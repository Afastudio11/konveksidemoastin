import { Router } from 'express';
import { db } from '../db';
import { productionExpenses, customers, orders } from '../db/schema';
import { eq, desc, and, sql, ilike, or } from 'drizzle-orm';
import { z } from 'zod';
import { AuthRequest, requireRole } from '../middleware/auth';
import { createAuditLog } from '../services/auditLog';
import puppeteer from 'puppeteer';
import { execSync } from 'child_process';
import { format, startOfMonth, isBefore } from 'date-fns';
import { id as idLocale } from 'date-fns/locale/id';
import * as fs from 'fs';
import * as path from 'path';

function isMonthLocked(date: Date): boolean {
  const now = new Date();
  const firstOfCurrentMonth = startOfMonth(now);
  const expenseMonthStart = startOfMonth(date);
  return isBefore(expenseMonthStart, firstOfCurrentMonth);
}

function getChromiumPath(): string {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  
  const possiblePaths = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
  ];
  
  for (const chromePath of possiblePaths) {
    if (fs.existsSync(chromePath)) {
      return chromePath;
    }
  }
  
  try {
    const whichResult = execSync('which chromium 2>/dev/null || which chromium-browser 2>/dev/null || which google-chrome 2>/dev/null').toString().trim();
    if (whichResult && fs.existsSync(whichResult)) {
      return whichResult;
    }
  } catch {
  }
  
  try {
    const nixChrome = execSync('find /nix/store -name "chromium" -type f -executable 2>/dev/null | head -1').toString().trim();
    if (nixChrome && fs.existsSync(nixChrome)) {
      return nixChrome;
    }
  } catch {
  }
  
  return '';
}

