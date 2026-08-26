import { Router } from 'express';
import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { rawMaterials, stockMovements, users } from '../db/schema';
import { AuthRequest, requireRole } from '../middleware/auth';
import { createAuditLog } from '../services/auditLog';

const router = Router();

const materialSchema = z.object({
  code: z.string().trim().min(2).max(40),
  name: z.string().trim().min(2).max(150),
  category: z.string().trim().min(2).max(80),
  unit: z.string().trim().min(1).max(30),
  currentStock: z.number().min(0).default(0),
  minimumStock: z.number().min(0).default(0),
  unitPrice: z.number().min(0).default(0),
  supplierName: z.string().trim().max(150).optional().nullable(),
  storageLocation: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

const updateMaterialSchema = materialSchema.omit({ currentStock: true }).partial();

const movementSchema = z.object({
  type: z.enum(['in', 'out', 'adjustment']),
  quantity: z.number().min(0),
  reference: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  movementDate: z.string().optional(),
}).superRefine((value, ctx) => {
  if (value.type !== 'adjustment' && value.quantity <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['quantity'],
      message: 'Jumlah harus lebih besar dari 0',
    });
  }
});

function requestMeta(req: AuthRequest) {
  return {
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  };
}

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { search, category, stockStatus } = req.query;
    const conditions = [eq(rawMaterials.isActive, true)];

    if (search) {
      conditions.push(or(
        ilike(rawMaterials.code, `%${search}%`),
        ilike(rawMaterials.name, `%${search}%`),
        ilike(rawMaterials.supplierName, `%${search}%`),
        ilike(rawMaterials.storageLocation, `%${search}%`),
      )!);
    }

    if (category) {
      conditions.push(eq(rawMaterials.category, String(category)));
    }

    if (stockStatus === 'out') {
      conditions.push(sql`${rawMaterials.currentStock} <= 0`);
    } else if (stockStatus === 'low') {
      conditions.push(sql`${rawMaterials.currentStock} > 0 AND ${rawMaterials.currentStock} <= ${rawMaterials.minimumStock}`);
    } else if (stockStatus === 'safe') {
      conditions.push(sql`${rawMaterials.currentStock} > ${rawMaterials.minimumStock}`);
    }

    const materials = await db
      .select()
      .from(rawMaterials)
      .where(and(...conditions))
      .orderBy(asc(rawMaterials.name));

    const categoriesResult = await db
      .select({ category: rawMaterials.category })
      .from(rawMaterials)
      .where(eq(rawMaterials.isActive, true))
      .groupBy(rawMaterials.category)
      .orderBy(asc(rawMaterials.category));

    const [summary] = await db
      .select({
        totalMaterials: sql<number>`COUNT(*)`,
        lowStock: sql<number>`COUNT(*) FILTER (WHERE ${rawMaterials.currentStock} > 0 AND ${rawMaterials.currentStock} <= ${rawMaterials.minimumStock})`,
        outOfStock: sql<number>`COUNT(*) FILTER (WHERE ${rawMaterials.currentStock} <= 0)`,
        totalValue: sql<number>`COALESCE(SUM(${rawMaterials.currentStock} * ${rawMaterials.unitPrice}), 0)`,
      })
      .from(rawMaterials)
      .where(eq(rawMaterials.isActive, true));

    res.json({
      materials,
      categories: categoriesResult.map((item) => item.category),
      summary: {
        totalMaterials: Number(summary?.totalMaterials || 0),
        lowStock: Number(summary?.lowStock || 0),
        outOfStock: Number(summary?.outOfStock || 0),
        totalValue: Number(summary?.totalValue || 0),
      },
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Gagal memuat stok bahan baku' });
  }
});

