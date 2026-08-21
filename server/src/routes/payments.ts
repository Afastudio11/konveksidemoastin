import { Router } from 'express';
import { db } from '../db';
import { orders, payments, customers } from '../db/schema';
import { eq } from 'drizzle-orm';
import { midtransService, CreateTransactionRequest, MidtransTransaction } from '../services/midtrans';
import { whatsappService } from '../services/whatsapp';
import { authMiddleware } from '../middleware/auth';
import { createPaymentInvoice } from './invoice';

const router = Router();

router.post('/create', async (req, res) => {
  try {
    const { trackingCode, paymentType, bank } = req.body;

    if (!trackingCode || typeof trackingCode !== 'string') {
      return res.status(400).json({ error: 'Kode tracking diperlukan' });
    }

    const validPaymentTypes = ['bank_transfer', 'qris', 'gopay', 'shopeepay'];
    if (!paymentType || !validPaymentTypes.includes(paymentType)) {
      return res.status(400).json({ error: 'Metode pembayaran tidak valid' });
    }

    if (paymentType === 'bank_transfer') {
      const validBanks = ['bca', 'bni', 'bri', 'mandiri', 'permata'];
      if (!bank || !validBanks.includes(bank)) {
        return res.status(400).json({ error: 'Bank tidak valid' });
      }
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.trackingCode, trackingCode.toUpperCase()))
      .limit(1);

    if (!order) {
      return res.status(404).json({ error: 'Order tidak ditemukan' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'Order sudah lunas' });
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, order.customerId))
      .limit(1);

    if (!customer) {
      return res.status(404).json({ error: 'Customer tidak ditemukan' });
    }

    const amount = Number(order.remainingAmount) > 0 
      ? Number(order.remainingAmount) 
      : Number(order.totalAmount);

    if (amount <= 0) {
      return res.status(400).json({ error: 'Tidak ada sisa pembayaran' });
    }

    const transactionRequest: CreateTransactionRequest = {
      orderId: order.id,
      grossAmount: amount,
      customerName: customer.name,
      customerEmail: customer.email || undefined,
      customerPhone: customer.phone,
      paymentType,
      bank,
      itemDetails: [
        {
          id: order.trackingCode,
          name: `Order ${order.trackingCode}`,
          price: amount,
          quantity: 1,
        },
      ],
    };

    const transaction = await midtransService.createTransaction(transactionRequest);
    const instructions = midtransService.getPaymentInstructions(transaction);

    const [newPayment] = await db.insert(payments).values({
      orderId: order.id,
      amount: amount.toString(),
      paymentMethod: paymentType,
      paymentChannel: bank || paymentType,
      transactionId: transaction.transactionId,
      status: 'waiting_payment',
    }).returning();

    res.json({
      success: true,
      paymentId: newPayment.id,
      transaction: {
        transactionId: transaction.transactionId,
        paymentType: transaction.paymentType,
        grossAmount: transaction.grossAmount,
        vaNumber: transaction.vaNumber,
        bank: transaction.bank,
        qrCodeUrl: transaction.qrCodeUrl,
        paymentUrl: transaction.paymentUrl,
        expiryTime: transaction.expiryTime,
      },
      instructions,
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.get('/status/:trackingCode', async (req, res) => {
  try {
    const { trackingCode } = req.params;

    if (!trackingCode) {
      return res.status(400).json({ error: 'Kode tracking diperlukan' });
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.trackingCode, trackingCode.toUpperCase()))
      .limit(1);

    if (!order) {
      return res.status(404).json({ error: 'Order tidak ditemukan' });
    }

    const orderPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, order.id))
      .orderBy(payments.createdAt);

    const latestPayment = orderPayments[orderPayments.length - 1];
    let midtransStatus: MidtransTransaction | null = null;
    let instructions: string[] = [];

    if (latestPayment?.transactionId && latestPayment.status === 'waiting_payment') {
      midtransStatus = await midtransService.getTransactionStatus(latestPayment.transactionId);
      if (midtransStatus) {
        instructions = midtransService.getPaymentInstructions(midtransStatus);
      }
    }

    res.json({
      order: {
        trackingCode: order.trackingCode,
        totalAmount: order.totalAmount,
        dpAmount: order.dpAmount,
        remainingAmount: order.remainingAmount,
        paymentStatus: order.paymentStatus,
      },
      payments: orderPayments.map(p => ({
        id: p.id,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        status: p.status,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
      })),
      midtransStatus: midtransStatus ? {
        transactionId: midtransStatus.transactionId,
        paymentType: midtransStatus.paymentType,
        grossAmount: midtransStatus.grossAmount,
        vaNumber: midtransStatus.vaNumber,
        bank: midtransStatus.bank,
        qrCodeUrl: midtransStatus.qrCodeUrl,
        expiryTime: midtransStatus.expiryTime,
        transactionStatus: midtransStatus.transactionStatus,
      } : null,
      instructions,
    });
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.post('/simulate/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID diperlukan' });
    }

    const transaction = await midtransService.simulatePayment(transactionId);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    }

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.transactionId, transactionId))
      .limit(1);

    if (!payment) {
      return res.status(404).json({ error: 'Payment record tidak ditemukan' });
    }

    if (payment.status === 'paid') {
      return res.status(400).json({ error: 'Pembayaran sudah diproses' });
    }

    await db
      .update(payments)
      .set({
        status: 'paid',
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.transactionId, transactionId));

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, payment.orderId))
      .limit(1);

    if (!order) {
      return res.status(404).json({ error: 'Order tidak ditemukan' });
    }

    const allPaidPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, order.id));
    
    const totalPaidAmount = allPaidPayments.reduce((sum, p) => {
      if (p.status === 'paid' || p.transactionId === transactionId) {
        return sum + Number(p.amount || 0);
      }
      return sum;
    }, 0);

    const newRemainingAmount = Math.max(0, Number(order.totalAmount) - totalPaidAmount);
    const newPaymentStatus = newRemainingAmount <= 0 ? 'paid' : 'waiting_payment';

    await db
      .update(orders)
      .set({
        dpAmount: totalPaidAmount.toString(),
        remainingAmount: newRemainingAmount.toString(),
        paymentStatus: newPaymentStatus,
        paidAt: newPaymentStatus === 'paid' ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, order.customerId))
      .limit(1);

    const paymentInvoice = await createPaymentInvoice(
      order.id,
      payment.id,
      Number(payment.amount),
      payment.paymentMethod || 'Transfer',
      totalPaidAmount,
      newRemainingAmount
    );

    if (customer) {
      try {
        await whatsappService.sendPaymentConfirmation(customer.phone, {
          customerName: customer.name,
          trackingCode: order.trackingCode,
          amount: `Rp ${Number(payment.amount).toLocaleString('id-ID')}`,
          paymentMethod: payment.paymentMethod || 'Transfer',
        });
      } catch (waError) {
        console.error('WhatsApp notification failed:', waError);
      }
    }

    res.json({
      success: true,
      message: 'Pembayaran berhasil',
      order: {
        trackingCode: order.trackingCode,
        totalAmount: order.totalAmount,
        dpAmount: totalPaidAmount.toString(),
        remainingAmount: newRemainingAmount.toString(),
        paymentStatus: newPaymentStatus,
      },
      paymentInvoice: {
        id: paymentInvoice.id,
        invoiceNumber: paymentInvoice.invoiceNumber,
        invoiceType: paymentInvoice.invoiceType,
      },
    });
  } catch (error) {
    console.error('Simulate payment error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const webhookData = req.body;
    
    console.log('Payment webhook received:', JSON.stringify(webhookData, null, 2));

    const { transaction_id, transaction_status } = webhookData;

    if (!transaction_id) {
      return res.status(400).json({ error: 'Transaction ID required' });
    }

    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.transactionId, transaction_id))
        .limit(1);

      if (payment && payment.status !== 'paid') {
        await db
          .update(payments)
          .set({
            status: 'paid',
            paidAt: new Date(),
            webhookData: JSON.stringify(webhookData),
            updatedAt: new Date(),
          })
          .where(eq(payments.transactionId, transaction_id));

        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, payment.orderId))
          .limit(1);

        if (order) {
          const allPaidPayments = await db
            .select()
            .from(payments)
            .where(eq(payments.orderId, order.id));
          
          const totalPaidAmount = allPaidPayments.reduce((sum, p) => {
            if (p.status === 'paid' || p.transactionId === transaction_id) {
              return sum + Number(p.amount || 0);
            }
            return sum;
          }, 0);

          const newRemainingAmount = Math.max(0, Number(order.totalAmount) - totalPaidAmount);
          const newPaymentStatus = newRemainingAmount <= 0 ? 'paid' : 'waiting_payment';

          await db
            .update(orders)
            .set({
              dpAmount: totalPaidAmount.toString(),
              remainingAmount: newRemainingAmount.toString(),
              paymentStatus: newPaymentStatus,
              paidAt: newPaymentStatus === 'paid' ? new Date() : undefined,
              updatedAt: new Date(),
            })
            .where(eq(orders.id, order.id));

          await createPaymentInvoice(
            order.id,
            payment.id,
            Number(payment.amount),
            payment.paymentMethod || 'Transfer',
            totalPaidAmount,
            newRemainingAmount
          );
        }
      }
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Payment webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

