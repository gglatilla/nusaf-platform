import { prisma } from '../config/database';
import { Warehouse } from '@prisma/client';
import type {
  AddBomComponentInput,
  UpdateBomComponentInput,
} from '../utils/validation/bom';

// ============================================
// TYPES
// ============================================

export interface BomItemData {
  id: string;
  componentProductId: string;
  componentProduct: {
    id: string;
    nusafSku: string;
    description: string;
    unitOfMeasure: string;
  };
  quantity: number;
  unitOverride: string | null;
  notes: string | null;
  sortOrder: number;
  isOptional: boolean;
  hasOwnBom: boolean;
}

export interface ExplodedBomItem {
  productId: string;
  nusafSku: string;
  description: string;
  unitOfMeasure: string;
  requiredQuantity: number;
  level: number;
  parentPath: string[];
  isOptional: boolean;
}

export interface BomStockCheckResult {
  canFulfill: boolean;
  components: Array<{
    productId: string;
    nusafSku: string;
    description: string;
    requiredQuantity: number;
    availableQuantity: number;
    shortfall: number;
    isOptional: boolean;
  }>;
  optionalComponents: Array<{
    productId: string;
    nusafSku: string;
    description: string;
    requiredQuantity: number;
    availableQuantity: number;
  }>;
}

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Transform a raw BomItem from Prisma to BomItemData
 */
