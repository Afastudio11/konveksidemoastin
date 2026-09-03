import 'dotenv/config';
import { db } from './db';
import { productionExpenses, customers, orders, users } from './db/schema';
import { eq } from 'drizzle-orm';

async function seedSeptemberExpenses() {
  console.log('--- SEEDING PRODUCTION EXPENSES FOR SEPTEMBER 2026 ---');

  // Find admin user
  let [admin] = await db.select().from(users).where(eq(users.role, 'superadmin')).limit(1);
  if (!admin) {
    [admin] = await db.select().from(users).limit(1);
  }

  // Find some customers & orders to link
  const existingCustomers = await db.select().from(customers).limit(10);
  const existingOrders = await db.select().from(orders).limit(10);

  const sampleExpenses = [
    {
      date: new Date('2026-09-01T09:30:00Z'),
      projectName: 'Proyek Batch September - Seragam BUMN PLN & Mandiri',
      itemName: 'Kain Drill American Khaki Roll (120 meter)',
      vendorName: 'PT Grand Textile Bandung',
      quantity: 120,
      unitPrice: '52000',
      totalValue: '6240000',
      workStatus: 'selesai' as const,
      vendorPaymentStatus: 'lunas' as const,
      notes: 'Bahan kemeja formal & PDH lapangan klaster BUMN batch September.',
    },
    {
      date: new Date('2026-09-02T11:00:00Z'),
      projectName: 'Seragam Kantor BUMN Kanwil Makassar',
      itemName: 'Kain Katun Tropical Deluxe Navy (75 meter)',
      vendorName: 'PT Danliris Solo',
      quantity: 75,
      unitPrice: '75000',
      totalValue: '5625000',
      workStatus: 'selesai' as const,
      vendorPaymentStatus: 'lunas' as const,
      notes: 'Kain katun adem standar korporat perbankan.',
    },
    {
      date: new Date('2026-09-02T14:15:00Z'),
      projectName: 'Kaos Polo & Merchandise KNPI Sulsel',
      itemName: 'Kain Lacoste CVC Pique Premium 24s (120 kg)',
      vendorName: 'CV Knitto Textile',
      quantity: 120,
      unitPrice: '135000',
      totalValue: '16200000',
      workStatus: 'selesai' as const,
      vendorPaymentStatus: 'lunas' as const,
      notes: 'Bahan polo lacoste warna Hitam & Navy untuk 600 pcs polo.',
    },
    {
      date: new Date('2026-09-03T10:00:00Z'),
      projectName: 'Proyek Batch September - Kemeja Tactical PU',
      itemName: 'Jasa Bordir Komputer Logo Dada & Bendera (350 pcs)',
      vendorName: 'CV Mitra Bordir Komputer',
      quantity: 350,
      unitPrice: '12500',
      totalValue: '4375000',
      workStatus: 'proses' as const,
      vendorPaymentStatus: 'lunas' as const,
      notes: 'Bordir presisi benang rayon emas kerapatan 4.5.',
    },
    {
      date: new Date('2026-09-03T15:45:00Z'),
      projectName: 'Jersey Olahraga & Komunitas KNPI',
      itemName: 'Kain Dryfit Milano Sublimasi (80 kg)',
      vendorName: 'Sentra Dryfit Bandung',
      quantity: 80,
      unitPrice: '98000',
      totalValue: '7840000',
      workStatus: 'selesai' as const,
      vendorPaymentStatus: 'lunas' as const,
      notes: 'Bahan jersey printing anti-UV cepat kering.',
    },
    {
      date: new Date('2026-09-04T08:30:00Z'),
      projectName: 'Proyek Batch September - Makloon Jahit',
      itemName: 'Ongkos Jahit Makloon Kemeja PDH Line 1 (300 pcs)',
      vendorName: 'Sentra Jahit Tailor Pro Makassar',
      quantity: 300,
      unitPrice: '28000',
      totalValue: '8400000',
      workStatus: 'proses' as const,
      vendorPaymentStatus: 'belum' as const,
      notes: 'Jahit stik balik 2 jarum, kancing lubang rantai.',
    },
    {
      date: new Date('2026-09-04T13:20:00Z'),
      projectName: 'Aksesoris Produksi Kemeja & Jaket September',
      itemName: 'Kancing Kemeja Formal 4 Lubang & Resleting YKK',
      vendorName: 'UD Kancing & Aksesori YKK',
      quantity: 25,
      unitPrice: '95000',
      totalValue: '2375000',
      workStatus: 'selesai' as const,
      vendorPaymentStatus: 'lunas' as const,
      notes: '20 gross kancing custom dan 50 pcs resleting besi 60cm.',
    },
    {
      date: new Date('2026-09-05T09:00:00Z'),
      projectName: 'Kaos Polo & Merchandise - Sablon DTF',
      itemName: 'Jasa Cetak Film Sablon DTF High Resolution (60m)',
      vendorName: 'Toko Sablon & DTF Makassar',
      quantity: 60,
      unitPrice: '65000',
      totalValue: '3900000',
      workStatus: 'proses' as const,
      vendorPaymentStatus: 'belum' as const,
      notes: 'Cetak logo dada, punggung, dan lengan event KNPI.',
    },
    {
      date: new Date('2026-09-05T16:00:00Z'),
      projectName: 'Finishing & Packaging Batch September',
      itemName: 'Plastik Zipper Bag Custom Logo ouruniform (1.000 pcs)',
      vendorName: 'Sentra Plastik Packaging',
      quantity: 1000,
      unitPrice: '2200',
      totalValue: '2200000',
      workStatus: 'selesai' as const,
      vendorPaymentStatus: 'lunas' as const,
      notes: 'Plastik klip buram tebal dengan hangtag & silica gel.',
    },
  ];

  let insertedCount = 0;
  for (let i = 0; i < sampleExpenses.length; i++) {
    const item = sampleExpenses[i];
    const customer = existingCustomers[i % existingCustomers.length];
    const order = existingOrders[i % existingOrders.length];

    await db.insert(productionExpenses).values({
      date: item.date,
      customerId: customer?.id || null,
      orderId: order?.id || null,
      projectName: item.projectName,
      itemName: item.itemName,
      vendorName: item.vendorName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalValue: item.totalValue,
      workStatus: item.workStatus,
      vendorPaymentStatus: item.vendorPaymentStatus,
      notes: item.notes,
      createdBy: admin?.id || null,
      createdAt: item.date,
      updatedAt: item.date,
    });
    insertedCount++;
  }

  console.log(`✅ Sukses menambahkan ${insertedCount} data pengeluaran untuk September 2026!`);
  process.exit(0);
}

seedSeptemberExpenses().catch((err) => {
  console.error('❌ Gagal seed data pengeluaran:', err);
  process.exit(1);
});
