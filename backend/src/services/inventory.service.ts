import {
  Prisma,
  Warehouse,
  StockMovementType,
  StockAdjustmentReason,
  ReservationType,
} from '@prisma/client';
import { prisma } from '../config/database';
import type {
  StockLevelListQuery,
  StockMovementListQuery,
  CreateStockAdjustmentInput,
  StockAdjustmentListQuery,
} from '../utils/validation/inventory';

// ============================================
// STOCK STATUS TYPES AND HELPERS
// ============================================

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'ON_ORDER' | 'OVERSTOCK';

export const WAREHOUSE_NAMES: Record<Warehouse, string> = {
  JHB: 'Johannesburg',
  CT: 'Cape Town',
};

/**
 * Compute stock status for a single location
 * Uses location-specific reorder settings, falls back to product defaults
 */
export function computeStockStatus(params: {
  onHand: number;
  hardReserved: number;
  onOrder: number;
  reorderPoint: number | null;
  maximumStock: number | null;
  productDefaults?: {
    defaultReorderPoint: number | null;
    defaultMaxStock: number | null;
  };
}): StockStatus {
  const { onHand, hardReserved, onOrder, reorderPoint, maximumStock, productDefaults } = params;
  const available = onHand - hardReserved;

  // Use location override or fall back to product default
  const effectiveReorderPoint = reorderPoint ?? productDefaults?.defaultReorderPoint ?? 0;
  const effectiveMaxStock = maximumStock ?? productDefaults?.defaultMaxStock ?? null;

  // Priority order for status determination
  if (available <= 0 && onOrder > 0) return 'ON_ORDER';
  if (available <= 0) return 'OUT_OF_STOCK';
  if (effectiveMaxStock !== null && onHand > effectiveMaxStock) return 'OVERSTOCK';
  if (effectiveReorderPoint > 0 && available <= effectiveReorderPoint) return 'LOW_STOCK';
  return 'IN_STOCK';
}

/**
 * Compute aggregate stock status across all locations for a product
 */
export function computeProductStockStatus(params: {
  totalOnHand: number;
  totalAvailable: number;
  totalOnOrder: number;
  productDefaults?: {
    defaultReorderPoint: number | null;
    defaultMaxStock: number | null;
  };
}): StockStatus {
  const { totalOnHand, totalAvailable, totalOnOrder, productDefaults } = params;

  const effectiveReorderPoint = productDefaults?.defaultReorderPoint ?? 0;
  const effectiveMaxStock = productDefaults?.defaultMaxStock ?? null;

  // Priority order for status determination
  if (totalAvailable <= 0 && totalOnOrder > 0) return 'ON_ORDER';
  if (totalAvailable <= 0) return 'OUT_OF_STOCK';
  if (effectiveMaxStock !== null && totalOnHand > effectiveMaxStock) return 'OVERSTOCK';
  if (effectiveReorderPoint > 0 && totalAvailable <= effectiveReorderPoint) return 'LOW_STOCK';
  return 'IN_STOCK';
}

/**
 * Get unified inventory summary for a product
 * Returns totals + byLocation array with all reorder settings
 * Products with no StockLevel records return zero quantities (not an error)
 */
export async function getProductInventorySummary(productId: string) {
  // Fetch product with stock levels
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      defaultReorderPoint: true,
      defaultReorderQty: true,
      defaultMinStock: true,
      defaultMaxStock: true,
      leadTimeDays: true,
      stockLevels: true,
    },
  });

  if (!product) {
    return null;
  }

  const stockLevels = product.stockLevels;

  // Calculate totals
  let totalOnHand = 0;
  let totalSoftReserved = 0;
  let totalHardReserved = 0;
  let totalOnOrder = 0;

  for (const sl of stockLevels) {
    totalOnHand += sl.onHand;
    totalSoftReserved += sl.softReserved;
    totalHardReserved += sl.hardReserved;
    totalOnOrder += sl.onOrder;
  }

  const totalAvailable = totalOnHand - totalHardReserved;
  const totalReserved = totalSoftReserved + totalHardReserved;

  // Calculate aggregate status
  const status = computeProductStockStatus({
    totalOnHand,
    totalAvailable,
    totalOnOrder,
    productDefaults: product,
  });

  // Build byLocation array from existing stock levels
  const byLocation: Array<{
    warehouseId: Warehouse;
    warehouseName: string;
    onHand: number;
    available: number;
    softReserved: number;
    hardReserved: number;
    onOrder: number;
    reorderPoint: number | null;
    reorderQuantity: number | null;
    minimumStock: number | null;
    maximumStock: number | null;
    stockStatus: StockStatus;
  }> = stockLevels.map((sl) => {
    const available = sl.onHand - sl.hardReserved;
    const locationStatus = computeStockStatus({
      onHand: sl.onHand,
      hardReserved: sl.hardReserved,
      onOrder: sl.onOrder,
      reorderPoint: sl.reorderPoint,
      maximumStock: sl.maximumStock,
      productDefaults: product,
    });

    return {
      warehouseId: sl.location,
      warehouseName: WAREHOUSE_NAMES[sl.location],
      onHand: sl.onHand,
      available,
      softReserved: sl.softReserved,
      hardReserved: sl.hardReserved,
      onOrder: sl.onOrder,
      reorderPoint: sl.reorderPoint,
      reorderQuantity: sl.reorderQuantity,
      minimumStock: sl.minimumStock,
      maximumStock: sl.maximumStock,
      stockStatus: locationStatus,
    };
  });

  // Ensure both warehouses are always present (for admin/manager views)
  const ALL_WAREHOUSES: Warehouse[] = ['JHB', 'CT'];
  const existingWarehouses = new Set(byLocation.map((loc) => loc.warehouseId));

  for (const warehouse of ALL_WAREHOUSES) {
    if (!existingWarehouses.has(warehouse)) {
      // Add missing warehouse with zero values
      const emptyStatus = computeStockStatus({
        onHand: 0,
        hardReserved: 0,
        onOrder: 0,
        reorderPoint: null,
        maximumStock: null,
        productDefaults: product,
      });

      byLocation.push({
        warehouseId: warehouse,
        warehouseName: WAREHOUSE_NAMES[warehouse],
        onHand: 0,
        available: 0,
        softReserved: 0,
        hardReserved: 0,
        onOrder: 0,
        reorderPoint: null,
        reorderQuantity: null,
        minimumStock: null,
        maximumStock: null,
        stockStatus: emptyStatus,
      });
    }
  }

  // Sort with JHB (primary warehouse) first, then others alphabetically
  const WAREHOUSE_ORDER: Record<string, number> = { JHB: 0, CT: 1 };
  byLocation.sort(
    (a, b) =>
      (WAREHOUSE_ORDER[a.warehouseId] ?? 99) - (WAREHOUSE_ORDER[b.warehouseId] ?? 99)
  );

  return {
    totalOnHand,
    totalAvailable,
    totalReserved,
    totalOnOrder,
    status,
    byLocation,
    // Include product-level defaults for reference
    defaults: {
      reorderPoint: product.defaultReorderPoint,
      reorderQty: product.defaultReorderQty,
      minStock: product.defaultMinStock,
      maxStock: product.defaultMaxStock,
      leadTimeDays: product.leadTimeDays,
    },
  };
}

