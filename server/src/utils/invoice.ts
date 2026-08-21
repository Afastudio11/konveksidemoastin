import { db } from '../db';
import { orders } from '../db/schema';
import { sql } from 'drizzle-orm';

export async function generateInvoiceNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `SKL-${year}-${month}`;

  const result = await db.execute(sql`
    SELECT MAX(CAST(SUBSTRING(invoice_number FROM '\\d{4}$') AS INTEGER)) as max_seq 
    FROM orders 
    WHERE invoice_number LIKE ${prefix + '%'}
  `);
  
  const maxSeq = Number(result.rows[0]?.max_seq || 0) + 1;
  const sequence = String(maxSeq).padStart(4, '0');
  
  return `${prefix}-${sequence}`;
}

export function generateTrackingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function getProductionStatusProgress(status: string): number {
  const statusProgress: Record<string, number> = {
    'pending': 0,
    'design': 12,
    'beli_bahan': 25,
    'potong_printing': 37,
    'jahit': 50,
    'bordir_sablon': 62,
    'qc': 75,
    'packing': 87,
    'selesai': 100,
    'dikirim': 100,
  };
  return statusProgress[status] || 0;
}

export function getProductionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'pending': 'Menunggu',
    'design': 'Design',
    'beli_bahan': 'Beli Bahan',
    'potong_printing': 'Potong/Printing',
    'jahit': 'Jahit',
    'bordir_sablon': 'Bordir/Sablon',
    'qc': 'Quality Control',
    'packing': 'Packing',
    'selesai': 'Selesai',
    'dikirim': 'Dikirim',
  };
  return labels[status] || status;
}

export function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'waiting_payment': 'Menunggu Pembayaran',
    'waiting_dp': 'Menunggu DP',
    'dp_paid': 'DP Dibayar',
    'waiting_pelunasan': 'Menunggu Pelunasan',
    'paid': 'Lunas',
    'expired': 'Kadaluarsa',
    'cancelled': 'Dibatalkan',
    'refunded': 'Dikembalikan',
  };
  return labels[status] || status;
}

export async function generatePaymentInvoiceNumber(type: 'dp' | 'pelunasan'): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = type === 'dp' ? `DP-${year}-${month}` : `PL-${year}-${month}`;

  const result = await db.execute(sql`
    SELECT MAX(CAST(SUBSTRING(invoice_number FROM '\\d{4}$') AS INTEGER)) as max_seq 
    FROM payment_invoices 
    WHERE invoice_number LIKE ${prefix + '%'}
  `);
  
  const maxSeq = Number(result.rows[0]?.max_seq || 0) + 1;
  const sequence = String(maxSeq).padStart(4, '0');
  
  return `${prefix}-${sequence}`;
}
