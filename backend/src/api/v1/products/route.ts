import { Router } from 'express';
import { Prisma } from '@prisma/client';
import multer from 'multer';
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
  getProductReservations,
  createStockAdjustment,
  type StockStatus,
} from '../../../services/inventory.service';
import {
  createProduct,
  updateProduct,
  softDeleteProduct,
} from '../../../services/product.service';
import {
  uploadProductAsset,
  deleteFromR2,
  isR2Configured,
} from '../../../services/r2-storage.service';
import { createStockAdjustmentSchema } from '../../../utils/validation/inventory';
import {
  createProductSchema,
  updateProductSchema,
  createProductDocumentSchema,
  createProductImageSchema,
  updateProductImageSchema,
  createCrossReferenceSchema,
  updateCrossReferenceSchema,
} from '../../../utils/validation/products';
import {
  addBomComponentSchema,
  updateBomComponentSchema,
  checkBomStockQuerySchema,
  explodeBomQuerySchema,
} from '../../../utils/validation/bom';
import {
  getBom,
  addBomComponent,
  updateBomComponent,
  removeBomComponent,
  explodeBom,
  checkBomStock,
  getWhereUsed,
  copyBom,
} from '../../../services/bom.service';
import { Warehouse } from '@prisma/client';
import type { CustomerTier, ProductDocumentType } from '@prisma/client';

