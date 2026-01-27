// Supplier types

export type SupplierCurrency = 'EUR' | 'ZAR';

export type SkuHandling = 'direct' | 'tecom_conversion' | 'nusaf_internal';

export interface Supplier {
  id: string;
  code: string;
  name: string;
  country: string;
  currency: SupplierCurrency;
  skuHandling: SkuHandling;
  isLocal: boolean;
  isActive: boolean;
  createdAt: Date;
  createdBy?: string;
  updatedAt: Date;
  updatedBy?: string;
}

export interface CreateSupplierInput {
  code: string;
  name: string;
  country?: string;
  currency: SupplierCurrency;
  skuHandling: SkuHandling;
  isLocal?: boolean;
}

export interface UpdateSupplierInput {
  name?: string;
  country?: string;
  currency?: SupplierCurrency;
  skuHandling?: SkuHandling;
  isLocal?: boolean;
  isActive?: boolean;
}

// Predefined suppliers
export const SUPPLIERS = {
  TECOM: 'TECOM',
  CHIARAVALLI: 'CHIARAVALLI',
  REGINA: 'REGINA',
  NUSAF: 'NUSAF',
} as const;