router.post('/manual', authMiddleware, async (req, res) => {
  try {
    const { orderId, amount, paymentMethod } = req.body;

    if (!orderId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Data pembayaran tidak valid' });
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return res.status(404).json({ error: 'Order tidak ditemukan' });
    }

    const [newPayment] = await db
      .insert(payments)
      .values({
        orderId,
        amount: amount.toString(),
        paymentMethod: paymentMethod || 'manual',
        status: 'paid',
        paidAt: new Date(),
      })
      .returning();

    const allPaidPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId));
    
    const totalPaidAmount = allPaidPayments.reduce((sum, p) => {
      if (p.status === 'paid') {
        return sum + Number(p.amount || 0);
      }
      return sum;
    }, 0);

    const newRemainingAmount = Math.max(0, Number(order.totalAmount) - totalPaidAmount);
    const newPaymentStatus = newRemainingAmount <= 0 ? 'paid' : 'waiting_payment';

    await db
      .update(orders)
      .set({
        dpAmount: totalPaidAmount.toString(),
        remainingAmount: newRemainingAmount.toString(),
        paymentStatus: newPaymentStatus,
        paidAt: newPaymentStatus === 'paid' ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, order.customerId))
      .limit(1);

    const paymentInvoice = await createPaymentInvoice(
      orderId,
      newPayment.id,
      amount,
      paymentMethod || 'Manual',
      totalPaidAmount,
      newRemainingAmount
    );

    if (customer) {
      try {
        await whatsappService.sendPaymentConfirmation(customer.phone, {
          customerName: customer.name,
          trackingCode: order.trackingCode,
          amount: `Rp ${amount.toLocaleString('id-ID')}`,
          paymentMethod: paymentMethod || 'Manual',
        });
      } catch (waError) {
        console.error('WhatsApp notification failed:', waError);
      }
    }

    res.json({
      message: 'Pembayaran berhasil dicatat',
      payment: newPayment,
      order: {
        dpAmount: totalPaidAmount.toString(),
        remainingAmount: newRemainingAmount.toString(),
        paymentStatus: newPaymentStatus,
      },
      paymentInvoice: {
        id: paymentInvoice.id,
        invoiceNumber: paymentInvoice.invoiceNumber,
        invoiceType: paymentInvoice.invoiceType,
      },
    });
  } catch (error) {
    console.error('Manual payment error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.get('/methods', async (req, res) => {
  res.json({
    methods: [
      {
        type: 'bank_transfer',
        name: 'Transfer Bank',
        banks: [
          { code: 'bca', name: 'BCA Virtual Account' },
          { code: 'bni', name: 'BNI Virtual Account' },
          { code: 'bri', name: 'BRI Virtual Account' },
          { code: 'mandiri', name: 'Mandiri Virtual Account' },
          { code: 'permata', name: 'Permata Virtual Account' },
        ],
      },
      {
        type: 'qris',
        name: 'QRIS',
        description: 'Scan QR dengan e-wallet atau mobile banking',
      },
      {
        type: 'gopay',
        name: 'GoPay',
        description: 'Bayar dengan saldo GoPay',
      },
      {
        type: 'shopeepay',
        name: 'ShopeePay',
        description: 'Bayar dengan saldo ShopeePay',
      },
    ],
  });
});

export { router as paymentsRoutes };