// Configure multer for memory storage (files go to R2)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
});

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

    // Parse warehouseId filter for per-warehouse stock data
    const warehouseFilter = typeof warehouseId === 'string' && ['JHB', 'CT'].includes(warehouseId.toUpperCase())
      ? (warehouseId.toUpperCase() as 'JHB' | 'CT')
      : null;

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
          productImages: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true, thumbnailUrl: true },
          },
        },
        orderBy,
        skip,
        take,
      }),
    ]);

    // Fetch stock summaries if needed (optionally filtered by warehouse)
    let stockSummaryMap = new Map<string, { totalOnHand: number; totalAvailable: number; status: StockStatus }>();
    if (needStockData && products.length > 0) {
      const productIds = products.map((p) => p.id);
      stockSummaryMap = await getProductsStockSummary(productIds, warehouseFilter);
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

      // Get primary image if available
      const primaryImage = product.productImages && product.productImages.length > 0
        ? { url: product.productImages[0].url, thumbnailUrl: product.productImages[0].thumbnailUrl }
        : null;

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
        // Publishing status
        isPublished: product.isPublished,
        publishedAt: product.publishedAt,
        // Primary image for thumbnail
        primaryImage,
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
 *   - include: comma-separated list of facets (inventory, movements, documents, images, crossReferences)
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
    const includeDocuments = includes.has('documents');
    const includeImages = includes.has('images');
    const includeCrossReferences = includes.has('crossreferences');

    // Check if this is the /price endpoint (handled separately)
    if (id === 'price') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'Use GET /products/:id/price for pricing' },
      });
    }

    // Parallel fetch: product, company tier, global settings, and optional inventory/movements
    const [product, company, globalSettings, inventoryResult, movementsResult] = await Promise.all([
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
          ...(includeDocuments && {
            productDocuments: {
              where: { isActive: true },
              orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
              select: {
                id: true,
                type: true,
                name: true,
                fileName: true,
                fileUrl: true,
                fileSize: true,
                mimeType: true,
                sortOrder: true,
              },
            },
          }),
          ...(includeImages && {
            productImages: {
              orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
              select: {
                id: true,
                url: true,
                thumbnailUrl: true,
                altText: true,
                caption: true,
                isPrimary: true,
                sortOrder: true,
              },
            },
          }),
          ...(includeCrossReferences && {
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
          }),
        },
      }),
      prisma.company.findUnique({
        where: { id: authReq.user.companyId },
        select: { tier: true },
      }),
      prisma.globalSettings.findUnique({
        where: { id: 'global' },
        select: { eurZarRate: true },
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

    // Calculate landed cost using correct formula:
    // Step 1: Apply discount if isGross (Net Price = Cost × (1 - Discount%))
    // Step 2: Convert to ZAR (ZAR Value = Net Price × EUR/ZAR)
    // Step 3: Add freight (Landed Cost = ZAR Value × (1 + Freight%))
    const eurZarRate = globalSettings?.eurZarRate ? Number(globalSettings.eurZarRate) : null;
    const costPrice = product.costPrice ? Number(product.costPrice) : null;
    let landedCost: number | null = null;

    if (costPrice && eurZarRate && product.supplierId && product.categoryId) {
      // Fetch pricing rule to get discount, freight, and isGross
      const pricingRule = await prisma.pricingRule.findFirst({
        where: {
          supplierId: product.supplierId,
          categoryId: product.categoryId,
          // Try exact match with subcategory first, or null for category-level rule
          OR: [
            { subCategoryId: product.subCategoryId },
            { subCategoryId: null },
          ],
        },
        orderBy: {
          // Prefer subcategory-specific rule over category-level rule
          subCategoryId: 'desc',
        },
        select: {
          freightPercent: true,
          discountPercent: true,
          isGross: true,
        },
      });

      const freightPercent = pricingRule?.freightPercent ? Number(pricingRule.freightPercent) : 0;
      const discountPercent = pricingRule?.discountPercent ? Number(pricingRule.discountPercent) : 0;
      const isGross = pricingRule?.isGross ?? false;

      // Step 1: Apply discount if gross price
      let netPrice = costPrice;
      if (isGross && discountPercent > 0) {
        netPrice = costPrice * (1 - discountPercent / 100);
      }

      // Step 2: Convert to ZAR
      const zarValue = netPrice * eurZarRate;

      // Step 3: Add freight
      landedCost = Math.round(zarValue * (1 + freightPercent / 100) * 100) / 100;
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

      // Pricing fields (raw + calculated)
      costPrice,  // Raw supplier cost in EUR
      landedCost, // Calculated: Supplier EUR × EUR/ZAR × (1 + Freight%)
      listPrice,  // Base selling price in ZAR

      // Foreign keys for edit form
      supplierId: product.supplierId,
      categoryId: product.categoryId,
      subCategoryId: product.subCategoryId,

      // Classification
      productType: product.productType,
      assemblyLeadDays: product.assemblyLeadDays,
      isConfigurable: product.isConfigurable,

      // Extended info
      longDescription: product.longDescription,
      weight: product.weight ? Number(product.weight) : null,
      dimensionsJson: product.dimensionsJson,
      imageUrl: product.imageUrl,

      // Status
      isActive: product.isActive,

      // Inventory defaults at root level (matches frontend ProductWithInventory type)
      defaultReorderPoint: product.defaultReorderPoint,
      defaultReorderQty: product.defaultReorderQty,
      defaultMinStock: product.defaultMinStock,
      defaultMaxStock: product.defaultMaxStock,
      leadTimeDays: product.leadTimeDays,
    };

    // Add inventory if requested (transform to match frontend ProductInventory type)
    if (includeInventory) {
      if (inventoryResult) {
        responseData.inventory = {
          onHand: inventoryResult.totalOnHand,
          available: inventoryResult.totalAvailable,
          reserved: inventoryResult.totalReserved,
          onOrder: inventoryResult.totalOnOrder,
          stockStatus: inventoryResult.status,
          byLocation: inventoryResult.byLocation,
        };
      } else {
        // No inventory record = zero quantities
        responseData.inventory = {
          onHand: 0,
          available: 0,
          reserved: 0,
          onOrder: 0,
          stockStatus: 'OUT_OF_STOCK',
          byLocation: [],
        };
      }
    }

    // Add movements if requested (field name matches frontend type)
    if (includeMovements) {
      responseData.movements = movementsResult?.movements ?? [];
    }

    // Add documents if requested
    if (includeDocuments && 'productDocuments' in product) {
      responseData.documents = product.productDocuments;
    }

    // Add images if requested
    if (includeImages && 'productImages' in product) {
      responseData.images = product.productImages;
    }

    // Add cross-references if requested
    if (includeCrossReferences && 'crossReferences' in product) {
      responseData.crossReferences = product.crossReferences;
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
 * POST /api/v1/products
 * Create a new product manually (admin only)
 */
router.post('/', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // Validate request body
    const bodyResult = createProductSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: bodyResult.error.errors,
        },
      });
    }

    const result = await createProduct(bodyResult.data, authReq.user.id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'CREATE_FAILED', message: result.error },
      });
    }

    return res.status(201).json({
      success: true,
      data: result.product,
    });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PRODUCT_CREATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create product',
      },
    });
  }
});