/**
 * Get stock summary for multiple products (for product list with stockSummary)
 * Returns a map of productId -> { totalOnHand, totalAvailable, status }
 */
export async function getProductsStockSummary(
  productIds: string[],
  warehouseId?: 'JHB' | 'CT' | null
) {
  if (productIds.length === 0) {
    return new Map<string, { totalOnHand: number; totalAvailable: number; status: StockStatus }>();
  }

  // Build where clause - optionally filter by warehouse (using 'location' field)
  const where: { productId: { in: string[] }; location?: 'JHB' | 'CT' } = {
    productId: { in: productIds },
  };
  if (warehouseId) {
    where.location = warehouseId;
  }

  // Fetch stock levels for the given products (optionally filtered by warehouse)
  const stockLevels = await prisma.stockLevel.findMany({
    where,
    include: {
      product: {
        select: {
          id: true,
          defaultReorderPoint: true,
          defaultMaxStock: true,
        },
      },
    },
  });

  // Group by productId and calculate totals
  const summaryMap = new Map<string, { totalOnHand: number; totalAvailable: number; totalOnOrder: number; product: { defaultReorderPoint: number | null; defaultMaxStock: number | null } }>();

  for (const sl of stockLevels) {
    const existing = summaryMap.get(sl.productId);
    if (existing) {
      existing.totalOnHand += sl.onHand;
      existing.totalAvailable += sl.onHand - sl.hardReserved;
      existing.totalOnOrder += sl.onOrder;
    } else {
      summaryMap.set(sl.productId, {
        totalOnHand: sl.onHand,
        totalAvailable: sl.onHand - sl.hardReserved,
        totalOnOrder: sl.onOrder,
        product: sl.product,
      });
    }
  }

  // Convert to final result with status
  const result = new Map<string, { totalOnHand: number; totalAvailable: number; status: StockStatus }>();

  // Include all requested products (even those without stock records)
  for (const productId of productIds) {
    const summary = summaryMap.get(productId);
    if (summary) {
      const status = computeProductStockStatus({
        totalOnHand: summary.totalOnHand,
        totalAvailable: summary.totalAvailable,
        totalOnOrder: summary.totalOnOrder,
        productDefaults: summary.product,
      });
      result.set(productId, {
        totalOnHand: summary.totalOnHand,
        totalAvailable: summary.totalAvailable,
        status,
      });
    } else {
      // No stock records = zero quantities, OUT_OF_STOCK
      result.set(productId, {
        totalOnHand: 0,
        totalAvailable: 0,
        status: 'OUT_OF_STOCK',
      });
    }
  }

  return result;
}

// ============================================
// STOCK LEVEL FUNCTIONS
// ============================================

/**
 * Get stock level for a product at a specific location
 */
export async function getStockLevel(productId: string, location: Warehouse) {
  const stockLevel = await prisma.stockLevel.findUnique({
    where: {
      productId_location: { productId, location },
    },
    include: {
      product: {
        select: {
          id: true,
          nusafSku: true,
          description: true,
          unitOfMeasure: true,
          defaultReorderPoint: true,
          defaultReorderQty: true,
          defaultMinStock: true,
          defaultMaxStock: true,
        },
      },
    },
  });

  if (!stockLevel) {
    return null;
  }

  const available = stockLevel.onHand - stockLevel.hardReserved;
  const stockStatus = computeStockStatus({
    onHand: stockLevel.onHand,
    hardReserved: stockLevel.hardReserved,
    onOrder: stockLevel.onOrder,
    reorderPoint: stockLevel.reorderPoint,
    maximumStock: stockLevel.maximumStock,
    productDefaults: stockLevel.product,
  });

  return {
    id: stockLevel.id,
    productId: stockLevel.productId,
    product: stockLevel.product,
    location: stockLevel.location,
    onHand: stockLevel.onHand,
    softReserved: stockLevel.softReserved,
    hardReserved: stockLevel.hardReserved,
    onOrder: stockLevel.onOrder,
    available,
    reorderPoint: stockLevel.reorderPoint,
    reorderQuantity: stockLevel.reorderQuantity,
    minimumStock: stockLevel.minimumStock,
    maximumStock: stockLevel.maximumStock,
    stockStatus,
    updatedAt: stockLevel.updatedAt,
  };
}

