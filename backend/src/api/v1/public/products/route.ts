import { Router } from 'express';
import { Prisma } from '@prisma/client';
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
 * Find category ID by code or slug
 */
async function findCategoryId(codeOrSlug: string): Promise<string | null> {
  // First try exact code match (e.g., "C", "L", "P")
  let category = await prisma.category.findFirst({
    where: {
      isActive: true,
      code: { equals: codeOrSlug.toUpperCase(), mode: 'insensitive' },
    },
    select: { id: true },
  });

  if (category) return category.id;

  // Try slug match
  const allCategories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  const matched = allCategories.find((cat) => toSlug(cat.name) === codeOrSlug.toLowerCase());
  return matched?.id || null;
}

/**
 * Find subcategory ID by code or slug within a category
 */
async function findSubCategoryId(
  codeOrSlug: string,
  categoryId?: string
): Promise<string | null> {
  // Try exact code match (e.g., "C-001", "L-003")
  const whereClause: Prisma.SubCategoryWhereInput = {
    isActive: true,
    code: { equals: codeOrSlug.toUpperCase(), mode: 'insensitive' },
  };
  if (categoryId) {
    whereClause.categoryId = categoryId;
  }

  let subCategory = await prisma.subCategory.findFirst({
    where: whereClause,
    select: { id: true },
  });

  if (subCategory) return subCategory.id;

  // Try slug match
  const subCategories = await prisma.subCategory.findMany({
    where: {
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
    },
    select: { id: true, name: true },
  });

  const matched = subCategories.find((sub) => toSlug(sub.name) === codeOrSlug.toLowerCase());
  return matched?.id || null;
}

/**
 * GET /api/v1/public/products
 * List published products (no prices, no auth required)
 * Query params:
 *   - categoryId: filter by category ID
 *   - categoryCode: filter by category code or slug (e.g., "C" or "conveyor-components")
 *   - subCategoryId: filter by subcategory ID
 *   - subCategoryCode: filter by subcategory code or slug (e.g., "C-001" or "bases")
 *   - search: search by SKU or description
 *   - page: page number (default 1)
 *   - pageSize: items per page (default 20, max 100)
 */
router.get('/', async (req, res) => {
  try {
    const {
      categoryId,
      categoryCode,
      subCategoryId,
      subCategoryCode,
      search,
      page = '1',
      pageSize = '20',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string, 10) || 20));

    // Build where clause - only published products
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      deletedAt: null,
      isPublished: true,
    };

    // Resolve category filter (ID takes priority, then code/slug)
    let resolvedCategoryId: string | null = null;
    if (categoryId && typeof categoryId === 'string') {
      resolvedCategoryId = categoryId;
    } else if (categoryCode && typeof categoryCode === 'string') {
      resolvedCategoryId = await findCategoryId(categoryCode);
    }

    if (resolvedCategoryId) {
      where.categoryId = resolvedCategoryId;
    }

    // Resolve subcategory filter (ID takes priority, then code/slug)
    let resolvedSubCategoryId: string | null = null;
    if (subCategoryId && typeof subCategoryId === 'string') {
      resolvedSubCategoryId = subCategoryId;
    } else if (subCategoryCode && typeof subCategoryCode === 'string') {
      resolvedSubCategoryId = await findSubCategoryId(subCategoryCode, resolvedCategoryId || undefined);
    }

    if (resolvedSubCategoryId) {
      where.subCategoryId = resolvedSubCategoryId;
    }

    // Search by SKU or description
    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { nusafSku: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { marketingTitle: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, code: true, name: true } },
          subCategory: { select: { id: true, code: true, name: true } },
          productImages: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true, thumbnailUrl: true, altText: true },
          },
        },
        orderBy: [
          { category: { sortOrder: 'asc' } },
          { nusafSku: 'asc' },
        ],
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
      }),
    ]);

    // Transform products - no prices exposed
    const transformedProducts = products.map((product) => ({
      id: product.id,
      sku: product.nusafSku,
      title: product.marketingTitle || product.description,
      description: product.marketingDescription || product.longDescription,
      category: product.category,
      subCategory: product.subCategory,
      primaryImage: product.productImages[0] || null,
      unitOfMeasure: product.unitOfMeasure,
    }));

    const totalPages = Math.ceil(total / pageSizeNum);

    return res.json({
      success: true,
      data: {
        products: transformedProducts,
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          totalItems: total,
          totalPages,
          hasMore: pageNum < totalPages,
        },
      },
    });
  } catch (error) {
    console.error('Get public products error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PRODUCTS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch products',
      },
    });
  }
});

