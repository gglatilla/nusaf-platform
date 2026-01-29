import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/database';
import { authenticate, requireRole, type AuthenticatedRequest } from '../../../middleware/auth';
import {
  calculateProductPrice,
  calculateCustomerPrice,
  recalculateProductPrices,
} from '../../../services/pricing.service';

const router = Router();

/**
 * GET /api/v1/products
 * List products with filtering, search, and pagination
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const {
      categoryId,
      subCategoryId,
      supplierId,
      search,
      page = '1',
      pageSize = '20',
      sort,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string, 10) || 20));
    const skip = (pageNum - 1) * pageSizeNum;

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      deletedAt: null,
    };

    if (categoryId && typeof categoryId === 'string') {
      where.categoryId = categoryId;
    }

    if (subCategoryId && typeof subCategoryId === 'string') {
      where.subCategoryId = subCategoryId;
    }

    if (supplierId && typeof supplierId === 'string') {
      where.supplierId = supplierId;
    }

    // Search by SKU or description
    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { nusafSku: { contains: searchTerm, mode: 'insensitive' } },
        { supplierSku: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    // Build orderBy clause
    let orderBy: Prisma.ProductOrderByWithRelationInput[] = [
      { category: { sortOrder: 'asc' } },
      { nusafSku: 'asc' },
    ];

    if (sort && typeof sort === 'string') {
      const [field, direction] = sort.split(':');
      const sortDir = direction === 'desc' ? 'desc' : 'asc';

      // Map allowed sort fields
      const sortableFields: Record<string, Prisma.ProductOrderByWithRelationInput> = {
        nusafSku: { nusafSku: sortDir },
        description: { description: sortDir },
        price: { listPrice: sortDir },
      };

      if (sortableFields[field]) {
        orderBy = [sortableFields[field]];
      }
    }

    // Get total count and products in parallel
    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          supplier: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          category: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          subCategory: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
        orderBy,
        skip,
        take: pageSizeNum,
      }),
    ]);

    // Get company tier for pricing
    const company = await prisma.company.findUnique({
      where: { id: authReq.user.companyId },
    });

    const userRole = authReq.user.role;
    const isCustomer = userRole === 'CUSTOMER';
    const tier = company?.tier ?? 'END_USER';

    // Transform products with role-appropriate pricing
    const transformedProducts = products.map((product) => {
      const listPrice = product.listPrice ? Number(product.listPrice) : null;
      let displayPrice: number | null = null;
      let priceLabel: string;

      if (listPrice) {
        if (isCustomer) {
          // Customers see their tier-discounted price
          displayPrice = calculateCustomerPrice(listPrice, tier);
          priceLabel = 'Your Price';
        } else {
          // Sales, Manager, Admin see list price
          displayPrice = listPrice;
          priceLabel = 'List Price';
        }
      } else {
        priceLabel = 'Price on Request';
      }

      return {
        id: product.id,
        nusafSku: product.nusafSku,
        supplierSku: product.supplierSku,
        description: product.description,
        unitOfMeasure: product.unitOfMeasure,
        supplier: product.supplier,
        category: product.category,
        subCategory: product.subCategory,
        price: displayPrice,
        priceLabel,
        hasPrice: !!listPrice,
      };
    });

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
    console.error('Get products error:', error);
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
 * GET /api/v1/products/:id
 * Get product details with full pricing information
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    // Check if this is the /price endpoint (handled separately)
    if (id === 'price') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'Use GET /products/:id/price for pricing' },
      });
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        subCategory: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (!product || !product.isActive || product.deletedAt) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    // Get company tier for pricing
    const company = await prisma.company.findUnique({
      where: { id: authReq.user.companyId },
    });

    const userRole = authReq.user.role;
    const isCustomer = userRole === 'CUSTOMER';
    const tier = company?.tier ?? 'END_USER';

    const listPrice = product.listPrice ? Number(product.listPrice) : null;
    let displayPrice: number | null = null;
    let priceLabel: string;

    if (listPrice) {
      if (isCustomer) {
        displayPrice = calculateCustomerPrice(listPrice, tier);
        priceLabel = 'Your Price';
      } else {
        displayPrice = listPrice;
        priceLabel = 'List Price';
      }
    } else {
      priceLabel = 'Price on Request';
    }

    return res.json({
      success: true,
      data: {
        id: product.id,
        nusafSku: product.nusafSku,
        supplierSku: product.supplierSku,
        description: product.description,
        unitOfMeasure: product.unitOfMeasure,
        supplier: product.supplier,
        category: product.category,
        subCategory: product.subCategory,
        price: displayPrice,
        priceLabel,
        hasPrice: !!listPrice,
        priceUpdatedAt: product.priceUpdatedAt,
      },
    });
  } catch (error) {
    console.error('Get product error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PRODUCT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch product',
      },
    });
  }
});

/**
 * GET /api/v1/products/:id/price
 * Get calculated price for a product (requires authentication)
 */
router.get('/:id/price', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    // Get product
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        supplier: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    // Get company tier for pricing
    const company = await prisma.company.findUnique({
      where: { id: authReq.user.companyId },
    });

    if (!company) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_COMPANY', message: 'User company not found' },
      });
    }

    // If product has list price, use it; otherwise calculate
    let listPrice: number;
    let calculated = false;

    if (product.listPrice) {
      listPrice = Number(product.listPrice);
    } else if (product.costPrice) {
      // Calculate on the fly
      const result = await calculateProductPrice(id);
      if (!result.success || !result.listPrice) {
        return res.status(400).json({
          success: false,
          error: { code: 'PRICE_ERROR', message: result.error || 'Cannot calculate price' },
        });
      }
      listPrice = result.listPrice;
      calculated = true;
    } else {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_PRICE', message: 'Product has no cost price set' },
      });
    }

    // Calculate customer price based on tier
    const customerPrice = calculateCustomerPrice(listPrice, company.tier);

    return res.json({
      success: true,
      data: {
        productId: product.id,
        nusafSku: product.nusafSku,
        listPrice,
        customerPrice,
        tier: company.tier,
        currency: 'ZAR',
        calculated,
        priceUpdatedAt: product.priceUpdatedAt,
      },
    });
  } catch (error) {
    console.error('Get product price error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PRICE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get product price',
      },
    });
  }
});

/**
 * POST /api/v1/products/recalculate
 * Recalculate and save list prices for products (admin only)
 */
router.post(
  '/recalculate',
  authenticate,
  requireRole('ADMIN', 'MANAGER'),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { supplierId, categoryId } = req.body;

      const result = await recalculateProductPrices({
        supplierId: typeof supplierId === 'string' ? supplierId : undefined,
        categoryId: typeof categoryId === 'string' ? categoryId : undefined,
        userId: authReq.user.id,
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Recalculate prices error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'RECALCULATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to recalculate prices',
        },
      });
    }
  }
);

export default router;
