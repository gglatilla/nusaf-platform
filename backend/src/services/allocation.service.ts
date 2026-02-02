/**
 * Stock Allocation Service
 *
 * Determines HOW to fulfill an order based on:
 * 1. Customer's delivery warehouse (from SalesOrder.warehouse)
 * 2. Stock availability across warehouses (JHB, CT)
 * 3. Product type (assembly products always from JHB)
 *
 * Returns an allocation plan - does NOT create documents.
 * TASK-022 (orchestration engine) consumes the plan to create picking slips, transfers, etc.
 */

import { Warehouse, ProductType } from '@prisma/client';
import { prisma } from '../config/database';

// ============================================
// TYPES
// ============================================

/**
 * Input for allocating a single product
 */
export interface AllocationRequest {
  productId: string;
  quantity: number;
}

/**
 * Result of allocating from a specific warehouse
 */
export interface AllocationLine {
  productId: string;
  productSku: string;
  productDescription: string;
  warehouse: Warehouse;
  quantityAllocated: number;
  /** True if this allocation requires a transfer (JHB → CT for CT customers) */
  requiresTransfer: boolean;
}

/**
 * Product line that couldn't be fully allocated
 */
export interface BackorderLine {
  productId: string;
  productSku: string;
  productDescription: string;
  quantityBackorder: number;
}

/**
 * Summary statistics for the allocation plan
 */
export interface AllocationSummary {
  totalRequested: number;
  totalAllocated: number;
  totalBackorder: number;
  canFulfillCompletely: boolean;
}

/**
 * Complete allocation plan for an order or product check
 */
export interface AllocationPlan {
  orderId?: string;
  orderNumber?: string;
  customerWarehouse: Warehouse;
  allocations: AllocationLine[];
  backorders: BackorderLine[];
  summary: AllocationSummary;
}

/**
 * Stock availability at a specific warehouse
 */
interface WarehouseStock {
  warehouse: Warehouse;
  onHand: number;
  hardReserved: number;
  available: number; // onHand - hardReserved
}

/**
 * Product info needed for allocation decisions
 */
interface ProductAllocationInfo {
  id: string;
  nusafSku: string;
  description: string;
  productType: ProductType;
  stock: WarehouseStock[];
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Product types that require manufacturing/assembly (JHB only)
 */
export const ASSEMBLY_PRODUCT_TYPES: ProductType[] = [
  ProductType.ASSEMBLY_REQUIRED,
  ProductType.MADE_TO_ORDER,
];

/**
 * Product types that can be fulfilled from any warehouse
 */
export const STOCK_PRODUCT_TYPES: ProductType[] = [
  ProductType.STOCK_ONLY,
  ProductType.KIT,
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a product type requires assembly (must come from JHB)
 */
export function isAssemblyProduct(productType: ProductType): boolean {
  return ASSEMBLY_PRODUCT_TYPES.includes(productType);
}

/**
 * Get available stock for a product at a specific warehouse
 */
async function getWarehouseStock(
  productId: string,
  warehouse: Warehouse
): Promise<WarehouseStock> {
  const stockLevel = await prisma.stockLevel.findUnique({
    where: {
      productId_location: {
        productId,
        location: warehouse,
      },
    },
  });

  if (!stockLevel) {
    return {
      warehouse,
      onHand: 0,
      hardReserved: 0,
      available: 0,
    };
  }

  return {
    warehouse,
    onHand: stockLevel.onHand,
    hardReserved: stockLevel.hardReserved,
    available: stockLevel.onHand - stockLevel.hardReserved,
  };
}

/**
 * Get stock levels for a product at all warehouses
 */
async function getAllWarehouseStock(productId: string): Promise<WarehouseStock[]> {
  const [jhbStock, ctStock] = await Promise.all([
    getWarehouseStock(productId, Warehouse.JHB),
    getWarehouseStock(productId, Warehouse.CT),
  ]);

  return [jhbStock, ctStock];
}

/**
 * Get product info needed for allocation
 */
async function getProductForAllocation(productId: string): Promise<ProductAllocationInfo | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      nusafSku: true,
      description: true,
      productType: true,
    },
  });

  if (!product) return null;

  const stock = await getAllWarehouseStock(productId);

  return {
    id: product.id,
    nusafSku: product.nusafSku,
    description: product.description,
    productType: product.productType,
    stock,
  };
}

// ============================================
// ALLOCATION LOGIC
// ============================================

/**
 * Allocate stock for a single product based on customer warehouse and product type.
 *
 * Business Rules:
 * - CT customer + stock product: CT first, spill to JHB
 * - CT customer + assembly product: JHB only (requires transfer)
 * - JHB customer: JHB only
 *
 * @param product Product info with stock levels
 * @param quantity Quantity to allocate
 * @param customerWarehouse Customer's delivery warehouse
 * @returns Allocations and any backorder
 */
