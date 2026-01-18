import { CustomerTier, FreightType } from "@prisma/client";
import {
  PricingConfig,
  ImportedProductCost,
  ManufacturedProductCost,
  AssembledProductCost,
  CalculatedPrice,
  PriceBreakdown,
} from "./types";

/**
 * NUSAF Pricing Engine
 *
 * Pricing calculation follows this flow:
 *
 * IMPORTED PRODUCTS:
 * 1. Supplier Price (EUR) - gross or net
 * 2. If gross: Apply dealer discount → Net cost (EUR)
 * 3. Convert to ZAR: Net × Exchange Rate = Cost (ZAR)
 * 4. Add freight: Cost × (1 + Freight %) = Landed Cost (ZAR)
 * 5. Calculate OEM Price: Landed Cost ÷ Margin Factor
 * 6. Calculate List Price: OEM Price ÷ 0.60 (ensures 40% OEM discount)
 *
 * MANUFACTURED PRODUCTS:
 * 1. Raw Material Cost
 * 2. Add Machine Time (hours × rate)
 * 3. Add Labor (if applicable)
 * 4. Result = Product Cost
 * 5-6. Same as imported
 *
 * ASSEMBLED PRODUCTS:
 * 1. Sum Component Costs
 * 2. Add Assembly Labor
 * 3. Result = Product Cost
 * 4-5. Same as imported
 *
 * Customer pricing:
 * - End User: List Price × (1 - 30%)
 * - OEM/Reseller: List Price × (1 - 40%)
 * - Distributor: List Price × (1 - 50%)
 */

export class PricingCalculator {
  constructor(private config: PricingConfig) {}

  /**
   * Calculate pricing for imported products
   */
  calculateImportedProduct(input: ImportedProductCost): CalculatedPrice {
    const {
      supplierPriceEur,
      isGrossPrice,
      dealerDiscountPercent = 0,
      freightType,
      marginFactor,
    } = input;

    // Step 1-2: Apply dealer discount if gross price
    let netCostEur = supplierPriceEur;
    let dealerDiscountApplied = 0;
    if (isGrossPrice && dealerDiscountPercent > 0) {
      dealerDiscountApplied = supplierPriceEur * (dealerDiscountPercent / 100);
      netCostEur = supplierPriceEur - dealerDiscountApplied;
    }

    // Step 3: Convert to ZAR
    const costZar = netCostEur * this.config.exchangeRateEurZar;

    // Step 4: Add freight
    const freightPercent =
      freightType === FreightType.AIR
        ? this.config.airFreightPercent
        : this.config.seaFreightPercent;
    const freightAmount = costZar * (freightPercent / 100);
    const landedCostZar = costZar + freightAmount;

    // Step 5: Calculate target OEM price
    const targetOemPrice = landedCostZar / marginFactor;

    // Step 6: Calculate list price (OEM is 40% off list)
    const listPrice = targetOemPrice / (1 - this.config.tierDiscounts.OEM_RESELLER / 100);

    // Calculate tier prices
    const tierPrices = this.calculateTierPrices(listPrice);

    const breakdown: PriceBreakdown = {
      supplierPriceEur,
      dealerDiscountApplied: isGrossPrice ? dealerDiscountApplied : undefined,
      netCostEur,
      exchangeRate: this.config.exchangeRateEurZar,
      costZar,
      freightPercent,
      freightAmount,
      landedCostZar,
      marginFactor,
      targetOemPrice,
      listPrice,
    };

    return {
      costEur: netCostEur,
      costZar,
      landedCostZar,
      oemPrice: targetOemPrice,
      listPrice,
      tierPrices,
      breakdown,
    };
  }

