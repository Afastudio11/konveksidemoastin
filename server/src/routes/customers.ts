import { Router } from 'express';
import { db } from '../db';
import { customers, orders } from '../db/schema';
import { eq, desc, sql, ilike, or } from 'drizzle-orm';
import { z } from 'zod';
import { AuthRequest, requireRole } from '../middleware/auth';
import { createAuditLog } from '../services/auditLog';
import puppeteer from 'puppeteer';

const router = Router();

const createCustomerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  address: z.string().optional(),
});

router.get('/export/pdf', requireRole('superadmin'), async (req: AuthRequest, res) => {
  try {
    const { search } = req.query;

    let whereClause;
    if (search) {
      whereClause = or(
        ilike(customers.name, `%${search}%`),
        ilike(customers.phone, `%${search}%`)
      );
    }

    const customersResult = await db
      .select()
      .from(customers)
      .where(whereClause)
      .orderBy(desc(customers.createdAt));

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Data Pelanggan - Sekala Industry</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
    h1 { text-align: center; color: #333; margin-bottom: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #1a1a2e; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #1a1a2e; color: white; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
    .summary { margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">SEKALA INDUSTRY</div>
    <p>Data Pelanggan</p>
    <p>Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
  </div>

  <div class="summary">
    <strong>Total Pelanggan:</strong> ${customersResult.length}
  </div>

  <table>
    <thead>
      <tr>
        <th>No</th>
        <th>Nama</th>
        <th>Telepon</th>
        <th>Email</th>
        <th>Alamat</th>
        <th>Terdaftar</th>
      </tr>
    </thead>
    <tbody>
      ${customersResult.map((c, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${c.name}</td>
          <td>${c.phone}</td>
          <td>${c.email || '-'}</td>
          <td>${c.address || '-'}</td>
          <td>${new Date(c.createdAt).toLocaleDateString('id-ID')}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>Dokumen ini digenerate otomatis oleh Sekala Industry</p>
  </div>
</body>
</html>`;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=data-pelanggan-${Date.now()}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Export customers PDF error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { page = '1', limit = '10', search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let whereClause;
    if (search) {
      whereClause = or(
        ilike(customers.name, `%${search}%`),
        ilike(customers.phone, `%${search}%`)
      );
    }

    const customersResult = await db
      .select()
      .from(customers)
      .where(whereClause)
      .orderBy(desc(customers.createdAt))
      .limit(limitNum)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(whereClause);

    const total = Number(countResult?.count || 0);

    res.json({
      customers: customersResult,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    if (!customer) {
      return res.status(404).json({ error: 'Customer tidak ditemukan' });
    }

    const customerOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, id))
      .orderBy(desc(orders.createdAt));

    res.json({
      ...customer,
      orders: customerOrders,
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.post('/', requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const data = createCustomerSchema.parse(req.body);

    const [existingCustomer] = await db
      .select()
      .from(customers)
      .where(eq(customers.phone, data.phone))
      .limit(1);

    if (existingCustomer) {
      return res.status(400).json({ error: 'Nomor telepon sudah terdaftar' });
    }

    const [newCustomer] = await db
      .insert(customers)
      .values(data)
      .returning();

    if (req.user) {
      await createAuditLog({
        actorId: req.user.id,
        actorRole: req.user.role as any,
        actorName: req.user.name,
        actionType: 'customer_create',
        entityType: 'customer',
        entityId: newCustomer.id,
        summary: `Menambah pelanggan baru: ${data.name} (${data.phone})`,
        afterState: newCustomer,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    res.status(201).json({
      message: 'Customer berhasil ditambahkan',
      customer: newCustomer,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Data tidak valid', details: error.errors });
    }
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.put('/:id', requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = createCustomerSchema.parse(req.body);

    const [existingCustomer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer tidak ditemukan' });
    }

    const [updatedCustomer] = await db
      .update(customers)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id))
      .returning();

    if (req.user) {
      await createAuditLog({
        actorId: req.user.id,
        actorRole: req.user.role as any,
        actorName: req.user.name,
        actionType: 'customer_update',
        entityType: 'customer',
        entityId: id,
        summary: `Mengubah data pelanggan: ${updatedCustomer.name}`,
        beforeState: existingCustomer,
        afterState: updatedCustomer,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    res.json({
      message: 'Customer berhasil diupdate',
      customer: updatedCustomer,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Data tidak valid', details: error.errors });
    }
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.delete('/:id', requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const [existingCustomer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer tidak ditemukan' });
    }

    await db.delete(customers).where(eq(customers.id, id));

    if (req.user) {
      await createAuditLog({
        actorId: req.user.id,
        actorRole: req.user.role as any,
        actorName: req.user.name,
        actionType: 'customer_delete',
        entityType: 'customer',
        entityId: id,
        summary: `Menghapus pelanggan: ${existingCustomer.name} (${existingCustomer.phone})`,
        beforeState: existingCustomer,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    res.json({ message: 'Customer berhasil dihapus' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

export { router as customersRoutes };
