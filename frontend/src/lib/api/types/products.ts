// Product catalog types

import type { StockStatus, StockMovementType } from '@nusaf/shared';

// Product type for orchestration
export type ProductType = 'STOCK_ONLY' | 'ASSEMBLY_REQUIRED' | 'MADE_TO_ORDER' | 'KIT';

export interface CatalogCategory {
  id: string;
  code: string;
  name: string;
  productCount: number;
  subCategories: Array<{
    id: string;
    code: string;
    name: string;
  }>;
}

export interface CatalogProduct {
  id: string;
  nusafSku: string;
  supplierSku: string;
  description: string;
  unitOfMeasure: string;
  supplier: {
    id: string;
    code: string;
    name: string;
  };
  category: {
    id: string;
    code: string;
    name: string;
  };
  subCategory: {
    id: string;
    code: string;
    name: string;
  } | null;
  price: number | null;
  priceLabel: string;
  hasPrice: boolean;
  stockSummary?: {
    totalOnHand: number;
    totalAvailable: number;
    status: StockStatus;
  };
}

export interface StockLocationData {
  warehouseId: string;
  warehouseName: string;
  onHand: number;
  softReserved: number;
  hardReserved: number;
  available: number;
  onOrder: number;
  reorderPoint: number | null;
  reorderQuantity: number | null;
  minimumStock: number | null;
  maximumStock: number | null;
  stockStatus: StockStatus;
}

export interface StockMovement {
  id: string;
  productId: string;
  warehouseId: string;
  warehouseName: string;
  type: StockMovementType;
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface ProductInventory {
  onHand: number;
  available: number;
  reserved: number;
  onOrder: number;
  stockStatus: StockStatus;
  byLocation: StockLocationData[];
}

export interface ProductWithInventory extends CatalogProduct {
  isActive: boolean;
  costPrice: number | null;
  landedCost: number | null;
  listPrice: number | null;
  priceUpdatedAt: string | null;
  productType: ProductType;
  assemblyLeadDays: number | null;
  isConfigurable: boolean;
  longDescription: string | null;
  weight: number | null;
  dimensionsJson: { length?: number; width?: number; height?: number; unit?: string } | null;
  imageUrl: string | null;
  defaultReorderPoint: number | null;
  defaultReorderQty: number | null;
  defaultMinStock: number | null;
  defaultMaxStock: number | null;
  leadTimeDays: number | null;
  supplierId: string;
  categoryId: string;
  subCategoryId: string | null;
  // Marketing content
  marketingTitle: string | null;
  marketingDescription: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  specifications: Record<string, string> | null;
  // Publishing status
  isPublished: boolean;
  publishedAt: string | null;
  // Completeness counts
  imageCount: number;
  documentCount: number;
  // Relations
  inventory?: ProductInventory;
  movements?: StockMovement[];
  // Optional includes
  images?: { id: string; url: string; thumbnailUrl: string | null; altText: string | null; caption: string | null; isPrimary: boolean }[];
  documents?: { id: string; type: string; name: string; fileUrl: string; fileSize: number | null }[];
  crossReferences?: { id: string; competitorBrand: string; competitorSku: string; notes: string | null; isExact: boolean }[];
}

export interface CreateProductData {
  supplierSku: string;
  nusafSku: string;
  description: string;
  supplierId: string;
  categoryId: string;
  subCategoryId?: string | null;
  unitOfMeasure?: string;
  costPrice?: number | null;
  listPrice?: number | null;
  productType?: ProductType;
  assemblyLeadDays?: number | null;
  isConfigurable?: boolean;
  longDescription?: string | null;
  weight?: number | null;
  dimensionsJson?: { length?: number; width?: number; height?: number; unit?: string } | null;
  imageUrl?: string | null;
  defaultReorderPoint?: number | null;
  defaultReorderQty?: number | null;
  defaultMinStock?: number | null;
  defaultMaxStock?: number | null;
  leadTimeDays?: number | null;
}

export interface UpdateProductData {
  supplierSku?: string;
  description?: string;
  supplierId?: string;
  categoryId?: string;
  subCategoryId?: string | null;
  unitOfMeasure?: string;
  isActive?: boolean;
  costPrice?: number | null;
  listPrice?: number | null;
  productType?: ProductType;
  assemblyLeadDays?: number | null;
  isConfigurable?: boolean;
  longDescription?: string | null;
  weight?: number | null;
  dimensionsJson?: { length?: number; width?: number; height?: number; unit?: string } | null;
  imageUrl?: string | null;
  defaultReorderPoint?: number | null;
  defaultReorderQty?: number | null;
  defaultMinStock?: number | null;
  defaultMaxStock?: number | null;
  leadTimeDays?: number | null;
}

// BOM (Bill of Materials) types
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

export interface AddBomComponentInput {
  componentProductId: string;
  quantity: number;
  unitOverride?: string | null;
  notes?: string | null;
  sortOrder?: number;
  isOptional?: boolean;
}

export interface UpdateBomComponentInput {
  quantity?: number;
  unitOverride?: string | null;
  notes?: string | null;
  sortOrder?: number;
  isOptional?: boolean;
}

// Supplier types
export interface Supplier {
  id: string;
  code: string;
  name: string;
  country: string;
  isActive: boolean;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierData {
  code: string;
  name: string;
  country: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  website?: string | null;
  notes?: string | null;
}

export interface UpdateSupplierData {
  name?: string;
  country?: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  website?: string | null;
  notes?: string | null;
  isActive?: boolean;
}
