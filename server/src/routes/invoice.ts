import { Router } from 'express';
import { db } from '../db';
import { orders, orderItems, customers, payments, paymentInvoices } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { generateInvoiceHTML, generateInvoicePDF, InvoiceData, generatePaymentInvoiceHTML, generatePaymentInvoicePDF, PaymentInvoiceData, generateBillingInvoiceHTML, generateBillingInvoicePDF, BillingInvoiceData } from '../services/invoice';
import { authMiddleware } from '../middleware/auth';
import { generatePaymentInvoiceNumber } from '../utils/invoice';

const router = Router();

async function getInvoiceData(orderId: string): Promise<InvoiceData | null> {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) return null;

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, order.customerId))
    .limit(1);

  if (!customer) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const invoiceItems = items.map((item) => ({
    name: item.productName,
    description: item.notes || undefined,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    subtotal: Number(item.subtotal),
  }));

  const subtotal = invoiceItems.reduce((sum, item) => sum + item.subtotal, 0);
  const total = Number(order.totalAmount);
  const includePPN = order.includePPN || false;
  const ppnAmount = Number(order.ppnAmount || 0);

  let paymentStatus: 'pending' | 'partial' | 'paid' = 'pending';
  if (order.paymentStatus === 'paid') {
    paymentStatus = 'paid';
  } else if (order.dpAmount && Number(order.dpAmount) > 0) {
    paymentStatus = 'partial';
  }

  return {
    invoiceNumber: order.invoiceNumber,
    trackingCode: order.trackingCode,
    orderDate: order.createdAt,
    dueDate: order.paymentDeadline || undefined,
    customer: {
      name: customer.name,
      email: customer.email || undefined,
      phone: customer.phone,
      address: customer.address || undefined,
    },
    items: invoiceItems,
    subtotal,
    includePPN,
    ppnAmount,
    tax: includePPN ? ppnAmount : undefined,
    discountAmount: Number(order.discountAmount || 0),
    total,
    paymentStatus,
    paidAmount: order.dpAmount ? Number(order.dpAmount) : undefined,
    notes: order.notes || undefined,
  };
}

async function getPaymentInvoiceData(paymentInvoiceId: string): Promise<PaymentInvoiceData | null> {
  const [paymentInvoice] = await db
    .select()
    .from(paymentInvoices)
    .where(eq(paymentInvoices.id, paymentInvoiceId))
    .limit(1);

  if (!paymentInvoice) return null;

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, paymentInvoice.orderId))
    .limit(1);

  if (!order) return null;

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, order.customerId))
    .limit(1);

  if (!customer) return null;

  return {
    invoiceNumber: paymentInvoice.invoiceNumber,
    orderInvoiceNumber: order.invoiceNumber,
    trackingCode: order.trackingCode,
    paymentDate: paymentInvoice.createdAt,
    invoiceType: paymentInvoice.invoiceType as 'dp' | 'pelunasan',
    customer: {
      name: customer.name,
      email: customer.email || undefined,
      phone: customer.phone,
      address: customer.address || undefined,
    },
    paymentAmount: Number(paymentInvoice.amount),
    paymentMethod: paymentInvoice.paymentMethod || 'Transfer',
    orderTotal: Number(order.totalAmount),
    discountAmount: Number(order.discountAmount || 0),
    totalPaid: Number(paymentInvoice.paidAmount),
    remainingAmount: Number(paymentInvoice.remainingAmount),
    notes: paymentInvoice.notes || undefined,
  };
}

export async function createPaymentInvoice(
  orderId: string,
  paymentId: string | null,
  amount: number,
  paymentMethod: string,
  totalPaid: number,
  remainingAmount: number,
  invoiceTypeOverride?: 'dp' | 'pelunasan'
) {
  const invoiceType = invoiceTypeOverride || (remainingAmount <= 0 ? 'pelunasan' : 'dp');
  const invoiceNumber = await generatePaymentInvoiceNumber(invoiceType);

  const [newInvoice] = await db
    .insert(paymentInvoices)
    .values({
      invoiceNumber,
      orderId,
      paymentId,
      invoiceType,
      amount: amount.toString(),
      paidAmount: totalPaid.toString(),
      remainingAmount: remainingAmount.toString(),
      paymentMethod,
    })
    .returning();

  return newInvoice;
}