function getLogoBase64(): string {
  try {
    const logoDarkPath = path.join(process.cwd(), 'server', 'src', 'assets', 'logo-dark.png');
    if (fs.existsSync(logoDarkPath)) {
      const logoBuffer = fs.readFileSync(logoDarkPath);
      return `data:image/png;base64,${logoBuffer.toString('base64')}`;
    }
    const logoPath = path.join(process.cwd(), 'src', 'assets', 'logo-dark.png');
    const logoBuffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch (error) {
    return '';
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date): string {
  return format(date, 'd MMMM yyyy', { locale: idLocale });
}

const router = Router();

const createExpenseSchema = z.object({
  date: z.string(),
  customerId: z.string().uuid().optional().nullable(),
  orderId: z.string().uuid().optional().nullable(),
  projectName: z.string().optional(),
  itemName: z.string().min(1),
  vendorName: z.string().optional(),
  quantity: z.number().min(1).default(1),
  unitPrice: z.number().min(0).default(0),
  workStatus: z.enum(['proses', 'selesai']).default('proses'),
  vendorPaymentStatus: z.enum(['belum', 'lunas']).default('belum'),
  notes: z.string().optional(),
});

const updateExpenseSchema = createExpenseSchema.partial();

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { 
      page = '1', 
      limit = '50', 
      search,
      workStatus,
      vendorPaymentStatus,
      customerId,
      startDate,
      endDate 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const conditions: any[] = [];

    if (workStatus) {
      conditions.push(eq(productionExpenses.workStatus, workStatus as any));
    }

    if (vendorPaymentStatus) {
      conditions.push(eq(productionExpenses.vendorPaymentStatus, vendorPaymentStatus as any));
    }

    if (customerId) {
      conditions.push(eq(productionExpenses.customerId, customerId as string));
    }

    if (startDate) {
      conditions.push(sql`${productionExpenses.date} >= ${new Date(startDate as string)}`);
    }

    if (endDate) {
      conditions.push(sql`${productionExpenses.date} <= ${new Date(endDate as string)}`);
    }

    if (search) {
      conditions.push(
        or(
          ilike(productionExpenses.itemName, `%${search}%`),
          ilike(productionExpenses.vendorName, `%${search}%`),
          ilike(productionExpenses.projectName, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const expensesResult = await db
      .select({
        id: productionExpenses.id,
        date: productionExpenses.date,
        customerId: productionExpenses.customerId,
        orderId: productionExpenses.orderId,
        projectName: productionExpenses.projectName,
        itemName: productionExpenses.itemName,
        vendorName: productionExpenses.vendorName,
        quantity: productionExpenses.quantity,
        unitPrice: productionExpenses.unitPrice,
        totalValue: productionExpenses.totalValue,
        workStatus: productionExpenses.workStatus,
        vendorPaymentStatus: productionExpenses.vendorPaymentStatus,
        notes: productionExpenses.notes,
        createdAt: productionExpenses.createdAt,
        customer: {
          id: customers.id,
          name: customers.name,
        },
      })
      .from(productionExpenses)
      .leftJoin(customers, eq(productionExpenses.customerId, customers.id))
      .where(whereClause)
      .orderBy(desc(productionExpenses.date))
      .limit(limitNum)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(productionExpenses)
      .where(whereClause);

    const [totalResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${productionExpenses.totalValue}), 0)` })
      .from(productionExpenses)
      .where(whereClause);

    const total = Number(countResult?.count || 0);
    const totalValue = Number(totalResult?.total || 0);

    res.json({
      expenses: expensesResult,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      summary: {
        totalExpenses: totalValue,
      },
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.get('/customers', async (req: AuthRequest, res) => {
  try {
    const customersList = await db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
      })
      .from(customers)
      .orderBy(desc(customers.createdAt));

    res.json(customersList);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.get('/orders/:customerId', async (req: AuthRequest, res) => {
  try {
    const { customerId } = req.params;
    
    const ordersList = await db
      .select({
        id: orders.id,
        invoiceNumber: orders.invoiceNumber,
        trackingCode: orders.trackingCode,
      })
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt));

    res.json(ordersList);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.get('/export/pdf', async (req: AuthRequest, res) => {
  try {
    const { projectName, startDate, endDate } = req.query;

    const conditions: any[] = [];

    if (projectName) {
      conditions.push(eq(productionExpenses.projectName, projectName as string));
    }

    if (startDate) {
      conditions.push(sql`${productionExpenses.date} >= ${new Date(startDate as string)}`);
    }

    if (endDate) {
      conditions.push(sql`${productionExpenses.date} <= ${new Date(endDate as string)}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const expensesResult = await db
      .select({
        id: productionExpenses.id,
        date: productionExpenses.date,
        projectName: productionExpenses.projectName,
        itemName: productionExpenses.itemName,
        vendorName: productionExpenses.vendorName,
        quantity: productionExpenses.quantity,
        unitPrice: productionExpenses.unitPrice,
        totalValue: productionExpenses.totalValue,
        workStatus: productionExpenses.workStatus,
        vendorPaymentStatus: productionExpenses.vendorPaymentStatus,
        notes: productionExpenses.notes,
        customer: {
          id: customers.id,
          name: customers.name,
        },
      })
      .from(productionExpenses)
      .leftJoin(customers, eq(productionExpenses.customerId, customers.id))
      .where(whereClause)
      .orderBy(desc(productionExpenses.date));

    const logoBase64 = getLogoBase64();
    const today = formatDate(new Date());

    const projectMap = new Map<string, any[]>();
    expensesResult.forEach((expense) => {
      const key = expense.projectName || expense.customer?.name || 'Lainnya';
      if (!projectMap.has(key)) {
        projectMap.set(key, []);
      }
      projectMap.get(key)!.push(expense);
    });

    let projectsHTML = '';
    let grandTotal = 0;
    let grandUnpaid = 0;

    projectMap.forEach((expenses, projectKey) => {
      let projectTotal = 0;
      let projectUnpaid = 0;

      const expensesRowsHTML = expenses.map((expense, index) => {
        const total = Number(expense.totalValue) || 0;
        projectTotal += total;
        if (expense.vendorPaymentStatus === 'belum') {
          projectUnpaid += total;
        }

        const workStatusBadge = expense.workStatus === 'selesai'
          ? '<span style="background: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 4px; font-size: 9px;">Selesai</span>'
          : '<span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-size: 9px;">Proses</span>';

        const paymentStatusBadge = expense.vendorPaymentStatus === 'lunas'
          ? '<span style="background: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 4px; font-size: 9px;">Lunas</span>'
          : '<span style="background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-size: 9px;">Belum</span>';

        return `
          <tr>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 10px;">${index + 1}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 10px;">${expense.date ? format(new Date(expense.date), 'dd/MM/yy') : '-'}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 10px;">${expense.itemName}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 10px;">${expense.vendorName || '-'}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 10px; text-align: center;">${expense.quantity}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 10px; text-align: right;">${formatCurrency(Number(expense.unitPrice))}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 10px; text-align: right;">${formatCurrency(total)}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 10px; text-align: center;">${workStatusBadge}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 10px; text-align: center;">${paymentStatusBadge}</td>
          </tr>
        `;
      }).join('');

      grandTotal += projectTotal;
      grandUnpaid += projectUnpaid;

      projectsHTML += `
        <div style="margin-bottom: 20px; page-break-inside: avoid;">
          <div style="background: #1e3a8a; color: white; padding: 8px 12px; border-radius: 6px 6px 0 0;">
            <h3 style="margin: 0; font-size: 12px;">${projectKey}</h3>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 6px 8px; text-align: left; font-size: 9px; width: 30px;">No</th>
                <th style="padding: 6px 8px; text-align: left; font-size: 9px; width: 60px;">Tanggal</th>
                <th style="padding: 6px 8px; text-align: left; font-size: 9px;">Nama Barang</th>
                <th style="padding: 6px 8px; text-align: left; font-size: 9px;">Vendor</th>
                <th style="padding: 6px 8px; text-align: center; font-size: 9px; width: 40px;">Qty</th>
                <th style="padding: 6px 8px; text-align: right; font-size: 9px; width: 80px;">Harga</th>
                <th style="padding: 6px 8px; text-align: right; font-size: 9px; width: 90px;">Total</th>
                <th style="padding: 6px 8px; text-align: center; font-size: 9px; width: 55px;">Status</th>
                <th style="padding: 6px 8px; text-align: center; font-size: 9px; width: 55px;">Bayar</th>
              </tr>
            </thead>
            <tbody>
              ${expensesRowsHTML}
            </tbody>
          </table>
          <div style="display: flex; justify-content: flex-end; gap: 20px; padding: 8px 12px; background: #f9fafb; border-radius: 0 0 6px 6px;">
            <div style="text-align: right;">
              <span style="font-size: 10px; color: #6b7280;">Total Project:</span>
              <span style="font-size: 12px; font-weight: bold; margin-left: 8px;">${formatCurrency(projectTotal)}</span>
            </div>
            ${projectUnpaid > 0 ? `
            <div style="text-align: right;">
              <span style="font-size: 10px; color: #dc2626;">Belum Bayar:</span>
              <span style="font-size: 12px; font-weight: bold; color: #dc2626; margin-left: 8px;">${formatCurrency(projectUnpaid)}</span>
            </div>
            ` : ''}
          </div>
        </div>
      `;
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Laporan Pengeluaran Produksi</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; line-height: 1.3; font-size: 11px; }
    .container { max-width: 100%; margin: 0 auto; padding: 15px 20px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #1e3a8a; }
    .logo-img { height: 50px; width: auto; }
    table { width: 100%; border-collapse: collapse; }
    @media print { .page-break { page-break-before: always; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        ${logoBase64 ? `<img src="${logoBase64}" alt="Sekala Industry" class="logo-img" />` : '<div style="font-size: 18px; font-weight: bold;">Sekala Industry</div>'}
        <p style="color: #6b7280; font-size: 10px; margin-top: 4px;">Konveksi & Apparel Professional</p>
      </div>
      <div style="text-align: right;">
        <h1 style="font-size: 20px; color: #1e3a8a; margin-bottom: 8px;">LAPORAN PENGELUARAN</h1>
        <p style="font-size: 10px; color: #6b7280;">Tanggal Cetak: ${today}</p>
        ${startDate && endDate ? `<p style="font-size: 10px; color: #6b7280;">Periode: ${formatDate(new Date(startDate as string))} - ${formatDate(new Date(endDate as string))}</p>` : ''}
      </div>
    </div>

    <div style="display: flex; gap: 15px; margin-bottom: 20px;">
      <div style="flex: 1; background: #eff6ff; padding: 12px; border-radius: 8px; border-left: 4px solid #3b82f6;">
        <p style="font-size: 10px; color: #6b7280;">Total Pengeluaran</p>
        <p style="font-size: 16px; font-weight: bold; color: #1e40af;">${formatCurrency(grandTotal)}</p>
      </div>
      <div style="flex: 1; background: #fef2f2; padding: 12px; border-radius: 8px; border-left: 4px solid #ef4444;">
        <p style="font-size: 10px; color: #6b7280;">Belum Dibayar</p>
        <p style="font-size: 16px; font-weight: bold; color: #dc2626;">${formatCurrency(grandUnpaid)}</p>
      </div>
      <div style="flex: 1; background: #f0fdf4; padding: 12px; border-radius: 8px; border-left: 4px solid #22c55e;">
        <p style="font-size: 10px; color: #6b7280;">Sudah Dibayar</p>
        <p style="font-size: 16px; font-weight: bold; color: #16a34a;">${formatCurrency(grandTotal - grandUnpaid)}</p>
      </div>
      <div style="flex: 1; background: #f9fafb; padding: 12px; border-radius: 8px; border-left: 4px solid #6b7280;">
        <p style="font-size: 10px; color: #6b7280;">Jumlah Project</p>
        <p style="font-size: 16px; font-weight: bold;">${projectMap.size}</p>
      </div>
    </div>

    ${projectsHTML}

    <div style="margin-top: 30px; text-align: center; color: #9ca3af; font-size: 9px;">
      <p>Laporan ini dibuat secara otomatis oleh sistem Sekala Industry</p>
      <p>Dicetak pada: ${today}</p>
    </div>
  </div>
</body>
</html>
    `;

    const chromiumPath = getChromiumPath();

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: chromiumPath || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: {
        top: '15px',
        right: '15px',
        bottom: '15px',
        left: '15px',
      },
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=laporan-pengeluaran-${Date.now()}.pdf`);
    res.send(Buffer.from(pdf));
  } catch (error) {
    console.error('Export expenses PDF error:', error);
    res.status(500).json({ error: 'Gagal membuat PDF laporan pengeluaran' });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const [expense] = await db
      .select()
      .from(productionExpenses)
      .where(eq(productionExpenses.id, id))
      .limit(1);

    if (!expense) {
      return res.status(404).json({ error: 'Pengeluaran tidak ditemukan' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.post('/', requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const data = createExpenseSchema.parse(req.body);
    
    const expenseDate = new Date(data.date);
    if (isMonthLocked(expenseDate)) {
      return res.status(403).json({ 
        error: 'Tidak dapat menambahkan pengeluaran ke bulan yang sudah terkunci' 
      });
    }
    
    const totalValue = data.quantity * data.unitPrice;

    const [newExpense] = await db
      .insert(productionExpenses)
      .values({
        date: expenseDate,
        customerId: data.customerId || null,
        orderId: data.orderId || null,
        projectName: data.projectName,
        itemName: data.itemName,
        vendorName: data.vendorName,
        quantity: data.quantity,
        unitPrice: data.unitPrice.toString(),
        totalValue: totalValue.toString(),
        workStatus: data.workStatus,
        vendorPaymentStatus: data.vendorPaymentStatus,
        notes: data.notes,
        createdBy: req.user?.id,
      })
      .returning();

    if (req.user) {
      await createAuditLog({
        actorId: req.user.id,
        actorRole: req.user.role as any,
        actorName: req.user.name,
        actionType: 'expense_create',
        entityType: 'expense',
        entityId: newExpense.id,
        summary: `Menambah pengeluaran: ${data.itemName} - Rp ${totalValue.toLocaleString('id-ID')}`,
        afterState: newExpense,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    res.status(201).json({
      message: 'Pengeluaran berhasil ditambahkan',
      expense: newExpense,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Data tidak valid', details: error.errors });
    }
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.patch('/:id', requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = updateExpenseSchema.parse(req.body);

    const [existingExpense] = await db
      .select()
      .from(productionExpenses)
      .where(eq(productionExpenses.id, id))
      .limit(1);

    if (!existingExpense) {
      return res.status(404).json({ error: 'Pengeluaran tidak ditemukan' });
    }

    if (isMonthLocked(new Date(existingExpense.date))) {
      return res.status(403).json({ 
        error: 'Data bulan yang sudah terkunci tidak dapat diubah' 
      });
    }

    const quantity = data.quantity ?? existingExpense.quantity;
    const unitPrice = data.unitPrice ?? Number(existingExpense.unitPrice);
    const totalValue = quantity * unitPrice;

    const [updatedExpense] = await db
      .update(productionExpenses)
      .set({
        date: data.date ? new Date(data.date) : undefined,
        customerId: data.customerId !== undefined ? (data.customerId || null) : undefined,
        orderId: data.orderId !== undefined ? (data.orderId || null) : undefined,
        projectName: data.projectName,
        itemName: data.itemName,
        vendorName: data.vendorName,
        quantity: data.quantity,
        unitPrice: data.unitPrice?.toString(),
        totalValue: totalValue.toString(),
        workStatus: data.workStatus,
        vendorPaymentStatus: data.vendorPaymentStatus,
        notes: data.notes,
        updatedAt: new Date(),
      })
      .where(eq(productionExpenses.id, id))
      .returning();

    if (req.user) {
      await createAuditLog({
        actorId: req.user.id,
        actorRole: req.user.role as any,
        actorName: req.user.name,
        actionType: 'expense_update',
        entityType: 'expense',
        entityId: id,
        summary: `Mengubah pengeluaran: ${updatedExpense.itemName}`,
        beforeState: existingExpense,
        afterState: updatedExpense,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    res.json({
      message: 'Pengeluaran berhasil diupdate',
      expense: updatedExpense,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Data tidak valid', details: error.errors });
    }
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.delete('/:id', requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const [existingExpense] = await db
      .select()
      .from(productionExpenses)
      .where(eq(productionExpenses.id, id))
      .limit(1);

    if (!existingExpense) {
      return res.status(404).json({ error: 'Pengeluaran tidak ditemukan' });
    }

    if (isMonthLocked(new Date(existingExpense.date))) {
      return res.status(403).json({ 
        error: 'Data bulan yang sudah terkunci tidak dapat dihapus' 
      });
    }

    await db.delete(productionExpenses).where(eq(productionExpenses.id, id));

    if (req.user) {
      await createAuditLog({
        actorId: req.user.id,
        actorRole: req.user.role as any,
        actorName: req.user.name,
        actionType: 'expense_delete',
        entityType: 'expense',
        entityId: id,
        summary: `Menghapus pengeluaran: ${existingExpense.itemName} - Rp ${Number(existingExpense.totalValue).toLocaleString('id-ID')}`,
        beforeState: existingExpense,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    res.json({ message: 'Pengeluaran berhasil dihapus' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

export { router as expensesRoutes };
