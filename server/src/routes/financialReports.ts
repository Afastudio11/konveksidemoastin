import { Router } from 'express';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../db';
import {
  customers,
  orderMaterialUsages,
  orders,
  payments,
  productionExpenses,
  rawMaterials,
} from '../db/schema';
import { AuthRequest } from '../middleware/auth';

const router = Router();

function filters(query: AuthRequest['query']) {
  const { startDate, endDate, month, year } = query;
  let start: string | undefined;
  let end: string | undefined;

  if (startDate && endDate) {
    start = String(startDate);
    end = String(endDate);
  } else if (month && year) {
    const monthNumber = Number(month);
    const yearNumber = Number(year);
    start = `${yearNumber}-${String(monthNumber).padStart(2, '0')}-01`;
    end = `${yearNumber}-${String(monthNumber).padStart(2, '0')}-${String(new Date(yearNumber, monthNumber, 0).getDate()).padStart(2, '0')}`;
  }

  const orderDate = start && end
    ? sql`DATE(${orders.createdAt} AT TIME ZONE 'Asia/Makassar') BETWEEN ${start} AND ${end}`
    : sql`TRUE`;
  const paymentDate = start && end
    ? sql`DATE(${payments.paidAt} AT TIME ZONE 'Asia/Makassar') BETWEEN ${start} AND ${end}`
    : sql`TRUE`;
  const expenseDate = start && end
    ? sql`DATE(${productionExpenses.date} AT TIME ZONE 'Asia/Makassar') BETWEEN ${start} AND ${end}`
    : sql`TRUE`;

  return { start, end, orderDate, paymentDate, expenseDate };
}

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { orderDate, paymentDate, expenseDate } = filters(req.query);
    const validOrder = sql`${orders.paymentStatus} NOT IN ('cancelled', 'refunded', 'expired')`;

    const [orderSummary] = await db.select({
      orderRevenue: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
      outstandingReceivables: sql<number>`COALESCE(SUM(${orders.remainingAmount}), 0)`,
      totalOrders: sql<number>`COUNT(*)`,
    }).from(orders).where(and(validOrder, orderDate));

    const [cashSummary] = await db.select({
      cashReceived: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
    }).from(payments).where(and(eq(payments.status, 'paid'), paymentDate));

    const [expenseSummary] = await db.select({
      productionExpense: sql<number>`COALESCE(SUM(${productionExpenses.totalValue}), 0)`,
    }).from(productionExpenses).where(expenseDate);

    const [materialSummary] = await db.select({
      materialCost: sql<number>`COALESCE(SUM(${orderMaterialUsages.totalCost}), 0)`,
      materialQuantity: sql<number>`COALESCE(SUM(${orderMaterialUsages.quantity}), 0)`,
    })
      .from(orderMaterialUsages)
      .innerJoin(orders, eq(orderMaterialUsages.orderId, orders.id))
      .where(and(validOrder, orderDate));

    const perOrder = await db.select({
      id: orders.id,
      invoiceNumber: orders.invoiceNumber,
      trackingCode: orders.trackingCode,
      createdAt: orders.createdAt,
      customerName: customers.name,
      totalAmount: orders.totalAmount,
      paidAmount: sql<number>`GREATEST(${orders.totalAmount} - ${orders.remainingAmount}, 0)`,
      outstandingAmount: orders.remainingAmount,
      paymentStatus: orders.paymentStatus,
      productionStatus: orders.productionStatus,
      materialCost: sql<number>`COALESCE((SELECT SUM(omu.total_cost) FROM order_material_usages omu WHERE omu.order_id = ${orders.id}), 0)`,
      otherExpense: sql<number>`COALESCE((SELECT SUM(pe.total_value) FROM production_expenses pe WHERE pe.order_id = ${orders.id}), 0)`,
    })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .where(and(validOrder, orderDate))
      .orderBy(desc(orders.createdAt))
      .limit(500);

    const perMaterial = await db.select({
      materialId: rawMaterials.id,
      code: rawMaterials.code,
      name: rawMaterials.name,
      category: rawMaterials.category,
      unit: rawMaterials.unit,
      quantityUsed: sql<number>`COALESCE(SUM(${orderMaterialUsages.quantity}), 0)`,
      totalCost: sql<number>`COALESCE(SUM(${orderMaterialUsages.totalCost}), 0)`,
      orderCount: sql<number>`COUNT(DISTINCT ${orderMaterialUsages.orderId})`,
      currentStock: rawMaterials.currentStock,
      currentUnitPrice: rawMaterials.unitPrice,
    })
      .from(orderMaterialUsages)
      .innerJoin(rawMaterials, eq(orderMaterialUsages.materialId, rawMaterials.id))
      .innerJoin(orders, eq(orderMaterialUsages.orderId, orders.id))
      .where(and(validOrder, orderDate))
      .groupBy(
        rawMaterials.id,
        rawMaterials.code,
        rawMaterials.name,
        rawMaterials.category,
        rawMaterials.unit,
        rawMaterials.currentStock,
        rawMaterials.unitPrice,
      )
      .orderBy(desc(sql`SUM(${orderMaterialUsages.totalCost})`));

    const monthlyResult = await db.execute(sql`
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', CURRENT_DATE) - interval '5 months',
          date_trunc('month', CURRENT_DATE),
          interval '1 month'
        ) AS month
      ), order_values AS (
        SELECT date_trunc('month', created_at) AS month, SUM(total_amount) AS revenue
        FROM orders
        WHERE payment_status NOT IN ('cancelled', 'refunded', 'expired')
        GROUP BY 1
      ), material_values AS (
        SELECT date_trunc('month', o.created_at) AS month, SUM(omu.total_cost) AS cost
        FROM order_material_usages omu JOIN orders o ON o.id = omu.order_id
        WHERE o.payment_status NOT IN ('cancelled', 'refunded', 'expired')
        GROUP BY 1
      ), expense_values AS (
        SELECT date_trunc('month', date) AS month, SUM(total_value) AS cost
        FROM production_expenses GROUP BY 1
      )
      SELECT to_char(m.month, 'YYYY-MM') AS month,
        COALESCE(o.revenue, 0) AS revenue,
        COALESCE(mat.cost, 0) AS material_cost,
        COALESCE(e.cost, 0) AS other_expense
      FROM months m
      LEFT JOIN order_values o ON o.month = m.month
      LEFT JOIN material_values mat ON mat.month = m.month
      LEFT JOIN expense_values e ON e.month = m.month
      ORDER BY m.month
    `);

    const orderRevenue = Number(orderSummary?.orderRevenue || 0);
    const productionExpense = Number(expenseSummary?.productionExpense || 0);
    const materialCost = Number(materialSummary?.materialCost || 0);

    res.json({
      summary: {
        orderRevenue,
        cashReceived: Number(cashSummary?.cashReceived || 0),
        outstandingReceivables: Number(orderSummary?.outstandingReceivables || 0),
        materialCost,
        productionExpense,
        totalCost: materialCost + productionExpense,
        estimatedGrossProfit: orderRevenue - materialCost - productionExpense,
        totalOrders: Number(orderSummary?.totalOrders || 0),
      },
      perOrder: perOrder.map((item) => ({
        ...item,
        estimatedProfit: Number(item.totalAmount) - Number(item.materialCost) - Number(item.otherExpense),
      })),
      perMaterial,
      monthlyTrend: monthlyResult.rows,
    });
  } catch (error) {
    console.error('Financial report error:', error);
    res.status(500).json({ error: 'Gagal memuat laporan keuangan' });
  }
});

export { router as financialReportsRoutes };