/**
 * PATCH /api/v1/products/:id
 * Update a product (admin only)
 * Supports all product fields including pricing, classification, and inventory defaults
 */
router.patch('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    // Validate request body
    const bodyResult = updateProductSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: bodyResult.error.errors,
        },
      });
    }

    const result = await updateProduct(id, bodyResult.data, authReq.user.id);

    if (!result.success) {
      const statusCode = result.error === 'Product not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: { code: statusCode === 404 ? 'NOT_FOUND' : 'UPDATE_FAILED', message: result.error },
      });
    }

    return res.json({
      success: true,
      data: result.product,
    });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PRODUCT_UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update product',
      },
    });
  }
});

/**
 * DELETE /api/v1/products/:id
 * Soft delete a product (admin only)
 */
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    const result = await softDeleteProduct(id, authReq.user.id);

    if (!result.success) {
      const statusCode = result.error === 'Product not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: { code: statusCode === 404 ? 'NOT_FOUND' : 'DELETE_FAILED', message: result.error },
      });
    }

    return res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PRODUCT_DELETE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete product',
      },
    });
  }
});

/**
 * POST /api/v1/products/:id/publish
 * Publish a product to the website (admin only)
 * Sets isPublished=true and publishedAt=now
 */
router.post('/:id/publish', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check product exists
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, isActive: true, deletedAt: true, isPublished: true },
    });

    if (!product || !product.isActive || product.deletedAt) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    if (product.isPublished) {
      return res.status(400).json({
        success: false,
        error: { code: 'ALREADY_PUBLISHED', message: 'Product is already published' },
      });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        isPublished: true,
        publishedAt: new Date(),
      },
      select: {
        id: true,
        nusafSku: true,
        isPublished: true,
        publishedAt: true,
      },
    });

    return res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Publish product error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PUBLISH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to publish product',
      },
    });
  }
});

/**
 * POST /api/v1/products/:id/unpublish
 * Unpublish a product from the website (admin only)
 * Sets isPublished=false
 */
router.post('/:id/unpublish', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check product exists
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, isActive: true, deletedAt: true, isPublished: true },
    });

    if (!product || !product.isActive || product.deletedAt) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    if (!product.isPublished) {
      return res.status(400).json({
        success: false,
        error: { code: 'ALREADY_UNPUBLISHED', message: 'Product is already unpublished' },
      });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        isPublished: false,
      },
      select: {
        id: true,
        nusafSku: true,
        isPublished: true,
        publishedAt: true,
      },
    });

    return res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Unpublish product error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'UNPUBLISH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to unpublish product',
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

// ============================================
// NESTED STOCK ROUTES (Product Context)
// ============================================

/**
 * GET /api/v1/products/:productId/stock
 * Get stock levels for a product (unified inventory view)
 */
router.get('/:productId/stock', authenticate, requireRole('ADMIN', 'MANAGER', 'SALES'), async (req, res) => {
  try {
    const { productId } = req.params;

    const inventory = await getProductInventorySummary(productId);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    return res.json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    console.error('Get product stock error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PRODUCT_STOCK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch product stock',
      },
    });
  }
});

/**
 * GET /api/v1/products/:productId/stock/movements
 * Get movement history for a product
 */
