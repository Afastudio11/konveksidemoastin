import 'dotenv/config';
import { db } from './db';
import { users, customers, orders, orderItems, payments, productionExpenses, orderStatusHistory, auditLogs } from './db/schema';
import { eq } from 'drizzle-orm';

const productTypes = ['Kaos Polo', 'Kaos Oblong', 'Kemeja', 'Jaket', 'Rompi', 'Seragam Kerja', 'Jersey', 'Hoodie', 'Celana Kerja', 'Topi', 'Tas Goodie Bag', 'Masker Kain'];
const productCategories: ('konveksi' | 'percetakan')[] = ['konveksi', 'percetakan'];
const colors = ['Hitam', 'Putih', 'Navy', 'Merah', 'Biru', 'Hijau', 'Abu-abu', 'Kuning', 'Orange', 'Cream'];
const sizes = ['S', 'M', 'L', 'XL', 'XXL', 'All Size'];
const vendorNames = ['CV Bahan Kain Jaya', 'UD Benang Emas', 'Toko Sablon Mandiri', 'CV Bordir Indah', 'UD Aksesori Jahit'];
const itemNames = ['Kain Katun', 'Kain Drill', 'Benang Jahit', 'Resleting', 'Kancing', 'Label Merk', 'Plastik Packing', 'Kardus', 'Sablon DTF', 'Bordir Logo'];

const paymentStatuses: ('waiting_dp' | 'dp_paid' | 'waiting_pelunasan' | 'paid')[] = ['waiting_dp', 'dp_paid', 'waiting_pelunasan', 'paid'];
const productionStatuses: ('pending' | 'design' | 'beli_bahan' | 'potong_printing' | 'jahit' | 'bordir_sablon' | 'qc' | 'packing' | 'selesai' | 'dikirim')[] = ['pending', 'design', 'beli_bahan', 'potong_printing', 'jahit', 'bordir_sablon', 'qc', 'packing', 'selesai', 'dikirim'];
const workStatuses: ('proses' | 'selesai')[] = ['proses', 'selesai'];
const vendorPaymentStatuses: ('belum' | 'lunas')[] = ['belum', 'lunas'];
const auditActionTypes: ('order_create' | 'order_update' | 'order_status_update' | 'order_payment_update' | 'expense_create' | 'expense_update' | 'customer_create' | 'payment_confirm_dp' | 'payment_confirm_pelunasan' | 'login')[] = [
  'order_create', 'order_update', 'order_status_update', 'order_payment_update', 
  'expense_create', 'expense_update', 'customer_create', 'payment_confirm_dp', 
  'payment_confirm_pelunasan', 'login'
];
const auditEntityTypes: ('order' | 'expense' | 'customer' | 'payment' | 'session')[] = ['order', 'expense', 'customer', 'payment', 'session'];

const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function generatePhone(): string {
  const prefixes = ['0812', '0813', '0821', '0822', '0852', '0853', '0857', '0858', '0878', '0877'];
  return randomElement(prefixes) + randomInt(10000000, 99999999).toString();
}

