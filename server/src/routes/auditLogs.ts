import { Router } from 'express';
import { db } from '../db';
import { auditLogs, users } from '../db/schema';
import { desc, eq, and, sql, ilike, or, gte, lte } from 'drizzle-orm';
import { AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', requireRole('superadmin'), async (req: AuthRequest, res) => {
  try {
    const { 
      page = '1', 
      limit = '50',
      search,
      actionType,
      entityType,
      actorId,
      startDate,
      endDate,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const conditions: any[] = [];

    if (actionType) {
      conditions.push(eq(auditLogs.actionType, actionType as any));
    }

    if (entityType) {
      conditions.push(eq(auditLogs.entityType, entityType as any));
    }

    if (actorId) {
      conditions.push(eq(auditLogs.actorId, actorId as string));
    }

    if (startDate) {
      conditions.push(gte(auditLogs.createdAt, new Date(startDate as string)));
    }

    if (endDate) {
      const endDateTime = new Date(endDate as string);
      endDateTime.setHours(23, 59, 59, 999);
      conditions.push(lte(auditLogs.createdAt, endDateTime));
    }

    if (search) {
      conditions.push(
        or(
          ilike(auditLogs.summary, `%${search}%`),
          ilike(auditLogs.actorName, `%${search}%`),
          ilike(auditLogs.entityId, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const logsResult = await db
      .select({
        id: auditLogs.id,
        actorId: auditLogs.actorId,
        actorRole: auditLogs.actorRole,
        actorName: auditLogs.actorName,
        actionType: auditLogs.actionType,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        summary: auditLogs.summary,
        beforeState: auditLogs.beforeState,
        afterState: auditLogs.afterState,
        metadata: auditLogs.metadata,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limitNum)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(whereClause);

    const total = Number(countResult?.count || 0);

    res.json({
      logs: logsResult,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.get('/stats', requireRole('superadmin'), async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const conditions: any[] = [];
    
    if (startDate) {
      conditions.push(gte(auditLogs.createdAt, new Date(startDate as string)));
    }
    
    if (endDate) {
      const endDateTime = new Date(endDate as string);
      endDateTime.setHours(23, 59, 59, 999);
      conditions.push(lte(auditLogs.createdAt, endDateTime));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const totalActivities = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(whereClause);

    const actionStats = await db
      .select({
        actionType: auditLogs.actionType,
        count: sql<number>`count(*)`,
      })
      .from(auditLogs)
      .where(whereClause)
      .groupBy(auditLogs.actionType)
      .orderBy(desc(sql`count(*)`));

    const userStats = await db
      .select({
        actorId: auditLogs.actorId,
        actorName: auditLogs.actorName,
        actorRole: auditLogs.actorRole,
        count: sql<number>`count(*)`,
      })
      .from(auditLogs)
      .where(whereClause)
      .groupBy(auditLogs.actorId, auditLogs.actorName, auditLogs.actorRole)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    const recentActivities = await db
      .select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(5);

    res.json({
      totalActivities: Number(totalActivities[0]?.count || 0),
      actionStats,
      userStats,
      recentActivities,
    });
  } catch (error) {
    console.error('Get audit logs stats error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.get('/users', requireRole('superadmin'), async (req: AuthRequest, res) => {
  try {
    const usersList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .orderBy(users.name);

    res.json(usersList);
  } catch (error) {
    console.error('Get users for audit error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.get('/:id', requireRole('superadmin'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const [log] = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.id, id))
      .limit(1);

    if (!log) {
      return res.status(404).json({ error: 'Log tidak ditemukan' });
    }

    res.json(log);
  } catch (error) {
    console.error('Get audit log detail error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

export { router as auditLogsRoutes };
