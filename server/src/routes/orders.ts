import { Router } from 'express';
import { db } from '../db';
import { orders, orderItems, orderStatusHistory, customers, payments } from '../db/schema';
import { eq, desc, and, or, ilike, sql } from 'drizzle-orm';
import { z } from 'zod';
import { AuthRequest, requireRole } from '../middleware/auth';
import { createAuditLog } from '../services/auditLog';
import { generateInvoiceNumber, generateTrackingCode, getProductionStatusProgress } from '../utils/invoice';
import { v4 as uuidv4 } from 'uuid';
import { createPaymentInvoice } from './invoice';

const router = Router();

const createOrderSchema = z.object({
  customer: z.object({
    name: z.string().min(2),
    phone: z.string().min(10),
    email: z.string().email().optional().or(z.literal('')),
    companyName: z.string().optional(),
    address: z.string().optional(),
  }),
  items: z.array(z.object({
    productName: z.string().min(1),
    productType: z.string().optional(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    size: z.string().optional(),
    color: z.string().optional(),
    notes: z.string().optional(),
  })).min(1),
  dpAmount: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(),
  discountType: z.enum(['fixed', 'percent']).optional(),
  discountValue: z.number().min(0).optional(),
  includePPN: z.boolean().optional(),
  paymentDeadline: z.string().optional(),
  productionDeadline: z.string().optional(),
  notes: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'design', 'beli_bahan', 'potong_printing', 'jahit', 'bordir_sablon', 'qc', 'packing', 'selesai', 'dikirim']),
  notes: z.string().optional(),
});

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { 
      page = '1', 
      limit = '10', 
      paymentStatus, 
      productionStatus, 
      search,
      startDate,
      endDate 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const conditions: any[] = [];

    if (paymentStatus) {
      conditions.push(eq(orders.paymentStatus, paymentStatus as any));
    }

    if (productionStatus) {
      conditions.push(eq(orders.productionStatus, productionStatus as any));
    }

    if (startDate) {
      conditions.push(sql`DATE(${orders.createdAt} AT TIME ZONE 'Asia/Jakarta') >= ${startDate}`);
    }

    if (endDate) {
      conditions.push(sql`DATE(${orders.createdAt} AT TIME ZONE 'Asia/Jakarta') <= ${endDate}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const ordersResult = await db
      .select({
        id: orders.id,
        invoiceNumber: orders.invoiceNumber,
        trackingCode: orders.trackingCode,
        totalAmount: orders.totalAmount,
        dpAmount: orders.dpAmount,
        remainingAmount: orders.remainingAmount,
        paymentStatus: orders.paymentStatus,
        productionStatus: orders.productionStatus,
        productionProgress: orders.productionProgress,
        paymentDeadline: orders.paymentDeadline,
        productionDeadline: orders.productionDeadline,
        notes: orders.notes,
        createdAt: orders.createdAt,
        customer: {
          id: customers.id,
          name: customers.name,
          phone: customers.phone,
          email: customers.email,
        },
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limitNum)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(whereClause);

    const total = Number(countResult?.count || 0);

    res.json({
      orders: ordersResult,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) {
      return res.status(404).json({ error: 'Order tidak ditemukan' });
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, order.customerId))
      .limit(1);

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id));

    const statusHistory = await db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, id))
      .orderBy(desc(orderStatusHistory.createdAt));

    const orderPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, id))
      .orderBy(desc(payments.createdAt));

    res.json({
      ...order,
      customer,
      items,
      statusHistory,
      payments: orderPayments,
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.post('/', requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const data = createOrderSchema.parse(req.body);

    let [existingCustomer] = await db
      .select()
      .from(customers)
      .where(eq(customers.phone, data.customer.phone))
      .limit(1);

    let customerId: string;

    if (existingCustomer) {
      customerId = existingCustomer.id;
      // Update existing customer with new info if provided
      if (data.customer.companyName || data.customer.email || data.customer.address) {
        await db
          .update(customers)
          .set({
            ...(data.customer.companyName && { companyName: data.customer.companyName }),
            ...(data.customer.email && { email: data.customer.email }),
            ...(data.customer.address && { address: data.customer.address }),
            updatedAt: new Date(),
          })
          .where(eq(customers.id, existingCustomer.id));
      }
    } else {
      const [newCustomer] = await db
        .insert(customers)
        .values({
          name: data.customer.name,
          phone: data.customer.phone,
          email: data.customer.email || null,
          companyName: data.customer.companyName || null,
          address: data.customer.address,
        })
        .returning();
      customerId = newCustomer.id;
    }

    const subtotalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const includePPN = data.includePPN || false;
    const discountAmount = data.discountAmount || 0;
    const ppnAmount = includePPN ? Math.round((subtotalAmount - discountAmount) * 0.11) : 0;
    const totalAmount = subtotalAmount - discountAmount + ppnAmount;
    const dpAmount = data.dpAmount || 0;
    const remainingAmount = totalAmount;
    const initialPaymentStatus = dpAmount > 0 ? 'waiting_dp' : 'waiting_pelunasan';

    const invoiceNumber = await generateInvoiceNumber();
    const trackingCode = generateTrackingCode();

    const [newOrder] = await db
      .insert(orders)
      .values({
        invoiceNumber,
        trackingCode,
        customerId,
        subtotalAmount: subtotalAmount.toString(),
        ppnAmount: ppnAmount.toString(),
        includePPN,
        discountAmount: discountAmount.toString(),
        totalAmount: totalAmount.toString(),
        dpAmount: dpAmount.toString(),
        paidDpAmount: '0',
        remainingAmount: remainingAmount.toString(),
        paymentStatus: initialPaymentStatus,
        paymentDeadline: data.paymentDeadline ? new Date(data.paymentDeadline) : null,
        productionDeadline: data.productionDeadline ? new Date(data.productionDeadline) : null,
        notes: data.notes,
        createdBy: req.user?.id,
      })
      .returning();

    for (const item of data.items) {
      await db.insert(orderItems).values({
        orderId: newOrder.id,
        productName: item.productName,
        productType: item.productType,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        subtotal: (item.quantity * item.unitPrice).toString(),
        size: item.size,
        color: item.color,
        notes: item.notes,
      });
    }

    await db.insert(orderStatusHistory).values({
      orderId: newOrder.id,
      status: 'pending',
      progress: 0,
      notes: 'Order dibuat',
      updatedBy: req.user?.id,
    });

    if (req.user) {
      await createAuditLog({
        actorId: req.user.id,
        actorRole: req.user.role as any,
        actorName: req.user.name,
        actionType: 'order_create',
        entityType: 'order',
        entityId: newOrder.id,
        summary: `Membuat order baru: ${invoiceNumber} - ${data.customer.name} - Rp ${totalAmount.toLocaleString('id-ID')}`,
        afterState: { order: newOrder, items: data.items, customer: data.customer },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    res.status(201).json({
      message: 'Order berhasil dibuat',
      order: newOrder,
      invoiceNumber,
      trackingCode,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Data tidak valid', details: error.errors });
    }
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.patch('/:id/status', requireRole('admin', 'production'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = updateStatusSchema.parse(req.body);

    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order tidak ditemukan' });
    }

    if (status === 'dikirim' && existingOrder.paymentStatus !== 'paid') {
      return res.status(400).json({ 
        error: 'Tidak bisa mengubah status ke Dikirim. Pelunasan belum dilakukan.',
        requiresPayment: true
      });
    }

    const progress = getProductionStatusProgress(status);

    const [updatedOrder] = await db
      .update(orders)
      .set({
        productionStatus: status,
        productionProgress: progress,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    await db.insert(orderStatusHistory).values({
      orderId: id,
      status,
      progress,
      notes,
      updatedBy: req.user?.id,
    });

    if (req.user) {
      await createAuditLog({
        actorId: req.user.id,
        actorRole: req.user.role as any,
        actorName: req.user.name,
        actionType: 'order_status_update',
        entityType: 'order',
        entityId: id,
        summary: `Mengubah status order ${existingOrder.invoiceNumber}: ${existingOrder.productionStatus} -> ${status}`,
        beforeState: { status: existingOrder.productionStatus, progress: existingOrder.productionProgress },
        afterState: { status, progress },
        metadata: { notes },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    res.json({
      message: 'Status berhasil diupdate',
      order: updatedOrder,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Data tidak valid', details: error.errors });
    }
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.patch('/:id/payment', requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, amount, paymentMethod } = req.body;

    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order tidak ditemukan' });
    }

    let paymentInvoiceResult: { id: string; invoiceNumber: string; invoiceType: string } | null = null;
    let updatedOrderData = existingOrder;

    if (status === 'paid' && amount && amount > 0) {
      const remainingBalance = Number(existingOrder.remainingAmount || existingOrder.totalAmount);
      
      if (amount > remainingBalance) {
        return res.status(400).json({ 
          error: `Jumlah pembayaran melebihi sisa tagihan (${remainingBalance})` 
        });
      }

      const existingPaidPayments = await db
        .select()
        .from(payments)
        .where(eq(payments.orderId, id));
      
      const totalPaidBefore = existingPaidPayments.reduce((sum, p) => {
        if (p.status === 'paid') {
          return sum + Number(p.amount || 0);
        }
        return sum;
      }, 0);

      const [newPayment] = await db.insert(payments).values({
        orderId: id,
        amount: amount.toString(),
        paymentMethod: paymentMethod || 'manual',
        status: 'paid',
        paidAt: new Date(),
      }).returning();

      const totalPaidAfter = totalPaidBefore + Number(amount);
      const newRemainingAmount = Math.max(0, Number(existingOrder.totalAmount) - totalPaidAfter);
      const configuredDpAmount = Number(existingOrder.dpAmount || 0);
      
      let newPaymentStatus: 'waiting_dp' | 'dp_paid' | 'waiting_pelunasan' | 'paid';
      if (newRemainingAmount <= 0) {
        newPaymentStatus = 'paid';
      } else if (configuredDpAmount > 0 && totalPaidAfter >= configuredDpAmount) {
        newPaymentStatus = 'waiting_pelunasan';
      } else if (configuredDpAmount > 0 && totalPaidAfter < configuredDpAmount) {
        newPaymentStatus = 'waiting_dp';
      } else {
        newPaymentStatus = 'waiting_pelunasan';
      }

      const paidDpAmountValue = configuredDpAmount > 0 
        ? Math.min(totalPaidAfter, configuredDpAmount).toString()
        : '0';

      const updateData: any = {
        remainingAmount: newRemainingAmount.toString(),
        paidDpAmount: paidDpAmountValue,
        paymentStatus: newPaymentStatus,
        updatedAt: new Date(),
      };
      
      if (newPaymentStatus === 'paid') {
        updateData.paidAt = new Date();
      }

      const [updatedOrder] = await db
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, id))
        .returning();

      updatedOrderData = updatedOrder;

      const isFirstPayment = totalPaidBefore === 0;
      const isFullyPaid = newRemainingAmount <= 0;
      
      let invoiceType: 'dp' | 'pelunasan';
      if (isFirstPayment && configuredDpAmount > 0 && !isFullyPaid) {
        invoiceType = 'dp';
      } else if (isFullyPaid) {
        invoiceType = 'pelunasan';
      } else {
        invoiceType = 'dp';
      }

      const paymentInvoice = await createPaymentInvoice(
        id,
        newPayment.id,
        Number(amount),
        paymentMethod || 'Manual',
        totalPaidAfter,
        newRemainingAmount,
        invoiceType
      );
      
      paymentInvoiceResult = {
        id: paymentInvoice.id,
        invoiceNumber: paymentInvoice.invoiceNumber,
        invoiceType: paymentInvoice.invoiceType,
      };

      if (req.user) {
        await createAuditLog({
          actorId: req.user.id,
          actorRole: req.user.role as any,
          actorName: req.user.name,
          actionType: 'order_payment_update',
          entityType: 'order',
          entityId: id,
          summary: `Pembayaran manual order ${existingOrder.invoiceNumber}: Rp ${Number(amount).toLocaleString('id-ID')} via ${paymentMethod || 'manual'}`,
          beforeState: { paymentStatus: existingOrder.paymentStatus, remainingAmount: existingOrder.remainingAmount },
          afterState: { paymentStatus: updatedOrderData.paymentStatus, remainingAmount: updatedOrderData.remainingAmount },
          metadata: { amount, paymentMethod, invoiceType: paymentInvoice.invoiceType },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      }
    }

    res.json({
      message: 'Pembayaran berhasil dicatat',
      order: updatedOrderData,
      paymentInvoice: paymentInvoiceResult,
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

const updateOrderSchema = z.object({
  customer: z.object({
    name: z.string().min(2),
    phone: z.string().min(10),
    email: z.string().email().optional().nullable(),
    address: z.string().optional().nullable(),
  }).optional(),
  items: z.array(z.object({
    productName: z.string().min(1),
    productType: z.string().optional(),
    productCategory: z.enum(['konveksi', 'percetakan']).optional(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    size: z.string().optional(),
    color: z.string().optional(),
    notes: z.string().optional(),
  })).optional(),
  dpAmount: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(),
  paymentDeadline: z.string().optional().nullable(),
  productionDeadline: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

router.put('/:id', requireRole('superadmin'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = updateOrderSchema.parse(req.body);

    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order tidak ditemukan' });
    }

    const existingItems = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id));

    const [existingCustomer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, existingOrder.customerId))
      .limit(1);

    if (data.customer && existingCustomer) {
      await db
        .update(customers)
        .set({
          name: data.customer.name,
          phone: data.customer.phone,
          email: data.customer.email || null,
          address: data.customer.address || null,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, existingOrder.customerId));
    }

    if (data.items && data.items.length > 0) {
      await db.delete(orderItems).where(eq(orderItems.orderId, id));
      
      const subtotalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const discountAmount = data.discountAmount !== undefined ? data.discountAmount : Number(existingOrder.discountAmount || 0);
      const dpAmount = data.dpAmount !== undefined ? data.dpAmount : Number(existingOrder.dpAmount || 0);
      const includePPN = existingOrder.includePPN;
      const ppnAmount = includePPN ? Math.round((subtotalAmount - discountAmount) * 0.11) : 0;
      const totalAmount = subtotalAmount - discountAmount + ppnAmount;
      
      const existingPayments = await db
        .select()
        .from(payments)
        .where(eq(payments.orderId, id));
      
      const totalPaid = existingPayments.reduce((sum, p) => {
        if (p.status === 'paid') {
          return sum + Number(p.amount || 0);
        }
        return sum;
      }, 0);
      
      const remainingAmount = Math.max(0, totalAmount - totalPaid);

      for (const item of data.items) {
        await db.insert(orderItems).values({
          orderId: id,
          productName: item.productName,
          productType: item.productType,
          productCategory: item.productCategory,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          subtotal: (item.quantity * item.unitPrice).toString(),
          size: item.size,
          color: item.color,
          notes: item.notes,
        });
      }

      await db
        .update(orders)
        .set({
          subtotalAmount: subtotalAmount.toString(),
          ppnAmount: ppnAmount.toString(),
          discountAmount: discountAmount.toString(),
          totalAmount: totalAmount.toString(),
          dpAmount: dpAmount.toString(),
          remainingAmount: remainingAmount.toString(),
          paymentDeadline: data.paymentDeadline ? new Date(data.paymentDeadline) : existingOrder.paymentDeadline,
          productionDeadline: data.productionDeadline ? new Date(data.productionDeadline) : existingOrder.productionDeadline,
          notes: data.notes !== undefined ? data.notes : existingOrder.notes,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id));
    } else {
      const updateData: any = { updatedAt: new Date() };
      if (data.dpAmount !== undefined) updateData.dpAmount = data.dpAmount.toString();
      if (data.paymentDeadline !== undefined) updateData.paymentDeadline = data.paymentDeadline ? new Date(data.paymentDeadline) : null;
      if (data.productionDeadline !== undefined) updateData.productionDeadline = data.productionDeadline ? new Date(data.productionDeadline) : null;
      if (data.notes !== undefined) updateData.notes = data.notes;

      await db
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, id));
    }

    const [updatedOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    const updatedItems = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id));

    if (req.user) {
      await createAuditLog({
        actorId: req.user.id,
        actorRole: req.user.role as any,
        actorName: req.user.name,
        actionType: 'order_update',
        entityType: 'order',
        entityId: id,
        summary: `Mengedit order ${existingOrder.invoiceNumber}`,
        beforeState: { order: existingOrder, items: existingItems, customer: existingCustomer },
        afterState: { order: updatedOrder, items: updatedItems },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    res.json({
      message: 'Order berhasil diupdate',
      order: updatedOrder,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Data tidak valid', details: error.errors });
    }
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.delete('/:id', requireRole('superadmin'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order tidak ditemukan' });
    }

    await db.delete(orders).where(eq(orders.id, id));

    if (req.user) {
      await createAuditLog({
        actorId: req.user.id,
        actorRole: req.user.role as any,
        actorName: req.user.name,
        actionType: 'order_delete',
        entityType: 'order',
        entityId: id,
        summary: `Menghapus order ${existingOrder.invoiceNumber} - Rp ${Number(existingOrder.totalAmount).toLocaleString('id-ID')}`,
        beforeState: existingOrder,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    res.json({ message: 'Order berhasil dihapus' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

export { router as ordersRoutes };
