// Admin types - imports, settings, pricing rules

// Import types
export interface ColumnMapping {
  CODE: string;
  DESCRIPTION: string;
  PRICE: string;
  UM?: string;
  CATEGORY: string;
  SUBCATEGORY?: string;
}

export interface UploadResponse {
  fileId: string;
  fileName: string;
  headers: string[];
  rowCount: number;
  sampleRows: Record<string, unknown>[];
  detectedMapping: Partial<ColumnMapping>;
}

export interface RowValidationResult {
  rowNumber: number;
  isValid: boolean;
  errors: Array<{ field: string; message: string }>;
  warnings: Array<{ field: string; message: string }>;
  data: {
    supplierSku: string;
    nusafSku: string;
    description: string;
    price: number;
    unitOfMeasure: string;
    categoryCode: string;
    subcategoryCode?: string;
  } | null;
}

export interface ImportValidationResult {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  errors: Array<{ code: string; message: string }>;
  rows: RowValidationResult[];
  summary: {
    newProducts: number;
    existingProducts: number;
    categoryBreakdown: Record<string, number>;
  };
}

export interface ImportExecuteResult {
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ rowNumber: number; message: string }>;
  total: number;
}

export interface ImportSupplier {
  code: string;
  name: string;
  country: string;
}

export interface ImportCategory {
  code: string;
  name: string;
  subcategories: Array<{ code: string; name: string }>;
}

export interface ImportCategoriesResponse {
  categoryCount: number;
  subCategoryCount: number;
  categories: ImportCategory[];
}

export interface ImportHistoryItem {
  id: string;
  fileName: string;
  supplierCode: string;
  status: 'PENDING' | 'VALIDATING' | 'VALIDATED' | 'IMPORTING' | 'COMPLETED' | 'FAILED';
  totalRows: number;
  processedRows: number;
  successRows: number;
  errorRows: number;
  createdAt: string;
  completedAt: string | null;
  rowCount: number;
}

// Global settings types
export interface GlobalSettings {
  eurZarRate: number;
  rateUpdatedAt: string;
  rateUpdatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsData {
  eurZarRate: number;
}

// Pricing rule types
export interface PricingRuleRef {
  id: string;
  code: string;
  name: string;
}

export interface PricingRule {
  id: string;
  supplier: PricingRuleRef;
  category: PricingRuleRef;
  subCategory: PricingRuleRef | null;
  isGross: boolean;
  discountPercent: number | null;
  freightPercent: number;
  marginDivisor: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePricingRuleData {
  supplierId: string;
  categoryId: string;
  subCategoryId?: string | null;
  isGross: boolean;
  discountPercent?: number | null;
  freightPercent: number;
  marginDivisor: number;
}

export interface UpdatePricingRuleData {
  isGross?: boolean;
  discountPercent?: number | null;
  freightPercent?: number;
  marginDivisor?: number;
}

export interface RecalculatePricesResult {
  updated: number;
  total: number;
}
