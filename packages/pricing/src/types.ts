import { CustomerTier, FreightType, ProductType } from "@nusaf/database";

export interface PricingConfig {
  exchangeRateEurZar: number;
  seaFreightPercent: number;
  airFreightPercent: number;
  tierDiscounts: {
    END_USER: number;
    OEM_RESELLER: number;
    DISTRIBUTOR: number;
  };
}

export interface PricingRule {
  categoryId?: string;
  subCategoryId?: string;
  supplierId?: string;
  brand?: string;
  dealerDiscountPercent?: number; // For gross price lists
  freightType: FreightType;
  marginFactor: number; // e.g., 0.5 = 50% margin
  priority: number;
}

export interface ImportedProductCost {
  supplierPriceEur: number;
  isGrossPrice: boolean;
  dealerDiscountPercent?: number;
  freightType: FreightType;
  marginFactor: number;
}

export interface ManufacturedProductCost {
  rawMaterialCost: number;
  machineOperations: {
    type: string;
    hours?: number;
    meters?: number;
    quantity?: number;
    rateAmount: number;
    rateType: "HOURLY" | "PER_METER" | "PER_EACH";
  }[];
  assemblyLaborCost?: number;
  marginFactor: number;
}

export interface AssembledProductCost {
  componentCosts: {
    sku: string;
    costZar: number;
    quantity: number;
  }[];
  assemblyLaborCost: number;
  marginFactor: number;
}

export interface CalculatedPrice {
  costEur?: number;
  costZar: number;
  landedCostZar: number;
  oemPrice: number; // Target OEM price (at 40% discount)
  listPrice: number; // Full list price
  tierPrices: {
    END_USER: number;
    OEM_RESELLER: number;
    DISTRIBUTOR: number;
  };
  breakdown: PriceBreakdown;
}

export interface PriceBreakdown {
  supplierPriceEur?: number;
  dealerDiscountApplied?: number;
  netCostEur?: number;
  exchangeRate?: number;
  costZar?: number;
  freightPercent?: number;
  freightAmount?: number;
  landedCostZar: number;
  marginFactor: number;
  targetOemPrice: number;
  listPrice: number;
  rawMaterialCost?: number;
  machineTimeCost?: number;
  assemblyLaborCost?: number;
  componentsCost?: number;
}