function generateInvoiceNumber(date: Date, index: number): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV/${year}${month}${day}/${String(index).padStart(4, '0')}-${random}`;
}

function generateTrackingCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'TRK-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const firstNames = ['Budi', 'Andi', 'Dewi', 'Sari', 'Joko', 'Rina', 'Ahmad', 'Putri', 'Agus', 'Sri', 'Hendra', 'Nina', 'Tono', 'Wati', 'Dian', 'Rudi', 'Yuni', 'Bambang', 'Lina', 'Eko'];
const lastNames = ['Santoso', 'Wijaya', 'Pratama', 'Suharto', 'Kusuma', 'Hidayat', 'Rahman', 'Saputra', 'Wibowo', 'Setiawan', 'Nugroho', 'Hartono', 'Purnomo', 'Susanto', 'Gunawan'];
const companies = ['PT', 'CV', 'UD', 'Toko', 'Yayasan', 'Koperasi'];
const companyNames = ['Maju Jaya', 'Berkah Abadi', 'Sentosa', 'Mandiri', 'Sejahtera', 'Makmur', 'Prima', 'Karya', 'Bersama', 'Utama'];
const cities = ['Jakarta', 'Surabaya', 'Bandung', 'Semarang', 'Yogyakarta', 'Malang', 'Solo', 'Medan', 'Makassar', 'Denpasar'];

function generateCustomerName(): string {
  const useCompany = Math.random() > 0.6;
  if (useCompany) {
    return `${randomElement(companies)} ${randomElement(companyNames)} ${randomElement(companyNames)}`;
  }
  return `${randomElement(firstNames)} ${randomElement(lastNames)}`;
}

function generateEmail(name: string): string {
  const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'company.co.id'];
  return `${cleanName}${randomInt(1, 999)}@${randomElement(domains)}`;
}

function generateAddress(): string {
  const streets = ['Jl. Raya', 'Jl. Merdeka', 'Jl. Sudirman', 'Jl. Gatot Subroto', 'Jl. Diponegoro', 'Jl. Ahmad Yani', 'Jl. Pahlawan'];
  return `${randomElement(streets)} No. ${randomInt(1, 200)}, ${randomElement(cities)}`;
}

async function seedSampleData() {
  console.log('Starting sample data seeding...');

  let adminUser = await db.select().from(users).where(eq(users.email, 'admin@sekala.id')).limit(1).then(r => r[0]);
  
  if (!adminUser) {
    adminUser = await db.select().from(users).where(eq(users.email, 'superadmin@sekala.id')).limit(1).then(r => r[0]);
  }
  
  if (!adminUser) {
    console.error('No admin user found. Please run npm run db:seed first.');
    process.exit(1);
  }
  
  console.log(`Using user: ${adminUser.email} as creator`);
  

  const now = new Date();
  const months = [
    new Date(now.getFullYear(), now.getMonth() - 2, 1),
    new Date(now.getFullYear(), now.getMonth() - 1, 1),
    new Date(now.getFullYear(), now.getMonth(), 1),
  ];

  let orderIndex = 1;

  for (let monthIdx = 0; monthIdx < 3; monthIdx++) {
    const monthStart = months[monthIdx];
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    const daysInMonth = monthEnd.getDate();

    console.log(`Month ${monthIdx + 1}: ${monthStart.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`);

    const customerBatch: any[] = [];
    for (let i = 0; i < 100; i++) {
      const customerName = generateCustomerName();
      customerBatch.push({
        name: customerName,
        phone: generatePhone(),
        email: generateEmail(customerName),
        address: generateAddress(),
      });
    }
    
    const createdCustomers = await db.insert(customers).values(customerBatch).returning();
    console.log(`  Created ${createdCustomers.length} customers`);

    for (let i = 0; i < 100; i++) {
      const randomDay = randomInt(1, daysInMonth);
      const orderDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), randomDay);
      const customer = createdCustomers[i];

      const quantity = randomInt(10, 500);
      const unitPrice = randomInt(50000, 350000);
      const subtotal = quantity * unitPrice;
      const totalAmount = subtotal + randomInt(0, Math.floor(subtotal * 0.1));
      const dpAmount = Math.round(totalAmount * (randomInt(30, 50) / 100));

      const paymentStatus = randomElement(paymentStatuses);
      const productionStatus = randomElement(productionStatuses);
      const productionProgress = productionStatuses.indexOf(productionStatus) * 10;

      const invoiceNumber = generateInvoiceNumber(orderDate, orderIndex);
      const trackingCode = generateTrackingCode();

      const paymentDeadline = new Date(orderDate);
      paymentDeadline.setDate(paymentDeadline.getDate() + 3);

      const productionDeadline = new Date(orderDate);
      productionDeadline.setDate(productionDeadline.getDate() + randomInt(14, 30));

      const paidDpAmount = paymentStatus === 'waiting_dp' ? '0' : String(dpAmount);
      const remainingAmount = paymentStatus === 'paid' ? '0' : String(totalAmount - Number(paidDpAmount));

      const [newOrder] = await db.insert(orders).values({
        invoiceNumber,
        trackingCode,
        customerId: customer.id,
        totalAmount: String(totalAmount),
        dpAmount: String(dpAmount),
        paidDpAmount,
        remainingAmount,
        paymentStatus,
        productionStatus,
        productionProgress,
        paymentDeadline,
        productionDeadline,
        notes: `Order ${randomElement(productTypes)} untuk ${customer.name}`,
        createdBy: adminUser.id,
        createdAt: orderDate,
        updatedAt: orderDate,
      }).returning();

      await db.insert(orderItems).values({
        orderId: newOrder.id,
        productName: randomElement(productTypes),
        productType: randomElement(['Sablon', 'Bordir', 'DTF', 'Polos']),
        productCategory: randomElement(productCategories),
        quantity: quantity,
        unitPrice: String(unitPrice),
        subtotal: String(subtotal),
        size: randomElement(sizes),
        color: randomElement(colors),
        createdAt: orderDate,
      });

      if (paymentStatus !== 'waiting_dp') {
        await db.insert(payments).values({
          orderId: newOrder.id,
          amount: String(dpAmount),
          paymentMethod: randomElement(['transfer', 'cash', 'qris']),
          paymentChannel: randomElement(['BCA', 'Mandiri', 'BNI', 'BRI']),
          status: 'paid',
          paidAt: new Date(orderDate.getTime() + randomInt(1, 3) * 24 * 60 * 60 * 1000),
          createdAt: orderDate,
        });
      }

      const expenseDate = new Date(orderDate.getTime() + randomInt(0, 3) * 24 * 60 * 60 * 1000);
      const expenseQuantity = randomInt(1, 50);
      const expenseUnitPrice = randomInt(10000, 200000);
      const expenseTotalValue = expenseQuantity * expenseUnitPrice;

      await db.insert(productionExpenses).values({
        date: expenseDate,
        customerId: customer.id,
        orderId: newOrder.id,
        projectName: `Order ${invoiceNumber}`,
        itemName: randomElement(itemNames),
        vendorName: randomElement(vendorNames),
        quantity: expenseQuantity,
        unitPrice: String(expenseUnitPrice),
        totalValue: String(expenseTotalValue),
        workStatus: randomElement(workStatuses),
        vendorPaymentStatus: randomElement(vendorPaymentStatuses),
        createdBy: adminUser.id,
        createdAt: expenseDate,
        updatedAt: expenseDate,
      });

      orderIndex++;
    }
    console.log(`  Created 100 orders with items, payments, and expenses`);
  }

  console.log('Creating audit logs for the past month...');
  const currentDate = new Date();
  const oneMonthAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
  
  for (let i = 0; i < 100; i++) {
    const randomDays = randomInt(0, 30);
    const logDate = new Date(oneMonthAgo.getTime() + randomDays * 24 * 60 * 60 * 1000);
    const actionType = randomElement(auditActionTypes);
    
    let entityType: 'order' | 'expense' | 'customer' | 'payment' | 'session';
    if (actionType.startsWith('order_')) {
      entityType = 'order';
    } else if (actionType.startsWith('expense_')) {
      entityType = 'expense';
    } else if (actionType.startsWith('customer_')) {
      entityType = 'customer';
    } else if (actionType.startsWith('payment_')) {
      entityType = 'payment';
    } else {
      entityType = 'session';
    }
    
    const summaryMap: Record<string, string> = {
      order_create: 'Membuat order baru',
      order_update: 'Mengubah data order',
      order_status_update: 'Mengubah status produksi order',
      order_payment_update: 'Mengubah status pembayaran order',
      expense_create: 'Menambah pengeluaran produksi',
      expense_update: 'Mengubah data pengeluaran',
      customer_create: 'Menambah pelanggan baru',
      payment_confirm_dp: 'Konfirmasi pembayaran DP',
      payment_confirm_pelunasan: 'Konfirmasi pelunasan',
      login: 'Login ke sistem',
    };
    
    await db.insert(auditLogs).values({
      actorId: adminUser.id,
      actorRole: adminUser.role as 'superadmin' | 'admin' | 'production' | 'viewer',
      actorName: adminUser.name,
      actionType: actionType,
      entityType: entityType,
      entityId: `sample-${i}`,
      summary: summaryMap[actionType] || 'Aktivitas sistem',
      createdAt: logDate,
    });
  }
  console.log('  Created 100 audit logs');

  console.log('\n✅ Sample data seeding completed!');
  console.log(`📊 Summary: 300 customers, 300 orders, 300+ expenses, 100 audit logs created`);
  
  process.exit(0);
}

seedSampleData().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