function transformBomItem(
  item: {
    id: string;
    componentProductId: string;
    componentProduct: {
      id: string;
      nusafSku: string;
      description: string;
      unitOfMeasure: string;
      _count?: { bomComponents: number };
    };
    quantity: { toString: () => string } | number;
    unitOverride: string | null;
    notes: string | null;
    sortOrder: number;
    isOptional: boolean;
  }
): BomItemData {
  const quantity = typeof item.quantity === 'number'
    ? item.quantity
    : Number(item.quantity.toString());

  return {
    id: item.id,
    componentProductId: item.componentProductId,
    componentProduct: {
      id: item.componentProduct.id,
      nusafSku: item.componentProduct.nusafSku,
      description: item.componentProduct.description,
      unitOfMeasure: item.componentProduct.unitOfMeasure,
    },
    quantity,
    unitOverride: item.unitOverride,
    notes: item.notes,
    sortOrder: item.sortOrder,
    isOptional: item.isOptional,
    hasOwnBom: (item.componentProduct._count?.bomComponents ?? 0) > 0,
  };
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate that adding componentId to parentId would not create a circular reference.
 * Uses BFS to check if parentId appears anywhere in componentId's BOM tree.
 */
export async function validateBomCircular(
  parentProductId: string,
  componentProductId: string
): Promise<{ valid: boolean; error?: string }> {
  // Immediate self-reference check
  if (parentProductId === componentProductId) {
    return { valid: false, error: 'Cannot add a product as its own component' };
  }

  // BFS to find if parentProductId appears in componentProductId's BOM tree
  const visited = new Set<string>();
  const queue: string[] = [componentProductId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;

    if (visited.has(currentId)) {
      continue;
    }
    visited.add(currentId);

    // Get all components of current product
    const bomItems = await prisma.bomItem.findMany({
      where: { parentProductId: currentId },
      select: { componentProductId: true },
    });

    for (const item of bomItems) {
      if (item.componentProductId === parentProductId) {
        return {
          valid: false,
          error: 'Adding this component would create a circular reference in the BOM hierarchy'
        };
      }
      queue.push(item.componentProductId);
    }
  }

  return { valid: true };
}

// ============================================
// CORE CRUD FUNCTIONS
// ============================================

/**
 * Get BOM for a product (direct children only)
 */
export async function getBom(
  productId: string
): Promise<ServiceResult<BomItemData[]>> {
  try {
    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, deletedAt: true },
    });

    if (!product || product.deletedAt) {
      return { success: false, error: 'Product not found' };
    }

    const bomItems = await prisma.bomItem.findMany({
      where: { parentProductId: productId },
      include: {
        componentProduct: {
          select: {
            id: true,
            nusafSku: true,
            description: true,
            unitOfMeasure: true,
            _count: { select: { bomComponents: true } },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const transformed = bomItems.map(transformBomItem);
    return { success: true, data: transformed };
  } catch (error) {
    console.error('Get BOM error:', error);
    return { success: false, error: 'Failed to get BOM' };
  }
}

/**
 * Add a component to a product's BOM
 */
export async function addBomComponent(
  parentProductId: string,
  input: AddBomComponentInput,
  userId: string
): Promise<ServiceResult<BomItemData>> {
  try {
    // Verify parent product exists
    const parentProduct = await prisma.product.findUnique({
      where: { id: parentProductId },
      select: { id: true, deletedAt: true },
    });

    if (!parentProduct || parentProduct.deletedAt) {
      return { success: false, error: 'Parent product not found' };
    }

    // Verify component product exists
    const componentProduct = await prisma.product.findUnique({
      where: { id: input.componentProductId },
      select: { id: true, deletedAt: true, isActive: true },
    });

    if (!componentProduct || componentProduct.deletedAt) {
      return { success: false, error: 'Component product not found' };
    }

    if (!componentProduct.isActive) {
      return { success: false, error: 'Component product is inactive' };
    }

    // Check for circular reference
    const circularCheck = await validateBomCircular(parentProductId, input.componentProductId);
    if (!circularCheck.valid) {
      return { success: false, error: circularCheck.error };
    }

    // Check if component already exists in BOM
    const existing = await prisma.bomItem.findUnique({
      where: {
        parentProductId_componentProductId: {
          parentProductId,
          componentProductId: input.componentProductId,
        },
      },
    });

    if (existing) {
      return { success: false, error: 'Component already exists in BOM. Use update to change quantity.' };
    }

    // Create BOM item
    const bomItem = await prisma.bomItem.create({
      data: {
        parentProductId,
        componentProductId: input.componentProductId,
        quantity: input.quantity,
        unitOverride: input.unitOverride ?? null,
        notes: input.notes ?? null,
        sortOrder: input.sortOrder ?? 0,
        isOptional: input.isOptional ?? false,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        componentProduct: {
          select: {
            id: true,
            nusafSku: true,
            description: true,
            unitOfMeasure: true,
            _count: { select: { bomComponents: true } },
          },
        },
      },
    });

    return { success: true, data: transformBomItem(bomItem) };
  } catch (error) {
    console.error('Add BOM component error:', error);
    return { success: false, error: 'Failed to add BOM component' };
  }
}

/**
 * Update a BOM component
 */
export async function updateBomComponent(
  parentProductId: string,
  componentProductId: string,
  input: UpdateBomComponentInput,
  userId: string
): Promise<ServiceResult<BomItemData>> {
  try {
    // Find existing BOM item
    const existing = await prisma.bomItem.findUnique({
      where: {
        parentProductId_componentProductId: {
          parentProductId,
          componentProductId,
        },
      },
    });

    if (!existing) {
      return { success: false, error: 'BOM component not found' };
    }

    // Update BOM item
    const bomItem = await prisma.bomItem.update({
      where: { id: existing.id },
      data: {
        quantity: input.quantity,
        unitOverride: input.unitOverride,
        notes: input.notes,
        sortOrder: input.sortOrder,
        isOptional: input.isOptional,
        updatedBy: userId,
      },
      include: {
        componentProduct: {
          select: {
            id: true,
            nusafSku: true,
            description: true,
            unitOfMeasure: true,
            _count: { select: { bomComponents: true } },
          },
        },
      },
    });

    return { success: true, data: transformBomItem(bomItem) };
  } catch (error) {
    console.error('Update BOM component error:', error);
    return { success: false, error: 'Failed to update BOM component' };
  }
}

/**
 * Remove a component from BOM
 */
export async function removeBomComponent(
  parentProductId: string,
  componentProductId: string,
  _userId: string // Kept for API consistency, not used in delete
): Promise<ServiceResult<void>> {
  try {
    // Find existing BOM item
    const existing = await prisma.bomItem.findUnique({
      where: {
        parentProductId_componentProductId: {
          parentProductId,
          componentProductId,
        },
      },
    });

    if (!existing) {
      return { success: false, error: 'BOM component not found' };
    }

    // Delete BOM item
    await prisma.bomItem.delete({
      where: { id: existing.id },
    });

    return { success: true };
  } catch (error) {
    console.error('Remove BOM component error:', error);
    return { success: false, error: 'Failed to remove BOM component' };
  }
}

// ============================================
// ADVANCED FUNCTIONS
// ============================================

/**
 * Explode BOM recursively - returns flat list of ALL components at all levels
 * Multiplies quantities through the hierarchy
 */
export async function explodeBom(
  productId: string,
  quantity: number,
  options?: { maxDepth?: number; includeOptional?: boolean }
): Promise<ServiceResult<ExplodedBomItem[]>> {
  try {
    const maxDepth = options?.maxDepth ?? 10;
    const includeOptional = options?.includeOptional ?? true;
    const results: ExplodedBomItem[] = [];
    const visited = new Set<string>();

    async function explodeRecursive(
      currentProductId: string,
      multiplier: number,
      level: number,
      parentPath: string[],
      inheritedOptional: boolean
    ): Promise<void> {
      if (level > maxDepth) {
        return;
      }

      // Prevent infinite loops from data corruption (shouldn't happen with validation)
      const pathKey = `${currentProductId}:${level}`;
      if (visited.has(pathKey) && level > 1) {
        return;
      }
      visited.add(pathKey);

      const bomItems = await prisma.bomItem.findMany({
        where: { parentProductId: currentProductId },
        include: {
          componentProduct: {
            select: {
              id: true,
              nusafSku: true,
              description: true,
              unitOfMeasure: true,
            },
          },
        },
        orderBy: { sortOrder: 'asc' },
      });

      for (const item of bomItems) {
        const isOptional = inheritedOptional || item.isOptional;

        // Skip optional items if not including them
        if (item.isOptional && !includeOptional) {
          continue;
        }

        const requiredQty = Number(item.quantity) * multiplier;

        results.push({
          productId: item.componentProductId,
          nusafSku: item.componentProduct.nusafSku,
          description: item.componentProduct.description,
          unitOfMeasure: item.componentProduct.unitOfMeasure,
          requiredQuantity: requiredQty,
          level,
          parentPath: [...parentPath, currentProductId],
          isOptional,
        });

        // Recurse into component's BOM
        await explodeRecursive(
          item.componentProductId,
          requiredQty,
          level + 1,
          [...parentPath, currentProductId],
          isOptional
        );
      }
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, deletedAt: true },
    });

    if (!product || product.deletedAt) {
      return { success: false, error: 'Product not found' };
    }

    await explodeRecursive(productId, quantity, 1, [], false);

    return { success: true, data: results };
  } catch (error) {
    console.error('Explode BOM error:', error);
    return { success: false, error: 'Failed to explode BOM' };
  }
}

/**
 * Check stock availability for all BOM components
 * isOptional items are listed separately and don't affect canFulfill
 */
export async function checkBomStock(
  productId: string,
  quantity: number,
  warehouse: Warehouse
): Promise<ServiceResult<BomStockCheckResult>> {
  try {
    // First explode the BOM to get all components
    const explodeResult = await explodeBom(productId, quantity, { includeOptional: true });

    if (!explodeResult.success || !explodeResult.data) {
      return { success: false, error: explodeResult.error || 'Failed to explode BOM' };
    }

    const explodedItems = explodeResult.data;

    if (explodedItems.length === 0) {
      // No BOM = product is simple, can fulfill
      return {
        success: true,
        data: {
          canFulfill: true,
          components: [],
          optionalComponents: [],
        },
      };
    }

    // Get unique product IDs (a component may appear multiple times if used at different levels)
    // We need to aggregate quantities for the same productId
    const componentQuantities = new Map<string, { qty: number; isOptional: boolean; item: ExplodedBomItem }>();

    for (const item of explodedItems) {
      const existing = componentQuantities.get(item.productId);
      if (existing) {
        // If component appears both as optional and required, treat as required
        existing.qty += item.requiredQuantity;
        if (!item.isOptional) {
          existing.isOptional = false;
        }
      } else {
        componentQuantities.set(item.productId, {
          qty: item.requiredQuantity,
          isOptional: item.isOptional,
          item,
        });
      }
    }

    const productIds = Array.from(componentQuantities.keys());

    // Get stock levels for all components at the specified warehouse
    const stockLevels = await prisma.stockLevel.findMany({
      where: {
        productId: { in: productIds },
        location: warehouse,
      },
      select: {
        productId: true,
        onHand: true,
        hardReserved: true,
      },
    });

    // Create lookup map
    const stockMap = new Map<string, { onHand: number; hardReserved: number }>();
    for (const sl of stockLevels) {
      stockMap.set(sl.productId, { onHand: sl.onHand, hardReserved: sl.hardReserved });
    }

    // Check each component
    const requiredComponents: BomStockCheckResult['components'] = [];
    const optionalComponents: BomStockCheckResult['optionalComponents'] = [];
    let canFulfill = true;

    for (const [prodId, data] of componentQuantities) {
      const stock = stockMap.get(prodId);
      const available = stock ? stock.onHand - stock.hardReserved : 0;
      const shortfall = Math.max(0, data.qty - available);

      const componentData = {
        productId: prodId,
        nusafSku: data.item.nusafSku,
        description: data.item.description,
        requiredQuantity: data.qty,
        availableQuantity: available,
        shortfall,
        isOptional: data.isOptional,
      };

      if (data.isOptional) {
        optionalComponents.push({
          productId: prodId,
          nusafSku: data.item.nusafSku,
          description: data.item.description,
          requiredQuantity: data.qty,
          availableQuantity: available,
        });
      } else {
        requiredComponents.push(componentData);
        if (shortfall > 0) {
          canFulfill = false;
        }
      }
    }

    return {
      success: true,
      data: {
        canFulfill,
        components: requiredComponents,
        optionalComponents,
      },
    };
  } catch (error) {
    console.error('Check BOM stock error:', error);
    return { success: false, error: 'Failed to check BOM stock' };
  }
}

/**
 * Get "where used" - all products that use this component
 */
export async function getWhereUsed(
  componentProductId: string
): Promise<ServiceResult<Array<{ id: string; nusafSku: string; description: string; quantity: number }>>> {
  try {
    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: componentProductId },
      select: { id: true, deletedAt: true },
    });

    if (!product || product.deletedAt) {
      return { success: false, error: 'Product not found' };
    }

    const bomItems = await prisma.bomItem.findMany({
      where: { componentProductId },
      include: {
        parentProduct: {
          select: {
            id: true,
            nusafSku: true,
            description: true,
            deletedAt: true,
          },
        },
      },
      orderBy: { parentProduct: { nusafSku: 'asc' } },
    });

    // Filter out deleted parent products
    const results = bomItems
      .filter(item => !item.parentProduct.deletedAt)
      .map(item => ({
        id: item.parentProduct.id,
        nusafSku: item.parentProduct.nusafSku,
        description: item.parentProduct.description,
        quantity: Number(item.quantity),
      }));

    return { success: true, data: results };
  } catch (error) {
    console.error('Get where used error:', error);
    return { success: false, error: 'Failed to get where used' };
  }
}

