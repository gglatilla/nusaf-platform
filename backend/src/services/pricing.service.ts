import { PrismaClient, CustomerTier } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

/**
 * Customer tier discount percentages (off list price)
 */
export const CUSTOMER_TIER_DISCOUNTS: Record<CustomerTier, number> = {
  END_USER: 30,
  OEM_RESELLER: 40,
  DISTRIBUTOR: 50,
};

/**
 * Fixed multiplier always applied at the end of pricing calculation
 */
export const FIXED_MULTIPLIER = 1.40;

/**
 * Input for list price calculation
 */
export interface PriceCalculationInput {
  costPrice: number; // Supplier price (EUR for imports, ZAR for local)
  isGross: boolean; // Whether costPrice is gross (requires discount)
  discountPercent?: number; // Discount % to apply if gross
  eurZarRate: number; // EUR/ZAR exchange rate
  freightPercent: number; // Freight % to add
  marginDivisor: number; // Divide by this for margin
  isLocal: boolean; // True for ZAR supplier (skip currency conversion)
}

/**
 * Breakdown of pricing calculation for audit trail
 */
export interface PriceCalculationBreakdown {
  costPrice: number;
  discountAmount: number;
  netPrice: number;
  zarValue: number;
  freightAmount: number;
  landedCost: number;
  afterMargin: number;
  listPrice: number;
}

/**
 * Calculate the list price from supplier cost price.
 *
 * Formula (imported products):
 * Supplier Price (Gross/Net)
 *   -> Apply discount % (if Gross)
 *   -> x EUR/ZAR rate
 *   -> x (1 + Freight %)
 *   -> / Margin Divisor
 *   -> x 1.40 (always)
 *   = List Price (ZAR)
 *
 * Formula (local products):
 * Cost Price (ZAR)
 *   -> / Margin Divisor
 *   -> x 1.40 (always)
 *   = List Price (ZAR)
 */
export function calculateListPrice(input: PriceCalculationInput): PriceCalculationBreakdown {
  const { costPrice, isGross, discountPercent, eurZarRate, freightPercent, marginDivisor, isLocal } = input;

  // Validate inputs
  if (marginDivisor <= 0) {
    throw new Error('Margin divisor must be greater than 0');
  }
  if (eurZarRate <= 0) {
    throw new Error('EUR/ZAR rate must be greater than 0');
  }
  if (freightPercent < 0) {
    throw new Error('Freight percent cannot be negative');
  }

  // Step 1: Apply discount if gross pricing
  let discountAmount = 0;
  let netPrice = costPrice;
  if (isGross && discountPercent && discountPercent > 0) {
    discountAmount = roundTo4(costPrice * (discountPercent / 100));
    netPrice = roundTo4(costPrice - discountAmount);
  }

  // Step 2: Convert to ZAR (skip for local suppliers)
  let zarValue: number;
  if (isLocal) {
    zarValue = netPrice; // Already in ZAR
  } else {
    zarValue = roundTo4(netPrice * eurZarRate);
  }

  // Step 3: Add freight
  const freightAmount = roundTo4(zarValue * (freightPercent / 100));
  const landedCost = roundTo4(zarValue + freightAmount);

  // Step 4: Apply margin
  const afterMargin = roundTo4(landedCost / marginDivisor);

  // Step 5: Apply fixed multiplier
  const listPrice = roundTo2(afterMargin * FIXED_MULTIPLIER);

  return {
    costPrice,
    discountAmount,
    netPrice,
    zarValue,
    freightAmount,
    landedCost,
    afterMargin,
    listPrice,
  };
}

/**
 * Calculate customer price based on tier discount
 */
export function calculateCustomerPrice(listPrice: number, tier: CustomerTier): number {
  const discountPercent = CUSTOMER_TIER_DISCOUNTS[tier];
  const multiplier = (100 - discountPercent) / 100;
  return roundTo2(listPrice * multiplier);
}

/**
 * Get the applicable pricing rule for a product
 * Falls back from subcategory -> category level
 */
export async function getPricingRule(
  supplierId: string,
  categoryId: string,
  subCategoryId: string | null
): Promise<{
  id: string;
  isGross: boolean;
  discountPercent: number | null;
  freightPercent: number;
  marginDivisor: number;
} | null> {
  // Try to find exact match (with subcategory)
  if (subCategoryId) {
    const exactRule = await prisma.pricingRule.findUnique({
      where: {
        supplierId_categoryId_subCategoryId: {
          supplierId,
          categoryId,
          subCategoryId,
        },
      },
    });

    if (exactRule) {
      return {
        id: exactRule.id,
        isGross: exactRule.isGross,
        discountPercent: exactRule.discountPercent ? Number(exactRule.discountPercent) : null,
        freightPercent: Number(exactRule.freightPercent),
        marginDivisor: Number(exactRule.marginDivisor),
      };
    }
  }

  // Fall back to category-level rule (subCategoryId = null)
  const categoryRule = await prisma.pricingRule.findFirst({
    where: {
      supplierId,
      categoryId,
      subCategoryId: null,
    },
  });

  if (categoryRule) {
    return {
      id: categoryRule.id,
      isGross: categoryRule.isGross,
      discountPercent: categoryRule.discountPercent ? Number(categoryRule.discountPercent) : null,
      freightPercent: Number(categoryRule.freightPercent),
      marginDivisor: Number(categoryRule.marginDivisor),
    };
  }

  return null;
}

