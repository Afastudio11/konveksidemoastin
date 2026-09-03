import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'konveksi-strack-secret-key-2025';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const AVAILABLE_PERMISSIONS = [
  'dashboard',
  'orders',
  'customers',
  'expenses',
  'inventory',
  'financial_reports',
  'ai_assistant',
  'activity_logs',
  'settings',
  'user_management'
] as const;

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['superadmin', 'admin']).optional(),
  permissions: z.array(z.string()).optional(),
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  name: z.string().min(2).optional(),
  role: z.enum(['superadmin', 'admin']).optional(),
  permissions: z.array(z.string()).optional(),
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    const userPermissions = user.role === 'superadmin' 
      ? AVAILABLE_PERMISSIONS 
      : (user.permissions as string[] || []);

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role, permissions: userPermissions },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: userPermissions,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Data tidak valid', details: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.post('/register', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = authHeader.split(' ')[1];
    if (!token || token === 'undefined' || token === 'null') {
      return res.status(401).json({ error: 'Token tidak valid' });
    }
    
    let decoded: { id: string; role: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    } catch (jwtError) {
      return res.status(401).json({ error: 'Token tidak valid atau kadaluarsa' });
    }

    if (decoded.role !== 'superadmin') {
      return res.status(403).json({ error: 'Hanya Super Admin yang bisa menambah user' });
    }

    const { email, password, name, role, permissions } = registerSchema.parse(req.body);

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || 'admin';
    const userPermissions = userRole === 'superadmin' 
      ? [...AVAILABLE_PERMISSIONS] 
      : (permissions || ['dashboard']);

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        name,
        role: userRole,
        permissions: userPermissions,
      })
      .returning();

    res.status(201).json({
      message: 'User berhasil ditambahkan',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        permissions: newUser.permissions,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Data tidak valid', details: error.errors });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = authHeader.split(' ')[1];
    if (!token || token === 'undefined' || token === 'null') {
      return res.status(401).json({ error: 'Token tidak valid' });
    }
    
    let decoded: { id: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    } catch (jwtError) {
      return res.status(401).json({ error: 'Token tidak valid atau kadaluarsa' });
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        permissions: users.permissions,
      })
      .from(users)
      .where(eq(users.id, decoded.id))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    const userPermissions = user.role === 'superadmin' 
      ? [...AVAILABLE_PERMISSIONS] 
      : (user.permissions as string[] || []);

    res.json({ 
      user: {
        ...user,
        permissions: userPermissions,
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

router.patch('/password', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = authHeader.split(' ')[1];
    if (!token || token === 'undefined' || token === 'null') {
      return res.status(401).json({ error: 'Token tidak valid' });
    }
    
    let decoded: { id: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    } catch (jwtError) {
      return res.status(401).json({ error: 'Token tidak valid atau kadaluarsa' });
    }

    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.id))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Password lama salah' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, decoded.id));

    res.json({ message: 'Password berhasil diubah' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Data tidak valid', details: error.errors });
    }
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.get('/users', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = authHeader.split(' ')[1];
    if (!token || token === 'undefined' || token === 'null') {
      return res.status(401).json({ error: 'Token tidak valid' });
    }
    
    let decoded: { id: string; role: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    } catch (jwtError) {
      return res.status(401).json({ error: 'Token tidak valid atau kadaluarsa' });
    }

    if (decoded.role !== 'superadmin') {
      return res.status(403).json({ error: 'Hanya Super Admin yang bisa melihat daftar user' });
    }

    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        permissions: users.permissions,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.createdAt);

    const usersWithPermissions = allUsers.map(u => ({
      ...u,
      permissions: u.role === 'superadmin' ? [...AVAILABLE_PERMISSIONS] : (u.permissions as string[] || []),
    }));

    res.json({ users: usersWithPermissions, availablePermissions: AVAILABLE_PERMISSIONS });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.patch('/users/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = authHeader.split(' ')[1];
    if (!token || token === 'undefined' || token === 'null') {
      return res.status(401).json({ error: 'Token tidak valid' });
    }
    
    let decoded: { id: string; role: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    } catch (jwtError) {
      return res.status(401).json({ error: 'Token tidak valid atau kadaluarsa' });
    }

    if (decoded.role !== 'superadmin') {
      return res.status(403).json({ error: 'Hanya Super Admin yang bisa mengedit user' });
    }

    const { id } = req.params;
    const updates = updateUserSchema.parse(req.body);

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existingUser) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    if (updates.email && updates.email !== existingUser.email) {
      const [emailExists] = await db
        .select()
        .from(users)
        .where(eq(users.email, updates.email))
        .limit(1);

      if (emailExists) {
        return res.status(400).json({ error: 'Email sudah digunakan user lain' });
      }
    }

    if (updates.role && updates.role !== 'superadmin' && existingUser.role === 'superadmin') {
      const [superadminCount] = await db
        .select({ count: users.id })
        .from(users)
        .where(eq(users.role, 'superadmin'));
      
      const allSuperadmins = await db
        .select()
        .from(users)
        .where(eq(users.role, 'superadmin'));
      
      if (allSuperadmins.length <= 1) {
        return res.status(400).json({ error: 'Tidak bisa mengubah role super admin terakhir' });
      }
    }

    const updateData: any = { updatedAt: new Date() };
    
    if (updates.email) updateData.email = updates.email;
    if (updates.name) updateData.name = updates.name;
    if (updates.role) updateData.role = updates.role;
    if (updates.permissions !== undefined) {
      updateData.permissions = updates.role === 'superadmin' 
        ? [...AVAILABLE_PERMISSIONS] 
        : updates.permissions;
    }
    if (updates.password) {
      updateData.password = await bcrypt.hash(updates.password, 10);
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        permissions: users.permissions,
      });

    const userPermissions = updatedUser.role === 'superadmin' 
      ? [...AVAILABLE_PERMISSIONS] 
      : (updatedUser.permissions as string[] || []);

    res.json({ 
      message: 'User berhasil diupdate', 
      user: { ...updatedUser, permissions: userPermissions } 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Data tidak valid', details: error.errors });
    }
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.delete('/users/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = authHeader.split(' ')[1];
    if (!token || token === 'undefined' || token === 'null') {
      return res.status(401).json({ error: 'Token tidak valid' });
    }
    
    let decoded: { id: string; role: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    } catch (jwtError) {
      return res.status(401).json({ error: 'Token tidak valid atau kadaluarsa' });
    }

    if (decoded.role !== 'superadmin') {
      return res.status(403).json({ error: 'Hanya Super Admin yang bisa menghapus user' });
    }

    const { id } = req.params;

    if (id === decoded.id) {
      return res.status(400).json({ error: 'Tidak bisa menghapus akun sendiri' });
    }

    const [userToDelete] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!userToDelete) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    if (userToDelete.role === 'superadmin') {
      const allSuperadmins = await db
        .select()
        .from(users)
        .where(eq(users.role, 'superadmin'));
      
      if (allSuperadmins.length <= 1) {
        return res.status(400).json({ error: 'Tidak bisa menghapus super admin terakhir' });
      }
    }

    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    if (!deletedUser) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    res.json({ message: 'User berhasil dihapus' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

export { router as authRoutes };