/**
 * Get stock levels for a product across all locations
 */
export async function getProductStockAcrossLocations(productId: string) {
  const stockLevels = await prisma.stockLevel.findMany({
    where: { productId },
    include: {
      product: {
        select: {
          id: true,
          nusafSku: true,
          description: true,
          unitOfMeasure: true,
          defaultReorderPoint: true,
          defaultReorderQty: true,
          defaultMinStock: true,
          defaultMaxStock: true,
        },
      },
    },
  });

  return stockLevels.map((sl) => {
    const available = sl.onHand - sl.hardReserved;
    const stockStatus = computeStockStatus({
      onHand: sl.onHand,
      hardReserved: sl.hardReserved,
      onOrder: sl.onOrder,
      reorderPoint: sl.reorderPoint,
      maximumStock: sl.maximumStock,
      productDefaults: sl.product,
    });

    return {
      id: sl.id,
      productId: sl.productId,
      product: sl.product,
      location: sl.location,
      onHand: sl.onHand,
      softReserved: sl.softReserved,
      hardReserved: sl.hardReserved,
      onOrder: sl.onOrder,
      available,
      reorderPoint: sl.reorderPoint,
      reorderQuantity: sl.reorderQuantity,
      minimumStock: sl.minimumStock,
      maximumStock: sl.maximumStock,
      stockStatus,
      updatedAt: sl.updatedAt,
    };
  });
}

/**
 * Get paginated list of stock levels with filtering
 */
export async function getStockLevels(options: StockLevelListQuery) {
  const { location, categoryId, lowStockOnly, search, page, pageSize } = options;

  const where: Prisma.StockLevelWhereInput = {};

  if (location) {
    where.location = location;
  }

  // Build product filter
  const productFilter: Prisma.ProductWhereInput = {};

  if (categoryId) {
    productFilter.categoryId = categoryId;
  }

  if (search) {
    productFilter.OR = [
      { nusafSku: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (Object.keys(productFilter).length > 0) {
    where.product = productFilter;
  }

  // Build the query - we'll filter lowStock in post-processing since it's a computed field
  const [total, stockLevels] = await Promise.all([
    prisma.stockLevel.count({ where }),
    prisma.stockLevel.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            nusafSku: true,
            description: true,
            unitOfMeasure: true,
            category: { select: { id: true, name: true } },
            defaultReorderPoint: true,
            defaultReorderQty: true,
            defaultMinStock: true,
            defaultMaxStock: true,
          },
        },
      },
      orderBy: [{ product: { nusafSku: 'asc' } }],
      skip: (page - 1) * pageSize,
      take: lowStockOnly ? pageSize * 3 : pageSize, // Fetch more if filtering
    }),
  ]);

  let results = stockLevels.map((sl) => {
    const available = sl.onHand - sl.hardReserved;
    const stockStatus = computeStockStatus({
      onHand: sl.onHand,
      hardReserved: sl.hardReserved,
      onOrder: sl.onOrder,
      reorderPoint: sl.reorderPoint,
      maximumStock: sl.maximumStock,
      productDefaults: sl.product,
    });

    return {
      id: sl.id,
      productId: sl.productId,
      product: sl.product,
      location: sl.location,
      onHand: sl.onHand,
      softReserved: sl.softReserved,
      hardReserved: sl.hardReserved,
      onOrder: sl.onOrder,
      available,
      reorderPoint: sl.reorderPoint,
      reorderQuantity: sl.reorderQuantity,
      minimumStock: sl.minimumStock,
      maximumStock: sl.maximumStock,
      stockStatus,
      updatedAt: sl.updatedAt,
    };
  });

  // Filter for low stock if requested
  let filteredTotal = total;
  if (lowStockOnly) {
    const filtered = results.filter((r) => r.stockStatus === 'LOW_STOCK' || r.stockStatus === 'OUT_OF_STOCK');
    filteredTotal = filtered.length; // Count BEFORE slicing
    results = filtered.slice(0, pageSize);
  }

  return {
    stockLevels: results,
    pagination: {
      page,
      pageSize,
      totalItems: lowStockOnly ? filteredTotal : total,
      totalPages: Math.ceil((lowStockOnly ? filteredTotal : total) / pageSize),
    },
  };
}

/**
 * Get low stock products (where status is LOW_STOCK or OUT_OF_STOCK)
 */