  /**
   * Calculate pricing for manufactured products
   */
  calculateManufacturedProduct(input: ManufacturedProductCost): CalculatedPrice {
    const { rawMaterialCost, machineOperations, assemblyLaborCost = 0, marginFactor } = input;

    // Calculate machine time cost
    let machineTimeCost = 0;
    for (const op of machineOperations) {
      switch (op.rateType) {
        case "HOURLY":
          machineTimeCost += (op.hours || 0) * op.rateAmount;
          break;
        case "PER_METER":
          machineTimeCost += (op.meters || 0) * op.rateAmount;
          break;
        case "PER_EACH":
          machineTimeCost += (op.quantity || 0) * op.rateAmount;
          break;
      }
    }

    // Total product cost
    const productCost = rawMaterialCost + machineTimeCost + assemblyLaborCost;
    const landedCostZar = productCost; // No freight for manufactured

    // Calculate target OEM price
    const targetOemPrice = landedCostZar / marginFactor;

    // Calculate list price
    const listPrice = targetOemPrice / (1 - this.config.tierDiscounts.OEM_RESELLER / 100);

    // Calculate tier prices
    const tierPrices = this.calculateTierPrices(listPrice);

    const breakdown: PriceBreakdown = {
      rawMaterialCost,
      machineTimeCost,
      assemblyLaborCost: assemblyLaborCost > 0 ? assemblyLaborCost : undefined,
      landedCostZar,
      marginFactor,
      targetOemPrice,
      listPrice,
    };

    return {
      costZar: productCost,
      landedCostZar,
      oemPrice: targetOemPrice,
      listPrice,
      tierPrices,
      breakdown,
    };
  }

  /**
   * Calculate pricing for assembled products (BOM)
   */
  calculateAssembledProduct(input: AssembledProductCost): CalculatedPrice {
    const { componentCosts, assemblyLaborCost, marginFactor } = input;

    // Sum component costs
    const totalComponentsCost = componentCosts.reduce(
      (sum, comp) => sum + comp.costZar * comp.quantity,
      0
    );

    // Total product cost
    const productCost = totalComponentsCost + assemblyLaborCost;
    const landedCostZar = productCost;

    // Calculate target OEM price
    const targetOemPrice = landedCostZar / marginFactor;

    // Calculate list price
    const listPrice = targetOemPrice / (1 - this.config.tierDiscounts.OEM_RESELLER / 100);

    // Calculate tier prices
    const tierPrices = this.calculateTierPrices(listPrice);

    const breakdown: PriceBreakdown = {
      componentsCost: totalComponentsCost,
      assemblyLaborCost,
      landedCostZar,
      marginFactor,
      targetOemPrice,
      listPrice,
    };

    return {
      costZar: productCost,
      landedCostZar,
      oemPrice: targetOemPrice,
      listPrice,
      tierPrices,
      breakdown,
    };
  }

  /**
   * Calculate prices for all customer tiers
   */
  private calculateTierPrices(listPrice: number): Record<CustomerTier, number> {
    return {
      END_USER: listPrice * (1 - this.config.tierDiscounts.END_USER / 100),
      OEM_RESELLER: listPrice * (1 - this.config.tierDiscounts.OEM_RESELLER / 100),
      DISTRIBUTOR: listPrice * (1 - this.config.tierDiscounts.DISTRIBUTOR / 100),
    };
  }

  /**
   * Get the price for a specific customer tier
   */
  getPriceForTier(listPrice: number, tier: CustomerTier): number {
    const discount = this.config.tierDiscounts[tier] / 100;
    return listPrice * (1 - discount);
  }

  /**
   * Round price to standard pricing increments
   * Optional: can be used to round to .00, .50, or nearest 5/10
   */
  roundPrice(price: number, precision: "cent" | "rand" | "five" = "cent"): number {
    switch (precision) {
      case "cent":
        return Math.round(price * 100) / 100;
      case "rand":
        return Math.round(price);
      case "five":
        return Math.round(price / 5) * 5;
      default:
        return price;
    }
  }
}

/**
 * Create a pricing calculator with system config
 */
export async function createPricingCalculator(
  prisma: any
): Promise<PricingCalculator> {
  const config = await prisma.systemConfig.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (!config) {
    throw new Error("System configuration not found. Please configure pricing settings.");
  }

  return new PricingCalculator({
    exchangeRateEurZar: Number(config.exchangeRateEurZar),
    seaFreightPercent: Number(config.defaultSeaFreightPercent),
    airFreightPercent: Number(config.defaultAirFreightPercent),
    tierDiscounts: {
      END_USER: Number(config.tierDiscountEndUser),
      OEM_RESELLER: Number(config.tierDiscountOem),
      DISTRIBUTOR: Number(config.tierDiscountDistributor),
    },
  });
}
