import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/database';
import { authenticate, requireRole, type AuthenticatedRequest } from '../../../middleware/auth';
import {
  calculateProductPrice,
  calculateCustomerPrice,
  recalculateProductPrices,
} from '../../../services/pricing.service';
import {
  getProductInventorySummary,
  getProductMovementHistory,
  getProductsStockSummary,
  type StockStatus,
} from '../../../services/inventory.service';
import type { CustomerTier } from '@prisma/client';

const router = Router();

/**
 * GET /api/v1/products
 * List products with filtering, search, and pagination
 * Query params:
 *   - include: stockSummary (adds stock info to each product)
 *   - stockStatus: comma-separated list (IN_STOCK, LOW_STOCK, OUT_OF_STOCK, ON_ORDER, OVERSTOCK)
 *   - warehouseId: filter by warehouse (JHB, CT)
 *   - sort: field:direction (available:asc, available:desc for stock sorting)
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
      include,
      stockStatus,
      warehouseId,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string, 10) || 20));

    // Parse include param
    const includeStockSummary = typeof include === 'string' && include.toLowerCase().includes('stocksummary');

    // Parse stockStatus filter
    const stockStatusFilter = typeof stockStatus === 'string'
      ? stockStatus.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean) as StockStatus[]
      : [];
    const hasStockStatusFilter = stockStatusFilter.length > 0;

    // Parse warehouseId filter (reserved for future use with per-warehouse filtering)
    const _warehouseFilter = typeof warehouseId === 'string' && ['JHB', 'CT'].includes(warehouseId.toUpperCase())
      ? warehouseId.toUpperCase()
      : null;
    void _warehouseFilter; // TODO: Implement per-warehouse stock filtering

    // Parse sort param
    const sortParam = typeof sort === 'string' ? sort : '';
    const [sortField, sortDirection] = sortParam.split(':');
    const sortDir = sortDirection === 'desc' ? 'desc' : 'asc';
    const sortByAvailable = sortField === 'available';

    // Need stock data if: includeStockSummary OR stockStatus filter OR sortByAvailable
    const needStockData = includeStockSummary || hasStockStatusFilter || sortByAvailable;

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

    // If filtering/sorting by stock, we need to fetch more products and filter in memory
    // This is because stock data comes from a separate table
    const fetchAll = needStockData && (hasStockStatusFilter || sortByAvailable);

    // Build orderBy clause (skip if sorting by available - we'll sort in memory)
    let orderBy: Prisma.ProductOrderByWithRelationInput[] = [
      { category: { sortOrder: 'asc' } },
      { nusafSku: 'asc' },
    ];

    if (!sortByAvailable && sortParam) {
      const sortableFields: Record<string, Prisma.ProductOrderByWithRelationInput> = {
        nusafSku: { nusafSku: sortDir },
        description: { description: sortDir },
        price: { listPrice: sortDir },
      };

      if (sortableFields[sortField]) {
        orderBy = [sortableFields[sortField]];
      }
    }

    // Get company tier
    const company = await prisma.company.findUnique({
      where: { id: authReq.user.companyId },
      select: { tier: true },
    });

    const userRole = authReq.user.role;
    const isCustomer = userRole === 'CUSTOMER';
    const tier = (company?.tier ?? 'END_USER') as CustomerTier;

    // Fetch products
    const skip = fetchAll ? 0 : (pageNum - 1) * pageSizeNum;
    const take = fetchAll ? 1000 : pageSizeNum;

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          supplier: { select: { id: true, code: true, name: true } },
          category: { select: { id: true, code: true, name: true } },
          subCategory: { select: { id: true, code: true, name: true } },
        },
        orderBy,
        skip,
        take,
      }),
    ]);

    // Fetch stock summaries if needed
    let stockSummaryMap = new Map<string, { totalOnHand: number; totalAvailable: number; status: StockStatus }>();
    if (needStockData && products.length > 0) {
      const productIds = products.map((p) => p.id);
      stockSummaryMap = await getProductsStockSummary(productIds);
    }

    // Transform products
    let transformedProducts = products.map((product) => {
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

      const stockSummary = stockSummaryMap.get(product.id) ?? {
        totalOnHand: 0,
        totalAvailable: 0,
        status: 'OUT_OF_STOCK' as StockStatus,
      };

      const result: Record<string, unknown> = {
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

      // Add stock summary if requested
      if (includeStockSummary) {
        result.stockSummary = stockSummary;
      }

      // Internal field for filtering/sorting (not returned to client unless includeStockSummary)
      (result as { _stockStatus: StockStatus; _available: number })._stockStatus = stockSummary.status;
      (result as { _stockStatus: StockStatus; _available: number })._available = stockSummary.totalAvailable;

      return result;
    });

    // Filter by stock status if requested
    if (hasStockStatusFilter) {
      transformedProducts = transformedProducts.filter((p) =>
        stockStatusFilter.includes((p as { _stockStatus: StockStatus })._stockStatus)
      );
    }

    // Sort by available if requested
    if (sortByAvailable) {
      transformedProducts.sort((a, b) => {
        const aAvail = (a as { _available: number })._available;
        const bAvail = (b as { _available: number })._available;
        return sortDir === 'asc' ? aAvail - bAvail : bAvail - aAvail;
      });
    }

    // Calculate pagination after filtering
    const filteredTotal = fetchAll ? transformedProducts.length : total;

    // Apply pagination if we fetched all
    if (fetchAll) {
      const paginationSkip = (pageNum - 1) * pageSizeNum;
      transformedProducts = transformedProducts.slice(paginationSkip, paginationSkip + pageSizeNum);
    }

    // Remove internal fields
    const finalProducts = transformedProducts.map((p) => {
      const { _stockStatus, _available, ...rest } = p as Record<string, unknown> & { _stockStatus: StockStatus; _available: number };
      return rest;
    });

    const totalPages = Math.ceil(filteredTotal / pageSizeNum);

    return res.json({
      success: true,
      data: {
        products: finalProducts,
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          totalItems: filteredTotal,
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
 * Query params:
 *   - include: comma-separated list of facets (inventory, movements)
 *   - movementLimit: number of recent movements to include (default 20)
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const includeParam = (req.query.include as string) || '';
    const movementLimit = Math.min(100, Math.max(1, parseInt(req.query.movementLimit as string, 10) || 20));

    // Parse include param
    const includes = new Set(includeParam.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean));
    const includeInventory = includes.has('inventory');
    const includeMovements = includes.has('movements');

    // Check if this is the /price endpoint (handled separately)
    if (id === 'price') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'Use GET /products/:id/price for pricing' },
      });
    }

    // Parallel fetch: product, company tier, and optional inventory/movements
    const [product, company, inventoryResult, movementsResult] = await Promise.all([
      prisma.product.findUnique({
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
      }),
      prisma.company.findUnique({
        where: { id: authReq.user.companyId },
        select: { tier: true },
      }),
      includeInventory ? getProductInventorySummary(id) : Promise.resolve(undefined),
      includeMovements ? getProductMovementHistory(id, { pageSize: movementLimit }) : Promise.resolve(undefined),
    ]);

    if (!product || !product.isActive || product.deletedAt) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    const userRole = authReq.user.role;
    const isCustomer = userRole === 'CUSTOMER';
    const tier = (company?.tier ?? 'END_USER') as CustomerTier;

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

    // Build response
    const responseData: Record<string, unknown> = {
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
    };

    // Add inventory if requested
    if (includeInventory) {
      if (inventoryResult) {
        responseData.inventory = inventoryResult;
      } else {
        // No inventory record = zero quantities
        responseData.inventory = {
          totalOnHand: 0,
          totalAvailable: 0,
          totalReserved: 0,
          totalOnOrder: 0,
          status: 'OUT_OF_STOCK',
          byLocation: [],
          defaults: {
            reorderPoint: null,
            reorderQty: null,
            minStock: null,
            maxStock: null,
            leadTimeDays: null,
          },
        };
      }
    }

    // Add movements if requested
    if (includeMovements) {
      responseData.recentMovements = movementsResult?.movements ?? [];
    }

    return res.json({
      success: true,
      data: responseData,
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
