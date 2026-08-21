import { Router } from 'express';
import { db } from '../db';
import { orders, orderItems, orderStatusHistory, customers } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { getProductionStatusLabel, getPaymentStatusLabel } from '../utils/invoice';

const router = Router();

router.get('/:trackingCode', async (req, res) => {
  try {
    const { trackingCode } = req.params;

    const [order] = await db
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
        productionDeadline: orders.productionDeadline,
        notes: orders.notes,
        createdAt: orders.createdAt,
        customerId: orders.customerId,
      })
      .from(orders)
      .where(eq(orders.trackingCode, trackingCode.toUpperCase()))
      .limit(1);

    if (!order) {
      return res.status(404).json({ error: 'Tracking code tidak ditemukan' });
    }

    const [customer] = await db
      .select({
        name: customers.name,
      })
      .from(customers)
      .where(eq(customers.id, order.customerId))
      .limit(1);

    const items = await db
      .select({
        productName: orderItems.productName,
        productType: orderItems.productType,
        quantity: orderItems.quantity,
        size: orderItems.size,
        color: orderItems.color,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    const statusHistory = await db
      .select({
        status: orderStatusHistory.status,
        progress: orderStatusHistory.progress,
        notes: orderStatusHistory.notes,
        createdAt: orderStatusHistory.createdAt,
      })
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, order.id))
      .orderBy(desc(orderStatusHistory.createdAt));

    const productionSteps = [
      { key: 'pending', label: 'Menunggu', icon: 'clock' },
      { key: 'design', label: 'Design', icon: 'palette' },
      { key: 'beli_bahan', label: 'Beli Bahan', icon: 'shopping-cart' },
      { key: 'potong_printing', label: 'Potong/Printing', icon: 'scissors' },
      { key: 'jahit', label: 'Jahit', icon: 'needle' },
      { key: 'bordir_sablon', label: 'Bordir/Sablon', icon: 'paintbrush' },
      { key: 'qc', label: 'Quality Control', icon: 'check-circle' },
      { key: 'packing', label: 'Packing', icon: 'package' },
      { key: 'selesai', label: 'Selesai', icon: 'check' },
      { key: 'dikirim', label: 'Dikirim', icon: 'truck' },
    ];

    const currentStepIndex = productionSteps.findIndex(s => s.key === order.productionStatus);

    res.json({
      trackingCode: order.trackingCode,
      invoiceNumber: order.invoiceNumber,
      customerName: customer?.name,
      items,
      totalAmount: order.totalAmount,
      dpAmount: order.dpAmount,
      remainingAmount: order.remainingAmount,
      paymentStatus: order.paymentStatus,
      paymentStatusLabel: getPaymentStatusLabel(order.paymentStatus),
      productionStatus: order.productionStatus,
      productionStatusLabel: getProductionStatusLabel(order.productionStatus),
      productionProgress: order.productionProgress,
      productionDeadline: order.productionDeadline,
      currentStepIndex,
      productionSteps,
      statusHistory: statusHistory.map(s => ({
        ...s,
        statusLabel: getProductionStatusLabel(s.status),
      })),
      createdAt: order.createdAt,
    });
  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

export { router as trackingRoutes };
