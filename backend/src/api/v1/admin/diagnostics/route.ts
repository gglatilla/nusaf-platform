import { Router } from 'express';
import { prisma } from '../../../../config/database';
import { authenticate, requireRole } from '../../../../middleware/auth';

const router = Router();

// Apply authentication and admin role check to all routes
router.use(authenticate);
router.use(requireRole('ADMIN', 'MANAGER', 'SALES'));

/**
 * GET /api/v1/admin/diagnostics/pricing-check
 * Diagnose pricing issues for a category/supplier combination
 *
 * Query params:
 * - category: Category code (default: 'L')
 * - supplier: Supplier code (default: 'TECOM')
 */
router.get('/pricing-check', async (req, res) => {
  try {
    const categoryCode = (req.query.category as string) || 'L';
    const supplierCode = (req.query.supplier as string) || 'TECOM';

    // 1. Get category
    const category = await prisma.category.findUnique({
      where: { code: categoryCode },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Category ${categoryCode} not found` },
      });
    }

    // 2. Get supplier
    const supplier = await prisma.supplier.findUnique({
      where: { code: supplierCode },
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Supplier ${supplierCode} not found` },
      });
    }

    // 3. Get all subcategories for this category
    const subcategories = await prisma.subCategory.findMany({
      where: { categoryId: category.id },
      orderBy: { code: 'asc' },
    });

    // 4. Get product counts per subcategory
    const productsBySubcategory = await prisma.product.groupBy({
      by: ['subCategoryId'],
      where: {
        categoryId: category.id,
        supplierId: supplier.id,
      },
      _count: { id: true },
    });

    // 5. Get products with NULL subCategoryId
    const productsWithNullSubcat = await prisma.product.count({
      where: {
        categoryId: category.id,
        supplierId: supplier.id,
        subCategoryId: null,
      },
    });

    // 6. Get pricing rules for this supplier/category
    const pricingRules = await prisma.pricingRule.findMany({
      where: {
        supplierId: supplier.id,
        categoryId: category.id,
      },
      include: {
        subCategory: { select: { code: true, name: true } },
      },
    });

    // 7. Get sample products showing price status (grouped by subcategory)
    const sampleProducts = await prisma.product.findMany({
      where: {
        categoryId: category.id,
        supplierId: supplier.id,
      },
      select: {
        supplierSku: true,
        description: true,
        subCategoryId: true,
        subCategory: { select: { code: true, name: true } },
        costPrice: true,
        listPrice: true,
      },
      orderBy: [{ subCategory: { code: 'asc' } }, { supplierSku: 'asc' }],
      take: 50,
    });

    // Build response with counts mapped to subcategory IDs
    const countMap = new Map(productsBySubcategory.map(p => [p.subCategoryId, p._count.id]));

    // Analyze pricing coverage
    const subcategoriesWithRules = new Set(
      pricingRules
        .filter(r => r.subCategoryId)
        .map(r => r.subCategoryId)
    );
    const hasCategoryLevelRule = pricingRules.some(r => r.subCategoryId === null);

    return res.json({
      success: true,
      data: {
        category: { code: category.code, name: category.name, id: category.id },
        supplier: { code: supplier.code, name: supplier.name, id: supplier.id },

        // Subcategory analysis
        subcategories: subcategories.map(s => ({
          code: s.code,
          name: s.name,
          id: s.id,
          productCount: countMap.get(s.id) || 0,
          hasPricingRule: subcategoriesWithRules.has(s.id),
        })),

        // Products without subcategory assignment
        productsWithNullSubcategory: productsWithNullSubcat,

        // Pricing rules
        pricingRules: pricingRules.map(r => ({
          id: r.id,
          subCategory: r.subCategory ? r.subCategory.code : 'CATEGORY-LEVEL',
          subCategoryName: r.subCategory?.name || 'Applies to entire category',
          isGross: r.isGross,
          discountPercent: r.discountPercent ? Number(r.discountPercent) : null,
          freightPercent: Number(r.freightPercent),
          marginDivisor: Number(r.marginDivisor),
        })),
        hasCategoryLevelRule,

        // Sample products
        sampleProducts: sampleProducts.map(p => ({
          sku: p.supplierSku,
          description: p.description?.substring(0, 50),
          subcategory: p.subCategory?.code || 'NULL',
          subcategoryName: p.subCategory?.name || 'NOT ASSIGNED',
          costPrice: p.costPrice ? Number(p.costPrice) : null,
          listPrice: p.listPrice ? Number(p.listPrice) : null,
          hasPricing: p.listPrice !== null,
        })),

        // Summary diagnosis
        diagnosis: {
          totalSubcategories: subcategories.length,
          subcategoriesWithProducts: subcategories.filter(s => (countMap.get(s.id) || 0) > 0).length,
          subcategoriesWithRules: subcategoriesWithRules.size,
          productsWithoutSubcategory: productsWithNullSubcat,
          hasCategoryFallback: hasCategoryLevelRule,
          potentialIssues: [] as string[],
        },
      },
    });
  } catch (error) {
    console.error('Diagnostic pricing-check error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DIAGNOSTIC_ERROR',
        message: error instanceof Error ? error.message : 'Diagnostic failed',
      },
    });
  }
});

export default router;