export async function getLowStockProducts(location?: Warehouse) {
  const where: Prisma.StockLevelWhereInput = {};

  if (location) {
    where.location = location;
  }

  const stockLevels = await prisma.stockLevel.findMany({
    where,
    include: {
      product: {
        select: {
          id: true,
          nusafSku: true,
          description: true,
          unitOfMeasure: true,
          category: { select: { id: true, name: true } },
          defaultReorderPoint: true,
          defaultReorderQty: true,
          defaultMinStock: true,
          defaultMaxStock: true,
        },
      },
    },
    orderBy: { product: { nusafSku: 'asc' } },
  });

  // Filter for low stock status
  return stockLevels
    .map((sl) => {
      const available = sl.onHand - sl.hardReserved;
      const stockStatus = computeStockStatus({
        onHand: sl.onHand,
        hardReserved: sl.hardReserved,
        onOrder: sl.onOrder,
        reorderPoint: sl.reorderPoint,
        maximumStock: sl.maximumStock,
        productDefaults: sl.product,
      });
      const effectiveReorderPoint = sl.reorderPoint ?? sl.product.defaultReorderPoint ?? 0;

      return {
        id: sl.id,
        productId: sl.productId,
        product: sl.product,
        location: sl.location,
        onHand: sl.onHand,
        available,
        reorderPoint: sl.reorderPoint,
        reorderQuantity: sl.reorderQuantity,
        minimumStock: sl.minimumStock,
        stockStatus,
        shortfall: effectiveReorderPoint > 0 ? Math.max(0, effectiveReorderPoint - available) : 0,
      };
    })
    .filter((sl) => sl.stockStatus === 'LOW_STOCK' || sl.stockStatus === 'OUT_OF_STOCK');
}

/**
 * Internal: Update stock level (creates if doesn't exist)
 */