function allocateProduct(
  product: ProductAllocationInfo,
  quantity: number,
  customerWarehouse: Warehouse
): { allocations: AllocationLine[]; backorder: BackorderLine | null } {
  const allocations: AllocationLine[] = [];
  let remaining = quantity;

  const jhbStock = product.stock.find(s => s.warehouse === Warehouse.JHB) || { available: 0 };
  const ctStock = product.stock.find(s => s.warehouse === Warehouse.CT) || { available: 0 };

  // Determine allocation strategy based on customer warehouse and product type
  if (customerWarehouse === Warehouse.CT && !isAssemblyProduct(product.productType)) {
    // CT customer with stock product: Try CT first, then JHB

    // 1. Allocate from CT
    if (ctStock.available > 0 && remaining > 0) {
      const fromCT = Math.min(ctStock.available, remaining);
      allocations.push({
        productId: product.id,
        productSku: product.nusafSku,
        productDescription: product.description,
        warehouse: Warehouse.CT,
        quantityAllocated: fromCT,
        requiresTransfer: false, // CT dispatches directly to CT customer
      });
      remaining -= fromCT;
    }

    // 2. Spill to JHB if needed
    if (jhbStock.available > 0 && remaining > 0) {
      const fromJHB = Math.min(jhbStock.available, remaining);
      allocations.push({
        productId: product.id,
        productSku: product.nusafSku,
        productDescription: product.description,
        warehouse: Warehouse.JHB,
        quantityAllocated: fromJHB,
        requiresTransfer: true, // JHB → CT transfer needed
      });
      remaining -= fromJHB;
    }
  } else {
    // JHB customer OR assembly product: JHB only

    if (jhbStock.available > 0 && remaining > 0) {
      const fromJHB = Math.min(jhbStock.available, remaining);
      allocations.push({
        productId: product.id,
        productSku: product.nusafSku,
        productDescription: product.description,
        warehouse: Warehouse.JHB,
        quantityAllocated: fromJHB,
        // Transfer needed only if customer is CT
        requiresTransfer: customerWarehouse === Warehouse.CT,
      });
      remaining -= fromJHB;
    }
  }

  // Create backorder if we couldn't fulfill everything
  const backorder: BackorderLine | null = remaining > 0
    ? {
        productId: product.id,
        productSku: product.nusafSku,
        productDescription: product.description,
        quantityBackorder: remaining,
      }
    : null;

  return { allocations, backorder };
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Check availability and generate allocation plan for a single product.
 * Does NOT create reservations - just returns the plan.
 *
 * @param productId Product to check
 * @param quantity Quantity needed
 * @param customerWarehouse Customer's delivery warehouse
 */
export async function checkProductAvailability(
  productId: string,
  quantity: number,
  customerWarehouse: Warehouse
): Promise<AllocationPlan | { error: string }> {
  const product = await getProductForAllocation(productId);

  if (!product) {
    return { error: `Product not found: ${productId}` };
  }

  const { allocations, backorder } = allocateProduct(product, quantity, customerWarehouse);

  const totalAllocated = allocations.reduce((sum, a) => sum + a.quantityAllocated, 0);
  const totalBackorder = backorder?.quantityBackorder || 0;

  return {
    customerWarehouse,
    allocations,
    backorders: backorder ? [backorder] : [],
    summary: {
      totalRequested: quantity,
      totalAllocated,
      totalBackorder,
      canFulfillCompletely: totalBackorder === 0,
    },
  };
}

/**
 * Generate allocation plan for an entire order.
 * Does NOT create reservations - just returns the plan.
 *
 * @param orderId Sales order ID
 */
export async function allocateForOrder(
  orderId: string
): Promise<AllocationPlan | { error: string }> {
  // Load order with lines and product info
  const order = await prisma.salesOrder.findUnique({
    where: { id: orderId },
    include: {
      lines: {
        select: {
          productId: true,
          quantityOrdered: true,
        },
      },
    },
  });

  if (!order) {
    return { error: `Order not found: ${orderId}` };
  }

  if (order.lines.length === 0) {
    return { error: 'Order has no lines' };
  }

  // Load product info for all lines
  const productIds = order.lines.map(line => line.productId);
  const products = await Promise.all(
    productIds.map(id => getProductForAllocation(id))
  );

  // Build product map (filter out any not found)
  const productMap = new Map<string, ProductAllocationInfo>();
  for (const product of products) {
    if (product) {
      productMap.set(product.id, product);
    }
  }

  // Allocate each line
  const allAllocations: AllocationLine[] = [];
  const allBackorders: BackorderLine[] = [];
  let totalRequested = 0;
  let totalAllocated = 0;
  let totalBackorder = 0;

  for (const line of order.lines) {
    const product = productMap.get(line.productId);
    if (!product) {
      // Product not found - treat as full backorder
      allBackorders.push({
        productId: line.productId,
        productSku: 'UNKNOWN',
        productDescription: 'Product not found',
        quantityBackorder: line.quantityOrdered,
      });
      totalRequested += line.quantityOrdered;
      totalBackorder += line.quantityOrdered;
      continue;
    }

    const { allocations, backorder } = allocateProduct(
      product,
      line.quantityOrdered,
      order.warehouse
    );

    allAllocations.push(...allocations);
    if (backorder) {
      allBackorders.push(backorder);
    }

    totalRequested += line.quantityOrdered;
    totalAllocated += allocations.reduce((sum, a) => sum + a.quantityAllocated, 0);
    totalBackorder += backorder?.quantityBackorder || 0;
  }

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerWarehouse: order.warehouse,
    allocations: allAllocations,
    backorders: allBackorders,
    summary: {
      totalRequested,
      totalAllocated,
      totalBackorder,
      canFulfillCompletely: totalBackorder === 0,
    },
  };
}

/**
 * Aggregate allocations by warehouse for easier processing.
 * Groups allocations into picking slip candidates per warehouse.
 */
export function groupAllocationsByWarehouse(
  allocations: AllocationLine[]
): Map<Warehouse, AllocationLine[]> {
  const grouped = new Map<Warehouse, AllocationLine[]>();

  for (const allocation of allocations) {
    const existing = grouped.get(allocation.warehouse) || [];
    existing.push(allocation);
    grouped.set(allocation.warehouse, existing);
  }

  return grouped;
}

/**
 * Get allocations that require transfer (JHB → CT)
 */
export function getTransferAllocations(allocations: AllocationLine[]): AllocationLine[] {
  return allocations.filter(a => a.requiresTransfer);
}
