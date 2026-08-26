import { pgTable, text, timestamp, integer, boolean, decimal, uuid, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const paymentStatusEnum = pgEnum('payment_status', ['waiting_payment', 'waiting_dp', 'dp_paid', 'waiting_pelunasan', 'paid', 'expired', 'cancelled', 'refunded']);

export const productCategoryEnum = pgEnum('product_category', ['konveksi', 'percetakan']);

export const workStatusEnum = pgEnum('work_status', ['proses', 'selesai']);

export const vendorPaymentStatusEnum = pgEnum('vendor_payment_status', ['belum', 'lunas']);

export const productionStatusEnum = pgEnum('production_status', [
  'pending',
  'design',
  'beli_bahan',
  'potong_printing',
  'jahit',
  'bordir_sablon',
  'qc',
  'packing',
  'selesai',
  'dikirim'
]);

export const userRoleEnum = pgEnum('user_role', ['superadmin', 'admin']);

export const menuPermissionEnum = pgEnum('menu_permission', [
  'dashboard',
  'orders',
  'customers',
  'expenses',
  'inventory',
  'activity_logs',
  'settings',
  'user_management'
]);

export const stockMovementTypeEnum = pgEnum('stock_movement_type', [
  'in',
  'out',
  'adjustment'
]);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: userRoleEnum('role').default('admin').notNull(),
  permissions: jsonb('permissions').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  companyName: text('company_name'),
  address: text('address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  trackingCode: text('tracking_code').notNull().unique(),
  customerId: uuid('customer_id').references(() => customers.id).notNull(),
  subtotalAmount: decimal('subtotal_amount', { precision: 12, scale: 2 }),
  ppnAmount: decimal('ppn_amount', { precision: 12, scale: 2 }).default('0'),
  includePPN: boolean('include_ppn').default(false),
  discountAmount: decimal('discount_amount', { precision: 12, scale: 2 }).default('0'),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  dpAmount: decimal('dp_amount', { precision: 12, scale: 2 }).default('0'),
  paidDpAmount: decimal('paid_dp_amount', { precision: 12, scale: 2 }).default('0'),
  remainingAmount: decimal('remaining_amount', { precision: 12, scale: 2 }).default('0'),
  paymentStatus: paymentStatusEnum('payment_status').default('waiting_dp').notNull(),
  productionStatus: productionStatusEnum('production_status').default('pending').notNull(),
  productionProgress: integer('production_progress').default(0).notNull(),
  paymentDeadline: timestamp('payment_deadline'),
  productionDeadline: timestamp('production_deadline'),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  productName: text('product_name').notNull(),
  productType: text('product_type'),
  productCategory: productCategoryEnum('product_category').default('konveksi'),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
  size: text('size'),
  color: text('color'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orderStatusHistory = pgTable('order_status_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  status: productionStatusEnum('status').notNull(),
  progress: integer('progress').notNull(),
  notes: text('notes'),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text('payment_method'),
  paymentChannel: text('payment_channel'),
  paymentLink: text('payment_link'),
  transactionId: text('transaction_id'),
  paidAt: timestamp('paid_at'),
  status: paymentStatusEnum('status').default('waiting_payment').notNull(),
  webhookData: text('webhook_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const messageLogs = pgTable('message_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id').references(() => customers.id),
  messageType: text('message_type').notNull(),
  recipient: text('recipient').notNull(),
  content: text('content').notNull(),
  status: text('status').default('pending'),
  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const testimonials = pgTable('testimonials', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id).notNull(),
  rating: integer('rating').notNull(),
  qualityRating: integer('quality_rating'),
  speedRating: integer('speed_rating'),
  comment: text('comment'),
  suggestions: text('suggestions'),
  allowPublish: boolean('allow_publish').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
  testimonials: many(testimonials),
  messageLogs: many(messageLogs),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  createdByUser: one(users, {
    fields: [orders.createdBy],
    references: [users.id],
  }),
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
  payments: many(payments),
  messageLogs: many(messageLogs),
  testimonials: many(testimonials),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, {
    fields: [orderStatusHistory.orderId],
    references: [orders.id],
  }),
  updatedByUser: one(users, {
    fields: [orderStatusHistory.updatedBy],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

export const messageLogsRelations = relations(messageLogs, ({ one }) => ({
  order: one(orders, {
    fields: [messageLogs.orderId],
    references: [orders.id],
  }),
  customer: one(customers, {
    fields: [messageLogs.customerId],
    references: [customers.id],
  }),
}));

export const testimonialsRelations = relations(testimonials, ({ one }) => ({
  order: one(orders, {
    fields: [testimonials.orderId],
    references: [orders.id],
  }),
  customer: one(customers, {
    fields: [testimonials.customerId],
    references: [customers.id],
  }),
}));

export const invoiceTypeEnum = pgEnum('invoice_type', ['order', 'dp', 'pelunasan']);

export const paymentInvoices = pgTable('payment_invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  paymentId: uuid('payment_id').references(() => payments.id, { onDelete: 'cascade' }),
  invoiceType: invoiceTypeEnum('invoice_type').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  paidAmount: decimal('paid_amount', { precision: 12, scale: 2 }).default('0'),
  remainingAmount: decimal('remaining_amount', { precision: 12, scale: 2 }).default('0'),
  paymentMethod: text('payment_method'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const paymentInvoicesRelations = relations(paymentInvoices, ({ one }) => ({
  order: one(orders, {
    fields: [paymentInvoices.orderId],
    references: [orders.id],
  }),
  payment: one(payments, {
    fields: [paymentInvoices.paymentId],
    references: [payments.id],
  }),
}));

export const productionExpenses = pgTable('production_expenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  date: timestamp('date').notNull(),
  customerId: uuid('customer_id').references(() => customers.id),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  projectName: text('project_name'),
  itemName: text('item_name').notNull(),
  vendorName: text('vendor_name'),
  quantity: integer('quantity').default(1).notNull(),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).default('0').notNull(),
  totalValue: decimal('total_value', { precision: 12, scale: 2 }).default('0').notNull(),
  workStatus: workStatusEnum('work_status').default('proses').notNull(),
  vendorPaymentStatus: vendorPaymentStatusEnum('vendor_payment_status').default('belum').notNull(),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const productionExpensesRelations = relations(productionExpenses, ({ one }) => ({
  customer: one(customers, {
    fields: [productionExpenses.customerId],
    references: [customers.id],
  }),
  order: one(orders, {
    fields: [productionExpenses.orderId],
    references: [orders.id],
  }),
  createdByUser: one(users, {
    fields: [productionExpenses.createdBy],
    references: [users.id],
  }),
}));

export const auditActionTypeEnum = pgEnum('audit_action_type', [
  'order_create',
  'order_update',
  'order_status_update',
  'order_payment_update',
  'order_delete',
  'expense_create',
  'expense_update',
  'expense_delete',
  'customer_create',
  'customer_update',
  'customer_delete',
  'payment_manual',
  'payment_confirm_dp',
  'payment_confirm_pelunasan',
  'user_create',
  'user_update',
  'user_delete',
  'material_create',
  'material_update',
  'material_delete',
  'stock_in',
  'stock_out',
  'stock_adjustment',
  'login',
  'logout'
]);

export const auditEntityTypeEnum = pgEnum('audit_entity_type', [
  'order',
  'expense',
  'customer',
  'payment',
  'user',
  'raw_material',
  'session'
]);

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorId: uuid('actor_id').references(() => users.id).notNull(),
  actorRole: userRoleEnum('actor_role').notNull(),
  actorName: text('actor_name').notNull(),
  actionType: auditActionTypeEnum('action_type').notNull(),
  entityType: auditEntityTypeEnum('entity_type').notNull(),
  entityId: text('entity_id'),
  summary: text('summary').notNull(),
  beforeState: jsonb('before_state'),
  afterState: jsonb('after_state'),
  metadata: jsonb('metadata'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorId],
    references: [users.id],
  }),
}));

export const rawMaterials = pgTable('raw_materials', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  unit: text('unit').notNull(),
  currentStock: decimal('current_stock', { precision: 14, scale: 2 }).default('0').notNull(),
  minimumStock: decimal('minimum_stock', { precision: 14, scale: 2 }).default('0').notNull(),
  unitPrice: decimal('unit_price', { precision: 14, scale: 2 }).default('0').notNull(),
  supplierName: text('supplier_name'),
  storageLocation: text('storage_location'),
  notes: text('notes'),
  isActive: boolean('is_active').default(true).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').defaultRandom().primaryKey(),
  materialId: uuid('material_id').references(() => rawMaterials.id, { onDelete: 'cascade' }).notNull(),
  type: stockMovementTypeEnum('type').notNull(),
  quantity: decimal('quantity', { precision: 14, scale: 2 }).notNull(),
  previousStock: decimal('previous_stock', { precision: 14, scale: 2 }).notNull(),
  newStock: decimal('new_stock', { precision: 14, scale: 2 }).notNull(),
  reference: text('reference'),
  notes: text('notes'),
  movementDate: timestamp('movement_date').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const rawMaterialsRelations = relations(rawMaterials, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [rawMaterials.createdBy],
    references: [users.id],
  }),
  movements: many(stockMovements),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  material: one(rawMaterials, {
    fields: [stockMovements.materialId],
    references: [rawMaterials.id],
  }),
  createdByUser: one(users, {
    fields: [stockMovements.createdBy],
    references: [users.id],
  }),
}));