/**
 * Copy BOM from one product to another
 * Replaces any existing BOM on the target product
 */
export async function copyBom(
  targetProductId: string,
  sourceProductId: string,
  userId: string
): Promise<ServiceResult<{ copiedCount: number }>> {
  try {
    // Verify both products exist
    const [targetProduct, sourceProduct] = await Promise.all([
      prisma.product.findUnique({
        where: { id: targetProductId },
        select: { id: true, deletedAt: true },
      }),
      prisma.product.findUnique({
        where: { id: sourceProductId },
        select: { id: true, deletedAt: true },
      }),
    ]);

    if (!targetProduct || targetProduct.deletedAt) {
      return { success: false, error: 'Target product not found' };
    }

    if (!sourceProduct || sourceProduct.deletedAt) {
      return { success: false, error: 'Source product not found' };
    }

    if (targetProductId === sourceProductId) {
      return { success: false, error: 'Cannot copy BOM to itself' };
    }

    // Get source BOM
    const sourceBomItems = await prisma.bomItem.findMany({
      where: { parentProductId: sourceProductId },
    });

    if (sourceBomItems.length === 0) {
      return { success: false, error: 'Source product has no BOM to copy' };
    }

    // Validate no circular references would be created
    for (const item of sourceBomItems) {
      const circularCheck = await validateBomCircular(targetProductId, item.componentProductId);
      if (!circularCheck.valid) {
        return {
          success: false,
          error: `Copying would create circular reference with component ${item.componentProductId}`
        };
      }
    }

    // Use transaction to replace target BOM
    await prisma.$transaction(async (tx) => {
      // Delete existing target BOM
      await tx.bomItem.deleteMany({
        where: { parentProductId: targetProductId },
      });

      // Create new BOM items
      await tx.bomItem.createMany({
        data: sourceBomItems.map(item => ({
          parentProductId: targetProductId,
          componentProductId: item.componentProductId,
          quantity: item.quantity,
          unitOverride: item.unitOverride,
          notes: item.notes,
          sortOrder: item.sortOrder,
          isOptional: item.isOptional,
          createdBy: userId,
          updatedBy: userId,
        })),
      });
    });

    return { success: true, data: { copiedCount: sourceBomItems.length } };
  } catch (error) {
    console.error('Copy BOM error:', error);
    return { success: false, error: 'Failed to copy BOM' };
  }
}
