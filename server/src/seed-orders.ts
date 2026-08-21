import 'dotenv/config';
import { db } from './db';
import { users, customers, orders, orderItems } from './db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  console.log('Seeding database with orders...');

  // Ensure users exist
  const superAdminEmail = 'superadmin@sekala.id';
  let [superAdmin] = await db.select().from(users).where(eq(users.email, superAdminEmail)).limit(1);
  if (!superAdmin) {
    const hashedPassword = await bcrypt.hash('super123', 10);
    [superAdmin] = await db.insert(users).values({
      email: superAdminEmail,
      password: hashedPassword,
      name: 'Super Admin',
      role: 'superadmin',
    }).returning();
  }

  // Create or get a customer
  let [customer] = await db.select().from(customers).limit(1);
  if (!customer) {
    [customer] = await db.insert(customers).values({
      name: 'Budi Santoso',
      phone: '08123456789',
      email: 'budi@example.com',
      address: 'Jl. Contoh No. 123',
    }).returning();
  }

  const months = [10, 11, 12]; // Oct, Nov, Dec 2025
  const year = 2025;
  const statuses = ['dp_paid', 'waiting_pelunasan', 'paid'];
  const categories = ['konveksi', 'percetakan'];

  for (const month of months) {
    console.log(`Seeding 50 orders for month ${month}...`);
    for (let i = 1; i <= 50; i++) {
      const day = Math.floor(Math.random() * 28) + 1;
      const createdAt = new Date(year, month - 1, day, 10, 0, 0);
      const totalAmount = (Math.floor(Math.random() * 20) + 1) * 100000; // 100k - 2M
      const dpAmount = totalAmount * 0.5;
      const paymentStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      let paidDpAmount = '0';
      let remainingAmount = totalAmount.toString();
      let paidAt = null;

      if (paymentStatus === 'dp_paid') {
        paidDpAmount = dpAmount.toString();
        remainingAmount = (totalAmount - dpAmount).toString();
      } else if (paymentStatus === 'waiting_pelunasan') {
        paidDpAmount = dpAmount.toString();
        remainingAmount = (totalAmount - dpAmount).toString();
      } else if (paymentStatus === 'paid') {
        paidDpAmount = dpAmount.toString();
        remainingAmount = '0';
        paidAt = createdAt;
      }

      const orderId = uuidv4();
      const invoiceNumber = `INV-${year}${month}${day}-${i}-${Math.floor(Math.random() * 1000)}`;
      const trackingCode = `TRK-${uuidv4().substring(0, 8).toUpperCase()}`;

      await db.insert(orders).values({
        id: orderId,
        invoiceNumber,
        trackingCode,
        customerId: customer.id,
        totalAmount: totalAmount.toString(),
        subtotalAmount: totalAmount.toString(),
        dpAmount: dpAmount.toString(),
        paidDpAmount,
        remainingAmount,
        paymentStatus: paymentStatus as any,
        productionStatus: 'pending',
        createdBy: superAdmin.id,
        paidAt,
        createdAt,
        updatedAt: createdAt,
      });

      await db.insert(orderItems).values({
        orderId,
        productName: i % 2 === 0 ? 'Kaos Custom' : 'Cetak Brosur',
        productCategory: categories[i % 2] as any,
        quantity: Math.floor(Math.random() * 50) + 1,
        unitPrice: (totalAmount / 10).toString(),
        subtotal: totalAmount.toString(),
        createdAt,
      });
    }
  }

  console.log('Seeding completed!');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
