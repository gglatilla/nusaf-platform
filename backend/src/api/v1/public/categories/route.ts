import { Router } from 'express';
import { prisma } from '../../../../config/database';

const router = Router();

/**
 * Convert a name to a URL-friendly slug
 * "Conveyor Components" -> "conveyor-components"
 */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * GET /api/v1/public/categories
 * List all categories with subcategories and product counts
 * No authentication required
 */
router.get('/', async (_req, res) => {
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
            description: true,
            _count: {
              select: {
                products: {
                  where: { isActive: true, deletedAt: null, isPublished: true },
                },
              },
            },
          },
        },
        _count: {
          select: {
            products: {
              where: { isActive: true, deletedAt: null, isPublished: true },
            },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Transform to include slugs and product counts
    const data = categories.map((cat) => ({
      id: cat.id,
      code: cat.code,
      name: cat.name,
      slug: toSlug(cat.name),
      description: cat.description,
      productCount: cat._count.products,
      subCategories: cat.subCategories.map((sub) => ({
        id: sub.id,
        code: sub.code,
        name: sub.name,
        slug: toSlug(sub.name),
        description: sub.description,
        productCount: sub._count.products,
      })),
    }));

    return res.json({
      success: true,
      data: {
        categories: data,
      },
    });
  } catch (error) {
    console.error('Get public categories error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CATEGORIES_ERROR',
        message: 'Failed to fetch categories',
      },
    });
  }
});

/**
 * GET /api/v1/public/categories/:slugOrCode
 * Get a single category by slug or code with all its subcategories
 */
router.get('/:slugOrCode', async (req, res) => {
  try {
    const { slugOrCode } = req.params;

    // First try to find by code (single letter like C, L, B)
    let category = await prisma.category.findFirst({
      where: {
        isActive: true,
        code: { equals: slugOrCode.toUpperCase(), mode: 'insensitive' },
      },
      include: {
        subCategories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            _count: {
              select: {
                products: {
                  where: { isActive: true, deletedAt: null, isPublished: true },
                },
              },
            },
          },
        },
        _count: {
          select: {
            products: {
              where: { isActive: true, deletedAt: null, isPublished: true },
            },
          },
        },
      },
    });

    // If not found by code, try to find by slug (matching name)
    if (!category) {
      const allCategories = await prisma.category.findMany({
        where: { isActive: true },
        include: {
          subCategories: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              code: true,
              name: true,
              description: true,
              _count: {
                select: {
                  products: {
                    where: { isActive: true, deletedAt: null, isPublished: true },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              products: {
                where: { isActive: true, deletedAt: null, isPublished: true },
              },
            },
          },
        },
      });

      category = allCategories.find((cat) => toSlug(cat.name) === slugOrCode.toLowerCase()) || null;
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'Category not found',
        },
      });
    }

    const data = {
      id: category.id,
      code: category.code,
      name: category.name,
      slug: toSlug(category.name),
      description: category.description,
      productCount: category._count.products,
      subCategories: category.subCategories.map((sub) => ({
        id: sub.id,
        code: sub.code,
        name: sub.name,
        slug: toSlug(sub.name),
        description: sub.description,
        productCount: sub._count.products,
      })),
    };

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get category by slug error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CATEGORY_ERROR',
        message: 'Failed to fetch category',
      },
    });
  }
});

/**
 * GET /api/v1/public/categories/:categorySlug/:subCategorySlug
 * Get a subcategory by parent category slug and subcategory slug
 */
router.get('/:categorySlug/:subCategorySlug', async (req, res) => {
  try {
    const { categorySlug, subCategorySlug } = req.params;

    // Find the parent category first
    const allCategories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        subCategories: {
          where: { isActive: true },
          include: {
            _count: {
              select: {
                products: {
                  where: { isActive: true, deletedAt: null, isPublished: true },
                },
              },
            },
          },
        },
      },
    });

    // Find category by slug or code
    const category = allCategories.find(
      (cat) => toSlug(cat.name) === categorySlug.toLowerCase() || cat.code.toLowerCase() === categorySlug.toLowerCase()
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'Category not found',
        },
      });
    }

    // Find subcategory by slug or code
    const subCategory = category.subCategories.find(
      (sub) =>
        toSlug(sub.name) === subCategorySlug.toLowerCase() || sub.code.toLowerCase() === subCategorySlug.toLowerCase()
    );

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SUBCATEGORY_NOT_FOUND',
          message: 'Subcategory not found',
        },
      });
    }

    const data = {
      id: subCategory.id,
      code: subCategory.code,
      name: subCategory.name,
      slug: toSlug(subCategory.name),
      description: subCategory.description,
      productCount: subCategory._count.products,
      category: {
        id: category.id,
        code: category.code,
        name: category.name,
        slug: toSlug(category.name),
      },
    };

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get subcategory by slug error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SUBCATEGORY_ERROR',
        message: 'Failed to fetch subcategory',
      },
    });
  }
});

export default router;