/**
 * GET /api/v1/public/products/search
 * Search products including cross-references (no auth required)
 * Query params:
 *   - q: search query (searches SKU, description, and cross-references)
 *   - page: page number
 *   - pageSize: items per page
 */
router.get('/search', async (req, res) => {
  try {
    const { q, page = '1', pageSize = '20' } = req.query;

    if (!q || typeof q !== 'string' || !q.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Search query (q) is required' },
      });
    }

    const searchTerm = q.trim();
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string, 10) || 20));

    // Find products by direct match or cross-reference match
    const productIds = await prisma.$queryRaw<{ id: string }[]>`
      SELECT DISTINCT p.id
      FROM products p
      LEFT JOIN competitor_cross_references ccr ON ccr.product_id = p.id
      WHERE p.is_active = true
        AND p.deleted_at IS NULL
        AND p.is_published = true
        AND (
          p.nusaf_sku ILIKE ${'%' + searchTerm + '%'}
          OR p.description ILIKE ${'%' + searchTerm + '%'}
          OR p.marketing_title ILIKE ${'%' + searchTerm + '%'}
          OR ccr.competitor_sku ILIKE ${'%' + searchTerm + '%'}
          OR ccr.competitor_brand ILIKE ${'%' + searchTerm + '%'}
        )
      LIMIT ${pageSizeNum + 1}
      OFFSET ${(pageNum - 1) * pageSizeNum}
    `;

    const hasMore = productIds.length > pageSizeNum;
    const ids = productIds.slice(0, pageSizeNum).map((r) => r.id);

    // Fetch full product details
    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      include: {
        category: { select: { id: true, code: true, name: true } },
        subCategory: { select: { id: true, code: true, name: true } },
        productImages: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true, thumbnailUrl: true, altText: true },
        },
        crossReferences: {
          select: { competitorBrand: true, competitorSku: true, isExact: true },
        },
      },
    });

    // Transform products
    const transformedProducts = products.map((product) => ({
      id: product.id,
      sku: product.nusafSku,
      title: product.marketingTitle || product.description,
      description: product.marketingDescription || product.longDescription,
      category: product.category,
      subCategory: product.subCategory,
      primaryImage: product.productImages[0] || null,
      unitOfMeasure: product.unitOfMeasure,
      crossReferences: product.crossReferences,
    }));

    return res.json({
      success: true,
      data: {
        products: transformedProducts,
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          hasMore,
        },
        searchTerm,
      },
    });
  } catch (error) {
    console.error('Search public products error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to search products',
      },
    });
  }
});

/**
 * GET /api/v1/public/products/cross-reference
 * Search by competitor part number (no auth required)
 * Query params:
 *   - q: part number to search
 *   - brand: optional brand filter
 */
router.get('/cross-reference', async (req, res) => {
  try {
    const { q, brand } = req.query;

    if (!q || typeof q !== 'string' || !q.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Part number query (q) is required' },
      });
    }

    const competitorSku = q.trim();

    // Build where clause for cross-references
    const crossRefWhere: Prisma.CompetitorCrossReferenceWhereInput = {
      competitorSku: { contains: competitorSku, mode: 'insensitive' },
      product: {
        isActive: true,
        deletedAt: null,
        isPublished: true,
      },
    };

    if (brand && typeof brand === 'string') {
      crossRefWhere.competitorBrand = { contains: brand, mode: 'insensitive' };
    }

    const crossReferences = await prisma.competitorCrossReference.findMany({
      where: crossRefWhere,
      include: {
        product: {
          include: {
            category: { select: { id: true, code: true, name: true } },
            subCategory: { select: { id: true, code: true, name: true } },
            productImages: {
              where: { isPrimary: true },
              take: 1,
              select: { url: true, thumbnailUrl: true, altText: true },
            },
          },
        },
      },
      take: 50,
    });

    // Transform results
    const results = crossReferences.map((ref) => ({
      crossReference: {
        competitorBrand: ref.competitorBrand,
        competitorSku: ref.competitorSku,
        isExact: ref.isExact,
        notes: ref.notes,
      },
      product: {
        id: ref.product.id,
        sku: ref.product.nusafSku,
        title: ref.product.marketingTitle || ref.product.description,
        description: ref.product.marketingDescription || ref.product.longDescription,
        category: ref.product.category,
        subCategory: ref.product.subCategory,
        primaryImage: ref.product.productImages[0] || null,
        unitOfMeasure: ref.product.unitOfMeasure,
      },
    }));

    return res.json({
      success: true,
      data: {
        results,
        searchedPartNumber: competitorSku,
        searchedBrand: brand || null,
      },
    });
  } catch (error) {
    console.error('Cross-reference search error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CROSS_REFERENCE_SEARCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to search cross-references',
      },
    });
  }
});