export async function updateStockLevel(
  tx: Prisma.TransactionClient,
  productId: string,
  location: Warehouse,
  delta: {
    onHand?: number;
    softReserved?: number;
    hardReserved?: number;
    onOrder?: number;
  },
  userId: string
): Promise<{ onHand: number; softReserved: number; hardReserved: number; onOrder: number }> {
  // Get or create stock level
  let stockLevel = await tx.stockLevel.findUnique({
    where: { productId_location: { productId, location } },
  });

  if (!stockLevel) {
    stockLevel = await tx.stockLevel.create({
      data: {
        productId,
        location,
        onHand: 0,
        softReserved: 0,
        hardReserved: 0,
        onOrder: 0,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  const newOnHand = stockLevel.onHand + (delta.onHand ?? 0);
  const newSoftReserved = stockLevel.softReserved + (delta.softReserved ?? 0);
  const newHardReserved = stockLevel.hardReserved + (delta.hardReserved ?? 0);
  const newOnOrder = stockLevel.onOrder + (delta.onOrder ?? 0);

  // Validate no negative values
  if (newOnHand < 0) {
    throw new Error(`Cannot reduce onHand below 0 (current: ${stockLevel.onHand}, delta: ${delta.onHand})`);
  }
  if (newSoftReserved < 0) {
    throw new Error(`Cannot reduce softReserved below 0`);
  }
  if (newHardReserved < 0) {
    throw new Error(`Cannot reduce hardReserved below 0`);
  }
  if (newOnOrder < 0) {
    throw new Error(`Cannot reduce onOrder below 0`);
  }

  await tx.stockLevel.update({
    where: { id: stockLevel.id },
    data: {
      onHand: newOnHand,
      softReserved: newSoftReserved,
      hardReserved: newHardReserved,
      onOrder: newOnOrder,
      updatedBy: userId,
    },
  });

  return {
    onHand: newOnHand,
    softReserved: newSoftReserved,
    hardReserved: newHardReserved,
    onOrder: newOnOrder,
  };
}

// ============================================
// STOCK MOVEMENT FUNCTIONS
// ============================================

/**
 * Internal: Create a stock movement record
 */
export async function createStockMovement(
  tx: Prisma.TransactionClient,
  data: {
    productId: string;
    location: Warehouse;
    movementType: StockMovementType;
    quantity: number;
    balanceAfter: number;
    referenceType?: string;
    referenceId?: string;
    referenceNumber?: string;
    adjustmentReason?: StockAdjustmentReason;
    notes?: string;
    createdBy: string;
  }
) {
  return tx.stockMovement.create({
    data: {
      productId: data.productId,
      location: data.location,
      movementType: data.movementType,
      quantity: data.quantity,
      balanceAfter: data.balanceAfter,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      referenceNumber: data.referenceNumber,
      adjustmentReason: data.adjustmentReason,
      notes: data.notes,
      createdBy: data.createdBy,
    },
  });
}

/**
 * Get paginated list of stock movements with filtering
 */
export async function getStockMovements(options: StockMovementListQuery) {
  const { location, movementType, productId, startDate, endDate, page, pageSize } = options;

  const where: Prisma.StockMovementWhereInput = {};

  if (location) {
    where.location = location;
  }

  if (movementType) {
    where.movementType = movementType;
  }

  if (productId) {
    where.productId = productId;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      where.createdAt.lte = endDate;
    }
  }

  const [total, movements] = await Promise.all([
    prisma.stockMovement.count({ where }),
    prisma.stockMovement.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            nusafSku: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    movements: movements.map((m) => ({
      id: m.id,
      productId: m.productId,
      product: m.product,
      location: m.location,
      movementType: m.movementType,
      quantity: m.quantity,
      balanceAfter: m.balanceAfter,
      referenceType: m.referenceType,
      referenceId: m.referenceId,
      referenceNumber: m.referenceNumber,
      adjustmentReason: m.adjustmentReason,
      notes: m.notes,
      createdAt: m.createdAt,
      createdBy: m.createdBy,
    })),
    pagination: {
      page,
      pageSize,
      totalItems: total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Get movement history for a specific product
 */
export async function getProductMovementHistory(
  productId: string,
  options?: {
    location?: Warehouse;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }
) {
  const { location, startDate, endDate, page = 1, pageSize = 20 } = options ?? {};

  const where: Prisma.StockMovementWhereInput = {
    productId,
  };

  if (location) {
    where.location = location;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      where.createdAt.lte = endDate;
    }
  }

  const [total, movements] = await Promise.all([
    prisma.stockMovement.count({ where }),
    prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    movements: movements.map((m) => ({
      id: m.id,
      productId: m.productId,
      warehouseId: m.location,
      warehouseName: WAREHOUSE_NAMES[m.location],
      type: m.movementType,
      quantity: m.quantity,
      referenceType: m.referenceType,
      referenceId: m.referenceId,
      notes: m.notes,
      createdAt: m.createdAt,
      createdBy: m.createdBy,
    })),
    pagination: {
      page,
      pageSize,
      totalItems: total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// ============================================
// STOCK ADJUSTMENT FUNCTIONS
// ============================================

/**
 * Generate the next adjustment number in format ADJ-YYYY-NNNNN
 */
export async function generateAdjustmentNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();

  const counter = await prisma.$transaction(async (tx) => {
    let counter = await tx.stockAdjustmentCounter.findUnique({
      where: { id: 'stock_adjustment_counter' },
    });

    if (!counter) {
      counter = await tx.stockAdjustmentCounter.create({
        data: {
          id: 'stock_adjustment_counter',
          year: currentYear,
          count: 1,
        },
      });
      return counter;
    }

    if (counter.year !== currentYear) {
      counter = await tx.stockAdjustmentCounter.update({
        where: { id: 'stock_adjustment_counter' },
        data: {
          year: currentYear,
          count: 1,
        },
      });
      return counter;
    }

    counter = await tx.stockAdjustmentCounter.update({
      where: { id: 'stock_adjustment_counter' },
      data: {
        count: { increment: 1 },
      },
    });

    return counter;
  });

  const paddedCount = counter.count.toString().padStart(5, '0');
  return `ADJ-${currentYear}-${paddedCount}`;
}

/**
 * Create a stock adjustment (pending approval)
 */
export async function createStockAdjustment(
  input: CreateStockAdjustmentInput,
  userId: string
): Promise<{ success: boolean; adjustment?: { id: string; adjustmentNumber: string }; error?: string }> {
  try {
    // Validate all products exist and get current quantities
    const productIds = input.lines.map((l) => l.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        deletedAt: null,
      },
      select: {
        id: true,
        nusafSku: true,
        description: true,
        stockLevels: {
          where: { location: input.location },
          select: { onHand: true },
        },
      },
    });

    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missingIds = productIds.filter((id) => !foundIds.has(id));
      return { success: false, error: `Products not found: ${missingIds.join(', ')}` };
    }

    const adjustmentNumber = await generateAdjustmentNumber();

    const adjustment = await prisma.stockAdjustment.create({
      data: {
        adjustmentNumber,
        location: input.location,
        reason: input.reason,
        notes: input.notes,
        status: 'PENDING',
        createdBy: userId,
        lines: {
          create: input.lines.map((line, index) => {
            const product = products.find((p) => p.id === line.productId)!;
            const currentQty = product.stockLevels[0]?.onHand ?? 0;
            return {
              lineNumber: index + 1,
              productId: line.productId,
              productSku: product.nusafSku,
              productDescription: product.description,
              currentQuantity: currentQty,
              adjustedQuantity: line.adjustedQuantity,
              difference: line.adjustedQuantity - currentQty,
              notes: line.notes,
            };
          }),
        },
      },
    });

    return {
      success: true,
      adjustment: {
        id: adjustment.id,
        adjustmentNumber: adjustment.adjustmentNumber,
      },
    };
  } catch (error) {
    console.error('Create stock adjustment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create adjustment',
    };
  }
}

/**
 * Get stock adjustment by ID
 */
export async function getStockAdjustment(adjustmentId: string) {
  const adjustment = await prisma.stockAdjustment.findUnique({
    where: { id: adjustmentId },
    include: {
      lines: {
        orderBy: { lineNumber: 'asc' },
      },
    },
  });

  if (!adjustment) {
    return null;
  }

  return {
    id: adjustment.id,
    adjustmentNumber: adjustment.adjustmentNumber,
    location: adjustment.location,
    reason: adjustment.reason,
    notes: adjustment.notes,
    status: adjustment.status,
    lines: adjustment.lines.map((line) => ({
      id: line.id,
      lineNumber: line.lineNumber,
      productId: line.productId,
      productSku: line.productSku,
      productDescription: line.productDescription,
      currentQuantity: line.currentQuantity,
      adjustedQuantity: line.adjustedQuantity,
      difference: line.difference,
      notes: line.notes,
    })),
    approvedAt: adjustment.approvedAt,
    approvedBy: adjustment.approvedBy,
    rejectedAt: adjustment.rejectedAt,
    rejectedBy: adjustment.rejectedBy,
    rejectionReason: adjustment.rejectionReason,
    createdAt: adjustment.createdAt,
    createdBy: adjustment.createdBy,
    updatedAt: adjustment.updatedAt,
  };
}

/**
 * Get paginated list of stock adjustments
 */
export async function getStockAdjustments(options: StockAdjustmentListQuery) {
  const { location, status, reason, startDate, endDate, page, pageSize } = options;

  const where: Prisma.StockAdjustmentWhereInput = {};

  if (location) {
    where.location = location;
  }

  if (status) {
    where.status = status;
  }

  if (reason) {
    where.reason = reason;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      where.createdAt.lte = endDate;
    }
  }

  const [total, adjustments] = await Promise.all([
    prisma.stockAdjustment.count({ where }),
    prisma.stockAdjustment.findMany({
      where,
      include: {
        _count: { select: { lines: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    adjustments: adjustments.map((adj) => ({
      id: adj.id,
      adjustmentNumber: adj.adjustmentNumber,
      location: adj.location,
      reason: adj.reason,
      status: adj.status,
      lineCount: adj._count.lines,
      createdAt: adj.createdAt,
      createdBy: adj.createdBy,
      approvedAt: adj.approvedAt,
      rejectedAt: adj.rejectedAt,
    })),
    pagination: {
      page,
      pageSize,
      totalItems: total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Approve a stock adjustment - applies the changes to stock levels
 */
export async function approveStockAdjustment(
  adjustmentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const adjustment = await prisma.stockAdjustment.findUnique({
    where: { id: adjustmentId },
    include: { lines: true },
  });

  if (!adjustment) {
    return { success: false, error: 'Adjustment not found' };
  }

  if (adjustment.status !== 'PENDING') {
    return { success: false, error: `Cannot approve adjustment with status ${adjustment.status}` };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Update adjustment status
      await tx.stockAdjustment.update({
        where: { id: adjustmentId },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: userId,
          updatedBy: userId,
        },
      });

      // Apply each line's adjustment
      for (const line of adjustment.lines) {
        const delta = line.difference;
        const movementType: StockMovementType = delta >= 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT';

        // Update stock level
        const newLevel = await updateStockLevel(
          tx,
          line.productId,
          adjustment.location,
          { onHand: delta },
          userId
        );

        // Create movement record
        await createStockMovement(tx, {
          productId: line.productId,
          location: adjustment.location,
          movementType,
          quantity: Math.abs(delta),
          balanceAfter: newLevel.onHand,
          referenceType: 'StockAdjustment',
          referenceId: adjustment.id,
          referenceNumber: adjustment.adjustmentNumber,
          adjustmentReason: adjustment.reason,
          notes: line.notes ?? adjustment.notes ?? undefined,
          createdBy: userId,
        });
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Approve stock adjustment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve adjustment',
    };
  }
}

/**
 * Reject a stock adjustment
 */
export async function rejectStockAdjustment(
  adjustmentId: string,
  rejectionReason: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const adjustment = await prisma.stockAdjustment.findUnique({
    where: { id: adjustmentId },
  });

  if (!adjustment) {
    return { success: false, error: 'Adjustment not found' };
  }

  if (adjustment.status !== 'PENDING') {
    return { success: false, error: `Cannot reject adjustment with status ${adjustment.status}` };
  }

  await prisma.stockAdjustment.update({
    where: { id: adjustmentId },
    data: {
      status: 'REJECTED',
      rejectedAt: new Date(),
      rejectedBy: userId,
      rejectionReason,
      updatedBy: userId,
    },
  });

  return { success: true };
}

// ============================================
// STOCK RESERVATION FUNCTIONS
// ============================================

/**
 * Create a soft reservation (for quotes)
 * Soft reservations don't reduce available stock, they're tracked for visibility
 */
export async function createSoftReservation(
  data: {
    productId: string;
    location: Warehouse;
    quantity: number;
    referenceType: string;
    referenceId: string;
    referenceNumber?: string;
    expiresAt: Date;
  },
  userId: string
): Promise<{ success: boolean; reservationId?: string; error?: string }> {
  try {
    return await prisma.$transaction(async (tx) => {
      // Verify product exists
      const product = await tx.product.findFirst({
        where: { id: data.productId, deletedAt: null },
      });

      if (!product) {
        return { success: false, error: 'Product not found' };
      }

      // Create the reservation
      const reservation = await tx.stockReservation.create({
        data: {
          productId: data.productId,
          location: data.location,
          reservationType: 'SOFT',
          quantity: data.quantity,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          referenceNumber: data.referenceNumber,
          expiresAt: data.expiresAt,
          createdBy: userId,
        },
      });

      // Update stock level's softReserved
      await updateStockLevel(
        tx,
        data.productId,
        data.location,
        { softReserved: data.quantity },
        userId
      );

      return { success: true, reservationId: reservation.id };
    });
  } catch (error) {
    console.error('Create soft reservation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create reservation',
    };
  }
}

/**
 * Create a hard reservation (for confirmed orders)
 * Hard reservations reduce available stock
 */
export async function createHardReservation(
  data: {
    productId: string;
    location: Warehouse;
    quantity: number;
    referenceType: string;
    referenceId: string;
    referenceNumber?: string;
  },
  userId: string
): Promise<{ success: boolean; reservationId?: string; error?: string }> {
  try {
    return await prisma.$transaction(async (tx) => {
      // Verify product exists
      const product = await tx.product.findFirst({
        where: { id: data.productId, deletedAt: null },
      });

      if (!product) {
        return { success: false, error: 'Product not found' };
      }

      // Get current stock level to validate
      const stockLevel = await tx.stockLevel.findUnique({
        where: { productId_location: { productId: data.productId, location: data.location } },
      });

      const currentOnHand = stockLevel?.onHand ?? 0;
      const currentHardReserved = stockLevel?.hardReserved ?? 0;
      const available = currentOnHand - currentHardReserved;

      if (data.quantity > available) {
        return {
          success: false,
          error: `Insufficient stock. Available: ${available}, Requested: ${data.quantity}`,
        };
      }

      // Create the reservation
      const reservation = await tx.stockReservation.create({
        data: {
          productId: data.productId,
          location: data.location,
          reservationType: 'HARD',
          quantity: data.quantity,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          referenceNumber: data.referenceNumber,
          createdBy: userId,
        },
      });

      // Update stock level's hardReserved
      await updateStockLevel(
        tx,
        data.productId,
        data.location,
        { hardReserved: data.quantity },
        userId
      );

      return { success: true, reservationId: reservation.id };
    });
  } catch (error) {
    console.error('Create hard reservation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create reservation',
    };
  }
}

/**
 * Convert a soft reservation to hard (when quote becomes order)
 */
export async function convertSoftToHardReservation(
  reservationId: string,
  newReferenceType: string,
  newReferenceId: string,
  newReferenceNumber: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    return await prisma.$transaction(async (tx) => {
      const reservation = await tx.stockReservation.findUnique({
        where: { id: reservationId },
      });

      if (!reservation) {
        return { success: false, error: 'Reservation not found' };
      }

      if (reservation.releasedAt) {
        return { success: false, error: 'Reservation already released' };
      }

      if (reservation.reservationType !== 'SOFT') {
        return { success: false, error: 'Only soft reservations can be converted' };
      }

      // Get current stock level to validate
      const stockLevel = await tx.stockLevel.findUnique({
        where: { productId_location: { productId: reservation.productId, location: reservation.location } },
      });

      const currentOnHand = stockLevel?.onHand ?? 0;
      const currentHardReserved = stockLevel?.hardReserved ?? 0;
      const available = currentOnHand - currentHardReserved;

      if (reservation.quantity > available) {
        return {
          success: false,
          error: `Insufficient stock for hard reservation. Available: ${available}, Reserved: ${reservation.quantity}`,
        };
      }

      // Release the soft reservation
      await tx.stockReservation.update({
        where: { id: reservationId },
        data: {
          releasedAt: new Date(),
          releasedBy: userId,
          releaseReason: 'Converted to hard reservation',
        },
      });

      // Decrease softReserved
      await updateStockLevel(
        tx,
        reservation.productId,
        reservation.location,
        { softReserved: -reservation.quantity },
        userId
      );

      // Create a new hard reservation
      await tx.stockReservation.create({
        data: {
          productId: reservation.productId,
          location: reservation.location,
          reservationType: 'HARD',
          quantity: reservation.quantity,
          referenceType: newReferenceType,
          referenceId: newReferenceId,
          referenceNumber: newReferenceNumber,
          createdBy: userId,
        },
      });

      // Increase hardReserved
      await updateStockLevel(
        tx,
        reservation.productId,
        reservation.location,
        { hardReserved: reservation.quantity },
        userId
      );

      return { success: true };
    });
  } catch (error) {
    console.error('Convert reservation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert reservation',
    };
  }
}

/**
 * Release a reservation (for quote rejection, order cancellation, fulfillment)
 */
export async function releaseReservation(
  reservationId: string,
  reason: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    return await prisma.$transaction(async (tx) => {
      const reservation = await tx.stockReservation.findUnique({
        where: { id: reservationId },
      });

      if (!reservation) {
        return { success: false, error: 'Reservation not found' };
      }

      if (reservation.releasedAt) {
        return { success: false, error: 'Reservation already released' };
      }

      // Release the reservation
      await tx.stockReservation.update({
        where: { id: reservationId },
        data: {
          releasedAt: new Date(),
          releasedBy: userId,
          releaseReason: reason,
        },
      });

      // Update the appropriate reserved field
      const delta =
        reservation.reservationType === 'SOFT'
          ? { softReserved: -reservation.quantity }
          : { hardReserved: -reservation.quantity };

      await updateStockLevel(tx, reservation.productId, reservation.location, delta, userId);

      return { success: true };
    });
  } catch (error) {
    console.error('Release reservation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to release reservation',
    };
  }
}

/**
 * Release reservations by reference (e.g., all reservations for a quote)
 */
export async function releaseReservationsByReference(
  referenceType: string,
  referenceId: string,
  reason: string,
  userId: string
): Promise<{ success: boolean; releasedCount: number; error?: string }> {
  try {
    const reservations = await prisma.stockReservation.findMany({
      where: {
        referenceType,
        referenceId,
        releasedAt: null,
      },
    });

    let releasedCount = 0;
    for (const reservation of reservations) {
      const result = await releaseReservation(reservation.id, reason, userId);
      if (result.success) {
        releasedCount++;
      }
    }

    return { success: true, releasedCount };
  } catch (error) {
    console.error('Release reservations by reference error:', error);
    return {
      success: false,
      releasedCount: 0,
      error: error instanceof Error ? error.message : 'Failed to release reservations',
    };
  }
}

/**
 * Get active reservations with filtering
 */
export async function getReservations(options: {
  location?: Warehouse;
  reservationType?: ReservationType;
  referenceType?: string;
  productId?: string;
  includeExpired?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const { location, reservationType, referenceType, productId, includeExpired, page = 1, pageSize = 20 } = options;

  const where: Prisma.StockReservationWhereInput = {
    releasedAt: null, // Only active reservations
  };

  if (location) {
    where.location = location;
  }

  if (reservationType) {
    where.reservationType = reservationType;
  }

  if (referenceType) {
    where.referenceType = referenceType;
  }

  if (productId) {
    where.productId = productId;
  }

  if (!includeExpired) {
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gte: new Date() } },
    ];
  }

  const [total, reservations] = await Promise.all([
    prisma.stockReservation.count({ where }),
    prisma.stockReservation.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            nusafSku: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    reservations: reservations.map((r) => ({
      id: r.id,
      productId: r.productId,
      product: r.product,
      location: r.location,
      reservationType: r.reservationType,
      quantity: r.quantity,
      referenceType: r.referenceType,
      referenceId: r.referenceId,
      referenceNumber: r.referenceNumber,
      expiresAt: r.expiresAt,
      isExpired: r.expiresAt && r.expiresAt < new Date(),
      createdAt: r.createdAt,
      createdBy: r.createdBy,
    })),
    pagination: {
      page,
      pageSize,
      totalItems: total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Get reservations for a specific product
 */
export async function getProductReservations(productId: string, location?: Warehouse) {
  const where: Prisma.StockReservationWhereInput = {
    productId,
    releasedAt: null,
  };

  if (location) {
    where.location = location;
  }

  const reservations = await prisma.stockReservation.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return reservations.map((r) => ({
    id: r.id,
    location: r.location,
    reservationType: r.reservationType,
    quantity: r.quantity,
    referenceType: r.referenceType,
    referenceId: r.referenceId,
    referenceNumber: r.referenceNumber,
    expiresAt: r.expiresAt,
    isExpired: r.expiresAt && r.expiresAt < new Date(),
    createdAt: r.createdAt,
  }));
}

/**
 * Release all expired soft reservations
 * Can be called by a cron job or on-demand
 */
export async function releaseExpiredSoftReservations(): Promise<{ releasedCount: number }> {
  const expiredReservations = await prisma.stockReservation.findMany({
    where: {
      reservationType: 'SOFT',
      releasedAt: null,
      expiresAt: { lt: new Date() },
    },
  });

  let releasedCount = 0;
  for (const reservation of expiredReservations) {
    const result = await releaseReservation(reservation.id, 'Expired', 'system');
    if (result.success) {
      releasedCount++;
    }
  }

  return { releasedCount };
}

// ============================================
// INVENTORY DASHBOARD SUMMARY
// ============================================

/**
 * Get inventory summary counts for the dashboard
 * Returns:
 * - totalProducts: count of products with stock levels
 * - belowReorderPoint: count of products below reorder point (LOW_STOCK or OUT_OF_STOCK)
 * - pendingAdjustments: count of adjustments awaiting approval
 * - movementsToday: count of stock movements created today
 */
export async function getInventorySummary() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalProducts,
    belowReorderCount,
    pendingAdjustments,
    movementsToday,
  ] = await Promise.all([
    // Count products that have at least one stock level
    prisma.stockLevel.groupBy({
      by: ['productId'],
    }).then((groups) => groups.length),

    // Count products that are LOW_STOCK or OUT_OF_STOCK across any location
    // We need to check each stock level individually
    prisma.stockLevel.findMany({
      include: {
        product: {
          select: {
            id: true,
            defaultReorderPoint: true,
            defaultMaxStock: true,
          },
        },
      },
    }).then((stockLevels) => {
      // Get unique products that are below reorder point
      const productsBelow = new Set<string>();
      for (const sl of stockLevels) {
        const available = sl.onHand - sl.hardReserved;
        const effectiveReorderPoint = sl.reorderPoint ?? sl.product.defaultReorderPoint ?? 0;
        if (available <= 0 || (effectiveReorderPoint > 0 && available <= effectiveReorderPoint)) {
          productsBelow.add(sl.productId);
        }
      }
      return productsBelow.size;
    }),

    // Count pending adjustments
    prisma.stockAdjustment.count({
      where: { status: 'PENDING' },
    }),

    // Count movements created today
    prisma.stockMovement.count({
      where: {
        createdAt: { gte: today },
      },
    }),
  ]);

  return {
    totalProducts,
    belowReorderPoint: belowReorderCount,
    pendingAdjustments,
    movementsToday,
  };
}

// ============================================
// REORDER SETTINGS MANAGEMENT
// ============================================

/**
 * Update reorder settings for a product at a specific location
 */
export async function updateReorderSettings(
  productId: string,
  location: Warehouse,
  settings: {
    reorderPoint?: number | null;
    reorderQuantity?: number | null;
    minimumStock?: number | null;
    maximumStock?: number | null;
  },
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if stock level exists
    const stockLevel = await prisma.stockLevel.findUnique({
      where: { productId_location: { productId, location } },
    });

    if (!stockLevel) {
      // Create stock level if it doesn't exist
      await prisma.stockLevel.create({
        data: {
          productId,
          location,
          onHand: 0,
          softReserved: 0,
          hardReserved: 0,
          onOrder: 0,
          reorderPoint: settings.reorderPoint ?? null,
          reorderQuantity: settings.reorderQuantity ?? null,
          minimumStock: settings.minimumStock ?? null,
          maximumStock: settings.maximumStock ?? null,
          createdBy: userId,
          updatedBy: userId,
        },
      });
    } else {
      // Update existing stock level
      await prisma.stockLevel.update({
        where: { productId_location: { productId, location } },
        data: {
          reorderPoint: settings.reorderPoint !== undefined ? settings.reorderPoint : stockLevel.reorderPoint,
          reorderQuantity: settings.reorderQuantity !== undefined ? settings.reorderQuantity : stockLevel.reorderQuantity,
          minimumStock: settings.minimumStock !== undefined ? settings.minimumStock : stockLevel.minimumStock,
          maximumStock: settings.maximumStock !== undefined ? settings.maximumStock : stockLevel.maximumStock,
          updatedBy: userId,
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Update reorder settings error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update reorder settings',
    };
  }
}