router.get('/:productId/stock/movements', authenticate, requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { productId } = req.params;
    const location = req.query.location as Warehouse | undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(100, parseInt(req.query.pageSize as string) || 20);

    if (location && !['JHB', 'CT'].includes(location)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid location' },
      });
    }

    const result = await getProductMovementHistory(productId, {
      location,
      startDate,
      endDate,
      page,
      pageSize,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get product movements error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PRODUCT_MOVEMENTS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch product movements',
      },
    });
  }
});

/**
 * GET /api/v1/products/:productId/stock/reservations
 * Get active reservations for a product
 */
router.get('/:productId/stock/reservations', authenticate, requireRole('ADMIN', 'MANAGER', 'SALES'), async (req, res) => {
  try {
    const { productId } = req.params;
    const location = req.query.location as Warehouse | undefined;

    if (location && !['JHB', 'CT'].includes(location)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid location' },
      });
    }

    const reservations = await getProductReservations(productId, location);

    return res.json({
      success: true,
      data: { reservations },
    });
  } catch (error) {
    console.error('Get product reservations error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PRODUCT_RESERVATIONS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch product reservations',
      },
    });
  }
});

/**
 * GET /api/v1/products/:productId/stock/adjustments
 * List stock adjustments that include this product
 */
router.get('/:productId/stock/adjustments', authenticate, requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(100, parseInt(req.query.pageSize as string) || 20);

    // Query adjustments that have lines for this product
    const [total, adjustments] = await Promise.all([
      prisma.stockAdjustment.count({
        where: {
          lines: { some: { productId } },
        },
      }),
      prisma.stockAdjustment.findMany({
        where: {
          lines: { some: { productId } },
        },
        include: {
          lines: {
            where: { productId },
            select: {
              id: true,
              lineNumber: true,
              productSku: true,
              productDescription: true,
              currentQuantity: true,
              adjustedQuantity: true,
              difference: true,
              notes: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return res.json({
      success: true,
      data: {
        adjustments: adjustments.map((adj) => ({
          id: adj.id,
          adjustmentNumber: adj.adjustmentNumber,
          location: adj.location,
          reason: adj.reason,
          status: adj.status,
          notes: adj.notes,
          createdAt: adj.createdAt,
          createdBy: adj.createdBy,
          approvedAt: adj.approvedAt,
          rejectedAt: adj.rejectedAt,
          lines: adj.lines,
        })),
        pagination: {
          page,
          pageSize,
          totalItems: total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('Get product adjustments error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PRODUCT_ADJUSTMENTS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch product adjustments',
      },
    });
  }
});

/**
 * POST /api/v1/products/:productId/stock/adjustments
 * Create a stock adjustment for this product
 */
router.post('/:productId/stock/adjustments', authenticate, requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { productId } = req.params;

    // Validate request body
    const bodyResult = createStockAdjustmentSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: bodyResult.error.errors,
        },
      });
    }

    // Ensure all lines reference the correct product (or add the product to lines)
    const adjustmentData = {
      ...bodyResult.data,
      lines: bodyResult.data.lines.map((line) => ({
        ...line,
        productId, // Override with the URL productId
      })),
    };

    const result = await createStockAdjustment(adjustmentData, authReq.user.id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'ADJUSTMENT_CREATE_FAILED', message: result.error },
      });
    }

    return res.status(201).json({
      success: true,
      data: result.adjustment,
    });
  } catch (error) {
    console.error('Create product adjustment error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PRODUCT_ADJUSTMENT_CREATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create adjustment',
      },
    });
  }
});

// ============================================
// BOM (BILL OF MATERIALS) ROUTES
// ============================================

/**
 * GET /api/v1/products/:productId/bom
 * Get BOM components for a product
 * Query params:
 *   - include: 'exploded' to get flattened tree
 *   - quantity: multiplier for exploded view (default 1)
 *   - maxDepth: max recursion depth for exploded view (default 10)
 *   - includeOptional: include optional items in exploded view (default true)
 */
