import { Router } from 'express';
import { db } from '../db';
import { orders, customers, payments, orderItems } from '../db/schema';
import { eq, sql, desc, and, gte, lte } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth';
import * as XLSX from 'xlsx';
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

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

const router = Router();

router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, month, year } = req.query;
    
    let dateFilter: any = null;
    let paymentDateFilter: any = null;
    
    if (startDate && endDate) {
      dateFilter = sql`DATE(${orders.createdAt} AT TIME ZONE 'Asia/Jakarta') >= ${startDate} AND DATE(${orders.createdAt} AT TIME ZONE 'Asia/Jakarta') <= ${endDate}`;
      paymentDateFilter = sql`DATE(${payments.paidAt} AT TIME ZONE 'Asia/Jakarta') >= ${startDate} AND DATE(${payments.paidAt} AT TIME ZONE 'Asia/Jakarta') <= ${endDate}`;
    } else if (month && year) {
      const monthNum = parseInt(month as string);
      const yearNum = parseInt(year as string);
      const startStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
      const lastDay = new Date(yearNum, monthNum, 0).getDate();
      const endStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      dateFilter = sql`DATE(${orders.createdAt} AT TIME ZONE 'Asia/Jakarta') >= ${startStr} AND DATE(${orders.createdAt} AT TIME ZONE 'Asia/Jakarta') <= ${endStr}`;
      paymentDateFilter = sql`DATE(${payments.paidAt} AT TIME ZONE 'Asia/Jakarta') >= ${startStr} AND DATE(${payments.paidAt} AT TIME ZONE 'Asia/Jakarta') <= ${endStr}`;
    }

    // Total Order = semua order dalam periode
    const [totalOrdersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(dateFilter || undefined);

    // Order Aktif = order yang belum lunas dalam periode
    const [activeOrdersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(
        dateFilter 
          ? and(dateFilter, sql`${orders.paymentStatus} NOT IN ('paid', 'cancelled', 'refunded', 'expired')`)
          : sql`${orders.paymentStatus} NOT IN ('paid', 'cancelled', 'refunded', 'expired')`
      );

    const [completedOrdersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(
        dateFilter
          ? and(dateFilter, sql`${orders.productionStatus} IN ('selesai', 'dikirim')`)
          : sql`${orders.productionStatus} IN ('selesai', 'dikirim')`
      );

    // Total revenue dari order yang sudah lunas penuh (Kumulatif)
    const [totalRevenueResult] = await db
      .select({ sum: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)` })
      .from(orders)
      .where(eq(orders.paymentStatus, 'paid'));

    // Revenue periode: order yang lunas penuh dalam periode tertentu berdasarkan TANGGAL PESANAN
    const [periodRevenueResult] = await db
      .select({ sum: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)` })
      .from(orders)
      .where(
        and(
          eq(orders.paymentStatus, 'paid'),
          dateFilter ? dateFilter : sql`TRUE`
        )
      );

    // Nominal tertahan (sisa pembayaran dari order dalam periode yang BELUM lunas)
    // Termasuk order yang masih 'waiting_dp' (seluruh totalAmount dianggap sisa)
    const [pendingAmountResult] = await db
      .select({ 
        sum: sql<number>`COALESCE(SUM(CAST(${orders.remainingAmount} AS DECIMAL)), 0)` 
      })
      .from(orders)
      .where(
        dateFilter
          ? and(dateFilter, sql`${orders.paymentStatus} NOT IN ('paid', 'cancelled', 'refunded', 'expired') AND CAST(${orders.totalAmount} AS DECIMAL) > 0`)
          : sql`${orders.paymentStatus} NOT IN ('paid', 'cancelled', 'refunded', 'expired') AND CAST(${orders.totalAmount} AS DECIMAL) > 0`
      );

    // DP yang sudah dibayarkan (hanya dari order dalam periode yang BELUM lunas)
    const [paidDpResult] = await db
      .select({ 
        sum: sql<number>`COALESCE(SUM(CAST(${orders.paidDpAmount} AS DECIMAL)), 0)` 
      })
      .from(orders)
      .where(
        dateFilter 
          ? and(dateFilter, sql`${orders.paymentStatus} NOT IN ('paid', 'cancelled', 'refunded', 'expired')`)
          : sql`${orders.paymentStatus} NOT IN ('paid', 'cancelled', 'refunded', 'expired')`
      );

    // Total Omzet Keseluruhan (untuk perbandingan)
    const [totalOmzetAllTimeResult] = await db
      .select({ 
        sum: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)` 
      })
      .from(orders)
      .where(sql`${orders.paymentStatus} NOT IN ('cancelled', 'refunded', 'expired')`);

    // Total Omzet = total amount dari SEMUA order dalam periode (termasuk yang baru dibuat/waiting_dp)
    // DISINKRONKAN: Omzet = Revenue Periode + DP Terbayar + Nominal Tertahan
    const totalOmzet = Number(periodRevenueResult?.sum || 0) + 
                      Number(paidDpResult?.sum || 0) + 
                      Number(pendingAmountResult?.sum || 0);

    // Total Pelanggan Periode (jika filter aktif)
    const [totalCustomersResult] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${orders.customerId})` })
      .from(orders)
      .where(dateFilter || undefined);

    res.json({
      totalOrders: Number(totalOrdersResult?.count || 0),
      activeOrders: Number(activeOrdersResult?.count || 0),
      completedOrders: Number(completedOrdersResult?.count || 0),
      totalCustomers: Number(totalCustomersResult?.count || 0),
      totalRevenue: Number(totalRevenueResult?.sum || 0),
      monthlyRevenue: Number(periodRevenueResult?.sum || 0),
      pendingAmount: Number(pendingAmountResult?.sum || 0),
      paidDpAmount: Number(paidDpResult?.sum || 0),
      totalOmzet: totalOmzet,
      totalOmzetAllTime: Number(totalOmzetAllTimeResult?.sum || 0),
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.get('/recent-orders', async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, month, year } = req.query;
    
    let dateFilter: any = null;
    
    if (startDate && endDate) {
      dateFilter = sql`DATE(${orders.createdAt} AT TIME ZONE 'Asia/Jakarta') >= ${startDate} AND DATE(${orders.createdAt} AT TIME ZONE 'Asia/Jakarta') <= ${endDate}`;
    } else if (month && year) {
      const monthNum = parseInt(month as string);
      const yearNum = parseInt(year as string);
      const startStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
      const lastDay = new Date(yearNum, monthNum, 0).getDate();
      const endStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      dateFilter = sql`DATE(${orders.createdAt} AT TIME ZONE 'Asia/Jakarta') >= ${startStr} AND DATE(${orders.createdAt} AT TIME ZONE 'Asia/Jakarta') <= ${endStr}`;
    }

    const recentOrders = await db
      .select({
        id: orders.id,
        invoiceNumber: orders.invoiceNumber,
        trackingCode: orders.trackingCode,
        totalAmount: orders.totalAmount,
        paymentStatus: orders.paymentStatus,
        productionStatus: orders.productionStatus,
        productionProgress: orders.productionProgress,
        createdAt: orders.createdAt,
        customer: {
          name: customers.name,
          phone: customers.phone,
        },
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(dateFilter || undefined)
      .orderBy(desc(orders.createdAt))
      .limit(10);

    res.json({ orders: recentOrders });
  } catch (error) {
    console.error('Recent orders error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.get('/production-overview', async (req: AuthRequest, res) => {
  try {
    const statusCounts = await db
      .select({
        status: orders.productionStatus,
        count: sql<number>`count(*)`,
      })
      .from(orders)
      .where(eq(orders.paymentStatus, 'paid'))
      .groupBy(orders.productionStatus);

    res.json({ statusCounts });
  } catch (error) {
    console.error('Production overview error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

const buildDateFilter = (startDate?: string, endDate?: string, month?: string, year?: string) => {
  if (startDate && endDate) {
    return {
      orderFilter: sql`DATE(${orders.createdAt} AT TIME ZONE 'Asia/Jakarta') >= ${startDate} AND DATE(${orders.createdAt} AT TIME ZONE 'Asia/Jakarta') <= ${endDate}`,
      paymentFilter: sql`DATE(${payments.paidAt} AT TIME ZONE 'Asia/Jakarta') >= ${startDate} AND DATE(${payments.paidAt} AT TIME ZONE 'Asia/Jakarta') <= ${endDate}`,
    };
  } else if (month && year) {
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    const startStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
    const lastDay = new Date(yearNum, monthNum, 0).getDate();
    const endStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return {
      orderFilter: sql`DATE(${orders.createdAt} AT TIME ZONE 'Asia/Jakarta') >= ${startStr} AND DATE(${orders.createdAt} AT TIME ZONE 'Asia/Jakarta') <= ${endStr}`,
      paymentFilter: sql`DATE(${payments.paidAt} AT TIME ZONE 'Asia/Jakarta') >= ${startStr} AND DATE(${payments.paidAt} AT TIME ZONE 'Asia/Jakarta') <= ${endStr}`,
    };
  }
  return { orderFilter: null, paymentFilter: null };
};

router.get('/product-analytics', async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, month, year } = req.query;
    const { orderFilter } = buildDateFilter(
      startDate as string, 
      endDate as string, 
      month as string, 
      year as string
    );

    const productSales = await db
      .select({
        productName: orderItems.productName,
        totalQuantity: sql<number>`SUM(${orderItems.quantity})`,
        totalRevenue: sql<number>`SUM(CAST(${orderItems.subtotal} AS DECIMAL))`,
        orderCount: sql<number>`COUNT(DISTINCT ${orderItems.orderId})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(orderFilter || undefined)
      .groupBy(orderItems.productName)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(10);

    const productCategorySales = await db
      .select({
        productCategory: orderItems.productCategory,
        totalQuantity: sql<number>`SUM(${orderItems.quantity})`,
        totalRevenue: sql<number>`SUM(CAST(${orderItems.subtotal} AS DECIMAL))`,
        orderCount: sql<number>`COUNT(DISTINCT ${orderItems.orderId})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(orderFilter || undefined)
      .groupBy(orderItems.productCategory)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(10);

    const colorSales = await db
      .select({
        color: orderItems.color,
        totalQuantity: sql<number>`SUM(${orderItems.quantity})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(orderFilter || undefined)
      .groupBy(orderItems.color)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(10);

    res.json({
      productSales: productSales.map(p => ({
        productName: p.productName,
        totalQuantity: Number(p.totalQuantity || 0),
        totalRevenue: Number(p.totalRevenue || 0),
        orderCount: Number(p.orderCount || 0),
      })),
      productCategorySales: productCategorySales.map(p => ({
        productCategory: p.productCategory || 'Tidak Ada',
        totalQuantity: Number(p.totalQuantity || 0),
        totalRevenue: Number(p.totalRevenue || 0),
        orderCount: Number(p.orderCount || 0),
      })),
      colorSales: colorSales.map(c => ({
        color: c.color || 'Tidak Ada',
        totalQuantity: Number(c.totalQuantity || 0),
      })),
    });
  } catch (error) {
    console.error('Product analytics error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.get('/export/excel', async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, month, year } = req.query;
    const { orderFilter, paymentFilter } = buildDateFilter(
      startDate as string, 
      endDate as string, 
      month as string, 
      year as string
    );

    const [totalOrdersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(orderFilter || undefined);

    const [activeOrdersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(
        orderFilter 
          ? and(orderFilter, sql`${orders.productionStatus} NOT IN ('selesai', 'dikirim')`, eq(orders.paymentStatus, 'paid'))
          : and(sql`${orders.productionStatus} NOT IN ('selesai', 'dikirim')`, eq(orders.paymentStatus, 'paid'))
      );

    const [completedOrdersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(
        orderFilter
          ? and(orderFilter, sql`${orders.productionStatus} IN ('selesai', 'dikirim')`)
          : sql`${orders.productionStatus} IN ('selesai', 'dikirim')`
      );

    const [revenueResult] = await db
      .select({ sum: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)` })
      .from(payments)
      .where(
        paymentFilter
          ? and(paymentFilter, eq(payments.status, 'paid'))
          : eq(payments.status, 'paid')
      );

    const productSales = await db
      .select({
        productName: orderItems.productName,
        totalQuantity: sql<number>`SUM(${orderItems.quantity})`,
        totalRevenue: sql<number>`SUM(CAST(${orderItems.subtotal} AS DECIMAL))`,
        orderCount: sql<number>`COUNT(DISTINCT ${orderItems.orderId})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(orderFilter || undefined)
      .groupBy(orderItems.productName)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`));

    const allOrders = await db
      .select({
        invoiceNumber: orders.invoiceNumber,
        trackingCode: orders.trackingCode,
        customerName: customers.name,
        customerPhone: customers.phone,
        totalAmount: orders.totalAmount,
        dpAmount: orders.dpAmount,
        paymentStatus: orders.paymentStatus,
        productionStatus: orders.productionStatus,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(orderFilter || undefined)
      .orderBy(desc(orders.createdAt));

    const workbook = XLSX.utils.book_new();

    const summaryData = [
      ['LAPORAN DASHBOARD SEKALA INDUSTRY'],
      [''],
      ['Periode', getPeriodLabel(startDate as string, endDate as string, month as string, year as string)],
      ['Tanggal Export', new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })],
      [''],
      ['RINGKASAN'],
      ['Total Order', Number(totalOrdersResult?.count || 0)],
      ['Order Aktif', Number(activeOrdersResult?.count || 0)],
      ['Order Selesai', Number(completedOrdersResult?.count || 0)],
      ['Total Revenue', formatCurrencyExcel(Number(revenueResult?.sum || 0))],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan');

    const productData = [
      ['ANALISIS PENJUALAN PRODUK'],
      [''],
      ['Nama Produk', 'Jumlah Terjual', 'Total Revenue', 'Jumlah Order'],
      ...productSales.map(p => [
        p.productName,
        Number(p.totalQuantity || 0),
        formatCurrencyExcel(Number(p.totalRevenue || 0)),
        Number(p.orderCount || 0),
      ]),
    ];
    const productSheet = XLSX.utils.aoa_to_sheet(productData);
    XLSX.utils.book_append_sheet(workbook, productSheet, 'Produk Terlaris');

    const orderData = [
      ['DAFTAR ORDER'],
      [''],
      ['No Invoice', 'Tracking Code', 'Pelanggan', 'No HP', 'Total', 'DP', 'Status Bayar', 'Status Produksi', 'Tanggal'],
      ...allOrders.map(o => [
        o.invoiceNumber,
        o.trackingCode,
        o.customerName,
        o.customerPhone,
        formatCurrencyExcel(Number(o.totalAmount || 0)),
        formatCurrencyExcel(Number(o.dpAmount || 0)),
        getPaymentStatusLabel(o.paymentStatus),
        getProductionStatusLabel(o.productionStatus),
        new Date(o.createdAt).toLocaleDateString('id-ID'),
      ]),
    ];
    const orderSheet = XLSX.utils.aoa_to_sheet(orderData);
    XLSX.utils.book_append_sheet(workbook, orderSheet, 'Daftar Order');

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=laporan-dashboard-${Date.now()}.xlsx`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({ error: 'Gagal export Excel' });
  }
});

router.get('/export/pdf', async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, month, year } = req.query;
    const { orderFilter } = buildDateFilter(
      startDate as string, 
      endDate as string, 
      month as string, 
      year as string
    );

    // Total Order = hanya order yang DP sudah dibayar (dp_paid, waiting_pelunasan, paid) - same as dashboard
    const [totalOrdersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(
        orderFilter 
          ? and(orderFilter, sql`${orders.paymentStatus} IN ('dp_paid', 'waiting_pelunasan', 'paid')`)
          : sql`${orders.paymentStatus} IN ('dp_paid', 'waiting_pelunasan', 'paid')`
      );

    // Order Aktif = order yang DP sudah dibayar tapi belum lunas - same as dashboard
    const [activeOrdersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(
        orderFilter 
          ? and(orderFilter, sql`${orders.paymentStatus} IN ('dp_paid', 'waiting_pelunasan')`)
          : sql`${orders.paymentStatus} IN ('dp_paid', 'waiting_pelunasan')`
      );

    const [completedOrdersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(
        orderFilter
          ? and(orderFilter, sql`${orders.productionStatus} IN ('selesai', 'dikirim')`)
          : sql`${orders.productionStatus} IN ('selesai', 'dikirim')`
      );

    // Revenue calculation - same as dashboard (from orders with paymentStatus='paid')
    let paidAtFilter: any = null;
    if (startDate && endDate) {
      paidAtFilter = sql`DATE(${orders.paidAt} AT TIME ZONE 'Asia/Jakarta') >= ${startDate} AND DATE(${orders.paidAt} AT TIME ZONE 'Asia/Jakarta') <= ${endDate}`;
    } else if (month && year) {
      const monthNum = parseInt(month as string);
      const yearNum = parseInt(year as string);
      const startStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
      const lastDay = new Date(yearNum, monthNum, 0).getDate();
      const endStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      paidAtFilter = sql`DATE(${orders.paidAt} AT TIME ZONE 'Asia/Jakarta') >= ${startStr} AND DATE(${orders.paidAt} AT TIME ZONE 'Asia/Jakarta') <= ${endStr}`;
    }

    const [revenueResult] = await db
      .select({ sum: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)` })
      .from(orders)
      .where(
        paidAtFilter
          ? and(eq(orders.paymentStatus, 'paid'), paidAtFilter)
          : eq(orders.paymentStatus, 'paid')
      );
    
    // DP yang sudah dibayarkan (hanya dari order yang BELUM lunas)
    const [paidDpResultPdf] = await db
      .select({ 
        sum: sql<number>`COALESCE(SUM(CAST(${orders.paidDpAmount} AS DECIMAL)), 0)` 
      })
      .from(orders)
      .where(
        orderFilter 
          ? and(orderFilter, sql`${orders.paymentStatus} IN ('dp_paid', 'waiting_pelunasan')`)
          : sql`${orders.paymentStatus} IN ('dp_paid', 'waiting_pelunasan')`
      );

    // Nominal tertahan (sisa pembayaran dari order yang DP sudah dibayar tapi belum lunas) - sama dengan dashboard
    const [pendingAmountResultPdf] = await db
      .select({ 
        sum: sql<number>`COALESCE(SUM(CAST(${orders.remainingAmount} AS DECIMAL)), 0)` 
      })
      .from(orders)
      .where(
        orderFilter
          ? and(orderFilter, sql`${orders.paymentStatus} IN ('dp_paid', 'waiting_pelunasan') AND CAST(${orders.remainingAmount} AS DECIMAL) > 0`)
          : sql`${orders.paymentStatus} IN ('dp_paid', 'waiting_pelunasan') AND CAST(${orders.remainingAmount} AS DECIMAL) > 0`
      );

    const productSales = await db
      .select({
        productName: orderItems.productName,
        totalQuantity: sql<number>`SUM(${orderItems.quantity})`,
        totalRevenue: sql<number>`SUM(CAST(${orderItems.subtotal} AS DECIMAL))`,
        orderCount: sql<number>`COUNT(DISTINCT ${orderItems.orderId})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(orderFilter || undefined)
      .groupBy(orderItems.productName)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(10);

    let logoBase64 = '';
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      }
    } catch (e) {
      console.log('Logo not found');
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Laporan Dashboard - Sekala Industry</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; color: #333; }
          .header { display: flex; align-items: center; margin-bottom: 30px; border-bottom: 3px solid #1e3a8a; padding-bottom: 20px; }
          .logo { width: 80px; height: 80px; margin-right: 20px; }
          .company-info h1 { color: #1e3a8a; font-size: 24px; }
          .company-info p { color: #666; font-size: 12px; }
          .report-title { text-align: center; margin: 30px 0; }
          .report-title h2 { color: #1e3a8a; font-size: 20px; }
          .report-title p { color: #666; font-size: 14px; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
          .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; }
          .summary-card h3 { font-size: 12px; color: #64748b; margin-bottom: 8px; }
          .summary-card p { font-size: 20px; font-weight: bold; color: #1e3a8a; }
          .section { margin-bottom: 30px; }
          .section h3 { color: #1e3a8a; font-size: 16px; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #CCFF00; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #1e3a8a; color: white; padding: 10px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) { background: #f8fafc; }
          .footer { margin-top: 40px; text-align: center; color: #64748b; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          .highlight { background: #CCFF00; padding: 2px 8px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          ${logoBase64 ? `<img src="${logoBase64}" class="logo" alt="Logo">` : ''}
          <div class="company-info">
            <h1>SEKALA INDUSTRY</h1>
            <p>Jl. Maccini Sawah No 48, Maccini, Kota Makassar</p>
            <p>Telp: 0857-5477-7068 | Email: sekalaindustry@gmail.com</p>
          </div>
        </div>
        
        <div class="report-title">
          <h2>LAPORAN DASHBOARD</h2>
          <p>Periode: ${getPeriodLabel(startDate as string, endDate as string, month as string, year as string)}</p>
          <p>Dicetak: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <h3>TOTAL ORDER</h3>
            <p>${Number(totalOrdersResult?.count || 0)}</p>
          </div>
          <div class="summary-card">
            <h3>ORDER AKTIF</h3>
            <p>${Number(activeOrdersResult?.count || 0)}</p>
          </div>
          <div class="summary-card">
            <h3>ORDER SELESAI</h3>
            <p>${Number(completedOrdersResult?.count || 0)}</p>
          </div>
          <div class="summary-card">
            <h3>REVENUE (LUNAS)</h3>
            <p style="color: #22c55e;">${formatCurrencyPdf(Number(revenueResult?.sum || 0))}</p>
          </div>
        </div>
        <div class="summary-grid" style="margin-top: 15px;">
          <div class="summary-card">
            <h3>DP TERBAYAR</h3>
            <p style="color: #3b82f6;">${formatCurrencyPdf(Number(paidDpResultPdf?.sum || 0))}</p>
          </div>
          <div class="summary-card">
            <h3>NOMINAL TERTAHAN</h3>
            <p style="color: #f59e0b;">${formatCurrencyPdf(Number(pendingAmountResultPdf?.sum || 0))}</p>
          </div>
          <div class="summary-card" style="background: #1e3a8a;">
            <h3 style="color: #CCFF00;">TOTAL OMZET</h3>
            <p style="color: #CCFF00;">${formatCurrencyPdf(Number(revenueResult?.sum || 0) + Number(pendingAmountResultPdf?.sum || 0))}</p>
          </div>
          <div class="summary-card">
            <h3>&nbsp;</h3>
            <p>&nbsp;</p>
          </div>
        </div>

        <div class="section">
          <h3>TOP 10 PRODUK TERLARIS</h3>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Produk</th>
                <th>Jumlah Terjual</th>
                <th>Total Revenue</th>
                <th>Jumlah Order</th>
              </tr>
            </thead>
            <tbody>
              ${productSales.map((p, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${p.productName}</td>
                  <td><span class="highlight">${Number(p.totalQuantity || 0).toLocaleString('id-ID')}</span></td>
                  <td>${formatCurrencyPdf(Number(p.totalRevenue || 0))}</td>
                  <td>${Number(p.orderCount || 0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>Dokumen ini digenerate secara otomatis oleh sistem Sekala Industry</p>
          <p>&copy; ${new Date().getFullYear()} Sekala Industry. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const chromiumPath = getChromiumPath();
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: chromiumPath || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-first-run', '--no-zygote', '--single-process'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
    });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=laporan-dashboard-${Date.now()}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ error: 'Gagal export PDF' });
  }
});

function getPeriodLabel(startDate?: string, endDate?: string, month?: string, year?: string): string {
  if (startDate && endDate) {
    return `${formatDateId(startDate)} - ${formatDateId(endDate)}`;
  } else if (month && year) {
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }
  return 'Semua Waktu';
}

function formatDateId(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatCurrencyExcel(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

function formatCurrencyPdf(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    waiting_payment: 'Belum Bayar',
    waiting_dp: 'Menunggu DP',
    dp_paid: 'DP Dibayar',
    waiting_pelunasan: 'Menunggu Pelunasan',
    paid: 'Lunas',
    expired: 'Kadaluarsa',
    cancelled: 'Dibatalkan',
  };
  return labels[status] || status;
}

function getProductionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Menunggu',
    design: 'Design',
    beli_bahan: 'Beli Bahan',
    potong_printing: 'Potong/Printing',
    jahit: 'Jahit',
    bordir_sablon: 'Bordir/Sablon',
    qc: 'QC',
    packing: 'Packing',
    selesai: 'Selesai',
    dikirim: 'Dikirim',
  };
  return labels[status] || status;
}

export { router as dashboardRoutes };
