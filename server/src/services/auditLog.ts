import { db } from '../db';
import { auditLogs } from '../db/schema';

type ActionType = 
  | 'order_create'
  | 'order_update'
  | 'order_status_update'
  | 'order_payment_update'
  | 'order_delete'
  | 'expense_create'
  | 'expense_update'
  | 'expense_delete'
  | 'customer_create'
  | 'customer_update'
  | 'customer_delete'
  | 'payment_manual'
  | 'payment_confirm_dp'
  | 'payment_confirm_pelunasan'
  | 'user_create'
  | 'user_update'
  | 'user_delete'
  | 'material_create'
  | 'material_update'
  | 'material_delete'
  | 'stock_in'
  | 'stock_out'
  | 'stock_adjustment'
  | 'login'
  | 'logout';

type EntityType = 'order' | 'expense' | 'customer' | 'payment' | 'user' | 'raw_material' | 'session';

interface AuditLogParams {
  actorId: string;
  actorRole: 'superadmin' | 'admin';
  actorName: string;
  actionType: ActionType;
  entityType: EntityType;
  entityId?: string;
  summary: string;
  beforeState?: any;
  afterState?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(params: AuditLogParams) {
  try {
    await db.insert(auditLogs).values({
      actorId: params.actorId,
      actorRole: params.actorRole,
      actorName: params.actorName,
      actionType: params.actionType,
      entityType: params.entityType,
      entityId: params.entityId,
      summary: params.summary,
      beforeState: params.beforeState,
      afterState: params.afterState,
      metadata: params.metadata,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

export function getActionLabel(actionType: string): string {
  const labels: Record<string, string> = {
    order_create: 'Membuat Order Baru',
    order_update: 'Mengubah Order',
    order_status_update: 'Mengubah Status Order',
    order_payment_update: 'Mengubah Pembayaran Order',
    order_delete: 'Menghapus Order',
    expense_create: 'Menambah Pengeluaran',
    expense_update: 'Mengubah Pengeluaran',
    expense_delete: 'Menghapus Pengeluaran',
    customer_create: 'Menambah Pelanggan',
    customer_update: 'Mengubah Data Pelanggan',
    customer_delete: 'Menghapus Pelanggan',
    payment_manual: 'Pembayaran Manual',
    payment_confirm_dp: 'Konfirmasi DP',
    payment_confirm_pelunasan: 'Konfirmasi Pelunasan',
    user_create: 'Menambah User',
    user_update: 'Mengubah User',
    user_delete: 'Menghapus User',
    material_create: 'Menambah Bahan Baku',
    material_update: 'Mengubah Bahan Baku',
    material_delete: 'Menonaktifkan Bahan Baku',
    stock_in: 'Stok Bahan Masuk',
    stock_out: 'Stok Bahan Keluar',
    stock_adjustment: 'Penyesuaian Stok',
    login: 'Login',
    logout: 'Logout',
  };
  return labels[actionType] || actionType;
}

export function getEntityLabel(entityType: string): string {
  const labels: Record<string, string> = {
    order: 'Order',
    expense: 'Pengeluaran',
    customer: 'Pelanggan',
    payment: 'Pembayaran',
    user: 'User',
    raw_material: 'Bahan Baku',
    session: 'Sesi',
  };
  return labels[entityType] || entityType;
}