router.get('/:productId/bom', authenticate, async (req, res) => {
  try {
    const { productId } = req.params;
    const include = req.query.include as string | undefined;

    // Check if exploded view is requested
    if (include?.toLowerCase() === 'exploded') {
      const queryResult = explodeBomQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: queryResult.error.errors,
          },
        });
      }

      const { quantity, maxDepth, includeOptional } = queryResult.data;
      const result = await explodeBom(productId, quantity, { maxDepth, includeOptional });

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: result.error },
        });
      }

      return res.json({
        success: true,
        data: {
          productId,
          explodedComponents: result.data,
        },
      });
    }

    // Default: return direct BOM items
    const result = await getBom(productId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: result.error },
      });
    }

    return res.json({
      success: true,
      data: {
        productId,
        components: result.data,
      },
    });
  } catch (error) {
    console.error('Get BOM error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'BOM_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get BOM',
      },
    });
  }
});

/**
 * POST /api/v1/products/:productId/bom
 * Add a component to a product's BOM
 */
router.post('/:productId/bom', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { productId } = req.params;

    const bodyResult = addBomComponentSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: bodyResult.error.errors,
        },
      });
    }

    const result = await addBomComponent(productId, bodyResult.data, authReq.user.id);

    if (!result.success) {
      const statusCode = result.error?.includes('not found') ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: { code: 'BOM_ADD_FAILED', message: result.error },
      });
    }

    return res.status(201).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Add BOM component error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'BOM_ADD_ERROR',
        message: error instanceof Error ? error.message : 'Failed to add BOM component',
      },
    });
  }
});

/**
 * PATCH /api/v1/products/:productId/bom/:componentId
 * Update a BOM component
 */
router.patch('/:productId/bom/:componentId', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { productId, componentId } = req.params;

    const bodyResult = updateBomComponentSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: bodyResult.error.errors,
        },
      });
    }

    const result = await updateBomComponent(productId, componentId, bodyResult.data, authReq.user.id);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: result.error },
      });
    }

    return res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Update BOM component error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'BOM_UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update BOM component',
      },
    });
  }
});

/**
 * DELETE /api/v1/products/:productId/bom/:componentId
 * Remove a component from BOM
 */
router.delete('/:productId/bom/:componentId', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { productId, componentId } = req.params;

    const result = await removeBomComponent(productId, componentId, authReq.user.id);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: result.error },
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Remove BOM component error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'BOM_DELETE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to remove BOM component',
      },
    });
  }
});

/**
 * GET /api/v1/products/:productId/bom/stock-check
 * Check stock availability for all BOM components
 */
router.get('/:productId/bom/stock-check', authenticate, async (req, res) => {
  try {
    const { productId } = req.params;

    const queryResult = checkBomStockQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: queryResult.error.errors,
        },
      });
    }

    const { quantity, warehouse } = queryResult.data;
    const result = await checkBomStock(productId, quantity, warehouse as Warehouse);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: result.error },
      });
    }

    return res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Check BOM stock error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'BOM_STOCK_CHECK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to check BOM stock',
      },
    });
  }
});

/**
 * GET /api/v1/products/:productId/where-used
 * Get products that use this as a component
 */
router.get('/:productId/where-used', authenticate, async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await getWhereUsed(productId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: result.error },
      });
    }

    return res.json({
      success: true,
      data: {
        productId,
        usedIn: result.data,
      },
    });
  } catch (error) {
    console.error('Get where used error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'WHERE_USED_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get where used',
      },
    });
  }
});

/**
 * POST /api/v1/products/:productId/bom/copy-from/:sourceId
 * Copy BOM from another product
 */
