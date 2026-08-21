import { Router } from 'express';
import { db } from '../db';
import { testimonials, orders, customers } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

const createTestimonialSchema = z.object({
  trackingCode: z.string().min(1),
  rating: z.number().min(1).max(5),
  qualityRating: z.number().min(1).max(5).optional(),
  speedRating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
  suggestions: z.string().optional(),
  allowPublish: z.boolean().optional(),
});

router.post('/', async (req, res) => {
  try {
    const data = createTestimonialSchema.parse(req.body);

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.trackingCode, data.trackingCode.toUpperCase()))
      .limit(1);

    if (!order) {
      return res.status(404).json({ error: 'Order tidak ditemukan' });
    }

    const [existingTestimonial] = await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.orderId, order.id))
      .limit(1);

    if (existingTestimonial) {
      return res.status(400).json({ error: 'Testimoni untuk order ini sudah ada' });
    }

    const [newTestimonial] = await db
      .insert(testimonials)
      .values({
        orderId: order.id,
        customerId: order.customerId,
        rating: data.rating,
        qualityRating: data.qualityRating,
        speedRating: data.speedRating,
        comment: data.comment,
        suggestions: data.suggestions,
        allowPublish: data.allowPublish || false,
      })
      .returning();

    res.status(201).json({
      message: 'Terima kasih atas testimoni Anda!',
      testimonial: newTestimonial,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Data tidak valid', details: error.errors });
    }
    console.error('Create testimonial error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.get('/published', async (req, res) => {
  try {
    const publishedTestimonials = await db
      .select({
        id: testimonials.id,
        rating: testimonials.rating,
        qualityRating: testimonials.qualityRating,
        speedRating: testimonials.speedRating,
        comment: testimonials.comment,
        createdAt: testimonials.createdAt,
        customer: {
          name: customers.name,
        },
      })
      .from(testimonials)
      .leftJoin(customers, eq(testimonials.customerId, customers.id))
      .where(eq(testimonials.allowPublish, true))
      .orderBy(desc(testimonials.createdAt))
      .limit(20);

    res.json({ testimonials: publishedTestimonials });
  } catch (error) {
    console.error('Get testimonials error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

export { router as testimonialsRoutes };