router.get('/:id/movements', async (req: AuthRequest, res) => {
  try {
    const movements = await db
      .select({
        id: stockMovements.id,
        type: stockMovements.type,
        quantity: stockMovements.quantity,
        previousStock: stockMovements.previousStock,
        newStock: stockMovements.newStock,
        reference: stockMovements.reference,
        notes: stockMovements.notes,
        movementDate: stockMovements.movementDate,
        createdAt: stockMovements.createdAt,
        createdByName: users.name,
      })
      .from(stockMovements)
      .leftJoin(users, eq(stockMovements.createdBy, users.id))
      .where(eq(stockMovements.materialId, req.params.id))
      .orderBy(desc(stockMovements.movementDate), desc(stockMovements.createdAt))
      .limit(100);

    res.json({ movements });
  } catch (error) {
    console.error('Get stock movements error:', error);
    res.status(500).json({ error: 'Gagal memuat riwayat stok' });
  }
});

router.post('/', requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const data = materialSchema.parse(req.body);
    const normalizedCode = data.code.toUpperCase();

    const [duplicate] = await db
      .select({ id: rawMaterials.id })
      .from(rawMaterials)
      .where(eq(rawMaterials.code, normalizedCode))
      .limit(1);

    if (duplicate) {
      return res.status(409).json({ error: 'Kode bahan sudah digunakan' });
    }

    const material = await db.transaction(async (tx) => {
      const [created] = await tx.insert(rawMaterials).values({
        code: normalizedCode,
        name: data.name,
        category: data.category,
        unit: data.unit,
        currentStock: data.currentStock.toString(),
        minimumStock: data.minimumStock.toString(),
        unitPrice: data.unitPrice.toString(),
        supplierName: data.supplierName || null,
        storageLocation: data.storageLocation || null,
        notes: data.notes || null,
        createdBy: req.user?.id,
      }).returning();

      if (data.currentStock > 0) {
        await tx.insert(stockMovements).values({
          materialId: created.id,
          type: 'in',
          quantity: data.currentStock.toString(),
          previousStock: '0',
          newStock: data.currentStock.toString(),
          reference: 'STOK-AWAL',
          notes: 'Stok awal saat bahan dibuat',
          createdBy: req.user?.id,
        });
      }

      return created;
    });

    await createAuditLog({
      actorId: req.user!.id,
      actorRole: req.user!.role as 'superadmin' | 'admin',
      actorName: req.user!.name,
      actionType: 'material_create',
      entityType: 'raw_material',
      entityId: material.id,
      summary: `Menambah bahan baku ${material.code} - ${material.name}`,
      afterState: material,
      ...requestMeta(req),
    });

    res.status(201).json({ material });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Data bahan baku tidak valid', details: error.errors });
    }
    console.error('Create material error:', error);
    res.status(500).json({ error: 'Gagal menambahkan bahan baku' });
  }
});

router.patch('/:id', requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const data = updateMaterialSchema.parse(req.body);
    const [existing] = await db.select().from(rawMaterials).where(eq(rawMaterials.id, req.params.id)).limit(1);
    if (!existing || !existing.isActive) {
      return res.status(404).json({ error: 'Bahan baku tidak ditemukan' });
    }

    const updateData: Record<string, unknown> = { ...data, updatedAt: new Date() };
    if (data.code) updateData.code = data.code.toUpperCase();
    if (data.minimumStock !== undefined) updateData.minimumStock = data.minimumStock.toString();
    if (data.unitPrice !== undefined) updateData.unitPrice = data.unitPrice.toString();

    const [material] = await db.update(rawMaterials)
      .set(updateData)
      .where(eq(rawMaterials.id, req.params.id))
      .returning();

    await createAuditLog({
      actorId: req.user!.id,
      actorRole: req.user!.role as 'superadmin' | 'admin',
      actorName: req.user!.name,
      actionType: 'material_update',
      entityType: 'raw_material',
      entityId: material.id,
      summary: `Mengubah bahan baku ${material.code} - ${material.name}`,
      beforeState: existing,
      afterState: material,
      ...requestMeta(req),
    });

    res.json({ material });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Data bahan baku tidak valid', details: error.errors });
    }
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'Kode bahan sudah digunakan' });
    }
    console.error('Update material error:', error);
    res.status(500).json({ error: 'Gagal mengubah bahan baku' });
  }
});