router.post('/:productId/bom/copy-from/:sourceId', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { productId, sourceId } = req.params;

    const result = await copyBom(productId, sourceId, authReq.user.id);

    if (!result.success) {
      const statusCode = result.error?.includes('not found') ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: { code: 'BOM_COPY_FAILED', message: result.error },
      });
    }

    return res.status(201).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Copy BOM error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'BOM_COPY_ERROR',
        message: error instanceof Error ? error.message : 'Failed to copy BOM',
      },
    });
  }
});

// ============================================
// PRODUCT DOCUMENTS ROUTES
// ============================================

/**
 * GET /api/v1/products/:productId/documents
 * List documents for a product (public - no auth required)
 */
router.get('/:productId/documents', async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isActive: true, deletedAt: true },
    });

    if (!product || !product.isActive || product.deletedAt) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    const documents = await prisma.productDocument.findMany({
      where: { productId, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        type: true,
        name: true,
        fileName: true,
        fileUrl: true,
        fileSize: true,
        mimeType: true,
        sortOrder: true,
        createdAt: true,
      },
    });

    return res.json({
      success: true,
      data: { documents },
    });
  } catch (error) {
    console.error('Get product documents error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DOCUMENTS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch documents',
      },
    });
  }
});

/**
 * POST /api/v1/products/:productId/documents
 * Upload a document for a product (admin only)
 */
router.post(
  '/:productId/documents',
  authenticate,
  requireRole('ADMIN'),
  upload.single('file'),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { productId } = req.params;

      if (!isR2Configured()) {
        return res.status(503).json({
          success: false,
          error: { code: 'STORAGE_NOT_CONFIGURED', message: 'File storage is not configured' },
        });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'File is required' },
        });
      }

      // Validate metadata
      const bodyResult = createProductDocumentSchema.safeParse({
        type: req.body.type,
        name: req.body.name,
        sortOrder: req.body.sortOrder ? parseInt(req.body.sortOrder, 10) : undefined,
      });

      if (!bodyResult.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: bodyResult.error.errors,
          },
        });
      }

      // Verify product exists
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, isActive: true, deletedAt: true },
      });

      if (!product || !product.isActive || product.deletedAt) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Product not found' },
        });
      }

      // Upload to R2
      const { key, url } = await uploadProductAsset(
        'document',
        productId,
        file.originalname,
        file.buffer,
        file.mimetype
      );

      // Create document record
      const document = await prisma.productDocument.create({
        data: {
          productId,
          type: bodyResult.data.type as ProductDocumentType,
          name: bodyResult.data.name,
          fileName: file.originalname,
          fileKey: key,
          fileUrl: url,
          fileSize: file.size,
          mimeType: file.mimetype,
          sortOrder: bodyResult.data.sortOrder ?? 0,
          createdBy: authReq.user.id,
        },
      });

      return res.status(201).json({
        success: true,
        data: document,
      });
    } catch (error) {
      console.error('Upload product document error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DOCUMENT_UPLOAD_ERROR',
          message: error instanceof Error ? error.message : 'Failed to upload document',
        },
      });
    }
  }
);

/**
 * DELETE /api/v1/products/:productId/documents/:documentId
 * Delete a document (admin only)
 */
router.delete('/:productId/documents/:documentId', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { productId, documentId } = req.params;

    const document = await prisma.productDocument.findFirst({
      where: { id: documentId, productId },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found' },
      });
    }

    // Delete from R2
    try {
      await deleteFromR2(document.fileKey);
    } catch (r2Error) {
      console.error('R2 delete error (continuing):', r2Error);
    }

    // Delete record
    await prisma.productDocument.delete({
      where: { id: documentId },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Delete product document error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DOCUMENT_DELETE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete document',
      },
    });
  }
});

// ============================================
// PRODUCT IMAGES ROUTES
// ============================================

/**
 * GET /api/v1/products/:productId/images
 * List images for a product (public - no auth required)
 */