async function getBillingInvoiceData(orderId: string, billingType: 'dp' | 'pelunasan'): Promise<BillingInvoiceData | null> {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) return null;

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, order.customerId))
    .limit(1);

  if (!customer) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const invoiceItems = items.map((item) => ({
    name: item.productName,
    description: item.notes || undefined,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    subtotal: Number(item.subtotal),
  }));

  const subtotal = invoiceItems.reduce((sum, item) => sum + item.subtotal, 0);
  const orderTotal = Number(order.totalAmount);
  const includePPN = order.includePPN || false;
  const ppnAmount = Number(order.ppnAmount || 0);
  const dpAmount = Number(order.dpAmount || 0);
  const paidDpAmount = Number(order.paidDpAmount || 0);
  const pelunasanAmount = orderTotal - dpAmount;
  const remainingAmount = Number(order.remainingAmount || orderTotal);

  let billingAmount: number;
  let isPaid: boolean;

  if (billingType === 'dp') {
    const unpaidDpAmount = Math.max(0, dpAmount - paidDpAmount);
    billingAmount = dpAmount;
    isPaid = paidDpAmount >= dpAmount;
  } else {
    billingAmount = dpAmount > 0 ? Math.max(0, remainingAmount) : orderTotal;
    isPaid = order.paymentStatus === 'paid' || remainingAmount <= 0;
  }

  return {
    invoiceNumber: order.invoiceNumber,
    trackingCode: order.trackingCode,
    orderDate: order.createdAt,
    billingType,
    customer: {
      name: customer.name,
      email: customer.email || undefined,
      phone: customer.phone,
      address: customer.address || undefined,
    },
    items: invoiceItems,
    subtotal,
    includePPN,
    ppnAmount,
    orderTotal,
    discountAmount: Number(order.discountAmount || 0),
    dpAmount,
    paidDpAmount,
    pelunasanAmount,
    billingAmount,
    isPaid,
    notes: order.notes || undefined,
  };
}

router.get('/:orderId/billing/:type/html', authMiddleware, async (req, res) => {
  try {
    const { orderId, type } = req.params;
    
    if (type !== 'dp' && type !== 'pelunasan') {
      return res.status(400).json({ error: 'Invalid billing type. Use "dp" or "pelunasan"' });
    }

    const invoiceData = await getBillingInvoiceData(orderId, type);

    if (!invoiceData) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const html = generateBillingInvoiceHTML(invoiceData);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error generating billing invoice HTML:', error);
    res.status(500).json({ error: 'Failed to generate billing invoice' });
  }
});

