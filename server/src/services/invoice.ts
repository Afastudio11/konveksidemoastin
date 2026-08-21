import puppeteer, { Browser, Page } from 'puppeteer';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale/id';
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

const COMPANY_INFO = {
  name: 'Sekala Industry',
  tagline: 'Konveksi & Apparel Professional',
  phone: '0857-5477-7068',
  email: 'sekalaindustry@gmail.com',
  address: 'Jl. Maccini Sawah No 48, Maccini, Kota Makassar, Sulawesi Selatan',
};

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
    console.error('Error loading logo:', error);
    return '';
  }
}

interface InvoiceItem {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface InvoiceData {
  invoiceNumber: string;
  trackingCode: string;
  orderDate: Date;
  dueDate?: Date;
  customer: {
    name: string;
    email?: string;
    phone: string;
    address?: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  includePPN?: boolean;
  ppnAmount?: number;
  tax?: number;
  discountAmount?: number;
  total: number;
  notes?: string;
  paymentStatus: 'pending' | 'partial' | 'paid';
  paidAmount?: number;
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

export function generateInvoiceHTML(data: InvoiceData): string {
  const logoBase64 = getLogoBase64();
  const itemsHTML = data.items
    .map(
      (item, index) => `
      <tr>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${index + 1}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">
          <strong>${item.name}</strong>
          ${item.description ? `<br><span style="color: #6b7280; font-size: 11px;">${item.description}</span>` : ''}
        </td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 12px;">${item.quantity}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 12px;">${formatCurrency(item.unitPrice)}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 12px;">${formatCurrency(item.subtotal)}</td>
      </tr>
    `
    )
    .join('');

  const statusBadge = {
    pending: '<span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 10px;">BELUM LUNAS</span>',
    partial: '<span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 10px;">DP</span>',
    paid: '<span style="background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 4px; font-size: 10px;">LUNAS</span>',
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${data.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; line-height: 1.3; font-size: 12px; }
    .container { max-width: 800px; margin: 0 auto; padding: 15px 20px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 15px; }
    .logo-img { height: 50px; width: auto; }
    .company-name { font-size: 16px; font-weight: bold; color: #000000; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1e3a8a; color: white; padding: 6px 8px; text-align: left; font-size: 11px; }
    th:nth-child(3), th:nth-child(4), th:nth-child(5) { text-align: center; }
    th:last-child { text-align: right; }
    .totals { margin-top: 10px; }
    .totals table { width: 250px; margin-left: auto; }
    .totals td { padding: 4px 8px; font-size: 11px; }
    .totals tr:last-child { font-weight: bold; font-size: 13px; background: #f3f4f6; }
    .footer { margin-top: 20px; text-align: center; color: #6b7280; font-size: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        ${logoBase64 ? `<img src="${logoBase64}" alt="${COMPANY_INFO.name}" class="logo-img" />` : `<div class="company-name">${COMPANY_INFO.name}</div>`}
        <p style="color: #6b7280; font-size: 10px; margin-top: 2px;">${COMPANY_INFO.tagline}</p>
        <p style="color: #6b7280; font-size: 10px;">${COMPANY_INFO.address}</p>
        <p style="color: #6b7280; font-size: 10px;">Telp: ${COMPANY_INFO.phone} | Email: ${COMPANY_INFO.email}</p>
      </div>
      <div style="text-align: right;">
        <h1 style="font-size: 24px; color: #1e3a8a;">INVOICE</h1>
        <p style="margin-top: 4px; font-size: 11px;"><strong>No:</strong> ${data.invoiceNumber}</p>
        <p style="font-size: 11px;"><strong>Tracking:</strong> ${data.trackingCode}</p>
        <p style="font-size: 11px;"><strong>Tanggal:</strong> ${formatDate(data.orderDate)}</p>
        ${data.dueDate ? `<p style="font-size: 11px;"><strong>Jatuh Tempo:</strong> ${formatDate(data.dueDate)}</p>` : ''}
        <div style="margin-top: 4px;">${statusBadge[data.paymentStatus]}</div>
      </div>
    </div>

    <div style="margin-bottom: 12px; padding: 10px; background: #f9fafb; border-radius: 6px;">
      <h3 style="color: #1e3a8a; margin-bottom: 6px; font-size: 12px;">Tagihan Kepada:</h3>
      <p style="font-size: 13px; font-weight: 600;">${data.customer.name}</p>
      <p style="color: #6b7280; font-size: 11px;">${data.customer.phone}</p>
      ${data.customer.email ? `<p style="color: #6b7280; font-size: 11px;">${data.customer.email}</p>` : ''}
      ${data.customer.address ? `<p style="color: #6b7280; font-size: 11px;">${data.customer.address}</p>` : ''}
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 30px;">No</th>
          <th>Deskripsi</th>
          <th style="width: 50px;">Qty</th>
          <th style="width: 100px;">Harga Satuan</th>
          <th style="width: 100px;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>

    <div class="totals">
      <table>
        <tr>
          <td>Subtotal</td>
          <td style="text-align: right;">${formatCurrency(data.subtotal)}</td>
        </tr>
        ${data.discountAmount ? `
        <tr>
          <td>Diskon</td>
          <td style="text-align: right; color: #dc2626;">-${formatCurrency(data.discountAmount)}</td>
        </tr>
        ` : ''}
        ${data.includePPN ? `
        <tr>
          <td>Pajak (PPN 11%)</td>
          <td style="text-align: right;">${formatCurrency(data.ppnAmount || data.tax || 0)}</td>
        </tr>
        ` : ''}
        <tr>
          <td>TOTAL</td>
          <td style="text-align: right;">${formatCurrency(data.total)}</td>
        </tr>
        ${data.paidAmount && data.paidAmount > 0 ? `
        <tr>
          <td>Terbayar</td>
          <td style="text-align: right; color: #059669;">${formatCurrency(data.paidAmount)}</td>
        </tr>
        <tr>
          <td>Sisa</td>
          <td style="text-align: right; color: #dc2626;">${formatCurrency(data.total - data.paidAmount)}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    ${data.notes ? `
    <div style="margin-top: 12px; padding: 10px; background: #fef3c7; border-radius: 6px;">
      <h4 style="color: #92400e; margin-bottom: 4px; font-size: 11px;">Catatan:</h4>
      <p style="color: #78350f; font-size: 11px;">${data.notes}</p>
    </div>
    ` : ''}

    <div style="margin-top: 12px; padding: 10px; background: #dbeafe; border-radius: 6px;">
      <h4 style="color: #1e40af; margin-bottom: 4px; font-size: 11px;">Informasi Pembayaran:</h4>
      <p style="color: #1e3a8a; font-size: 11px; font-weight: bold;">Bank BRI</p>
      <p style="color: #1e3a8a; font-size: 11px;">No. Rekening: 024001000578560</p>
      <p style="color: #1e3a8a; font-size: 11px;">A/n: PT Virotek Karya Kreasi</p>
      <p style="margin-top: 4px; font-size: 10px; color: #3b82f6;">
        Kode Tracking: <strong>${data.trackingCode}</strong>
      </p>
    </div>

    <div class="footer">
      <p>Terima kasih atas kepercayaan Anda kepada Sekala Industry</p>
      <p style="margin-top: 4px;">Invoice ini dibuat secara otomatis oleh sistem Sekala Industry</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const html = generateInvoiceHTML(data);
  const chromiumPath = getChromiumPath();
  
  let browser: Browser | null = null;
  let page: Page | null = null;
  
  try {
    browser = await puppeteer.launch({
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
    
    page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });
    
    return Buffer.from(pdf);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Gagal membuat PDF invoice. Silakan coba lagi atau gunakan versi HTML.');
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (e) {
        console.error('Error closing page:', e);
      }
    }
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('Error closing browser:', e);
      }
    }
  }
}

export { InvoiceData, InvoiceItem };

interface PaymentInvoiceData {
  invoiceNumber: string;
  orderInvoiceNumber: string;
  trackingCode: string;
  paymentDate: Date;
  invoiceType: 'dp' | 'pelunasan';
  customer: {
    name: string;
    email?: string;
    phone: string;
    address?: string;
  };
  paymentAmount: number;
  paymentMethod: string;
  orderTotal: number;
  discountAmount?: number;
  totalPaid: number;
  remainingAmount: number;
  notes?: string;
}

export function generatePaymentInvoiceHTML(data: PaymentInvoiceData): string {
  const logoBase64 = getLogoBase64();
  const invoiceTypeLabel = data.invoiceType === 'dp' ? 'DOWN PAYMENT (DP)' : 'PELUNASAN';
  const invoiceTypeBadge = data.invoiceType === 'dp' 
    ? '<span style="background: #dbeafe; color: #1e40af; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: bold;">INVOICE DP</span>'
    : '<span style="background: #d1fae5; color: #065f46; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: bold;">INVOICE PELUNASAN</span>';

  const statusBadge = data.remainingAmount <= 0 
    ? '<span style="background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 4px; font-size: 10px;">LUNAS</span>'
    : '<span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 10px;">BELUM LUNAS</span>';

  const dpPaidMessage = data.invoiceType === 'dp' 
    ? `<div style="margin-top: 12px; padding: 12px; background: #d1fae5; border-radius: 6px; border: 2px solid #22c55e; text-align: center;">
        <span style="color: #166534; font-size: 13px; font-weight: bold;">TAGIHAN DOWN PAYMENT (DP) TELAH DIBAYARKAN</span>
        <p style="color: #166534; font-size: 11px; margin-top: 6px;">Pembayaran DP sebesar ${formatCurrency(data.paymentAmount)} telah diterima dengan baik.</p>
      </div>`
    : `<div style="margin-top: 12px; padding: 12px; background: #d1fae5; border-radius: 6px; border: 2px solid #22c55e; text-align: center;">
        <span style="color: #166534; font-size: 13px; font-weight: bold;">PELUNASAN TELAH DIBAYARKAN</span>
        <p style="color: #166534; font-size: 11px; margin-top: 6px;">Pembayaran pelunasan sebesar ${formatCurrency(data.paymentAmount)} telah diterima dengan baik.</p>
      </div>`;

  const remainingPaymentBox = data.remainingAmount > 0 
    ? `<div style="margin-top: 12px; padding: 12px; background: #fef3c7; border-radius: 6px; border: 2px solid #f59e0b; text-align: center;">
        <p style="color: #92400e; font-size: 11px; margin-bottom: 4px;">Sisa yang harus Anda bayarkan:</p>
        <p style="color: #92400e; font-size: 20px; font-weight: bold;">${formatCurrency(data.remainingAmount)}</p>
        <p style="color: #78350f; font-size: 10px; margin-top: 6px;">Silakan lakukan pembayaran sisa tagihan untuk menyelesaikan pesanan Anda.</p>
      </div>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice Pembayaran ${data.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; line-height: 1.3; font-size: 11px; }
    .container { max-width: 800px; margin: 0 auto; padding: 15px 20px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 15px; }
    .logo-img { height: 50px; width: auto; }
    .company-name { font-size: 16px; font-weight: bold; color: #000000; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1e3a8a; color: white; padding: 6px 8px; text-align: left; font-size: 10px; }
    th:last-child { text-align: right; }
    td { padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
    .summary { margin-top: 12px; }
    .summary table { width: 280px; margin-left: auto; }
    .summary td { padding: 5px 8px; font-size: 11px; }
    .summary tr.highlight { font-weight: bold; font-size: 12px; background: #d1fae5; }
    .summary tr.total { font-weight: bold; background: #f3f4f6; }
    .footer { margin-top: 15px; text-align: center; color: #6b7280; font-size: 9px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        ${logoBase64 ? `<img src="${logoBase64}" alt="${COMPANY_INFO.name}" class="logo-img" />` : `<div class="company-name">${COMPANY_INFO.name}</div>`}
        <p style="color: #6b7280; font-size: 10px; margin-top: 2px;">${COMPANY_INFO.tagline}</p>
        <p style="color: #6b7280; font-size: 10px;">${COMPANY_INFO.address}</p>
        <p style="color: #6b7280; font-size: 10px;">Telp: ${COMPANY_INFO.phone} | Email: ${COMPANY_INFO.email}</p>
      </div>
      <div style="text-align: right;">
        <h1 style="font-size: 22px; color: #1e3a8a;">KWITANSI</h1>
        <div style="margin-top: 4px; margin-bottom: 6px;">${invoiceTypeBadge}</div>
        <p style="font-size: 10px;"><strong>No:</strong> ${data.invoiceNumber}</p>
        <p style="font-size: 10px;"><strong>Tanggal:</strong> ${formatDate(data.paymentDate)}</p>
        <p style="margin-top: 4px; font-size: 10px;"><strong>Ref Order:</strong> ${data.orderInvoiceNumber}</p>
        <p style="font-size: 10px;"><strong>Tracking:</strong> ${data.trackingCode}</p>
      </div>
    </div>

    <div style="margin-bottom: 12px; padding: 10px; background: #f9fafb; border-radius: 6px;">
      <h3 style="color: #1e3a8a; margin-bottom: 6px; font-size: 11px;">Diterima Dari:</h3>
      <p style="font-size: 13px; font-weight: 600;">${data.customer.name}</p>
      <p style="color: #6b7280; font-size: 10px;">${data.customer.phone}</p>
      ${data.customer.email ? `<p style="color: #6b7280; font-size: 10px;">${data.customer.email}</p>` : ''}
      ${data.customer.address ? `<p style="color: #6b7280; font-size: 10px;">${data.customer.address}</p>` : ''}
    </div>

    <div style="margin-bottom: 12px; padding: 12px; background: ${data.invoiceType === 'dp' ? '#eff6ff' : '#f0fdf4'}; border-radius: 6px; border-left: 3px solid ${data.invoiceType === 'dp' ? '#3b82f6' : '#22c55e'};">
      <h3 style="color: ${data.invoiceType === 'dp' ? '#1e40af' : '#166534'}; margin-bottom: 8px; font-size: 11px;">Detail Pembayaran ${invoiceTypeLabel}</h3>
      <table style="background: white; border-radius: 6px; overflow: hidden;">
        <thead>
          <tr>
            <th>Keterangan</th>
            <th style="width: 150px;">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Pembayaran ${invoiceTypeLabel}</strong>
              <br><span style="color: #6b7280; font-size: 10px;">Order: ${data.orderInvoiceNumber}</span>
              <br><span style="color: #6b7280; font-size: 10px;">Metode: ${data.paymentMethod}</span>
            </td>
            <td style="text-align: right; font-size: 14px; font-weight: bold; color: #059669;">
              ${formatCurrency(data.paymentAmount)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="summary">
      <table>
        <tr>
          <td>Total Order (Bruto)</td>
          <td style="text-align: right;">${formatCurrency(data.orderTotal + (data.discountAmount || 0))}</td>
        </tr>
        ${data.discountAmount ? `
        <tr>
          <td>Diskon</td>
          <td style="text-align: right; color: #dc2626;">-${formatCurrency(data.discountAmount)}</td>
        </tr>
        ` : ''}
        <tr class="highlight">
          <td>Total Order (Neto)</td>
          <td style="text-align: right;">${formatCurrency(data.orderTotal)}</td>
        </tr>
        <tr class="highlight">
          <td>Pembayaran Kali Ini</td>
          <td style="text-align: right; color: #059669;">${formatCurrency(data.paymentAmount)}</td>
        </tr>
        <tr class="total">
          <td>Total Terbayar</td>
          <td style="text-align: right;">${formatCurrency(data.totalPaid)}</td>
        </tr>
        <tr>
          <td>Sisa Pembayaran</td>
          <td style="text-align: right; ${data.remainingAmount > 0 ? 'color: #dc2626;' : 'color: #059669;'}">
            ${data.remainingAmount > 0 ? formatCurrency(data.remainingAmount) : 'Rp 0 (LUNAS)'}
          </td>
        </tr>
      </table>
    </div>

    ${dpPaidMessage}
    ${remainingPaymentBox}

    <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <p style="color: #6b7280; font-size: 10px;">Status Pembayaran:</p>
        <div style="margin-top: 4px;">${statusBadge}</div>
      </div>
      <div style="text-align: center; width: 150px;">
        <p style="color: #6b7280; font-size: 10px; margin-bottom: 40px;">Hormat Kami,</p>
        <div style="border-top: 1px solid #9ca3af; padding-top: 6px;">
          <p style="font-weight: 600; font-size: 11px;">Sekala Industry</p>
        </div>
      </div>
    </div>

    ${data.notes ? `
    <div style="margin-top: 12px; padding: 10px; background: #fef3c7; border-radius: 6px;">
      <h4 style="color: #92400e; margin-bottom: 4px; font-size: 10px;">Catatan:</h4>
      <p style="color: #78350f; font-size: 10px;">${data.notes}</p>
    </div>
    ` : ''}

    ${data.remainingAmount > 0 ? `
    <div style="margin-top: 12px; padding: 10px; background: #dbeafe; border-radius: 6px;">
      <h4 style="color: #1e40af; margin-bottom: 4px; font-size: 11px;">Informasi Pembayaran Sisa:</h4>
      <p style="color: #1e3a8a; font-size: 11px; font-weight: bold;">Bank BRI</p>
      <p style="color: #1e3a8a; font-size: 11px;">No. Rekening: 024001000578560</p>
      <p style="color: #1e3a8a; font-size: 11px;">A/n: PT Virotek Karya Kreasi</p>
    </div>
    ` : ''}

    <div class="footer">
      <p>Terima kasih atas pembayaran Anda</p>
      <p style="margin-top: 4px;">Kwitansi ini dibuat secara otomatis oleh sistem Sekala Industry</p>
      <p style="margin-top: 2px; font-size: 8px; color: #9ca3af;">Simpan kwitansi ini sebagai bukti pembayaran yang sah</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function generatePaymentInvoicePDF(data: PaymentInvoiceData): Promise<Buffer> {
  const html = generatePaymentInvoiceHTML(data);
  const chromiumPath = getChromiumPath();
  
  let browser: Browser | null = null;
  let page: Page | null = null;
  
  try {
    browser = await puppeteer.launch({
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
    
    page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });
    
    return Buffer.from(pdf);
  } catch (error) {
    console.error('Payment invoice PDF generation error:', error);
    throw new Error('Gagal membuat PDF kwitansi. Silakan coba lagi atau gunakan versi HTML.');
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (e) {
        console.error('Error closing page:', e);
      }
    }
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('Error closing browser:', e);
      }
    }
  }
}

export { PaymentInvoiceData };

interface BillingInvoiceData {
  invoiceNumber: string;
  trackingCode: string;
  orderDate: Date;
  billingType: 'dp' | 'pelunasan';
  customer: {
    name: string;
    email?: string;
    phone: string;
    address?: string;
  };
  items: {
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  subtotal: number;
  includePPN?: boolean;
  ppnAmount?: number;
  orderTotal: number;
  discountAmount?: number;
  dpAmount: number;
  paidDpAmount: number;
  pelunasanAmount: number;
  billingAmount: number;
  isPaid: boolean;
  notes?: string;
}

export function generateBillingInvoiceHTML(data: BillingInvoiceData): string {
  const logoBase64 = getLogoBase64();
  const billingTypeLabel = data.billingType === 'dp' ? 'DOWN PAYMENT (DP)' : 'PELUNASAN';
  const billingTypeBadge = data.billingType === 'dp' 
    ? '<span style="background: #dbeafe; color: #1e40af; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: bold;">TAGIHAN DP</span>'
    : '<span style="background: #fef3c7; color: #92400e; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: bold;">TAGIHAN PELUNASAN</span>';

  const statusBadge = data.isPaid
    ? '<span style="background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 4px; font-size: 10px;">LUNAS</span>'
    : '<span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 10px;">BELUM LUNAS</span>';

  const itemsHTML = data.items
    .map(
      (item, index) => `
      <tr>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px;">${index + 1}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px;">
          <strong>${item.name}</strong>
          ${item.description ? `<br><span style="color: #6b7280; font-size: 10px;">${item.description}</span>` : ''}
        </td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 11px;">${item.quantity}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 11px;">${formatCurrency(item.unitPrice)}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 11px;">${formatCurrency(item.subtotal)}</td>
      </tr>
    `
    )
    .join('');

  const paidMessage = data.isPaid
    ? `<div style="margin-top: 12px; padding: 12px; background: #d1fae5; border-radius: 6px; border: 2px solid #22c55e; text-align: center;">
        <span style="color: #166534; font-size: 13px; font-weight: bold;">TAGIHAN ${billingTypeLabel} TELAH DIBAYARKAN</span>
        <p style="color: #166534; font-size: 11px; margin-top: 6px;">Pembayaran ${data.billingType === 'dp' ? 'DP' : 'Pelunasan'} sebesar ${formatCurrency(data.billingAmount)} telah diterima dengan baik.</p>
      </div>`
    : `<div style="margin-top: 12px; padding: 12px; background: #fef3c7; border-radius: 6px; border: 2px solid #f59e0b; text-align: center;">
        <p style="color: #92400e; font-size: 11px; margin-bottom: 4px;">Jumlah yang harus Anda bayarkan:</p>
        <p style="color: #92400e; font-size: 22px; font-weight: bold;">${formatCurrency(data.billingAmount)}</p>
        <p style="color: #78350f; font-size: 10px; margin-top: 6px;">Silakan lakukan pembayaran untuk melanjutkan proses pesanan Anda.</p>
      </div>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Tagihan ${billingTypeLabel} - ${data.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; line-height: 1.3; font-size: 11px; }
    .container { max-width: 800px; margin: 0 auto; padding: 15px 20px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 15px; }
    .logo-img { height: 50px; width: auto; }
    .company-name { font-size: 16px; font-weight: bold; color: #000000; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1e3a8a; color: white; padding: 6px 8px; text-align: left; font-size: 10px; }
    th:nth-child(3), th:nth-child(4), th:nth-child(5) { text-align: center; }
    th:last-child { text-align: right; }
    .summary { margin-top: 12px; }
    .summary table { width: 280px; margin-left: auto; }
    .summary td { padding: 5px 8px; font-size: 11px; }
    .summary tr.highlight { font-weight: bold; font-size: 12px; background: ${data.billingType === 'dp' ? '#dbeafe' : '#fef3c7'}; }
    .summary tr.total { font-weight: bold; background: #f3f4f6; }
    .footer { margin-top: 15px; text-align: center; color: #6b7280; font-size: 9px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        ${logoBase64 ? `<img src="${logoBase64}" alt="${COMPANY_INFO.name}" class="logo-img" />` : `<div class="company-name">${COMPANY_INFO.name}</div>`}
        <p style="color: #6b7280; font-size: 10px; margin-top: 2px;">${COMPANY_INFO.tagline}</p>
        <p style="color: #6b7280; font-size: 10px;">${COMPANY_INFO.address}</p>
        <p style="color: #6b7280; font-size: 10px;">Telp: ${COMPANY_INFO.phone} | Email: ${COMPANY_INFO.email}</p>
      </div>
      <div style="text-align: right;">
        <h1 style="font-size: 20px; color: #1e3a8a;">INVOICE TAGIHAN</h1>
        <div style="margin-top: 4px; margin-bottom: 6px;">${billingTypeBadge}</div>
        <p style="font-size: 10px;"><strong>No:</strong> ${data.invoiceNumber}</p>
        <p style="font-size: 10px;"><strong>Tanggal:</strong> ${formatDate(data.orderDate)}</p>
        <p style="font-size: 10px;"><strong>Tracking:</strong> ${data.trackingCode}</p>
        <div style="margin-top: 4px;">${statusBadge}</div>
      </div>
    </div>

    <div style="margin-bottom: 12px; padding: 10px; background: #f9fafb; border-radius: 6px;">
      <h3 style="color: #1e3a8a; margin-bottom: 6px; font-size: 11px;">Tagihan Kepada:</h3>
      <p style="font-size: 13px; font-weight: 600;">${data.customer.name}</p>
      <p style="color: #6b7280; font-size: 10px;">${data.customer.phone}</p>
      ${data.customer.email ? `<p style="color: #6b7280; font-size: 10px;">${data.customer.email}</p>` : ''}
      ${data.customer.address ? `<p style="color: #6b7280; font-size: 10px;">${data.customer.address}</p>` : ''}
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 30px;">No</th>
          <th>Deskripsi</th>
          <th style="width: 50px;">Qty</th>
          <th style="width: 100px;">Harga Satuan</th>
          <th style="width: 100px;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>

    <div class="summary">
      <table>
        <tr>
          <td>Subtotal</td>
          <td style="text-align: right;">${formatCurrency(data.subtotal)}</td>
        </tr>
        ${data.includePPN ? `
        <tr>
          <td>Pajak (PPN 11%)</td>
          <td style="text-align: right;">${formatCurrency(data.ppnAmount || 0)}</td>
        </tr>
        ` : ''}
        ${data.discountAmount ? `
        <tr>
          <td>Diskon</td>
          <td style="text-align: right; color: #dc2626;">-${formatCurrency(data.discountAmount)}</td>
        </tr>
        ` : ''}
        <tr class="total">
          <td>Total Pesanan</td>
          <td style="text-align: right;">${formatCurrency(data.orderTotal)}</td>
        </tr>
        ${data.dpAmount > 0 ? `
        <tr>
          <td>DP Ditetapkan</td>
          <td style="text-align: right; color: #1e40af;">${formatCurrency(data.dpAmount)}</td>
        </tr>
        <tr>
          <td>DP Terbayar</td>
          <td style="text-align: right; color: ${data.paidDpAmount >= data.dpAmount ? '#059669' : '#dc2626'};">
            ${formatCurrency(data.paidDpAmount)}
          </td>
        </tr>
        <tr>
          <td>Pelunasan</td>
          <td style="text-align: right;">${formatCurrency(data.pelunasanAmount)}</td>
        </tr>
        ` : ''}
        <tr class="highlight">
          <td>Tagihan ${data.billingType === 'dp' ? 'DP' : 'Pelunasan'}</td>
          <td style="text-align: right; font-weight: bold; color: ${data.billingType === 'dp' ? '#1e40af' : '#92400e'};">
            ${formatCurrency(data.billingAmount)}
          </td>
        </tr>
      </table>
    </div>

    ${paidMessage}

    <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <p style="color: #6b7280; font-size: 10px;">Status Pembayaran:</p>
        <div style="margin-top: 4px;">${statusBadge}</div>
      </div>
      <div style="text-align: center; width: 150px;">
        <p style="color: #6b7280; font-size: 10px; margin-bottom: 40px;">Hormat Kami,</p>
        <div style="border-top: 1px solid #9ca3af; padding-top: 6px;">
          <p style="font-weight: 600; font-size: 11px;">Sekala Industry</p>
        </div>
      </div>
    </div>

    ${!data.isPaid ? `
    <div style="margin-top: 12px; padding: 10px; background: #dbeafe; border-radius: 6px;">
      <h4 style="color: #1e40af; margin-bottom: 4px; font-size: 11px;">Informasi Pembayaran:</h4>
      <p style="color: #1e3a8a; font-size: 11px; font-weight: bold;">Bank BRI</p>
      <p style="color: #1e3a8a; font-size: 11px;">No. Rekening: 024001000578560</p>
      <p style="color: #1e3a8a; font-size: 11px;">A/n: PT Virotek Karya Kreasi</p>
      <p style="margin-top: 4px; font-size: 10px; color: #3b82f6;">
        Kode Tracking: <strong>${data.trackingCode}</strong>
      </p>
    </div>
    ` : ''}

    <div class="footer">
      <p>Terima kasih atas kepercayaan Anda kepada Sekala Industry</p>
      <p style="margin-top: 4px;">Invoice tagihan ini dibuat secara otomatis oleh sistem Sekala Industry</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function generateBillingInvoicePDF(data: BillingInvoiceData): Promise<Buffer> {
  const html = generateBillingInvoiceHTML(data);
  const chromiumPath = getChromiumPath();
  
  let browser: Browser | null = null;
  let page: Page | null = null;
  
  try {
    browser = await puppeteer.launch({
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
    
    page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });
    
    return Buffer.from(pdf);
  } catch (error) {
    console.error('Billing invoice PDF generation error:', error);
    throw new Error('Gagal membuat PDF tagihan. Silakan coba lagi atau gunakan versi HTML.');
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (e) {
        console.error('Error closing page:', e);
      }
    }
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('Error closing browser:', e);
      }
    }
  }
}

export { BillingInvoiceData };