/**
 * Get global settings (EUR/ZAR rate)
 */
export async function getGlobalSettings(): Promise<{
  eurZarRate: number;
  rateUpdatedAt: Date;
}> {
  const settings = await prisma.globalSettings.findUnique({
    where: { id: 'global' },
  });

  if (!settings) {
    throw new Error('Global settings not found. Run database seed.');
  }

  return {
    eurZarRate: Number(settings.eurZarRate),
    rateUpdatedAt: settings.rateUpdatedAt,
  };
}

/**
 * Calculate and update list price for a single product
 */
export async function calculateProductPrice(productId: string): Promise<{
  success: boolean;
  listPrice?: number;
  breakdown?: PriceCalculationBreakdown;
  error?: string;
}> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      supplier: true,
    },
  });

  if (!product) {
    return { success: false, error: 'Product not found' };
  }

  if (!product.costPrice) {
    return { success: false, error: 'Product has no cost price' };
  }

  // Get pricing rule
  const rule = await getPricingRule(product.supplierId, product.categoryId, product.subCategoryId);
  if (!rule) {
    return {
      success: false,
      error: `No pricing rule found for supplier ${product.supplierId} and category ${product.categoryId}`,
    };
  }

  // Get global settings
  const settings = await getGlobalSettings();

  // Calculate price
  const breakdown = calculateListPrice({
    costPrice: Number(product.costPrice),
    isGross: rule.isGross,
    discountPercent: rule.discountPercent ?? undefined,
    eurZarRate: settings.eurZarRate,
    freightPercent: rule.freightPercent,
    marginDivisor: rule.marginDivisor,
    isLocal: product.supplier.isLocal,
  });

  return {
    success: true,
    listPrice: breakdown.listPrice,
    breakdown,
  };
}

/**
 * Recalculate and save list prices for all products matching criteria
 */
export async function recalculateProductPrices(options: {
  supplierId?: string;
  categoryId?: string;
  userId?: string;
}): Promise<{
  total: number;
  updated: number;
  failed: number;
  errors: Array<{ productId: string; error: string }>;
}> {
  const { supplierId, categoryId, userId } = options;

  const where: { supplierId?: string; categoryId?: string; costPrice: { not: null } } = {
    costPrice: { not: null },
  };
  if (supplierId) where.supplierId = supplierId;
  if (categoryId) where.categoryId = categoryId;

  const products = await prisma.product.findMany({
    where,
    include: { supplier: true },
  });

  // Get global settings once
  const settings = await getGlobalSettings();

  // Cache pricing rules to avoid repeated DB queries
  const ruleCache = new Map<string, Awaited<ReturnType<typeof getPricingRule>>>();

  const errors: Array<{ productId: string; error: string }> = [];
  const updates: Array<{ id: string; listPrice: Decimal; priceUpdatedAt: Date; updatedBy?: string }> = [];

  // First pass: calculate all prices and collect updates
  for (const product of products) {
    const cacheKey = `${product.supplierId}:${product.categoryId}:${product.subCategoryId ?? 'null'}`;

    if (!ruleCache.has(cacheKey)) {
      ruleCache.set(cacheKey, await getPricingRule(product.supplierId, product.categoryId, product.subCategoryId));
    }

    const rule = ruleCache.get(cacheKey);

    if (!rule) {
      errors.push({
        productId: product.id,
        error: `No pricing rule for category ${product.categoryId}`,
      });
      continue;
    }

    try {
      const breakdown = calculateListPrice({
        costPrice: Number(product.costPrice),
        isGross: rule.isGross,
        discountPercent: rule.discountPercent ?? undefined,
        eurZarRate: settings.eurZarRate,
        freightPercent: rule.freightPercent,
        marginDivisor: rule.marginDivisor,
        isLocal: product.supplier.isLocal,
      });

      updates.push({
        id: product.id,
        listPrice: new Decimal(breakdown.listPrice),
        priceUpdatedAt: new Date(),
        updatedBy: userId,
      });
    } catch (e) {
      errors.push({
        productId: product.id,
        error: e instanceof Error ? e.message : 'Unknown error',
      });
    }
  }

  // Second pass: batch all updates in a single transaction
  if (updates.length > 0) {
    await prisma.$transaction(
      updates.map(u => prisma.product.update({
        where: { id: u.id },
        data: {
          listPrice: u.listPrice,
          priceUpdatedAt: u.priceUpdatedAt,
          updatedBy: u.updatedBy,
        },
      }))
    );
  }

  return {
    total: products.length,
    updated: updates.length,
    failed: errors.length,
    errors,
  };
}

// Utility functions for rounding
function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundTo4(value: number): number {
  return Math.round(value * 10000) / 10000;
}
