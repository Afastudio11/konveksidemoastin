import 'dotenv/config';
import { db } from './db';
import { users } from './db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('Seeding database...');

  const superAdminEmail = 'superadmin@konveksi.id';
  const adminEmail = 'admin@konveksi.id';
  
  const [existingSuperAdmin] = await db
    .select()
    .from(users)
    .where(eq(users.email, superAdminEmail))
    .limit(1);

  if (!existingSuperAdmin) {
    const hashedPassword = await bcrypt.hash('super123', 10);
    
    await db.insert(users).values({
      email: superAdminEmail,
      password: hashedPassword,
      name: 'Super Admin',
      role: 'superadmin',
    });
    
    console.log('Super Admin user created:');
    console.log('  Email: superadmin@konveksi.id');
    console.log('  Password: super123');
  } else {
    console.log('Super Admin user already exists');
  }

  const [existingAdmin] = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await db.insert(users).values({
      email: adminEmail,
      password: hashedPassword,
      name: 'Admin',
      role: 'admin',
    });
    
    console.log('Admin user created:');
    console.log('  Email: admin@konveksi.id');
    console.log('  Password: admin123');
  } else {
    console.log('Admin user already exists');
  }

  console.log('Seeding completed!');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
