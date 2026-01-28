import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/v1/categories
 * List all categories with subcategories for filter sidebar
 */
router.get('/', authenticate, async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        subCategories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        _count: {
          select: {
            products: {
              where: { isActive: true, deletedAt: null },
            },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Transform to include product counts
    const data = categories.map((cat) => ({
      id: cat.id,
      code: cat.code,
      name: cat.name,
      productCount: cat._count.products,
      subCategories: cat.subCategories.map((sub) => ({
        id: sub.id,
        code: sub.code,
        name: sub.name,
      })),
    }));

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CATEGORIES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch categories',
      },
    });
  }
});

export default router;
