import { Router } from 'express';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '../db';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(2_000),
});

const chatSchema = z.object({
  question: z.string().trim().min(2).max(1_000),
  history: z.array(messageSchema).max(8).optional().default([]),
});

const requestBuckets = new Map<string, { count: number; resetAt: number }>();

function canMakeRequest(userId: string) {
  const now = Date.now();
  const current = requestBuckets.get(userId);
  if (!current || current.resetAt <= now) {
    requestBuckets.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (current.count >= 10) return false;
  current.count += 1;
  return true;
}

async function getBusinessContext() {
  const [summary, orders, inventory, expenses, materialUsage, products] = await Promise.all([
    db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE payment_status NOT IN ('cancelled', 'refunded', 'expired')) AS total_orders,
        COUNT(*) FILTER (WHERE production_status NOT IN ('selesai', 'dikirim') AND payment_status NOT IN ('cancelled', 'refunded', 'expired')) AS active_orders,
        COALESCE(SUM(total_amount) FILTER (WHERE payment_status NOT IN ('cancelled', 'refunded', 'expired')), 0) AS order_value,
        COALESCE(SUM(total_amount - remaining_amount) FILTER (WHERE payment_status NOT IN ('cancelled', 'refunded', 'expired')), 0) AS cash_received,
        COALESCE(SUM(remaining_amount) FILTER (WHERE payment_status NOT IN ('cancelled', 'refunded', 'expired')), 0) AS receivables,
        (SELECT COUNT(*) FROM customers) AS total_customers,
        (SELECT COALESCE(SUM(total_value), 0) FROM production_expenses) AS production_expenses,
        (SELECT COALESCE(SUM(total_cost), 0) FROM order_material_usages) AS material_cost
      FROM orders
    `),
    db.execute(sql`
      SELECT o.invoice_number, c.name AS customer_name, o.total_amount, o.remaining_amount,
        o.payment_status, o.production_status, o.production_progress, o.production_deadline, o.created_at
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      ORDER BY o.created_at DESC
      LIMIT 20
    `),
    db.execute(sql`
      SELECT code, name, category, unit, current_stock, minimum_stock, unit_price,
        CASE WHEN current_stock <= 0 THEN 'habis'
             WHEN current_stock <= minimum_stock THEN 'menipis'
             ELSE 'aman' END AS stock_status
      FROM raw_materials
      WHERE is_active = true
      ORDER BY (current_stock <= minimum_stock) DESC, name ASC
      LIMIT 30
    `),
    db.execute(sql`
      SELECT pe.date, pe.project_name, pe.item_name, pe.vendor_name, pe.quantity,
        pe.total_value, pe.work_status, pe.vendor_payment_status, o.invoice_number
      FROM production_expenses pe
      LEFT JOIN orders o ON o.id = pe.order_id
      ORDER BY pe.date DESC
      LIMIT 25
    `),
    db.execute(sql`
      SELECT rm.code, rm.name, rm.unit, COALESCE(SUM(omu.quantity), 0) AS quantity_used,
        COALESCE(SUM(omu.total_cost), 0) AS total_cost,
        COUNT(DISTINCT omu.order_id) AS order_count
      FROM order_material_usages omu
      JOIN raw_materials rm ON rm.id = omu.material_id
      GROUP BY rm.id, rm.code, rm.name, rm.unit
      ORDER BY SUM(omu.total_cost) DESC
      LIMIT 20
    `),
    db.execute(sql`
      SELECT oi.product_name, oi.product_category, COALESCE(SUM(oi.quantity), 0) AS quantity,
        COALESCE(SUM(oi.subtotal), 0) AS value, COUNT(DISTINCT oi.order_id) AS order_count
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.payment_status NOT IN ('cancelled', 'refunded', 'expired')
      GROUP BY oi.product_name, oi.product_category
      ORDER BY SUM(oi.quantity) DESC
      LIMIT 20
    `),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    privacyNote: 'Data kontak, alamat, kredensial, dan kode tracking tidak disertakan.',
    summary: summary.rows[0] || {},
    recentOrders: orders.rows,
    inventory: inventory.rows,
    recentProductionExpenses: expenses.rows,
    materialUsage: materialUsage.rows,
    productPerformance: products.rows,
  };
}

router.post('/chat', async (req: AuthRequest, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      return res.status(503).json({ error: 'GROQ_API_KEY belum dikonfigurasi di server' });
    }

    const userId = req.user?.id || req.ip || 'unknown';
    if (!canMakeRequest(userId)) {
      return res.status(429).json({ error: 'Batas 10 pertanyaan per menit tercapai. Coba lagi sebentar.' });
    }

    const { question, history } = chatSchema.parse(req.body);
    const businessContext = await getBusinessContext();
    const model = process.env.GROQ_MODEL?.trim() || DEFAULT_MODEL;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);

    let groqResponse: Response;
    try {
      groqResponse = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_completion_tokens: 1_200,
          messages: [
            {
              role: 'system',
              content: `Anda adalah asisten analis data bisnis internal ouruniform.id (Konveksi & Apparel).
Jawab dalam Bahasa Indonesia yang profesional, ringkas, dan to-the-point.
Gunakan HANYA fakta dan angka pada BUSINESS_DATA. Jangan mengarang angka atau data yang tidak ada.

ATURAN FORMAT JAWABAN (SANGAT PENTING):
1. Mulai jawaban dengan kesimpulan atau ringkasan 1-2 kalimat yang jelas.
2. JANGAN PERNAH menyajikan daftar mentah yang terlalu panjang atau bertele-tele.
3. Jika menyajikan tabel:
   - Buat tabel ringkas dengan maksimal 4-5 kolom penting saja.
   - Jika ditanya stok menipis/habis: HANYA tampilkan bahan yang berstatus 'habis' atau 'menipis' (maksimal 8-10 item prioritas). Jangan campur dengan bahan yang statusnya 'aman'.
   - Jika ditanya order/piutang/keuangan: tampilkan item teratas yang paling bernilai/mendesak.
4. Gunakan bullet points tebal untuk insight penting.
5. Format nominal rupiah selalu rapi: contoh Rp 1.500.000.
6. Berikan 1 catatan rekomendasi praktis di akhir jika relevan.

BUSINESS_DATA:
${JSON.stringify(businessContext)}`,
            },
            ...history,
            { role: 'user', content: question },
          ],
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const payload = await groqResponse.json().catch(() => null) as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    } | null;

    if (!groqResponse.ok) {
      console.error('AI API error:', groqResponse.status, payload?.error?.message || 'Unknown error');
      const message = groqResponse.status === 429
        ? 'Batas request tercapai. Silakan coba lagi sebentar.'
        : 'Sistem AI gagal memproses pertanyaan. Silakan coba lagi.';
      return res.status(502).json({ error: message });
    }

    const answer = payload?.choices?.[0]?.message?.content?.trim();
    if (!answer) return res.status(502).json({ error: 'Sistem AI tidak mengembalikan jawaban' });

    res.json({ answer, generatedAt: businessContext.generatedAt });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Pertanyaan tidak valid', details: error.errors });
    }
    if (error instanceof Error && error.name === 'AbortError') {
      return res.status(504).json({ error: 'Sistem AI terlalu lama merespons. Silakan coba lagi.' });
    }
    console.error('AI assistant error:', error);
    res.status(500).json({ error: 'Gagal memproses pertanyaan data' });
  }
});

export { router as aiAssistantRoutes };