router.get('/:productId/images', async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isActive: true, deletedAt: true },
    });

    if (!product || !product.isActive || product.deletedAt) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    const images = await prisma.productImage.findMany({
      where: { productId },
      orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        url: true,
        thumbnailUrl: true,
        altText: true,
        caption: true,
        isPrimary: true,
        sortOrder: true,
        createdAt: true,
      },
    });

    return res.json({
      success: true,
      data: { images },
    });
  } catch (error) {
    console.error('Get product images error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'IMAGES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch images',
      },
    });
  }
});

/**
 * POST /api/v1/products/:productId/images
 * Upload an image for a product (admin only)
 */
router.post(
  '/:productId/images',
  authenticate,
  requireRole('ADMIN'),
  upload.single('file'),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { productId } = req.params;

      if (!isR2Configured()) {
        return res.status(503).json({
          success: false,
          error: { code: 'STORAGE_NOT_CONFIGURED', message: 'File storage is not configured' },
        });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'File is required' },
        });
      }

      // Validate image mimetype
      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'File must be an image' },
        });
      }

      // Validate metadata
      const bodyResult = createProductImageSchema.safeParse({
        altText: req.body.altText || null,
        caption: req.body.caption || null,
        isPrimary: req.body.isPrimary === 'true',
        sortOrder: req.body.sortOrder ? parseInt(req.body.sortOrder, 10) : undefined,
      });

      if (!bodyResult.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: bodyResult.error.errors,
          },
        });
      }

      // Verify product exists
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, isActive: true, deletedAt: true },
      });

      if (!product || !product.isActive || product.deletedAt) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Product not found' },
        });
      }

      // Upload to R2
      const { key, url } = await uploadProductAsset(
        'image',
        productId,
        file.originalname,
        file.buffer,
        file.mimetype
      );

      // If this is set as primary, unset other primary images
      if (bodyResult.data.isPrimary) {
        await prisma.productImage.updateMany({
          where: { productId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      // Create image record
      const image = await prisma.productImage.create({
        data: {
          productId,
          fileKey: key,
          url,
          altText: bodyResult.data.altText,
          caption: bodyResult.data.caption,
          isPrimary: bodyResult.data.isPrimary ?? false,
          sortOrder: bodyResult.data.sortOrder ?? 0,
          createdBy: authReq.user.id,
        },
      });

      return res.status(201).json({
        success: true,
        data: image,
      });
    } catch (error) {
      console.error('Upload product image error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'IMAGE_UPLOAD_ERROR',
          message: error instanceof Error ? error.message : 'Failed to upload image',
        },
      });
    }
  }
);

/**
 * PATCH /api/v1/products/:productId/images/:imageId
 * Update image metadata (admin only)
 */
router.patch('/:productId/images/:imageId', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { productId, imageId } = req.params;

    const existingImage = await prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });

    if (!existingImage) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Image not found' },
      });
    }

    const bodyResult = updateProductImageSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: bodyResult.error.errors,
        },
      });
    }

    // If setting as primary, unset other primary images
    if (bodyResult.data.isPrimary) {
      await prisma.productImage.updateMany({
        where: { productId, isPrimary: true, id: { not: imageId } },
        data: { isPrimary: false },
      });
    }

    const image = await prisma.productImage.update({
      where: { id: imageId },
      data: bodyResult.data,
    });

    return res.json({
      success: true,
      data: image,
    });
  } catch (error) {
    console.error('Update product image error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'IMAGE_UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update image',
      },
    });
  }
});

/**
 * DELETE /api/v1/products/:productId/images/:imageId
 * Delete an image (admin only)
 */
router.delete('/:productId/images/:imageId', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { productId, imageId } = req.params;

    const image = await prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Image not found' },
      });
    }

    // Delete from R2
    try {
      await deleteFromR2(image.fileKey);
    } catch (r2Error) {
      console.error('R2 delete error (continuing):', r2Error);
    }

    // Delete record
    await prisma.productImage.delete({
      where: { id: imageId },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Delete product image error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'IMAGE_DELETE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete image',
      },
    });
  }
});

// ============================================
// PRODUCT CROSS-REFERENCES ROUTES
// ============================================