router.post('/:id/movements', requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const data = movementSchema.parse(req.body);

    const result = await db.transaction(async (tx) => {
      const [material] = await tx.select().from(rawMaterials)
        .where(and(eq(rawMaterials.id, req.params.id), eq(rawMaterials.isActive, true)))
        .limit(1)
        .for('update');

      if (!material) throw new Error('MATERIAL_NOT_FOUND');

      const previousStock = Number(material.currentStock);
      const newStock = data.type === 'in'
        ? previousStock + data.quantity
        : data.type === 'out'
          ? previousStock - data.quantity
          : data.quantity;

      if (newStock < 0) throw new Error('INSUFFICIENT_STOCK');

      const [movement] = await tx.insert(stockMovements).values({
        materialId: material.id,
        type: data.type,
        quantity: data.quantity.toString(),
        previousStock: previousStock.toString(),
        newStock: newStock.toString(),
        reference: data.reference || null,
        notes: data.notes || null,
        movementDate: data.movementDate ? new Date(data.movementDate) : new Date(),
        createdBy: req.user?.id,
      }).returning();

      const [updatedMaterial] = await tx.update(rawMaterials)
        .set({ currentStock: newStock.toString(), updatedAt: new Date() })
        .where(eq(rawMaterials.id, material.id))
        .returning();

      return { material: updatedMaterial, movement };
    });

    const actionType = data.type === 'in' ? 'stock_in' : data.type === 'out' ? 'stock_out' : 'stock_adjustment';
    const actionLabel = data.type === 'in' ? 'stok masuk' : data.type === 'out' ? 'stok keluar' : 'penyesuaian stok';
    await createAuditLog({
      actorId: req.user!.id,
      actorRole: req.user!.role as 'superadmin' | 'admin',
      actorName: req.user!.name,
      actionType,
      entityType: 'raw_material',
      entityId: result.material.id,
      summary: `Mencatat ${actionLabel} ${result.material.code} sebanyak ${data.quantity} ${result.material.unit}`,
      afterState: result.movement,
      ...requestMeta(req),
    });

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Data transaksi stok tidak valid', details: error.errors });
    }
    if (error instanceof Error && error.message === 'MATERIAL_NOT_FOUND') {
      return res.status(404).json({ error: 'Bahan baku tidak ditemukan' });
    }
    if (error instanceof Error && error.message === 'INSUFFICIENT_STOCK') {
      return res.status(400).json({ error: 'Stok tidak mencukupi untuk transaksi keluar' });
    }
    console.error('Create stock movement error:', error);
    res.status(500).json({ error: 'Gagal menyimpan transaksi stok' });
  }
});

router.delete('/:id', requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const [existing] = await db.select().from(rawMaterials).where(eq(rawMaterials.id, req.params.id)).limit(1);
    if (!existing || !existing.isActive) {
      return res.status(404).json({ error: 'Bahan baku tidak ditemukan' });
    }

    await db.update(rawMaterials)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(rawMaterials.id, req.params.id));

    await createAuditLog({
      actorId: req.user!.id,
      actorRole: req.user!.role as 'superadmin' | 'admin',
      actorName: req.user!.name,
      actionType: 'material_delete',
      entityType: 'raw_material',
      entityId: existing.id,
      summary: `Menonaktifkan bahan baku ${existing.code} - ${existing.name}`,
      beforeState: existing,
      ...requestMeta(req),
    });

    res.json({ message: 'Bahan baku berhasil dinonaktifkan' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ error: 'Gagal menonaktifkan bahan baku' });
  }
});

export { router as inventoryRoutes };