/**
 * GET /api/v1/public/products/:sku/related
 * Get related products (same category/subcategory, no auth required)
 * Returns up to 8 products from the same category
 */
router.get('/:sku/related', async (req, res) => {
  try {
    const { sku } = req.params;
    const limit = Math.min(12, parseInt(req.query.limit as string, 10) || 8);

    // First, get the current product to find its category
    const currentProduct = await prisma.product.findFirst({
      where: {
        nusafSku: sku,
        isActive: true,
        deletedAt: null,
        isPublished: true,
      },
      select: {
        id: true,
        categoryId: true,
        subCategoryId: true,
        specifications: true,
      },
    });

    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    // Build query for related products
    // Priority: same subcategory > same category
    const relatedProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        isPublished: true,
        id: { not: currentProduct.id }, // Exclude current product
        OR: [
          // Same subcategory (higher priority)
          ...(currentProduct.subCategoryId
            ? [{ subCategoryId: currentProduct.subCategoryId }]
            : []),
          // Same category
          { categoryId: currentProduct.categoryId },
        ],
      },
      include: {
        category: { select: { id: true, code: true, name: true } },
        subCategory: { select: { id: true, code: true, name: true } },
        productImages: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true, thumbnailUrl: true, altText: true },
        },
      },
      orderBy: [
        // Products in the same subcategory first (if applicable)
        ...(currentProduct.subCategoryId
          ? [
              {
                subCategoryId: 'asc' as const, // This helps group same subcategory together
              },
            ]
          : []),
        { nusafSku: 'asc' as const },
      ],
      take: limit,
    });

    // Sort so same subcategory products come first
    const sortedProducts = relatedProducts.sort((a, b) => {
      // Same subcategory products first
      const aInSubCat = a.subCategoryId === currentProduct.subCategoryId ? 0 : 1;
      const bInSubCat = b.subCategoryId === currentProduct.subCategoryId ? 0 : 1;
      if (aInSubCat !== bInSubCat) return aInSubCat - bInSubCat;
      // Then by SKU
      return a.nusafSku.localeCompare(b.nusafSku);
    });

    // Transform products - no prices exposed
    const transformedProducts = sortedProducts.map((product) => ({
      id: product.id,
      sku: product.nusafSku,
      title: product.marketingTitle || product.description,
      description: product.marketingDescription || product.longDescription,
      category: product.category,
      subCategory: product.subCategory,
      primaryImage: product.productImages[0] || null,
      unitOfMeasure: product.unitOfMeasure,
    }));

    return res.json({
      success: true,
      data: {
        products: transformedProducts,
        sourceProductSku: sku,
        categoryId: currentProduct.categoryId,
        subCategoryId: currentProduct.subCategoryId,
      },
    });
  } catch (error) {
    console.error('Get related products error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'RELATED_PRODUCTS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch related products',
      },
    });
  }
});

/**
 * GET /api/v1/public/products/:sku
 * Get product details by SKU (no prices, no auth required)
 */
router.get('/:sku', async (req, res) => {
  try {
    const { sku } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        nusafSku: sku,
        isActive: true,
        deletedAt: null,
        isPublished: true,
      },
      include: {
        category: { select: { id: true, code: true, name: true } },
        subCategory: { select: { id: true, code: true, name: true } },
        productImages: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          select: {
            id: true,
            url: true,
            thumbnailUrl: true,
            altText: true,
            caption: true,
            isPrimary: true,
          },
        },
        productDocuments: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
          select: {
            id: true,
            type: true,
            name: true,
            fileUrl: true,
            fileSize: true,
          },
        },
        crossReferences: {
          orderBy: [{ competitorBrand: 'asc' }, { competitorSku: 'asc' }],
          select: {
            id: true,
            competitorBrand: true,
            competitorSku: true,
            notes: true,
            isExact: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    // Transform - no prices exposed
    const responseData = {
      id: product.id,
      sku: product.nusafSku,
      title: product.marketingTitle || product.description,
      description: product.marketingDescription || product.longDescription,
      specifications: product.specifications,
      metaTitle: product.metaTitle,
      metaDescription: product.metaDescription,
      category: product.category,
      subCategory: product.subCategory,
      unitOfMeasure: product.unitOfMeasure,
      images: product.productImages,
      documents: product.productDocuments,
      crossReferences: product.crossReferences,
    };

    return res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Get public product error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PRODUCT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch product',
      },
    });
  }
});

export default router;