/**
 * GET /api/v1/products/:productId/cross-references
 * List cross-references for a product (public - no auth required)
 */
router.get('/:productId/cross-references', async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isActive: true, deletedAt: true },
    });

    if (!product || !product.isActive || product.deletedAt) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    const crossReferences = await prisma.competitorCrossReference.findMany({
      where: { productId },
      orderBy: [{ competitorBrand: 'asc' }, { competitorSku: 'asc' }],
      select: {
        id: true,
        competitorBrand: true,
        competitorSku: true,
        notes: true,
        isExact: true,
        createdAt: true,
      },
    });

    return res.json({
      success: true,
      data: { crossReferences },
    });
  } catch (error) {
    console.error('Get product cross-references error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CROSS_REFERENCES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch cross-references',
      },
    });
  }
});

/**
 * POST /api/v1/products/:productId/cross-references
 * Add a cross-reference to a product (admin only)
 */
router.post('/:productId/cross-references', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { productId } = req.params;

    const bodyResult = createCrossReferenceSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: bodyResult.error.errors,
        },
      });
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isActive: true, deletedAt: true },
    });

    if (!product || !product.isActive || product.deletedAt) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    // Check for duplicate
    const existing = await prisma.competitorCrossReference.findFirst({
      where: {
        productId,
        competitorBrand: bodyResult.data.competitorBrand,
        competitorSku: bodyResult.data.competitorSku,
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE', message: 'Cross-reference already exists' },
      });
    }

    const crossReference = await prisma.competitorCrossReference.create({
      data: {
        productId,
        competitorBrand: bodyResult.data.competitorBrand,
        competitorSku: bodyResult.data.competitorSku,
        notes: bodyResult.data.notes,
        isExact: bodyResult.data.isExact ?? false,
        createdBy: authReq.user.id,
      },
    });

    return res.status(201).json({
      success: true,
      data: crossReference,
    });
  } catch (error) {
    console.error('Create cross-reference error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CROSS_REFERENCE_CREATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create cross-reference',
      },
    });
  }
});

/**
 * PATCH /api/v1/products/:productId/cross-references/:refId
 * Update a cross-reference (admin only)
 */
router.patch('/:productId/cross-references/:refId', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { productId, refId } = req.params;

    const existing = await prisma.competitorCrossReference.findFirst({
      where: { id: refId, productId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Cross-reference not found' },
      });
    }

    const bodyResult = updateCrossReferenceSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: bodyResult.error.errors,
        },
      });
    }

    // Check for duplicate if competitorBrand or competitorSku is being changed
    if (bodyResult.data.competitorBrand || bodyResult.data.competitorSku) {
      const newBrand = bodyResult.data.competitorBrand ?? existing.competitorBrand;
      const newSku = bodyResult.data.competitorSku ?? existing.competitorSku;

      const duplicate = await prisma.competitorCrossReference.findFirst({
        where: {
          productId,
          competitorBrand: newBrand,
          competitorSku: newSku,
          id: { not: refId },
        },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE', message: 'Cross-reference with this brand and SKU already exists' },
        });
      }
    }

    const crossReference = await prisma.competitorCrossReference.update({
      where: { id: refId },
      data: bodyResult.data,
    });

    return res.json({
      success: true,
      data: crossReference,
    });
  } catch (error) {
    console.error('Update cross-reference error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CROSS_REFERENCE_UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update cross-reference',
      },
    });
  }
});

/**
 * DELETE /api/v1/products/:productId/cross-references/:refId
 * Delete a cross-reference (admin only)
 */
router.delete('/:productId/cross-references/:refId', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { productId, refId } = req.params;

    const existing = await prisma.competitorCrossReference.findFirst({
      where: { id: refId, productId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Cross-reference not found' },
      });
    }

    await prisma.competitorCrossReference.delete({
      where: { id: refId },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Delete cross-reference error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CROSS_REFERENCE_DELETE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete cross-reference',
      },
    });
  }
});

export default router;