router.get('/:orderId/billing/:type/pdf', authMiddleware, async (req, res) => {
  try {
    const { orderId, type } = req.params;
    
    if (type !== 'dp' && type !== 'pelunasan') {
      return res.status(400).json({ error: 'Invalid billing type. Use "dp" or "pelunasan"' });
    }

    const invoiceData = await getBillingInvoiceData(orderId, type);

    if (!invoiceData) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const pdf = await generateBillingInvoicePDF(invoiceData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Tagihan-${type.toUpperCase()}-${invoiceData.trackingCode}.pdf`);
    res.send(pdf);
  } catch (error) {
    console.error('Error generating billing invoice PDF:', error);
    res.status(500).json({ error: 'Failed to generate billing invoice PDF' });
  }
});

router.get('/:orderId/html', authMiddleware, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const invoiceData = await getInvoiceData(orderId);

    if (!invoiceData) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const html = generateInvoiceHTML(invoiceData);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error generating invoice HTML:', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

router.get('/:orderId/pdf', authMiddleware, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const invoiceData = await getInvoiceData(orderId);

    if (!invoiceData) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const pdf = await generateInvoicePDF(invoiceData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoiceData.trackingCode}.pdf`);
    res.send(pdf);
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

router.get('/:orderId/payment-invoices', authMiddleware, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    
    const invoices = await db
      .select()
      .from(paymentInvoices)
      .where(eq(paymentInvoices.orderId, orderId))
      .orderBy(desc(paymentInvoices.createdAt));

    res.json(invoices);
  } catch (error) {
    console.error('Error fetching payment invoices:', error);
    res.status(500).json({ error: 'Failed to fetch payment invoices' });
  }
});

router.get('/payment/:invoiceId/html', authMiddleware, async (req, res) => {
  try {
    const invoiceId = req.params.invoiceId;
    const invoiceData = await getPaymentInvoiceData(invoiceId);

    if (!invoiceData) {
      return res.status(404).json({ error: 'Payment invoice not found' });
    }

    const html = generatePaymentInvoiceHTML(invoiceData);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error generating payment invoice HTML:', error);
    res.status(500).json({ error: 'Failed to generate payment invoice' });
  }
});

router.get('/payment/:invoiceId/pdf', authMiddleware, async (req, res) => {
  try {
    const invoiceId = req.params.invoiceId;
    const invoiceData = await getPaymentInvoiceData(invoiceId);

    if (!invoiceData) {
      return res.status(404).json({ error: 'Payment invoice not found' });
    }

    const pdf = await generatePaymentInvoicePDF(invoiceData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Kwitansi-${invoiceData.invoiceNumber}.pdf`);
    res.send(pdf);
  } catch (error) {
    console.error('Error generating payment invoice PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

router.get('/public/:trackingCode/html', async (req, res) => {
  try {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.trackingCode, req.params.trackingCode))
      .limit(1);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const invoiceData = await getInvoiceData(order.id);

    if (!invoiceData) {
      return res.status(404).json({ error: 'Invoice data not found' });
    }

    const html = generateInvoiceHTML(invoiceData);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error generating public invoice:', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

router.get('/public/:trackingCode/pdf', async (req, res) => {
  try {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.trackingCode, req.params.trackingCode))
      .limit(1);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const invoiceData = await getInvoiceData(order.id);

    if (!invoiceData) {
      return res.status(404).json({ error: 'Invoice data not found' });
    }

    const pdf = await generateInvoicePDF(invoiceData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoiceData.trackingCode}.pdf`);
    res.send(pdf);
  } catch (error) {
    console.error('Error generating public PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

router.get('/public/:trackingCode/payment-invoices', async (req, res) => {
  try {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.trackingCode, req.params.trackingCode))
      .limit(1);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const invoices = await db
      .select()
      .from(paymentInvoices)
      .where(eq(paymentInvoices.orderId, order.id))
      .orderBy(desc(paymentInvoices.createdAt));

    res.json(invoices);
  } catch (error) {
    console.error('Error fetching payment invoices:', error);
    res.status(500).json({ error: 'Failed to fetch payment invoices' });
  }
});

router.get('/public/payment/:invoiceId/html', async (req, res) => {
  try {
    const invoiceId = req.params.invoiceId;
    const invoiceData = await getPaymentInvoiceData(invoiceId);

    if (!invoiceData) {
      return res.status(404).json({ error: 'Payment invoice not found' });
    }

    const html = generatePaymentInvoiceHTML(invoiceData);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error generating payment invoice HTML:', error);
    res.status(500).json({ error: 'Failed to generate payment invoice' });
  }
});

router.get('/public/payment/:invoiceId/pdf', async (req, res) => {
  try {
    const invoiceId = req.params.invoiceId;
    const invoiceData = await getPaymentInvoiceData(invoiceId);

    if (!invoiceData) {
      return res.status(404).json({ error: 'Payment invoice not found' });
    }

    const pdf = await generatePaymentInvoicePDF(invoiceData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Kwitansi-${invoiceData.invoiceNumber}.pdf`);
    res.send(pdf);
  } catch (error) {
    console.error('Error generating payment invoice PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

export default router;
