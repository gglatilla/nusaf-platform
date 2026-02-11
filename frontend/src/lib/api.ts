import type {
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  AuthenticatedUser,
  ApiResponse,
  // Inventory types
  Warehouse,
  StockStatus,
  StockMovementType,
  // Order types
  SalesOrderStatus,
  QuoteStatus,
  PickingSlipStatus,
  JobCardStatus,
  JobType,
  FulfillmentPolicy,
} from '@nusaf/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

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

// Product catalog types
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

// ============================================
// PUBLIC PRODUCTS API TYPES (No Auth Required)
// ============================================

export interface PublicProductImage {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  caption: string | null;
  isPrimary: boolean;
}

export type ProductDocumentType =
  | 'DATASHEET'
  | 'CATALOG'
  | 'CAD_DRAWING'
  | 'INSTALLATION_MANUAL'
  | 'CERTIFICATE'
  | 'MSDS'
  | 'OTHER'
  // CAD 2D formats
  | 'CAD_2D_DXF'
  | 'CAD_2D_DWG'
  | 'CAD_2D_PDF'
  // CAD 3D formats
  | 'CAD_3D_STEP'
  | 'CAD_3D_IGES'
  | 'CAD_3D_SAT'
  | 'CAD_3D_PARASOLID'
  | 'CAD_3D_SOLIDWORKS'
  | 'CAD_3D_INVENTOR'
  | 'CAD_3D_CATIA';

export interface PublicProductDocument {
  id: string;
  type: ProductDocumentType;
  name: string;
  fileUrl: string;
  fileSize: number | null;
}

export interface PublicCrossReference {
  id: string;
  competitorBrand: string;
  competitorSku: string;
  notes: string | null;
  isExact: boolean;
}

export interface PublicProduct {
  id: string;
  sku: string;
  title: string;
  description: string | null;
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
  primaryImage: {
    url: string;
    thumbnailUrl: string | null;
    altText: string | null;
  } | null;
  unitOfMeasure: string;
  crossReferences?: PublicCrossReference[];
}

export interface PublicProductDetail extends Omit<PublicProduct, 'primaryImage'> {
  specifications: Record<string, string | number | boolean> | null;
  metaTitle: string | null;
  metaDescription: string | null;
  images: PublicProductImage[];
  documents: PublicProductDocument[];
  crossReferences: PublicCrossReference[];
}

export interface PublicProductsParams {
  categoryId?: string;
  categoryCode?: string;  // Category code (e.g., "C") or slug (e.g., "conveyor-components")
  subCategoryId?: string;
  subCategoryCode?: string;  // Subcategory code (e.g., "C-001") or slug (e.g., "bases")
  search?: string;
  specs?: Record<string, string>;  // Specification filters (e.g., { pitch: "12.7", teeth: "15" })
  page?: number;
  pageSize?: number;
}

export interface PublicProductsResponse {
  products: PublicProduct[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
  };
  filters?: {
    categoryId: string | null;
    subCategoryId: string | null;
    search: string | null;
    specs: Record<string, string> | null;
  };
}

export interface PublicProductSearchParams {
  q: string;
  page?: number;
  pageSize?: number;
}

export interface PublicProductSearchResponse {
  products: PublicProduct[];
  pagination: {
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
  searchTerm: string;
}

export interface RelatedProductsResponse {
  products: PublicProduct[];
  sourceProductSku: string;
  categoryId: string;
  subCategoryId: string | null;
}

// Specification filter types for dynamic filtering
export interface SpecificationOption {
  key: string;
  label: string;
  values: string[];
  valueCount: number;
}

export interface SpecificationsParams {
  categoryId?: string;
  categoryCode?: string;
  subCategoryId?: string;
  subCategoryCode?: string;
}

export interface SpecificationsResponse {
  specifications: SpecificationOption[];
  productCount: number;
  categoryId: string | null;
  subCategoryId: string | null;
}

// ============================================
// PUBLIC CATEGORIES API TYPES (No Auth Required)
// ============================================

export interface PublicSubCategory {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  productCount: number;
}

export interface PublicCategory {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  productCount: number;
  subCategories: PublicSubCategory[];
}

export interface PublicCategoriesResponse {
  categories: PublicCategory[];
}

export interface PublicCategoryWithParent extends PublicSubCategory {
  category: {
    id: string;
    code: string;
    name: string;
    slug: string;
  };
}

export interface PublicCrossRefSearchParams {
  q: string;
  brand?: string;
}

export interface PublicCrossRefSearchResult {
  crossReference: {
    competitorBrand: string;
    competitorSku: string;
    isExact: boolean;
    notes: string | null;
  };
  product: PublicProduct;
}

export interface PublicCrossRefSearchResponse {
  results: PublicCrossRefSearchResult[];
  searchedPartNumber: string;
  searchedBrand: string | null;
}

// Product type for orchestration
export type ProductType = 'STOCK_ONLY' | 'ASSEMBLY_REQUIRED' | 'MADE_TO_ORDER' | 'KIT';

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
  // Publishing status
  isPublished?: boolean;
  publishedAt?: string | null;
  // Primary image for thumbnail
  primaryImage?: {
    url: string;
    thumbnailUrl: string | null;
  } | null;
}

// Re-export inventory types from shared
export type { Warehouse, StockStatus, StockMovementType } from '@nusaf/shared';

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
  // Core editable fields
  isActive: boolean;
  costPrice: number | null;     // Raw supplier cost in EUR
  landedCost: number | null;    // Calculated: Supplier EUR × EUR/ZAR × (1 + Freight%)
  listPrice: number | null;     // Base selling price in ZAR
  priceUpdatedAt: string | null;

  // Classification
  productType: ProductType;
  assemblyLeadDays: number | null;
  isConfigurable: boolean;

  // Extended info
  longDescription: string | null;
  weight: number | null;
  dimensionsJson: { length?: number; width?: number; height?: number; unit?: string } | null;
  imageUrl: string | null;

  // Inventory defaults
  defaultReorderPoint: number | null;
  defaultReorderQty: number | null;
  defaultMinStock: number | null;
  defaultMaxStock: number | null;
  leadTimeDays: number | null;

  // Foreign keys for editing
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

  // Inventory data (when ?include=inventory)
  inventory?: ProductInventory;
  // Movements (when ?include=movements)
  movements?: StockMovement[];
  // Images (when ?include=images)
  images?: PublicProductImage[];
  // Documents (when ?include=documents)
  documents?: PublicProductDocument[];
  // Cross-references (when ?include=crossReferences)
  crossReferences?: PublicCrossReference[];
}

// Product create/update types
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
  supplierLeadDays?: number | null;
  reorderPoint?: number | null;
  reorderQty?: number | null;
  minStock?: number | null;
  maxStock?: number | null;
  // Marketing fields
  marketingTitle?: string | null;
  marketingDescription?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  specifications?: Record<string, string> | null;
}

// ============================================
// BOM (BILL OF MATERIALS) TYPES
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

export interface WhereUsedItem {
  id: string;
  nusafSku: string;
  description: string;
  quantity: number;
}

export interface CreateStockAdjustmentData {
  warehouseId: string;
  adjustmentType: 'ADD' | 'REMOVE' | 'SET';
  quantity: number;
  reason: string;
}

// Inventory dashboard types
export interface InventorySummary {
  totalProducts: number;
  belowReorderPoint: number;
  pendingAdjustments: number;
  movementsToday: number;
}

// Inventory Dashboard (aggregated) types
export interface WarehouseStockSummary {
  location: 'JHB' | 'CT';
  totalSKUs: number;
  totalOnHand: number;
  totalAvailable: number;
  totalOnOrder: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface LowStockAlertItem {
  productId: string;
  nusafSku: string;
  description: string;
  location: 'JHB' | 'CT';
  onHand: number;
  available: number;
  reorderPoint: number;
  shortfall: number;
}

export interface PendingAdjustmentItem {
  id: string;
  adjustmentNumber: string;
  location: 'JHB' | 'CT';
  reason: string;
  lineCount: number;
  createdAt: string;
  createdByName: string | null;
}

export interface ActiveCycleCountItem {
  id: string;
  sessionNumber: string;
  location: 'JHB' | 'CT';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  totalLines: number;
  countedLines: number;
  createdAt: string;
}

export interface RecentMovementItem {
  id: string;
  productSku: string;
  productDescription: string;
  location: 'JHB' | 'CT';
  movementType: string;
  quantity: number;
  referenceNumber: string | null;
  referenceType: string | null;
  createdAt: string;
}

export interface InventoryDashboardData {
  summary: {
    totalSKUs: number;
    totalStockValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    pendingAdjustments: number;
    activeCycleCounts: number;
    movementsToday: number;
  };
  warehouseBreakdown: WarehouseStockSummary[];
  lowStockAlerts: {
    count: number;
    items: LowStockAlertItem[];
  };
  pendingAdjustments: {
    count: number;
    items: PendingAdjustmentItem[];
  };
  activeCycleCounts: {
    count: number;
    items: ActiveCycleCountItem[];
  };
  recentMovements: {
    todayCount: number;
    items: RecentMovementItem[];
  };
}

export interface StockLevelsQueryParams {
  location?: string;
  categoryId?: string;
  lowStockOnly?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface StockLevelItem {
  id: string;
  productId: string;
  product: {
    id: string;
    nusafSku: string;
    description: string;
    category?: { name: string };
  };
  location: 'JHB' | 'CT';
  onHand: number;
  softReserved: number;
  hardReserved: number;
  onOrder: number;
  available: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'ON_ORDER' | 'OVERSTOCK';
  reorderPoint: number | null;
  reorderQuantity: number | null;
  minimumStock: number | null;
  maximumStock: number | null;
}

export interface StockLevelsResponse {
  stockLevels: StockLevelItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface LowStockProduct {
  id: string;
  productId: string;
  product: {
    id: string;
    nusafSku: string;
    description: string;
    unitOfMeasure: string;
    category?: { id: string; name: string };
  };
  supplier: {
    id: string;
    code: string;
    name: string;
    currency: SupplierCurrency;
  };
  costPrice: number | null;
  leadTimeDays: number | null;
  location: 'JHB' | 'CT';
  onHand: number;
  onOrder: number;
  available: number;
  reorderPoint: number | null;
  reorderQuantity: number | null;
  minimumStock: number | null;
  stockStatus: 'LOW_STOCK' | 'OUT_OF_STOCK';
  shortfall: number;
}

export interface LowStockProductsResponse {
  lowStockProducts: LowStockProduct[];
}

export interface StockAdjustmentsQueryParams {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  location?: string;
  reason?: string;
  page?: number;
  pageSize?: number;
}

export interface StockAdjustmentLine {
  id: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  currentQuantity: number;
  adjustedQuantity: number;
  difference: number;
  notes: string | null;
}

export interface StockAdjustment {
  id: string;
  adjustmentNumber: string;
  location: 'JHB' | 'CT';
  reason: string;
  notes: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  lines: StockAdjustmentLine[];
  createdBy: string;
  createdAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
  rejectedAt: string | null;
  rejectedBy: string | null;
  rejectionReason: string | null;
}

export type StockAdjustmentReason =
  | 'INITIAL_COUNT'
  | 'CYCLE_COUNT'
  | 'DAMAGED'
  | 'EXPIRED'
  | 'FOUND'
  | 'LOST'
  | 'DATA_CORRECTION'
  | 'OTHER';

export interface CreateInventoryAdjustmentData {
  location: 'JHB' | 'CT';
  reason: StockAdjustmentReason;
  notes?: string;
  lines: Array<{
    productId: string;
    adjustedQuantity: number;
    notes?: string;
  }>;
}

export interface StockAdjustmentsResponse {
  adjustments: StockAdjustment[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface StockMovementsQueryParams {
  location?: string;
  movementType?: string;
  productId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface StockMovementItem {
  id: string;
  productId: string;
  product: {
    id: string;
    nusafSku: string;
    description: string;
  };
  location: string;
  movementType: string;
  quantity: number;
  balanceAfter: number;
  referenceType: string | null;
  referenceId: string | null;
  referenceNumber: string | null;
  adjustmentReason: string | null;
  notes: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface StockMovementsResponse {
  movements: StockMovementItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface UpdateReorderSettingsData {
  reorderPoint?: number | null;
  reorderQuantity?: number | null;
  minimumStock?: number | null;
  maximumStock?: number | null;
}

// ============================================
// CYCLE COUNT TYPES
// ============================================

export type CycleCountStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'RECONCILED' | 'CANCELLED';

export interface CycleCountLine {
  id: string;
  productId: string;
  productSku: string;
  productDescription: string;
  systemQuantity: number;
  countedQuantity: number | null;
  variance: number | null;
  countedAt: string | null;
  countedBy: string | null;
  notes: string | null;
}

export interface CycleCountSession {
  id: string;
  sessionNumber: string;
  location: 'JHB' | 'CT';
  status: CycleCountStatus;
  notes: string | null;
  adjustmentId: string | null;
  adjustmentNumber: string | null;
  lines: CycleCountLine[];
  lineCount: number;
  countedLineCount: number;
  createdAt: string;
  createdBy: string;
  completedAt: string | null;
  completedBy: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
}

export interface CycleCountSessionSummary {
  id: string;
  sessionNumber: string;
  location: 'JHB' | 'CT';
  status: CycleCountStatus;
  lineCount: number;
  countedLineCount: number;
  adjustmentNumber: string | null;
  createdAt: string;
  createdBy: string;
  completedAt: string | null;
}

export interface CycleCountsQueryParams {
  location?: string;
  status?: CycleCountStatus;
  page?: number;
  pageSize?: number;
}

export interface CycleCountsResponse {
  sessions: CycleCountSessionSummary[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface CreateCycleCountData {
  location: 'JHB' | 'CT';
  productIds: string[];
  notes?: string;
}

export interface SubmitCycleCountLinesData {
  lines: Array<{ lineId: string; countedQuantity: number; notes?: string }>;
}

export interface ProductsResponse {
  products: CatalogProduct[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ProductsQueryParams {
  categoryId?: string;
  subCategoryId?: string;
  supplierId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  include?: string;
  stockStatus?: string;
  warehouseId?: string;
  isPublished?: string;
  /** Staff: override tier to show customer-specific prices */
  customerTier?: string;
}

// Recalculate prices response
export interface RecalculatePricesResult {
  updated: number;
  total: number;
}

// Re-export quote types from shared
export type { QuoteStatus } from '@nusaf/shared';

export interface StockWarning {
  available: number;
  requested: number;
}

export interface QuoteItem {
  id: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  stockWarning?: StockWarning;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  status: QuoteStatus;
  customerTier: string;
  company: {
    id: string;
    name: string;
    isCashAccount?: boolean;
  };
  items: QuoteItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  customerNotes: string | null;
  cashCustomerName: string | null;
  cashCustomerPhone: string | null;
  cashCustomerEmail: string | null;
  cashCustomerCompany: string | null;
  cashCustomerVat: string | null;
  cashCustomerAddress: string | null;
  validUntil: string | null;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
  convertedOrder?: { id: string; orderNumber: string } | null;
}

export interface QuoteListItem {
  id: string;
  quoteNumber: string;
  status: QuoteStatus;
  itemCount: number;
  total: number;
  validUntil: string | null;
  createdAt: string;
  companyName?: string;
  cashCustomerName?: string | null;
  isCashAccount?: boolean;
}

export interface QuotesListResponse {
  quotes: QuoteListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface ActiveDraftQuote {
  id: string;
  quoteNumber: string;
  itemCount: number;
  items: QuoteItem[];
  subtotal: number;
  vatAmount: number;
  total: number;
}

export interface CreateQuoteResponse {
  id: string;
  quoteNumber: string;
  isNew: boolean;
}

export interface CashCustomerInput {
  cashCustomerName?: string;
  cashCustomerPhone?: string;
  cashCustomerEmail?: string;
  cashCustomerCompany?: string;
  cashCustomerVat?: string;
  cashCustomerAddress?: string;
}

export interface AddQuoteItemData {
  productId: string;
  quantity: number;
}

export interface AddQuoteItemResponse {
  id: string;
  lineNumber: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  stockWarning?: StockWarning;
}

export interface FinalizeQuoteResponse {
  id: string;
  quoteNumber: string;
  validUntil: string;
}

export interface QuotesQueryParams {
  status?: QuoteStatus;
  page?: number;
  pageSize?: number;
}

// Re-export sales order types from shared
export type { SalesOrderStatus, FulfillmentPolicy } from '@nusaf/shared';

export type FulfillmentType = 'STOCK_ONLY' | 'ASSEMBLY_REQUIRED' | 'MIXED';
export type SalesOrderLineStatus = 'PENDING' | 'PICKING' | 'PICKED' | 'SHIPPED' | 'DELIVERED';

export interface SalesOrderLine {
  id: string;
  lineNumber: number;
  status: SalesOrderLineStatus;
  productId: string;
  productSku: string;
  productDescription: string;
  quantityOrdered: number;
  quantityPicked: number;
  quantityShipped: number;
  unitPrice: number;
  lineTotal: number;
  notes: string | null;
}

export type OrderPaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'NOT_REQUIRED';
export type PaymentMethod = 'EFT' | 'CREDIT_CARD' | 'CASH' | 'CHEQUE' | 'OTHER';
export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'VOIDED';

export interface Payment {
  id: string;
  paymentNumber: string;
  orderId: string;
  companyId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  paymentDate: string;
  receivedBy: string;
  receivedByName: string;
  notes: string | null;
  status: PaymentStatus;
  voidedAt: string | null;
  voidedBy: string | null;
  voidReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentSummary {
  id: string;
  paymentNumber: string;
  amount: number;
  paymentDate: string;
  status: PaymentStatus;
}

export interface RecordPaymentData {
  amount: number;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  paymentDate: string;
  notes?: string;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  status: SalesOrderStatus;
  paymentTerms: PaymentTermsType;
  paymentStatus: OrderPaymentStatus;
  company: {
    id: string;
    name: string;
  };
  quoteId: string | null;
  quoteNumber: string | null;
  customerPoNumber: string | null;
  customerPoDate: string | null;
  fulfillmentType: FulfillmentType;
  warehouse: Warehouse;
  requiredDate: string | null;
  promisedDate: string | null;
  shippedDate: string | null;
  deliveredDate: string | null;
  lines: SalesOrderLine[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  internalNotes: string | null;
  customerNotes: string | null;
  holdReason: string | null;
  cancelReason: string | null;
  cashCustomerName: string | null;
  cashCustomerPhone: string | null;
  cashCustomerEmail: string | null;
  cashCustomerCompany: string | null;
  cashCustomerVat: string | null;
  cashCustomerAddress: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SalesOrderListItem {
  id: string;
  orderNumber: string;
  status: SalesOrderStatus;
  paymentTerms: PaymentTermsType;
  paymentStatus: OrderPaymentStatus;
  quoteNumber: string | null;
  customerPoNumber: string | null;
  companyName?: string;
  lineCount: number;
  total: number;
  createdAt: string;
}

export interface SalesOrdersListResponse {
  orders: SalesOrderListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface CreateOrderFromQuoteData {
  quoteId: string;
  customerPoNumber?: string;
  customerPoDate?: string;
  requiredDate?: string;
  customerNotes?: string;
}

export interface CheckoutQuoteData {
  shippingAddressId?: string;
  customerPoNumber: string;
  customerPoDate?: string | null;
  requiredDate?: string | null;
  customerNotes?: string | null;
}

export interface CheckoutQuoteResponse {
  message: string;
  orderId: string;
  orderNumber: string;
  paymentRequired: boolean;
  fulfillmentTriggered: boolean;
  proformaGenerated: boolean;
}

export interface CreateOrderResponse {
  id: string;
  orderNumber: string;
}

export interface OrdersQueryParams {
  status?: SalesOrderStatus;
  page?: number;
  pageSize?: number;
}

// Timeline event for order activity log
export type TimelineEventType =
  | 'ORDER_CREATED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_PROCESSING'
  | 'ORDER_READY_TO_SHIP'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_ON_HOLD'
  | 'ORDER_HOLD_RELEASED'
  | 'ORDER_CANCELLED'
  | 'PICKING_SLIP_CREATED'
  | 'PICKING_SLIP_STARTED'
  | 'PICKING_SLIP_COMPLETED'
  | 'JOB_CARD_CREATED'
  | 'JOB_CARD_STARTED'
  | 'JOB_CARD_ON_HOLD'
  | 'JOB_CARD_COMPLETED'
  | 'TRANSFER_CREATED'
  | 'TRANSFER_SHIPPED'
  | 'TRANSFER_RECEIVED'
  | 'FULFILLMENT_PLAN_EXECUTED';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: TimelineEventType;
  title: string;
  description: string | null;
  actor: string | null;
  documentType: string | null;
  documentId: string | null;
  documentNumber: string | null;
}

// Re-export picking slip types from shared
export type { PickingSlipStatus } from '@nusaf/shared';

export interface PickingSlipLine {
  id: string;
  orderLineId: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  quantityToPick: number;
  quantityPicked: number;
  pickedAt: string | null;
  pickedBy: string | null;
  binLocation: string | null;
}

export interface PickingSlip {
  id: string;
  pickingSlipNumber: string;
  companyId: string;
  orderId: string;
  orderNumber: string;
  location: Warehouse;
  status: PickingSlipStatus;
  assignedTo: string | null;
  assignedToName: string | null;
  startedAt: string | null;
  completedAt: string | null;
  lines: PickingSlipLine[];
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
}

export interface PickingSlipListItem {
  id: string;
  pickingSlipNumber: string;
  orderNumber: string;
  orderId: string;
  location: Warehouse;
  status: PickingSlipStatus;
  assignedToName: string | null;
  lineCount: number;
  createdAt: string;
}

export interface PickingSlipsListResponse {
  pickingSlips: PickingSlipListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface PickingSlipsQueryParams {
  orderId?: string;
  location?: Warehouse;
  status?: PickingSlipStatus;
  page?: number;
  pageSize?: number;
}

export interface GeneratePickingSlipsLineInput {
  orderLineId: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  quantityToPick: number;
  location: Warehouse;
}

export interface GeneratePickingSlipsData {
  lines: GeneratePickingSlipsLineInput[];
}

export interface GeneratePickingSlipsResponse {
  pickingSlips: Array<{ id: string; pickingSlipNumber: string; location: Warehouse }>;
  errors?: string[];
}

export interface OrderPickingSlipSummary {
  id: string;
  pickingSlipNumber: string;
  location: Warehouse;
  status: PickingSlipStatus;
  lineCount: number;
  assignedToName: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

// ============================================
// DELIVERY NOTE TYPES
// ============================================

export type DeliveryNoteStatus = 'DRAFT' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';

export interface DeliveryNoteLine {
  id: string;
  orderLineId: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  unitOfMeasure: string;
  quantityOrdered: number;
  quantityDispatched: number;
  quantityReceived: number;
  quantityDamaged: number;
  damageNotes: string | null;
}

export interface DeliveryNote {
  id: string;
  deliveryNoteNumber: string;
  companyId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  deliveryAddress: string | null;
  location: Warehouse;
  status: DeliveryNoteStatus;
  dispatchedAt: string | null;
  dispatchedBy: string | null;
  dispatchedByName: string | null;
  deliveredAt: string | null;
  deliveredByName: string | null;
  signatureNotes: string | null;
  notes: string | null;
  lines: DeliveryNoteLine[];
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
}

export interface DeliveryNoteListItem {
  id: string;
  deliveryNoteNumber: string;
  orderNumber: string;
  orderId: string;
  customerName: string;
  location: Warehouse;
  status: DeliveryNoteStatus;
  lineCount: number;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

export interface DeliveryNotesListResponse {
  deliveryNotes: DeliveryNoteListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface DeliveryNotesQueryParams {
  orderId?: string;
  status?: DeliveryNoteStatus;
  location?: Warehouse;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateDeliveryNoteLineInput {
  orderLineId: string;
  productId: string;
  productSku: string;
  productDescription: string;
  unitOfMeasure: string;
  quantityOrdered: number;
  quantityDispatched: number;
}

export interface CreateDeliveryNoteData {
  location?: Warehouse;
  deliveryAddress?: string;
  notes?: string;
  lines: CreateDeliveryNoteLineInput[];
}

export interface ConfirmDeliveryLineInput {
  lineId: string;
  quantityReceived: number;
  quantityDamaged?: number;
  damageNotes?: string;
}

export interface ConfirmDeliveryData {
  deliveredByName: string;
  signatureNotes?: string;
  lines: ConfirmDeliveryLineInput[];
}

export interface OrderDeliveryNoteSummary {
  id: string;
  deliveryNoteNumber: string;
  location: Warehouse;
  status: DeliveryNoteStatus;
  lineCount: number;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

// ============================================
// PROFORMA INVOICE TYPES
// ============================================

export type ProformaInvoiceStatus = 'ACTIVE' | 'VOIDED';

export interface ProformaInvoiceLine {
  id: string;
  orderLineId: string;
  lineNumber: number;
  productSku: string;
  productDescription: string;
  unitOfMeasure: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ProformaInvoice {
  id: string;
  proformaNumber: string;
  companyId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPoNumber: string | null;
  billingAddress: string | null;
  status: ProformaInvoiceStatus;
  issueDate: string;
  validUntil: string;
  paymentTerms: string;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  voidedAt: string | null;
  voidedBy: string | null;
  voidReason: string | null;
  notes: string | null;
  lines: ProformaInvoiceLine[];
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
}

export interface ProformaInvoiceSummary {
  id: string;
  proformaNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  status: ProformaInvoiceStatus;
  issueDate: string;
  total: number;
  createdAt: string;
}

export interface CreateProformaInvoiceData {
  notes?: string;
  paymentTerms?: string;
}

// ============================================
// TAX INVOICE TYPES
// ============================================

export type TaxInvoiceStatus = 'DRAFT' | 'ISSUED' | 'VOIDED';

export interface TaxInvoiceLine {
  id: string;
  orderLineId: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  unitOfMeasure: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface TaxInvoice {
  id: string;
  invoiceNumber: string;
  companyId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerVatNumber: string | null;
  customerRegNumber: string | null;
  billingAddress: string | null;
  paymentTerms: string;
  status: TaxInvoiceStatus;
  issueDate: string;
  dueDate: string | null;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  pdfUrl: string | null;
  voidedAt: string | null;
  voidedBy: string | null;
  voidReason: string | null;
  notes: string | null;
  issuedBy: string;
  issuedByName: string;
  lines: TaxInvoiceLine[];
  createdAt: string;
  updatedAt: string;
}

export interface TaxInvoiceSummary {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  status: TaxInvoiceStatus;
  issueDate: string;
  dueDate: string | null;
  paymentTerms: string;
  total: number;
  createdAt: string;
}

export interface TaxInvoicesListResponse {
  data: TaxInvoiceSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TaxInvoicesQueryParams {
  status?: TaxInvoiceStatus;
  companyId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  paymentTerms?: string;
  overdue?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CreateTaxInvoiceData {
  notes?: string;
}

// ============================================
// CREDIT NOTE TYPES
// ============================================

export type CreditNoteStatus = 'DRAFT' | 'ISSUED' | 'VOIDED';

export interface CreditNoteLine {
  id: string;
  returnAuthorizationLineId: string | null;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  unitOfMeasure: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  resolution: string | null;
}

export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  companyId: string;
  orderId: string | null;
  orderNumber: string | null;
  returnAuthorizationId: string;
  raNumber: string;
  customerName: string;
  customerVatNumber: string | null;
  customerRegNumber: string | null;
  billingAddress: string | null;
  status: CreditNoteStatus;
  issueDate: string;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  pdfUrl: string | null;
  voidedAt: string | null;
  voidedBy: string | null;
  voidReason: string | null;
  notes: string | null;
  issuedBy: string;
  issuedByName: string;
  lines: CreditNoteLine[];
  createdAt: string;
  updatedAt: string;
}

export interface CreditNoteSummary {
  id: string;
  creditNoteNumber: string;
  orderId: string | null;
  orderNumber: string | null;
  raNumber: string;
  customerName: string;
  status: CreditNoteStatus;
  issueDate: string;
  total: number;
  createdAt: string;
}

export interface CreditNotesListResponse {
  data: CreditNoteSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreditNotesQueryParams {
  status?: CreditNoteStatus;
  companyId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

// ============================================
// PURCHASE REQUISITION TYPES
// ============================================

export type PurchaseRequisitionStatus = 'PENDING' | 'CONVERTED_TO_PO' | 'REJECTED' | 'CANCELLED';
export type PurchaseRequisitionUrgency = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface PurchaseRequisitionLine {
  id: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  supplierId: string | null;
  supplierName: string | null;
  quantity: number;
  estimatedUnitCost: number | null;
  estimatedLineTotal: number | null;
  deliveryLocation: string;
  lineNotes: string | null;
}

export interface PurchaseRequisition {
  id: string;
  requisitionNumber: string;
  companyId: string;
  status: PurchaseRequisitionStatus;
  requestedBy: string;
  requestedByName: string;
  department: string | null;
  urgency: string;
  requiredByDate: string | null;
  reason: string;
  notes: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  approvedByName: string | null;
  rejectedAt: string | null;
  rejectedBy: string | null;
  rejectionReason: string | null;
  cancelledAt: string | null;
  generatedPOIds: string[];
  lines: PurchaseRequisitionLine[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseRequisitionListItem {
  id: string;
  requisitionNumber: string;
  status: PurchaseRequisitionStatus;
  requestedByName: string;
  department: string | null;
  urgency: string;
  requiredByDate: string | null;
  reason: string;
  lineCount: number;
  estimatedTotal: number | null;
  generatedPOIds: string[];
  createdAt: string;
}

export interface PurchaseRequisitionsListResponse {
  items: PurchaseRequisitionListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface PurchaseRequisitionsQueryParams {
  status?: PurchaseRequisitionStatus;
  urgency?: PurchaseRequisitionUrgency;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreatePurchaseRequisitionLineInput {
  productId: string;
  productSku: string;
  productDescription: string;
  supplierId?: string;
  supplierName?: string;
  quantity: number;
  estimatedUnitCost?: number;
  deliveryLocation?: string;
  lineNotes?: string;
}

export interface CreatePurchaseRequisitionData {
  reason: string;
  urgency?: PurchaseRequisitionUrgency;
  department?: string;
  requiredByDate?: string;
  notes?: string;
  lines: CreatePurchaseRequisitionLineInput[];
}

// ============================================
// RETURN AUTHORIZATION TYPES
// ============================================

export type ReturnAuthorizationStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'ITEMS_RECEIVED' | 'COMPLETED' | 'CANCELLED';
export type ReturnReason = 'DEFECTIVE' | 'DAMAGED_IN_TRANSIT' | 'WRONG_ITEM' | 'NOT_AS_DESCRIBED' | 'NO_LONGER_NEEDED' | 'OTHER';
export type ReturnResolution = 'RESTOCK' | 'SCRAP' | 'REPLACE';

export interface ReturnAuthorizationLine {
  id: string;
  lineNumber: number;
  orderLineId: string | null;
  deliveryNoteLineId: string | null;
  productId: string;
  productSku: string;
  productDescription: string;
  unitOfMeasure: string;
  quantityReturned: number;
  quantityReceived: number;
  returnReason: ReturnReason;
  reasonNotes: string | null;
  resolution: ReturnResolution | null;
}

export interface ReturnAuthorization {
  id: string;
  raNumber: string;
  companyId: string;
  status: ReturnAuthorizationStatus;
  orderId: string | null;
  orderNumber: string | null;
  deliveryNoteId: string | null;
  deliveryNoteNumber: string | null;
  customerName: string;
  requestedBy: string;
  requestedByName: string;
  requestedByRole: string;
  warehouse: string;
  approvedAt: string | null;
  approvedBy: string | null;
  approvedByName: string | null;
  rejectedAt: string | null;
  rejectedBy: string | null;
  rejectionReason: string | null;
  itemsReceivedAt: string | null;
  itemsReceivedBy: string | null;
  itemsReceivedByName: string | null;
  completedAt: string | null;
  completedBy: string | null;
  completedByName: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  notes: string | null;
  lines: ReturnAuthorizationLine[];
  createdAt: string;
  updatedAt: string;
}

export interface ReturnAuthorizationListItem {
  id: string;
  raNumber: string;
  orderNumber: string | null;
  orderId: string | null;
  deliveryNoteNumber: string | null;
  deliveryNoteId: string | null;
  customerName: string;
  status: ReturnAuthorizationStatus;
  requestedByName: string;
  requestedByRole: string;
  lineCount: number;
  totalQuantityReturned: number;
  warehouse: string;
  createdAt: string;
}

export interface ReturnAuthorizationsListResponse {
  returnAuthorizations: ReturnAuthorizationListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface ReturnAuthorizationsQueryParams {
  orderId?: string;
  deliveryNoteId?: string;
  status?: ReturnAuthorizationStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateReturnAuthorizationLineInput {
  orderLineId?: string;
  deliveryNoteLineId?: string;
  productId: string;
  productSku: string;
  productDescription: string;
  unitOfMeasure: string;
  quantityReturned: number;
  returnReason: ReturnReason;
  reasonNotes?: string;
}

export interface CreateReturnAuthorizationData {
  orderId?: string;
  deliveryNoteId?: string;
  orderNumber?: string;
  deliveryNoteNumber?: string;
  customerName?: string;
  warehouse?: string;
  notes?: string;
  lines: CreateReturnAuthorizationLineInput[];
}

export interface ReceiveReturnItemLineInput {
  lineId: string;
  quantityReceived: number;
}

export interface ReceiveReturnItemsData {
  lines: ReceiveReturnItemLineInput[];
}

export interface CompleteReturnLineInput {
  lineId: string;
  resolution: ReturnResolution;
}

export interface CompleteReturnAuthorizationData {
  lines: CompleteReturnLineInput[];
}

export interface OrderReturnAuthorizationSummary {
  id: string;
  raNumber: string;
  status: ReturnAuthorizationStatus;
  lineCount: number;
  totalQuantityReturned: number;
  createdAt: string;
}

// ============================================
// PACKING LIST TYPES
// ============================================

export type PackingListStatus = 'DRAFT' | 'FINALIZED' | 'CANCELLED';
export type PackageType = 'BOX' | 'PALLET' | 'CRATE' | 'ENVELOPE' | 'TUBE' | 'OTHER';

export interface PackingListLine {
  id: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  unitOfMeasure: string;
  quantity: number;
  packageNumber: number;
}

export interface PackingListPackage {
  id: string;
  packageNumber: number;
  packageType: PackageType;
  length: number | null;
  width: number | null;
  height: number | null;
  grossWeight: number | null;
  netWeight: number | null;
  notes: string | null;
}

export interface PackingList {
  id: string;
  packingListNumber: string;
  companyId: string;
  orderId: string;
  orderNumber: string;
  deliveryNoteId: string | null;
  deliveryNoteNumber: string | null;
  customerName: string;
  location: Warehouse;
  status: PackingListStatus;
  finalizedAt: string | null;
  finalizedBy: string | null;
  finalizedByName: string | null;
  handlingInstructions: string | null;
  notes: string | null;
  lines: PackingListLine[];
  packages: PackingListPackage[];
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
}

export interface PackingListListItem {
  id: string;
  packingListNumber: string;
  orderNumber: string;
  orderId: string;
  customerName: string;
  location: Warehouse;
  status: PackingListStatus;
  packageCount: number;
  lineCount: number;
  createdAt: string;
}

export interface PackingListsListResponse {
  packingLists: PackingListListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface PackingListsQueryParams {
  orderId?: string;
  deliveryNoteId?: string;
  status?: PackingListStatus;
  location?: Warehouse;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreatePackingListLineInput {
  productId: string;
  productSku: string;
  productDescription: string;
  unitOfMeasure: string;
  quantity: number;
  packageNumber: number;
}

export interface CreatePackingListPackageInput {
  packageNumber: number;
  packageType: PackageType;
  length?: number;
  width?: number;
  height?: number;
  grossWeight?: number;
  netWeight?: number;
  notes?: string;
}

export interface CreatePackingListData {
  deliveryNoteId?: string;
  location?: Warehouse;
  handlingInstructions?: string;
  notes?: string;
  lines: CreatePackingListLineInput[];
  packages: CreatePackingListPackageInput[];
}

export interface OrderPackingListSummary {
  id: string;
  packingListNumber: string;
  status: PackingListStatus;
  packageCount: number;
  lineCount: number;
  location: Warehouse;
  createdAt: string;
}

// Re-export job card types from shared
export type { JobCardStatus, JobType } from '@nusaf/shared';

export interface BomComponent {
  productId: string;
  sku: string;
  name: string;
  quantityPerUnit: number;
  requiredQuantity: number;
  availableStock: number;
  shortfall: number;
  isOptional: boolean;
  canFulfill: boolean;
}

export type BomStatus = 'READY' | 'PARTIAL' | 'SHORTAGE';

export interface MaterialWarning {
  componentSku: string;
  required: number;
  available: number;
  shortfall: number;
}

export interface JobCard {
  id: string;
  jobCardNumber: string;
  companyId: string;
  orderId: string;
  orderNumber: string;
  orderLineId: string;
  productId: string;
  productSku: string;
  productDescription: string;
  quantity: number;
  jobType: JobType;
  status: JobCardStatus;
  holdReason: string | null;
  notes: string | null;
  assignedTo: string | null;
  assignedToName: string | null;
  materialCheckPerformed: boolean;
  materialCheckResult: Record<string, unknown> | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  bomComponents: BomComponent[];
  bomStatus: BomStatus;
}

export interface JobCardListItem {
  id: string;
  jobCardNumber: string;
  orderNumber: string;
  orderId: string;
  productSku: string;
  productDescription: string;
  quantity: number;
  jobType: JobType;
  status: JobCardStatus;
  assignedToName: string | null;
  createdAt: string;
}

export interface JobCardsListResponse {
  jobCards: JobCardListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface JobCardsQueryParams {
  orderId?: string;
  status?: JobCardStatus;
  jobType?: JobType;
  page?: number;
  pageSize?: number;
}

export interface CreateJobCardData {
  orderId: string;
  orderLineId: string;
  jobType: JobType;
  notes?: string;
}

export interface CreateJobCardResponse {
  id: string;
  jobCardNumber: string;
}

export interface OrderJobCardSummary {
  id: string;
  jobCardNumber: string;
  productSku: string;
  productDescription: string;
  quantity: number;
  jobType: JobType;
  status: JobCardStatus;
  assignedToName: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

// Transfer Request types
export type TransferRequestStatus = 'PENDING' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';

export interface TransferRequestLine {
  id: string;
  orderLineId: string | null;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  quantity: number;
  receivedQuantity: number;
}

export interface TransferRequest {
  id: string;
  transferNumber: string;
  companyId: string;
  orderId: string | null;
  orderNumber: string | null;
  fromLocation: Warehouse;
  toLocation: Warehouse;
  status: TransferRequestStatus;
  notes: string | null;
  shippedAt: string | null;
  shippedBy: string | null;
  shippedByName: string | null;
  receivedAt: string | null;
  receivedBy: string | null;
  receivedByName: string | null;
  lines: TransferRequestLine[];
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
}

export interface TransferRequestListItem {
  id: string;
  transferNumber: string;
  orderNumber: string | null;
  orderId: string | null;
  fromLocation: Warehouse;
  toLocation: Warehouse;
  status: TransferRequestStatus;
  lineCount: number;
  createdAt: string;
}

export interface TransferRequestsListResponse {
  transferRequests: TransferRequestListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface TransferRequestsQueryParams {
  orderId?: string;
  status?: TransferRequestStatus;
  page?: number;
  pageSize?: number;
}

export interface CreateTransferRequestFromOrderLineInput {
  orderLineId: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  quantity: number;
}

export interface CreateTransferRequestFromOrderData {
  lines: CreateTransferRequestFromOrderLineInput[];
}

export interface CreateStandaloneTransferRequestLineInput {
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  quantity: number;
}

export interface CreateStandaloneTransferRequestData {
  fromLocation?: Warehouse;
  toLocation?: Warehouse;
  lines: CreateStandaloneTransferRequestLineInput[];
  notes?: string | null;
}

export interface CreateTransferRequestResponse {
  id: string;
  transferNumber: string;
}

export interface OrderTransferRequestSummary {
  id: string;
  transferNumber: string;
  status: TransferRequestStatus;
  lineCount: number;
  fromLocation: Warehouse;
  toLocation: Warehouse;
  createdAt: string;
  shippedAt: string | null;
  receivedAt: string | null;
}

// Issue Flag types
export type IssueFlagCategory = 'STOCK' | 'QUALITY' | 'PRODUCTION' | 'TIMING' | 'DOCUMENTATION';
export type IssueFlagSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IssueFlagStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING_INFO' | 'RESOLVED' | 'CLOSED';

export interface IssueComment {
  id: string;
  content: string;
  createdAt: string;
  createdByName: string;
}

export interface IssueFlag {
  id: string;
  issueNumber: string;
  companyId: string;
  category: IssueFlagCategory;
  severity: IssueFlagSeverity;
  status: IssueFlagStatus;
  title: string;
  description: string;
  slaDeadline: string;
  escalatedAt: string | null;
  resolution: string | null;
  resolvedAt: string | null;
  resolvedByName: string | null;
  createdAt: string;
  createdByName: string;
  updatedAt: string;
  pickingSlip: {
    id: string;
    pickingSlipNumber: string;
    orderNumber: string;
  } | null;
  jobCard: {
    id: string;
    jobCardNumber: string;
    orderNumber: string;
    productSku: string;
  } | null;
  comments: IssueComment[];
}

export interface IssueFlagListItem {
  id: string;
  issueNumber: string;
  category: IssueFlagCategory;
  severity: IssueFlagSeverity;
  status: IssueFlagStatus;
  title: string;
  slaDeadline: string;
  pickingSlipNumber: string | null;
  jobCardNumber: string | null;
  createdAt: string;
  createdByName: string;
}

export interface IssueFlagsListResponse {
  issueFlags: IssueFlagListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface IssueFlagsQueryParams {
  pickingSlipId?: string;
  jobCardId?: string;
  status?: IssueFlagStatus;
  severity?: IssueFlagSeverity;
  category?: IssueFlagCategory;
  page?: number;
  pageSize?: number;
}

export interface CreateIssueFlagData {
  pickingSlipId?: string;
  jobCardId?: string;
  category: IssueFlagCategory;
  severity: IssueFlagSeverity;
  title: string;
  description: string;
}

export interface CreateIssueFlagResponse {
  id: string;
  issueNumber: string;
}

export interface IssueFlagStats {
  total: number;
  bySeverity: Record<IssueFlagSeverity, number>;
  byStatus: Record<IssueFlagStatus, number>;
  overdue: number;
}

export interface IssueFlagSummary {
  id: string;
  issueNumber: string;
  category: IssueFlagCategory;
  severity: IssueFlagSeverity;
  status: IssueFlagStatus;
  title: string;
}

// Document types
export type DocumentType = 'CUSTOMER_PO' | 'SIGNED_DELIVERY_NOTE';

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  CUSTOMER_PO: 'Customer PO',
  SIGNED_DELIVERY_NOTE: 'Signed Delivery Note',
};

export interface Document {
  id: string;
  orderId: string;
  orderNumber: string;
  type: DocumentType;
  typeLabel: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  uploadedByName: string;
}

export interface DocumentForOrder {
  id: string;
  type: DocumentType;
  typeLabel: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  uploadedByName: string;
}

export interface DocumentsListResponse {
  documents: Document[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface DocumentsQueryParams {
  orderId?: string;
  type?: DocumentType;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface UploadDocumentData {
  orderId: string;
  type: DocumentType;
  file: File;
}

export interface DocumentDownloadResponse {
  url: string;
  filename: string;
}

// Supplier types
export type SupplierCurrency = 'EUR' | 'ZAR';
export type SkuHandling = 'DIRECT' | 'TECOM_CONVERSION' | 'NUSAF_INTERNAL';

export interface SupplierContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  country: string;
  currency: SupplierCurrency;
  skuHandling: SkuHandling;
  isLocal: boolean;
  isActive: boolean;
  email: string | null;
  phone: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postalCode: string | null;
  paymentTerms: string | null;
  minimumOrderValue: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  contacts?: SupplierContact[];
  _count?: {
    products: number;
  };
}

export interface SuppliersListResponse {
  suppliers: Supplier[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface SuppliersQueryParams {
  search?: string;
  isActive?: boolean;
  currency?: SupplierCurrency;
  isLocal?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CreateSupplierData {
  code: string;
  name: string;
  country?: string;
  currency?: SupplierCurrency;
  skuHandling: SkuHandling;
  isLocal?: boolean;
  email?: string;
  phone?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  paymentTerms?: string;
  minimumOrderValue?: number;
  notes?: string;
}

export interface UpdateSupplierData {
  name?: string;
  country?: string;
  currency?: SupplierCurrency;
  skuHandling?: SkuHandling;
  isLocal?: boolean;
  isActive?: boolean;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  postalCode?: string | null;
  paymentTerms?: string | null;
  minimumOrderValue?: number | null;
  notes?: string | null;
}

export interface CreateContactData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: string;
  isPrimary?: boolean;
}

export interface UpdateContactData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  role?: string | null;
  isPrimary?: boolean;
}

// ============================================
// COMPANY TYPES
// ============================================

export type PaymentTermsType = 'PREPAY' | 'COD' | 'NET_30' | 'NET_60' | 'NET_90';

export interface CompanyListItem {
  id: string;
  accountNumber: string | null;
  name: string;
  tradingName: string | null;
  registrationNumber: string | null;
  vatNumber: string | null;
  tier: string;
  isActive: boolean;
  isCashAccount: boolean;
  primaryWarehouse: string | null;
  fulfillmentPolicy: string;
  paymentTerms: PaymentTermsType;
  accountStatus: string | null;
  territory: string | null;
  assignedSalesRepId: string | null;
  assignedSalesRep: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeCode: string | null;
  } | null;
  createdAt: string;
  _count: {
    users: number;
    orders: number;
  };
}

export interface StaffUserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeCode: string | null;
  role: string;
}

export type CreditStatusType = 'GOOD_STANDING' | 'ON_HOLD' | 'SUSPENDED' | 'COD_ONLY';
export type AccountStatusType = 'PROSPECT' | 'ACTIVE' | 'DORMANT' | 'CHURNED';
export type ShippingMethodType = 'COLLECTION' | 'NUSAF_DELIVERY' | 'COURIER' | 'FREIGHT';
export type ContactRoleType = 'BUYER' | 'FINANCE' | 'TECHNICAL' | 'RECEIVING' | 'DECISION_MAKER';

export interface CompanyAddress {
  id: string;
  companyId: string;
  type: 'BILLING' | 'SHIPPING';
  label: string | null;
  line1: string;
  line2: string | null;
  suburb: string | null;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  deliveryInstructions: string | null;
  contactName: string | null;
  contactPhone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyContact {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  mobile: string | null;
  jobTitle: string | null;
  contactRole: ContactRoleType | null;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyDetail {
  id: string;
  accountNumber: string | null;
  name: string;
  tradingName: string | null;
  registrationNumber: string | null;
  vatNumber: string | null;
  tier: string;
  isActive: boolean;
  isCashAccount: boolean;
  primaryWarehouse: string | null;
  fulfillmentPolicy: string;
  paymentTerms: PaymentTermsType;
  creditLimit: number | null;
  creditStatus: CreditStatusType | null;
  discountOverride: number | null;
  statementEmail: string | null;
  invoiceEmail: string | null;
  accountStatus: AccountStatusType | null;
  territory: string | null;
  internalNotes: string | null;
  defaultShippingMethod: ShippingMethodType | null;
  bbbeeLevel: number | null;
  bbbeeExpiryDate: string | null;
  assignedSalesRepId: string | null;
  assignedSalesRep: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeCode: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  users: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
  }>;
  addresses: CompanyAddress[];
  contacts: CompanyContact[];
  _count: {
    orders: number;
    quotes: number;
  };
}

// ============================================
// STAFF USER TYPES
// ============================================

export type StaffRole = 'ADMIN' | 'MANAGER' | 'SALES' | 'PURCHASER' | 'WAREHOUSE';

export interface StaffUserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: StaffRole;
  employeeCode: string | null;
  primaryWarehouse: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  company: { id: string; name: string };
}

// ============================================
// PURCHASE ORDER TYPES
// ============================================

export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'SENT'
  | 'ACKNOWLEDGED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CLOSED'
  | 'CANCELLED';

export interface PurchaseOrderLine {
  id: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  lineTotal: number;
  salesOrderLineId: string | null;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplier: {
    id: string;
    code: string;
    name: string;
    email: string | null;
    currency: SupplierCurrency;
  };
  status: PurchaseOrderStatus;
  deliveryLocation: Warehouse;
  expectedDate: string | null;
  currency: SupplierCurrency;
  subtotal: number;
  total: number;
  sourceOrderId: string | null;
  internalNotes: string | null;
  supplierNotes: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  rejectedAt: string | null;
  rejectedBy: string | null;
  rejectionReason: string | null;
  sentAt: string | null;
  sentBy: string | null;
  lines: PurchaseOrderLine[];
  version: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface PurchaseOrderListItem {
  id: string;
  poNumber: string;
  supplierName: string;
  supplierCode: string;
  status: PurchaseOrderStatus;
  deliveryLocation: Warehouse;
  lineCount: number;
  total: number;
  currency: SupplierCurrency;
  expectedDate: string | null;
  createdAt: string;
}

export interface PurchaseOrdersListResponse {
  purchaseOrders: PurchaseOrderListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface PurchaseOrdersQueryParams {
  status?: PurchaseOrderStatus;
  supplierId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreatePurchaseOrderData {
  supplierId: string;
  deliveryLocation?: Warehouse;
  expectedDate?: string;
  internalNotes?: string;
  supplierNotes?: string;
  sourceOrderId?: string;
}

export interface UpdatePurchaseOrderData {
  deliveryLocation?: Warehouse;
  expectedDate?: string | null;
  internalNotes?: string | null;
  supplierNotes?: string | null;
  version?: number;
}

export interface AddPurchaseOrderLineData {
  productId: string;
  quantityOrdered: number;
  unitCost: number;
}

export interface UpdatePurchaseOrderLineData {
  quantityOrdered?: number;
  unitCost?: number;
}

export interface RejectPurchaseOrderData {
  reason: string;
}

export interface SendPurchaseOrderData {
  emailTo?: string;
  emailCc?: string[];
  message?: string;
}

export interface SendPurchaseOrderResponse {
  emailSent: boolean;
  recipientEmail: string;
  emailError?: string;
}

// ============================================
// GOODS RECEIVED VOUCHER (GRV) TYPES
// ============================================

export interface GrvLine {
  id: string;
  lineNumber: number;
  poLineId: string;
  productId: string;
  productSku: string;
  quantityExpected: number;
  quantityReceived: number;
  quantityRejected: number;
  rejectionReason: string | null;
}

export interface GoodsReceivedVoucher {
  id: string;
  grvNumber: string;
  purchaseOrderId: string;
  purchaseOrder: {
    id: string;
    poNumber: string;
    supplier: {
      id: string;
      code: string;
      name: string;
    };
  };
  location: Warehouse;
  receivedAt: string;
  receivedBy: string;
  receivedByName: string;
  notes: string | null;
  lines: GrvLine[];
  createdAt: string;
  updatedAt: string;
}

export interface GrvListItem {
  id: string;
  grvNumber: string;
  poNumber: string;
  supplierName: string;
  location: Warehouse;
  lineCount: number;
  totalReceived: number;
  totalRejected: number;
  receivedAt: string;
  receivedByName: string;
}

export interface GrvsListResponse {
  goodsReceipts: GrvListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface GrvsQueryParams {
  purchaseOrderId?: string;
  location?: Warehouse;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateGrvLineInput {
  poLineId: string;
  quantityReceived: number;
  quantityRejected?: number;
  rejectionReason?: string;
}

export interface CreateGrvData {
  purchaseOrderId: string;
  location?: Warehouse;
  notes?: string;
  lines: CreateGrvLineInput[];
}

export interface ReceivingSummaryLine {
  poLineId: string;
  productId: string;
  productSku: string;
  productDescription: string;
  quantityOrdered: number;
  quantityReceived: number;
  quantityRejected: number;
  outstanding: number;
}

export interface ReceivingSummary {
  poId: string;
  poNumber: string;
  status: PurchaseOrderStatus;
  totalQuantityOrdered: number;
  totalQuantityReceived: number;
  totalQuantityRejected: number;
  lines: ReceivingSummaryLine[];
}

// ============================================
// FULFILLMENT ORCHESTRATION TYPES
// ============================================
// FulfillmentPolicy is imported from @nusaf/shared above

export interface PickingSlipPlanLine {
  orderLineId: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  quantityToPick: number;
}

export interface PickingSlipPlan {
  warehouse: Warehouse;
  lines: PickingSlipPlanLine[];
  isTransferSource: boolean;
}

export interface JobCardComponentPlan {
  productId: string;
  productSku: string;
  productDescription: string;
  requiredQuantity: number;
  availableQuantity: number;
  shortfall: number;
  sourceWarehouse: Warehouse;
}

export interface ComponentAvailability {
  allComponentsAvailable: boolean;
  componentsWithShortfall: Array<{
    productId: string;
    productSku: string;
    productDescription: string;
    requiredQuantity: number;
    availableQuantity: number;
    shortfall: number;
    supplierId: string | null;
    supplierName: string | null;
  }>;
}

export interface JobCardPlan {
  orderLineId: string;
  productId: string;
  productSku: string;
  productDescription: string;
  productType: ProductType;
  quantity: number;
  jobType: JobType;
  components: JobCardComponentPlan[];
  componentAvailability: ComponentAvailability;
}

export interface TransferPlanLine {
  orderLineId: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  quantity: number;
}

export interface TransferPlan {
  fromWarehouse: Warehouse;
  toWarehouse: Warehouse;
  lines: TransferPlanLine[];
  linkedPickingSlipIndex: number;
}

export interface PurchaseOrderPlanLine {
  productId: string;
  productSku: string;
  productDescription: string;
  quantity: number;
  sourceType: 'ORDER_LINE' | 'JOB_CARD_COMPONENT';
  sourceId: string;
  estimatedUnitCost: number;
}

export interface PurchaseOrderPlan {
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  currency: SupplierCurrency;
  reason: 'FINISHED_GOODS_BACKORDER' | 'COMPONENT_SHORTAGE';
  lines: PurchaseOrderPlanLine[];
}

export interface OrchestrationSummary {
  totalOrderLines: number;
  linesFromStock: number;
  linesRequiringAssembly: number;
  linesRequiringTransfer: number;
  linesBackordered: number;
  pickingSlipsToCreate: number;
  jobCardsToCreate: number;
  transfersToCreate: number;
  purchaseOrdersToCreate: number;
  canFulfillCompletely: boolean;
  immediatelyFulfillablePercent: number;
}

export interface OrchestrationPlan {
  orderId: string;
  orderNumber: string;
  customerWarehouse: Warehouse;
  effectivePolicy: FulfillmentPolicy;
  canProceed: boolean;
  blockedReason?: string;
  pickingSlips: PickingSlipPlan[];
  jobCards: JobCardPlan[];
  transfers: TransferPlan[];
  purchaseOrders: PurchaseOrderPlan[];
  summary: OrchestrationSummary;
  generatedAt: string;
  warnings: string[];
}

export interface ExecutionResultDocument {
  id: string;
  number: string;
}

export interface ExecutionResultPickingSlip extends ExecutionResultDocument {
  warehouse: Warehouse;
}

export interface ExecutionResultPurchaseOrder extends ExecutionResultDocument {
  supplierId: string;
}

export interface ExecutionResult {
  success: boolean;
  error?: string;
  createdDocuments: {
    pickingSlips: ExecutionResultPickingSlip[];
    jobCards: ExecutionResultDocument[];
    transferRequests: ExecutionResultDocument[];
    purchaseOrders: ExecutionResultPurchaseOrder[];
  };
  reservationsCreated: number;
  orderStatusUpdated: string;
}

export interface GenerateFulfillmentPlanData {
  policyOverride?: FulfillmentPolicy;
}

export interface ExecuteFulfillmentPlanData {
  plan: OrchestrationPlan;
}

// ============================================
// FULFILLMENT DASHBOARD TYPES
// ============================================

export interface FulfillmentDashboardPickingSlipItem {
  id: string;
  pickingSlipNumber: string;
  orderNumber: string;
  orderId: string;
  location: Warehouse;
  status: PickingSlipStatus;
  assignedToName: string | null;
  lineCount: number;
  createdAt: string;
}

export interface FulfillmentDashboardJobCardItem {
  id: string;
  jobCardNumber: string;
  orderNumber: string;
  orderId: string;
  productSku: string;
  productDescription: string;
  quantity: number;
  jobType: JobType;
  status: JobCardStatus;
  assignedToName: string | null;
  createdAt: string;
}

export interface FulfillmentDashboardTransferItem {
  id: string;
  transferNumber: string;
  orderNumber: string | null;
  orderId: string | null;
  fromLocation: Warehouse;
  toLocation: Warehouse;
  status: TransferRequestStatus;
  lineCount: number;
  createdAt: string;
}

export interface FulfillmentDashboardPOItem {
  id: string;
  poNumber: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  currency: string;
  lineCount: number;
  total: number;
  expectedDate: string | null;
  createdAt: string;
}

export interface FulfillmentDashboardOrderItem {
  id: string;
  orderNumber: string;
  status: SalesOrderStatus;
  customerName: string | null;
  lineCount: number;
  total: number;
  createdAt: string;
}

export interface FulfillmentDashboardData {
  pickingQueue: {
    pendingCount: number;
    inProgressCount: number;
    recentItems: FulfillmentDashboardPickingSlipItem[];
  };
  jobCards: {
    pendingCount: number;
    inProgressCount: number;
    onHoldCount: number;
    recentItems: FulfillmentDashboardJobCardItem[];
  };
  transfers: {
    pendingCount: number;
    inTransitCount: number;
    recentItems: FulfillmentDashboardTransferItem[];
  };
  awaitingDelivery: {
    sentCount: number;
    acknowledgedCount: number;
    partiallyReceivedCount: number;
    overdueCount: number;
    recentItems: FulfillmentDashboardPOItem[];
  };
  readyToShip: {
    count: number;
    recentItems: FulfillmentDashboardOrderItem[];
  };
  exceptions: {
    overduePOs: number;
    stalledJobCards: number;
    onHoldOrders: number;
  };
}

// ============================================
// SALES REPORT TYPES
// ============================================

export interface SalesReportSummary {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  quoteConversionRate: number;
  totalQuotes: number;
  pendingFulfillment: number;
}

export interface RevenueOverTimeEntry {
  period: string;
  revenue: number;
  orderCount: number;
}

export interface QuotePipeline {
  created: number;
  accepted: number;
  converted: number;
  rejected: number;
  expired: number;
}

export interface TopCustomerEntry {
  companyId: string;
  companyName: string;
  tier: string;
  orderCount: number;
  revenue: number;
  averageOrderValue: number;
}

export interface TopProductEntry {
  productId: string;
  sku: string;
  description: string;
  quantitySold: number;
  revenue: number;
}

export interface RevenueByTierEntry {
  tier: string;
  revenue: number;
  orderCount: number;
  percentage: number;
}

export interface SalesReportData {
  summary: SalesReportSummary;
  revenueOverTime: RevenueOverTimeEntry[];
  quotePipeline: QuotePipeline;
  topCustomers: TopCustomerEntry[];
  topProducts: TopProductEntry[];
  revenueByTier: RevenueByTierEntry[];
}

class ApiClient {
  private accessToken: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    skipContentType = false
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const headers: Record<string, string> = {};

    // Only set Content-Type for non-FormData requests
    if (!skipContentType) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error?.message || 'Request failed',
        data.error?.code || 'UNKNOWN_ERROR',
        response.status
      );
    }

    return data;
  }

  private async uploadFile<T>(
    endpoint: string,
    formData: FormData
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const headers: Record<string, string> = {};

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error?.message || 'Request failed',
        data.error?.code || 'UNKNOWN_ERROR',
        response.status
      );
    }

    return data;
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return this.request<ApiResponse<LoginResponse>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async refresh(refreshToken: string): Promise<ApiResponse<RefreshResponse>> {
    return this.request<ApiResponse<RefreshResponse>>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getMe(): Promise<ApiResponse<AuthenticatedUser>> {
    return this.request<ApiResponse<AuthenticatedUser>>('/auth/me');
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Import endpoints
  async uploadImportFile(file: File, supplierCode: string): Promise<ApiResponse<UploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('supplierCode', supplierCode);
    return this.uploadFile<ApiResponse<UploadResponse>>('/admin/imports/upload', formData);
  }

  async validateImport(
    fileId: string,
    supplierCode: string,
    columnMapping: ColumnMapping
  ): Promise<ApiResponse<ImportValidationResult>> {
    return this.request<ApiResponse<ImportValidationResult>>('/admin/imports/validate', {
      method: 'POST',
      body: JSON.stringify({ fileId, supplierCode, columnMapping }),
    });
  }

  async executeImport(
    fileId: string,
    supplierCode: string,
    columnMapping: ColumnMapping,
    skipErrors: boolean = false
  ): Promise<ApiResponse<ImportExecuteResult>> {
    return this.request<ApiResponse<ImportExecuteResult>>('/admin/imports/execute', {
      method: 'POST',
      body: JSON.stringify({ fileId, supplierCode, columnMapping, skipErrors }),
    });
  }

  async getImportSuppliers(): Promise<ApiResponse<ImportSupplier[]>> {
    return this.request<ApiResponse<ImportSupplier[]>>('/admin/imports/suppliers');
  }

  async getImportCategories(): Promise<ApiResponse<ImportCategoriesResponse>> {
    return this.request<ApiResponse<ImportCategoriesResponse>>('/admin/imports/categories');
  }

  async getImportHistory(): Promise<ApiResponse<ImportHistoryItem[]>> {
    return this.request<ApiResponse<ImportHistoryItem[]>>('/admin/imports/history');
  }

  // Product catalog endpoints
  async getCategories(): Promise<ApiResponse<CatalogCategory[]>> {
    return this.request<ApiResponse<CatalogCategory[]>>('/categories');
  }

  async getProducts(params: ProductsQueryParams = {}): Promise<ApiResponse<ProductsResponse>> {
    const searchParams = new URLSearchParams();
    if (params.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params.subCategoryId) searchParams.set('subCategoryId', params.subCategoryId);
    if (params.supplierId) searchParams.set('supplierId', params.supplierId);
    if (params.search) searchParams.set('search', params.search);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params.sort) searchParams.set('sort', params.sort);
    if (params.include) searchParams.set('include', params.include);
    if (params.stockStatus) searchParams.set('stockStatus', params.stockStatus);
    if (params.warehouseId) searchParams.set('warehouseId', params.warehouseId);
    if (params.customerTier) searchParams.set('customerTier', params.customerTier);
    if (params.isPublished) searchParams.set('isPublished', params.isPublished);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/products?${queryString}` : '/products';
    return this.request<ApiResponse<ProductsResponse>>(endpoint);
  }

  async getProductById(id: string): Promise<ApiResponse<CatalogProduct>> {
    return this.request<ApiResponse<CatalogProduct>>(`/products/${id}`);
  }

  /**
   * Fetch product with inventory data
   * @param id Product ID
   * @param include Comma-separated list: 'inventory', 'movements', or 'inventory,movements'
   * @param movementLimit Number of movements to include (default 20)
   */
  async getProductWithInventory(
    id: string,
    include: string = 'inventory,movements',
    movementLimit: number = 20
  ): Promise<ApiResponse<ProductWithInventory>> {
    const params = new URLSearchParams({
      include,
      movementLimit: movementLimit.toString(),
    });
    return this.request<ApiResponse<ProductWithInventory>>(`/products/${id}?${params}`);
  }

  /**
   * Create a stock adjustment for a product
   */
  async createStockAdjustment(
    productId: string,
    data: CreateStockAdjustmentData
  ): Promise<ApiResponse<{ id: string; message: string }>> {
    return this.request<ApiResponse<{ id: string; message: string }>>(
      `/products/${productId}/stock/adjustments`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  // Inventory dashboard endpoints

  /**
   * Get inventory summary counts for the dashboard
   */
  async getInventorySummary(): Promise<ApiResponse<InventorySummary>> {
    return this.request<ApiResponse<InventorySummary>>('/inventory/summary');
  }

  /**
   * Get aggregated inventory dashboard data
   */
  async getInventoryDashboard(): Promise<ApiResponse<InventoryDashboardData>> {
    return this.request<ApiResponse<InventoryDashboardData>>('/inventory/dashboard');
  }

  /**
   * Get stock levels with filtering and pagination
   */
  async getStockLevels(params: StockLevelsQueryParams = {}): Promise<ApiResponse<StockLevelsResponse>> {
    const searchParams = new URLSearchParams();
    if (params.location) searchParams.set('location', params.location);
    if (params.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params.lowStockOnly) searchParams.set('lowStockOnly', 'true');
    if (params.search) searchParams.set('search', params.search);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/inventory/stock?${queryString}` : '/inventory/stock';
    return this.request<ApiResponse<StockLevelsResponse>>(endpoint);
  }

  /**
   * Get low stock products (below reorder point)
   */
  async getLowStockProducts(location?: string): Promise<ApiResponse<LowStockProductsResponse>> {
    const endpoint = location ? `/inventory/stock/low?location=${location}` : '/inventory/stock/low';
    return this.request<ApiResponse<LowStockProductsResponse>>(endpoint);
  }

  /**
   * Get stock adjustments with filtering and pagination
   */
  async getStockAdjustments(params: StockAdjustmentsQueryParams = {}): Promise<ApiResponse<StockAdjustmentsResponse>> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.location) searchParams.set('location', params.location);
    if (params.reason) searchParams.set('reason', params.reason);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/inventory/adjustments?${queryString}` : '/inventory/adjustments';
    return this.request<ApiResponse<StockAdjustmentsResponse>>(endpoint);
  }

  /**
   * Get a single stock adjustment by ID
   */
  async getStockAdjustmentById(id: string): Promise<ApiResponse<StockAdjustment>> {
    return this.request<ApiResponse<StockAdjustment>>(`/inventory/adjustments/${id}`);
  }

  /**
   * Approve a stock adjustment
   */
  async approveStockAdjustment(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/inventory/adjustments/${id}/approve`, {
      method: 'POST',
    });
  }

  /**
   * Reject a stock adjustment
   */
  async rejectStockAdjustment(id: string, reason: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/inventory/adjustments/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  /**
   * Create a multi-product inventory adjustment (PENDING status, requires approval)
   */
  async createInventoryAdjustment(
    data: CreateInventoryAdjustmentData
  ): Promise<ApiResponse<{ id: string; adjustmentNumber: string }>> {
    return this.request<ApiResponse<{ id: string; adjustmentNumber: string }>>(
      '/inventory/adjustments',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  /**
   * Get stock movements with filtering and pagination
   */
  async getStockMovements(params: StockMovementsQueryParams = {}): Promise<ApiResponse<StockMovementsResponse>> {
    const searchParams = new URLSearchParams();
    if (params.location) searchParams.set('location', params.location);
    if (params.movementType) searchParams.set('movementType', params.movementType);
    if (params.productId) searchParams.set('productId', params.productId);
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/inventory/movements?${queryString}` : '/inventory/movements';
    return this.request<ApiResponse<StockMovementsResponse>>(endpoint);
  }

  /**
   * Update reorder settings for a product at a specific location
   */
  async updateReorderSettings(
    productId: string,
    location: string,
    data: UpdateReorderSettingsData
  ): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/inventory/stock/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ location, ...data }),
    });
  }

  // ============================================
  // CYCLE COUNT METHODS
  // ============================================

  async getCycleCounts(params: CycleCountsQueryParams = {}): Promise<ApiResponse<CycleCountsResponse>> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.location) searchParams.set('location', params.location);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/inventory/cycle-counts?${queryString}` : '/inventory/cycle-counts';
    return this.request<ApiResponse<CycleCountsResponse>>(endpoint);
  }

  async getCycleCountById(id: string): Promise<ApiResponse<CycleCountSession>> {
    return this.request<ApiResponse<CycleCountSession>>(`/inventory/cycle-counts/${id}`);
  }

  async createCycleCount(data: CreateCycleCountData): Promise<ApiResponse<{ id: string; sessionNumber: string }>> {
    return this.request<ApiResponse<{ id: string; sessionNumber: string }>>('/inventory/cycle-counts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitCycleCountLines(
    id: string,
    data: SubmitCycleCountLinesData
  ): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/inventory/cycle-counts/${id}/count`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async completeCycleCount(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/inventory/cycle-counts/${id}/complete`, {
      method: 'POST',
    });
  }

  async reconcileCycleCount(
    id: string
  ): Promise<ApiResponse<{ message: string; adjustmentId?: string; adjustmentNumber?: string }>> {
    return this.request<ApiResponse<{ message: string; adjustmentId?: string; adjustmentNumber?: string }>>(
      `/inventory/cycle-counts/${id}/reconcile`,
      { method: 'POST' }
    );
  }

  async reconcileAndApplyCycleCount(
    id: string
  ): Promise<ApiResponse<{ message: string; adjustmentId?: string; adjustmentNumber?: string; applied: boolean }>> {
    return this.request<ApiResponse<{ message: string; adjustmentId?: string; adjustmentNumber?: string; applied: boolean }>>(
      `/inventory/cycle-counts/${id}/reconcile-and-apply`,
      { method: 'POST' }
    );
  }

  async cancelCycleCount(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/inventory/cycle-counts/${id}/cancel`, {
      method: 'POST',
    });
  }

  // Admin settings endpoints
  async getSettings(): Promise<ApiResponse<GlobalSettings>> {
    return this.request<ApiResponse<GlobalSettings>>('/admin/settings');
  }

  async updateSettings(data: UpdateSettingsData): Promise<ApiResponse<GlobalSettings>> {
    return this.request<ApiResponse<GlobalSettings>>('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Pricing rules endpoints
  async getPricingRules(supplierId?: string): Promise<ApiResponse<PricingRule[]>> {
    const endpoint = supplierId
      ? `/admin/pricing-rules?supplierId=${encodeURIComponent(supplierId)}`
      : '/admin/pricing-rules';
    return this.request<ApiResponse<PricingRule[]>>(endpoint);
  }

  async createPricingRule(data: CreatePricingRuleData): Promise<ApiResponse<PricingRule>> {
    return this.request<ApiResponse<PricingRule>>('/admin/pricing-rules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePricingRule(id: string, data: UpdatePricingRuleData): Promise<ApiResponse<PricingRule>> {
    return this.request<ApiResponse<PricingRule>>(`/admin/pricing-rules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePricingRule(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/admin/pricing-rules/${id}`, {
      method: 'DELETE',
    });
  }

  // Recalculate prices endpoint
  async recalculatePrices(): Promise<ApiResponse<RecalculatePricesResult>> {
    return this.request<ApiResponse<RecalculatePricesResult>>('/products/recalculate', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  // Quote endpoints
  async createQuote(companyId?: string, cashCustomer?: CashCustomerInput): Promise<ApiResponse<CreateQuoteResponse>> {
    return this.request<ApiResponse<CreateQuoteResponse>>('/quotes', {
      method: 'POST',
      body: JSON.stringify({
        ...(companyId ? { companyId } : {}),
        ...(cashCustomer || {}),
      }),
    });
  }

  async getQuotes(params: QuotesQueryParams = {}): Promise<ApiResponse<QuotesListResponse>> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/quotes?${queryString}` : '/quotes';
    return this.request<ApiResponse<QuotesListResponse>>(endpoint);
  }

  async getQuoteById(id: string): Promise<ApiResponse<Quote>> {
    return this.request<ApiResponse<Quote>>(`/quotes/${id}`);
  }

  async getActiveQuote(companyId?: string): Promise<ApiResponse<ActiveDraftQuote | null>> {
    const query = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
    return this.request<ApiResponse<ActiveDraftQuote | null>>(`/quotes/active${query}`);
  }

  async updateQuoteNotes(id: string, customerNotes: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/quotes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ customerNotes }),
    });
  }

  async updateCashCustomerDetails(quoteId: string, details: CashCustomerInput): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/quotes/${quoteId}/cash-customer`, {
      method: 'PATCH',
      body: JSON.stringify(details),
    });
  }

  async addQuoteItem(quoteId: string, data: AddQuoteItemData): Promise<ApiResponse<AddQuoteItemResponse>> {
    return this.request<ApiResponse<AddQuoteItemResponse>>(`/quotes/${quoteId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateQuoteItemQuantity(quoteId: string, itemId: string, quantity: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/quotes/${quoteId}/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeQuoteItem(quoteId: string, itemId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/quotes/${quoteId}/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  async finalizeQuote(id: string): Promise<ApiResponse<FinalizeQuoteResponse>> {
    return this.request<ApiResponse<FinalizeQuoteResponse>>(`/quotes/${id}/finalize`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async acceptQuote(id: string): Promise<ApiResponse<{ message: string; orderId?: string; orderNumber?: string; fulfillmentTriggered?: boolean; proformaGenerated?: boolean }>> {
    return this.request<ApiResponse<{ message: string; orderId?: string; orderNumber?: string; fulfillmentTriggered?: boolean; proformaGenerated?: boolean }>>(`/quotes/${id}/accept`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async checkoutQuote(
    quoteId: string,
    data: CheckoutQuoteData
  ): Promise<ApiResponse<CheckoutQuoteResponse>> {
    return this.request<ApiResponse<CheckoutQuoteResponse>>(`/quotes/${quoteId}/checkout`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async rejectQuote(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/quotes/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async deleteQuote(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/quotes/${id}`, {
      method: 'DELETE',
    });
  }

  // Order endpoints
  async createOrderFromQuote(data: CreateOrderFromQuoteData): Promise<ApiResponse<CreateOrderResponse>> {
    return this.request<ApiResponse<CreateOrderResponse>>('/orders/from-quote', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrders(params: OrdersQueryParams = {}): Promise<ApiResponse<SalesOrdersListResponse>> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/orders?${queryString}` : '/orders';
    return this.request<ApiResponse<SalesOrdersListResponse>>(endpoint);
  }

  async getOrderById(id: string): Promise<ApiResponse<SalesOrder>> {
    return this.request<ApiResponse<SalesOrder>>(`/orders/${id}`);
  }

  async getOrderTimeline(orderId: string): Promise<ApiResponse<TimelineEvent[]>> {
    return this.request<ApiResponse<TimelineEvent[]>>(`/orders/${orderId}/timeline`);
  }

  async updateOrderNotes(id: string, notes: { internalNotes?: string; customerNotes?: string }): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(notes),
    });
  }

  async confirmOrder(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/orders/${id}/confirm`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async holdOrder(id: string, reason: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/orders/${id}/hold`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async releaseOrderHold(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/orders/${id}/release`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async cancelOrder(id: string, reason: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async closeOrder(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/orders/${id}/close`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  // Picking slip endpoints
  async getPickingSlips(params: PickingSlipsQueryParams = {}): Promise<ApiResponse<PickingSlipsListResponse>> {
    const searchParams = new URLSearchParams();
    if (params.orderId) searchParams.set('orderId', params.orderId);
    if (params.location) searchParams.set('location', params.location);
    if (params.status) searchParams.set('status', params.status);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/picking-slips?${queryString}` : '/picking-slips';
    return this.request<ApiResponse<PickingSlipsListResponse>>(endpoint);
  }

  async getPickingSlipById(id: string): Promise<ApiResponse<PickingSlip>> {
    return this.request<ApiResponse<PickingSlip>>(`/picking-slips/${id}`);
  }

  async getPickingSlipsForOrder(orderId: string): Promise<ApiResponse<OrderPickingSlipSummary[]>> {
    return this.request<ApiResponse<OrderPickingSlipSummary[]>>(`/picking-slips/order/${orderId}`);
  }

  async generatePickingSlips(orderId: string, data: GeneratePickingSlipsData): Promise<ApiResponse<GeneratePickingSlipsResponse>> {
    return this.request<ApiResponse<GeneratePickingSlipsResponse>>(`/picking-slips/generate/${orderId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async assignPickingSlip(id: string, assignedTo: string, assignedToName: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/picking-slips/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assignedTo, assignedToName }),
    });
  }

  async startPicking(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/picking-slips/${id}/start`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async updatePickingSlipLine(pickingSlipId: string, lineId: string, quantityPicked: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/picking-slips/${pickingSlipId}/lines/${lineId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantityPicked }),
    });
  }

  async completePicking(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/picking-slips/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  // Job card endpoints
  async getJobCards(params: JobCardsQueryParams = {}): Promise<ApiResponse<JobCardsListResponse>> {
    const searchParams = new URLSearchParams();
    if (params.orderId) searchParams.set('orderId', params.orderId);
    if (params.status) searchParams.set('status', params.status);
    if (params.jobType) searchParams.set('jobType', params.jobType);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/job-cards?${queryString}` : '/job-cards';
    return this.request<ApiResponse<JobCardsListResponse>>(endpoint);
  }

  async getJobCardById(id: string): Promise<ApiResponse<JobCard>> {
    return this.request<ApiResponse<JobCard>>(`/job-cards/${id}`);
  }

  async getJobCardsForOrder(orderId: string): Promise<ApiResponse<OrderJobCardSummary[]>> {
    return this.request<ApiResponse<OrderJobCardSummary[]>>(`/job-cards/order/${orderId}`);
  }

  async createJobCard(data: CreateJobCardData): Promise<ApiResponse<CreateJobCardResponse>> {
    return this.request<ApiResponse<CreateJobCardResponse>>('/job-cards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async assignJobCard(id: string, assignedTo: string, assignedToName: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/job-cards/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assignedTo, assignedToName }),
    });
  }

  async startJobCard(id: string): Promise<ApiResponse<{ message: string; warnings?: MaterialWarning[] }>> {
    return this.request<ApiResponse<{ message: string; warnings?: MaterialWarning[] }>>(`/job-cards/${id}/start`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async putJobCardOnHold(id: string, holdReason: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/job-cards/${id}/hold`, {
      method: 'POST',
      body: JSON.stringify({ holdReason }),
    });
  }

  async resumeJobCard(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/job-cards/${id}/resume`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async completeJobCard(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/job-cards/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async updateJobCardNotes(id: string, notes: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/job-cards/${id}/notes`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    });
  }

  // Transfer request endpoints
  async getTransferRequests(params: TransferRequestsQueryParams = {}): Promise<ApiResponse<TransferRequestsListResponse>> {
    const searchParams = new URLSearchParams();
    if (params.orderId) searchParams.set('orderId', params.orderId);
    if (params.status) searchParams.set('status', params.status);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/transfer-requests?${queryString}` : '/transfer-requests';
    return this.request<ApiResponse<TransferRequestsListResponse>>(endpoint);
  }

  async getTransferRequestById(id: string): Promise<ApiResponse<TransferRequest>> {
    return this.request<ApiResponse<TransferRequest>>(`/transfer-requests/${id}`);
  }

  async getTransferRequestsForOrder(orderId: string): Promise<ApiResponse<OrderTransferRequestSummary[]>> {
    return this.request<ApiResponse<OrderTransferRequestSummary[]>>(`/transfer-requests/order/${orderId}`);
  }

  async generateTransferRequest(orderId: string, data: CreateTransferRequestFromOrderData): Promise<ApiResponse<CreateTransferRequestResponse>> {
    return this.request<ApiResponse<CreateTransferRequestResponse>>(`/transfer-requests/generate/${orderId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createStandaloneTransferRequest(data: CreateStandaloneTransferRequestData): Promise<ApiResponse<CreateTransferRequestResponse>> {
    return this.request<ApiResponse<CreateTransferRequestResponse>>('/transfer-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async shipTransferRequest(id: string, shippedByName: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/transfer-requests/${id}/ship`, {
      method: 'POST',
      body: JSON.stringify({ shippedByName }),
    });
  }

  async updateTransferRequestLine(transferRequestId: string, lineId: string, receivedQuantity: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/transfer-requests/${transferRequestId}/lines/${lineId}`, {
      method: 'PATCH',
      body: JSON.stringify({ receivedQuantity }),
    });
  }

  async receiveTransferRequest(id: string, receivedByName: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/transfer-requests/${id}/receive`, {
      method: 'POST',
      body: JSON.stringify({ receivedByName }),
    });
  }

  async updateTransferRequestNotes(id: string, notes: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/transfer-requests/${id}/notes`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    });
  }

  // Issue Flag endpoints
  async getIssueFlags(params: IssueFlagsQueryParams = {}): Promise<ApiResponse<IssueFlagsListResponse>> {
    const searchParams = new URLSearchParams();
    if (params.pickingSlipId) searchParams.set('pickingSlipId', params.pickingSlipId);
    if (params.jobCardId) searchParams.set('jobCardId', params.jobCardId);
    if (params.status) searchParams.set('status', params.status);
    if (params.severity) searchParams.set('severity', params.severity);
    if (params.category) searchParams.set('category', params.category);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/issues?${queryString}` : '/issues';
    return this.request<ApiResponse<IssueFlagsListResponse>>(endpoint);
  }

  async getIssueFlagById(id: string): Promise<ApiResponse<IssueFlag>> {
    return this.request<ApiResponse<IssueFlag>>(`/issues/${id}`);
  }

  async getIssueFlagStats(): Promise<ApiResponse<IssueFlagStats>> {
    return this.request<ApiResponse<IssueFlagStats>>('/issues/stats');
  }

  async getIssuesForPickingSlip(pickingSlipId: string): Promise<ApiResponse<IssueFlagSummary[]>> {
    return this.request<ApiResponse<IssueFlagSummary[]>>(`/issues/picking-slip/${pickingSlipId}`);
  }

  async getIssuesForJobCard(jobCardId: string): Promise<ApiResponse<IssueFlagSummary[]>> {
    return this.request<ApiResponse<IssueFlagSummary[]>>(`/issues/job-card/${jobCardId}`);
  }

  async createIssueFlag(data: CreateIssueFlagData): Promise<ApiResponse<CreateIssueFlagResponse>> {
    return this.request<ApiResponse<CreateIssueFlagResponse>>('/issues', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateIssueFlagStatus(id: string, status: IssueFlagStatus): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/issues/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async addIssueComment(id: string, content: string): Promise<ApiResponse<IssueComment>> {
    return this.request<ApiResponse<IssueComment>>(`/issues/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async resolveIssue(id: string, resolution: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/issues/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution }),
    });
  }

  async closeIssue(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/issues/${id}/close`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  // Document endpoints
  async getDocuments(params: DocumentsQueryParams = {}): Promise<ApiResponse<DocumentsListResponse>> {
    const searchParams = new URLSearchParams();
    if (params.orderId) searchParams.set('orderId', params.orderId);
    if (params.type) searchParams.set('type', params.type);
    if (params.search) searchParams.set('search', params.search);
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/documents?${queryString}` : '/documents';
    return this.request<ApiResponse<DocumentsListResponse>>(endpoint);
  }

  async getDocumentsForOrder(orderId: string): Promise<ApiResponse<DocumentForOrder[]>> {
    return this.request<ApiResponse<DocumentForOrder[]>>(`/documents/order/${orderId}`);
  }

  async getDocumentDownloadUrl(id: string): Promise<ApiResponse<DocumentDownloadResponse>> {
    return this.request<ApiResponse<DocumentDownloadResponse>>(`/documents/${id}/download`);
  }

  async uploadDocument(data: UploadDocumentData): Promise<ApiResponse<{ id: string; filename: string }>> {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('orderId', data.orderId);
    formData.append('type', data.type);
    return this.uploadFile<ApiResponse<{ id: string; filename: string }>>('/documents/upload', formData);
  }

  async deleteDocument(id: string): Promise<void> {
    await this.request(`/documents/${id}`, {
      method: 'DELETE',
    });
  }

  // Supplier endpoints
  async getSuppliers(params: SuppliersQueryParams = {}): Promise<ApiResponse<SuppliersListResponse>> {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.isActive !== undefined) searchParams.set('isActive', params.isActive.toString());
    if (params.currency) searchParams.set('currency', params.currency);
    if (params.isLocal !== undefined) searchParams.set('isLocal', params.isLocal.toString());
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/suppliers?${queryString}` : '/suppliers';
    return this.request<ApiResponse<SuppliersListResponse>>(endpoint);
  }

  async getSupplierById(id: string): Promise<ApiResponse<Supplier>> {
    return this.request<ApiResponse<Supplier>>(`/suppliers/${id}`);
  }

  async createSupplier(data: CreateSupplierData): Promise<ApiResponse<Supplier>> {
    return this.request<ApiResponse<Supplier>>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSupplier(id: string, data: UpdateSupplierData): Promise<ApiResponse<Supplier>> {
    return this.request<ApiResponse<Supplier>>(`/suppliers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteSupplier(id: string): Promise<void> {
    await this.request(`/suppliers/${id}`, {
      method: 'DELETE',
    });
  }

  async addSupplierContact(supplierId: string, data: CreateContactData): Promise<ApiResponse<SupplierContact>> {
    return this.request<ApiResponse<SupplierContact>>(`/suppliers/${supplierId}/contacts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSupplierContact(supplierId: string, contactId: string, data: UpdateContactData): Promise<ApiResponse<SupplierContact>> {
    return this.request<ApiResponse<SupplierContact>>(`/suppliers/${supplierId}/contacts/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteSupplierContact(supplierId: string, contactId: string): Promise<void> {
    await this.request(`/suppliers/${supplierId}/contacts/${contactId}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // PRODUCT CRUD
  // ============================================

  async createProduct(data: CreateProductData): Promise<ApiResponse<ProductWithInventory>> {
    return this.request<ApiResponse<ProductWithInventory>>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id: string, data: UpdateProductData): Promise<ApiResponse<ProductWithInventory>> {
    return this.request<ApiResponse<ProductWithInventory>>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: string): Promise<void> {
    await this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Publish a product to the website
   */
  async publishProduct(id: string): Promise<ApiResponse<{
    id: string;
    nusafSku: string;
    isPublished: boolean;
    publishedAt: string | null;
  }>> {
    return this.request(`/products/${id}/publish`, {
      method: 'POST',
    });
  }

  /**
   * Unpublish a product from the website
   */
  async unpublishProduct(id: string): Promise<ApiResponse<{
    id: string;
    nusafSku: string;
    isPublished: boolean;
    publishedAt: string | null;
  }>> {
    return this.request(`/products/${id}/unpublish`, {
      method: 'POST',
    });
  }

  /**
   * Bulk publish or unpublish multiple products
   */
  async bulkPublishProducts(
    productIds: string[],
    action: 'publish' | 'unpublish'
  ): Promise<ApiResponse<{
    action: string;
    updated: number;
    productIds: string[];
  }>> {
    return this.request('/products/bulk-publish', {
      method: 'POST',
      body: JSON.stringify({ productIds, action }),
    });
  }

  // ============================================
  // PRODUCT IMAGES METHODS
  // ============================================

  /**
   * Get images for a product
   */
  async getProductImages(productId: string): Promise<ApiResponse<{
    images: Array<{
      id: string;
      url: string;
      thumbnailUrl: string | null;
      altText: string | null;
      caption: string | null;
      isPrimary: boolean;
      sortOrder: number;
    }>;
  }>> {
    return this.request(`/products/${productId}/images`);
  }

  /**
   * Upload an image for a product
   */
  async uploadProductImage(
    productId: string,
    file: File,
    options?: {
      altText?: string;
      caption?: string;
      isPrimary?: boolean;
      sortOrder?: number;
    }
  ): Promise<ApiResponse<{
    id: string;
    url: string;
    thumbnailUrl: string | null;
    altText: string | null;
    caption: string | null;
    isPrimary: boolean;
    sortOrder: number;
  }>> {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.altText) formData.append('altText', options.altText);
    if (options?.caption) formData.append('caption', options.caption);
    if (options?.isPrimary !== undefined) formData.append('isPrimary', String(options.isPrimary));
    if (options?.sortOrder !== undefined) formData.append('sortOrder', String(options.sortOrder));

    return this.request(`/products/${productId}/images`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary for FormData
    }, true); // skipContentType = true
  }

  /**
   * Update image metadata
   */
  async updateProductImage(
    productId: string,
    imageId: string,
    data: {
      altText?: string | null;
      caption?: string | null;
      isPrimary?: boolean;
      sortOrder?: number;
    }
  ): Promise<ApiResponse<{
    id: string;
    url: string;
    thumbnailUrl: string | null;
    altText: string | null;
    caption: string | null;
    isPrimary: boolean;
    sortOrder: number;
  }>> {
    return this.request(`/products/${productId}/images/${imageId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a product image
   */
  async deleteProductImage(productId: string, imageId: string): Promise<void> {
    await this.request(`/products/${productId}/images/${imageId}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // PRODUCT DOCUMENTS METHODS
  // ============================================

  /**
   * Get documents for a product
   */
  async getProductDocuments(productId: string): Promise<ApiResponse<{
    documents: Array<{
      id: string;
      type: ProductDocumentType;
      name: string;
      fileName: string;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
      sortOrder: number;
    }>;
  }>> {
    return this.request(`/products/${productId}/documents`);
  }

  /**
   * Upload a document for a product
   */
  async uploadProductDocument(
    productId: string,
    file: File,
    options: {
      type: string;
      name: string;
      sortOrder?: number;
    }
  ): Promise<ApiResponse<{
    id: string;
    type: string;
    name: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    sortOrder: number;
  }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', options.type);
    formData.append('name', options.name);
    if (options.sortOrder !== undefined) formData.append('sortOrder', String(options.sortOrder));

    return this.request(`/products/${productId}/documents`, {
      method: 'POST',
      body: formData,
    }, true); // skipContentType = true
  }

  /**
   * Delete a product document
   */
  async deleteProductDocument(productId: string, documentId: string): Promise<void> {
    await this.request(`/products/${productId}/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // BOM (BILL OF MATERIALS) METHODS
  // ============================================

  async getProductBom(
    productId: string
  ): Promise<ApiResponse<{ productId: string; components: BomItemData[] }>> {
    return this.request(`/products/${productId}/bom`);
  }

  async addBomComponent(
    productId: string,
    data: AddBomComponentInput
  ): Promise<ApiResponse<BomItemData>> {
    return this.request(`/products/${productId}/bom`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBomComponent(
    productId: string,
    componentId: string,
    data: UpdateBomComponentInput
  ): Promise<ApiResponse<BomItemData>> {
    return this.request(`/products/${productId}/bom/${componentId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async removeBomComponent(productId: string, componentId: string): Promise<void> {
    await this.request(`/products/${productId}/bom/${componentId}`, {
      method: 'DELETE',
    });
  }

  async checkBomStock(
    productId: string,
    quantity: number,
    warehouse: 'JHB' | 'CT'
  ): Promise<ApiResponse<BomStockCheckResult>> {
    return this.request(
      `/products/${productId}/bom/stock-check?quantity=${quantity}&warehouse=${warehouse}`
    );
  }

  async getWhereUsed(
    productId: string
  ): Promise<ApiResponse<{ productId: string; usedIn: WhereUsedItem[] }>> {
    return this.request(`/products/${productId}/where-used`);
  }

  async copyBom(
    targetProductId: string,
    sourceProductId: string
  ): Promise<ApiResponse<{ copiedCount: number }>> {
    return this.request(`/products/${targetProductId}/bom/copy-from/${sourceProductId}`, {
      method: 'POST',
    });
  }

  // ============================================
  // PURCHASE ORDER METHODS
  // ============================================

  async getPurchaseOrders(params: PurchaseOrdersQueryParams = {}): Promise<ApiResponse<PurchaseOrdersListResponse>> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.supplierId) searchParams.set('supplierId', params.supplierId);
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);
    if (params.search) searchParams.set('search', params.search);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/purchase-orders?${queryString}` : '/purchase-orders';
    return this.request<ApiResponse<PurchaseOrdersListResponse>>(endpoint);
  }

  async getPurchaseOrderById(id: string): Promise<ApiResponse<PurchaseOrder>> {
    return this.request<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`);
  }

  async createPurchaseOrder(data: CreatePurchaseOrderData): Promise<ApiResponse<PurchaseOrder>> {
    return this.request<ApiResponse<PurchaseOrder>>('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePurchaseOrder(id: string, data: UpdatePurchaseOrderData): Promise<ApiResponse<PurchaseOrder>> {
    return this.request<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async cancelPurchaseOrder(id: string): Promise<void> {
    await this.request(`/purchase-orders/${id}`, {
      method: 'DELETE',
    });
  }

  // PO Line management
  async addPurchaseOrderLine(poId: string, data: AddPurchaseOrderLineData): Promise<ApiResponse<PurchaseOrderLine>> {
    return this.request<ApiResponse<PurchaseOrderLine>>(`/purchase-orders/${poId}/lines`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePurchaseOrderLine(poId: string, lineId: string, data: UpdatePurchaseOrderLineData): Promise<ApiResponse<PurchaseOrderLine>> {
    return this.request<ApiResponse<PurchaseOrderLine>>(`/purchase-orders/${poId}/lines/${lineId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async removePurchaseOrderLine(poId: string, lineId: string): Promise<void> {
    await this.request(`/purchase-orders/${poId}/lines/${lineId}`, {
      method: 'DELETE',
    });
  }

  // PO Workflow actions
  async submitPurchaseOrder(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/purchase-orders/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async approvePurchaseOrder(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/purchase-orders/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async rejectPurchaseOrder(id: string, data: RejectPurchaseOrderData): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/purchase-orders/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendPurchaseOrder(id: string, data: SendPurchaseOrderData = {}): Promise<ApiResponse<SendPurchaseOrderResponse>> {
    return this.request<ApiResponse<SendPurchaseOrderResponse>>(`/purchase-orders/${id}/send`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async acknowledgePurchaseOrder(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/purchase-orders/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async downloadPurchaseOrderPdf(id: string): Promise<Blob> {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/purchase-orders/${id}/pdf`;
    const headers: Record<string, string> = {};
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new ApiError('Failed to download PDF', 'PDF_DOWNLOAD_ERROR', response.status);
    }
    return response.blob();
  }

  // PO GRV-related
  async getPurchaseOrderGrvs(poId: string): Promise<ApiResponse<GoodsReceivedVoucher[]>> {
    return this.request<ApiResponse<GoodsReceivedVoucher[]>>(`/purchase-orders/${poId}/goods-receipts`);
  }

  async getPurchaseOrderReceivingSummary(poId: string): Promise<ApiResponse<ReceivingSummary>> {
    return this.request<ApiResponse<ReceivingSummary>>(`/purchase-orders/${poId}/receiving-summary`);
  }

  // ============================================
  // GOODS RECEIVED VOUCHER (GRV) METHODS
  // ============================================

  async getGoodsReceipts(params: GrvsQueryParams = {}): Promise<ApiResponse<GrvsListResponse>> {
    const searchParams = new URLSearchParams();
    if (params.purchaseOrderId) searchParams.set('purchaseOrderId', params.purchaseOrderId);
    if (params.location) searchParams.set('location', params.location);
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);
    if (params.search) searchParams.set('search', params.search);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/goods-receipts?${queryString}` : '/goods-receipts';
    return this.request<ApiResponse<GrvsListResponse>>(endpoint);
  }

  async getGoodsReceiptById(id: string): Promise<ApiResponse<GoodsReceivedVoucher>> {
    return this.request<ApiResponse<GoodsReceivedVoucher>>(`/goods-receipts/${id}`);
  }

  async createGoodsReceipt(data: CreateGrvData): Promise<ApiResponse<GoodsReceivedVoucher>> {
    return this.request<ApiResponse<GoodsReceivedVoucher>>('/goods-receipts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGoodsReceiptsForPO(poId: string): Promise<ApiResponse<GoodsReceivedVoucher[]>> {
    return this.request<ApiResponse<GoodsReceivedVoucher[]>>(`/goods-receipts/po/${poId}`);
  }

  async getReceivingSummary(poId: string): Promise<ApiResponse<ReceivingSummary>> {
    return this.request<ApiResponse<ReceivingSummary>>(`/goods-receipts/po/${poId}/summary`);
  }

  // ============================================
  // DELIVERY NOTE METHODS
  // ============================================

  async getDeliveryNotes(params: DeliveryNotesQueryParams = {}): Promise<ApiResponse<DeliveryNotesListResponse>> {
    const searchParams = new URLSearchParams();
    if (params.orderId) searchParams.set('orderId', params.orderId);
    if (params.status) searchParams.set('status', params.status);
    if (params.location) searchParams.set('location', params.location);
    if (params.search) searchParams.set('search', params.search);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/delivery-notes?${queryString}` : '/delivery-notes';
    return this.request<ApiResponse<DeliveryNotesListResponse>>(endpoint);
  }

  async getDeliveryNoteById(id: string): Promise<ApiResponse<DeliveryNote>> {
    return this.request<ApiResponse<DeliveryNote>>(`/delivery-notes/${id}`);
  }

  async getDeliveryNotesForOrder(orderId: string): Promise<ApiResponse<OrderDeliveryNoteSummary[]>> {
    return this.request<ApiResponse<OrderDeliveryNoteSummary[]>>(`/delivery-notes/order/${orderId}`);
  }

  async createDeliveryNoteFromOrder(orderId: string, data: CreateDeliveryNoteData): Promise<ApiResponse<{ id: string; deliveryNoteNumber: string }>> {
    return this.request<ApiResponse<{ id: string; deliveryNoteNumber: string }>>(`/delivery-notes/from-order/${orderId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async dispatchDeliveryNote(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/delivery-notes/${id}/dispatch`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async confirmDelivery(id: string, data: ConfirmDeliveryData): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/delivery-notes/${id}/confirm-delivery`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelDeliveryNote(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/delivery-notes/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  // ============================================
  // PROFORMA INVOICE METHODS
  // ============================================

  async getProformaInvoicesForOrder(orderId: string): Promise<ApiResponse<ProformaInvoiceSummary[]>> {
    return this.request<ApiResponse<ProformaInvoiceSummary[]>>(`/proforma-invoices/order/${orderId}`);
  }

  async getProformaInvoiceById(id: string): Promise<ApiResponse<ProformaInvoice>> {
    return this.request<ApiResponse<ProformaInvoice>>(`/proforma-invoices/${id}`);
  }

  async createProformaInvoice(orderId: string, data: CreateProformaInvoiceData = {}): Promise<ApiResponse<{ id: string; proformaNumber: string }>> {
    return this.request<ApiResponse<{ id: string; proformaNumber: string }>>(`/proforma-invoices/from-order/${orderId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async downloadProformaInvoicePDF(id: string): Promise<Blob> {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/proforma-invoices/${id}/pdf`;
    const headers: Record<string, string> = {};
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new ApiError('Failed to download PDF', 'PDF_DOWNLOAD_ERROR', response.status);
    }
    return response.blob();
  }

  async voidProformaInvoice(id: string, reason: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/proforma-invoices/${id}/void`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // ============================================
  // TAX INVOICE METHODS
  // ============================================

  async getTaxInvoices(params: TaxInvoicesQueryParams = {}): Promise<ApiResponse<TaxInvoicesListResponse>> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.companyId) searchParams.set('companyId', params.companyId);
    if (params.search) searchParams.set('search', params.search);
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) searchParams.set('dateTo', params.dateTo);
    if (params.paymentTerms) searchParams.set('paymentTerms', params.paymentTerms);
    if (params.overdue) searchParams.set('overdue', 'true');
    if (params.page) searchParams.set('page', String(params.page));
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
    const qs = searchParams.toString();
    return this.request<ApiResponse<TaxInvoicesListResponse>>(`/tax-invoices${qs ? `?${qs}` : ''}`);
  }

  async getTaxInvoicesForOrder(orderId: string): Promise<ApiResponse<TaxInvoiceSummary[]>> {
    return this.request<ApiResponse<TaxInvoiceSummary[]>>(`/tax-invoices/order/${orderId}`);
  }

  async getTaxInvoiceById(id: string): Promise<ApiResponse<TaxInvoice>> {
    return this.request<ApiResponse<TaxInvoice>>(`/tax-invoices/${id}`);
  }

  async createTaxInvoice(orderId: string, data: CreateTaxInvoiceData = {}): Promise<ApiResponse<{ id: string; invoiceNumber: string }>> {
    return this.request<ApiResponse<{ id: string; invoiceNumber: string }>>(`/tax-invoices/from-order/${orderId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async downloadTaxInvoicePDF(id: string): Promise<Blob> {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/tax-invoices/${id}/pdf`;
    const headers: Record<string, string> = {};
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new ApiError('Failed to download PDF', 'PDF_DOWNLOAD_ERROR', response.status);
    }
    return response.blob();
  }

  async voidTaxInvoice(id: string, reason: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/tax-invoices/${id}/void`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // ============================================
  // CREDIT NOTE METHODS
  // ============================================

  async getCreditNotes(params: CreditNotesQueryParams = {}): Promise<ApiResponse<CreditNotesListResponse>> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.companyId) searchParams.set('companyId', params.companyId);
    if (params.search) searchParams.set('search', params.search);
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) searchParams.set('dateTo', params.dateTo);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
    const qs = searchParams.toString();
    return this.request<ApiResponse<CreditNotesListResponse>>(`/credit-notes${qs ? `?${qs}` : ''}`);
  }

  async getCreditNotesForRA(raId: string): Promise<ApiResponse<CreditNoteSummary[]>> {
    return this.request<ApiResponse<CreditNoteSummary[]>>(`/credit-notes/ra/${raId}`);
  }

  async getCreditNotesForOrder(orderId: string): Promise<ApiResponse<CreditNoteSummary[]>> {
    return this.request<ApiResponse<CreditNoteSummary[]>>(`/credit-notes/order/${orderId}`);
  }

  async getCreditNoteById(id: string): Promise<ApiResponse<CreditNote>> {
    return this.request<ApiResponse<CreditNote>>(`/credit-notes/${id}`);
  }

  async downloadCreditNotePDF(id: string): Promise<Blob> {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/credit-notes/${id}/pdf`;
    const headers: Record<string, string> = {};
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new ApiError('Failed to download PDF', 'PDF_DOWNLOAD_ERROR', response.status);
    }
    return response.blob();
  }

  async voidCreditNote(id: string, reason: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/credit-notes/${id}/void`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // ============================================
  // PAYMENT METHODS
  // ============================================

  async getOrderPayments(orderId: string): Promise<ApiResponse<Payment[]>> {
    return this.request<ApiResponse<Payment[]>>(`/orders/${orderId}/payments`);
  }

  async recordPayment(orderId: string, data: RecordPaymentData): Promise<ApiResponse<{ id: string; paymentNumber: string; fulfillmentTriggered?: boolean; fulfillmentError?: string }>> {
    return this.request<ApiResponse<{ id: string; paymentNumber: string; fulfillmentTriggered?: boolean; fulfillmentError?: string }>>(`/orders/${orderId}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async voidPayment(paymentId: string, reason: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/orders/payments/${paymentId}/void`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // ============================================
  // PURCHASE REQUISITION METHODS
  // ============================================

  async getPurchaseRequisitions(params: PurchaseRequisitionsQueryParams = {}): Promise<ApiResponse<PurchaseRequisitionsListResponse>> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.urgency) searchParams.set('urgency', params.urgency);
    if (params.search) searchParams.set('search', params.search);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
    const qs = searchParams.toString();
    return this.request<ApiResponse<PurchaseRequisitionsListResponse>>(`/purchase-requisitions${qs ? `?${qs}` : ''}`);
  }

  async getPurchaseRequisitionById(id: string): Promise<ApiResponse<PurchaseRequisition>> {
    return this.request<ApiResponse<PurchaseRequisition>>(`/purchase-requisitions/${id}`);
  }

  async createPurchaseRequisition(data: CreatePurchaseRequisitionData): Promise<ApiResponse<PurchaseRequisition>> {
    return this.request<ApiResponse<PurchaseRequisition>>('/purchase-requisitions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approvePurchaseRequisition(id: string): Promise<ApiResponse<{ message: string; generatedPOIds: string[] }>> {
    return this.request<ApiResponse<{ message: string; generatedPOIds: string[] }>>(`/purchase-requisitions/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectPurchaseRequisition(id: string, reason: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/purchase-requisitions/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async cancelPurchaseRequisition(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/purchase-requisitions/${id}/cancel`, {
      method: 'POST',
    });
  }

  // ============================================
  // RETURN AUTHORIZATION METHODS
  // ============================================

  async getReturnAuthorizations(params: ReturnAuthorizationsQueryParams = {}): Promise<ApiResponse<ReturnAuthorizationsListResponse>> {
    const searchParams = new URLSearchParams();
    if (params.orderId) searchParams.set('orderId', params.orderId);
    if (params.deliveryNoteId) searchParams.set('deliveryNoteId', params.deliveryNoteId);
    if (params.status) searchParams.set('status', params.status);
    if (params.search) searchParams.set('search', params.search);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
    const qs = searchParams.toString();
    return this.request<ApiResponse<ReturnAuthorizationsListResponse>>(`/return-authorizations${qs ? `?${qs}` : ''}`);
  }

  async getReturnAuthorizationById(id: string): Promise<ApiResponse<ReturnAuthorization>> {
    return this.request<ApiResponse<ReturnAuthorization>>(`/return-authorizations/${id}`);
  }

  async getReturnAuthorizationsForOrder(orderId: string): Promise<ApiResponse<OrderReturnAuthorizationSummary[]>> {
    return this.request<ApiResponse<OrderReturnAuthorizationSummary[]>>(`/return-authorizations/order/${orderId}`);
  }

  async createReturnAuthorization(data: CreateReturnAuthorizationData): Promise<ApiResponse<ReturnAuthorization>> {
    return this.request<ApiResponse<ReturnAuthorization>>('/return-authorizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approveReturnAuthorization(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/return-authorizations/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectReturnAuthorization(id: string, reason: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/return-authorizations/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async receiveReturnItems(id: string, data: ReceiveReturnItemsData): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/return-authorizations/${id}/receive-items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async completeReturnAuthorization(id: string, data: CompleteReturnAuthorizationData): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/return-authorizations/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelReturnAuthorization(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/return-authorizations/${id}/cancel`, {
      method: 'POST',
    });
  }

  // ============================================
  // PACKING LIST METHODS
  // ============================================

  async getPackingLists(params: PackingListsQueryParams = {}): Promise<ApiResponse<PackingListsListResponse>> {
    const searchParams = new URLSearchParams();
    if (params.orderId) searchParams.set('orderId', params.orderId);
    if (params.deliveryNoteId) searchParams.set('deliveryNoteId', params.deliveryNoteId);
    if (params.status) searchParams.set('status', params.status);
    if (params.location) searchParams.set('location', params.location);
    if (params.search) searchParams.set('search', params.search);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
    const qs = searchParams.toString();
    return this.request<ApiResponse<PackingListsListResponse>>(`/packing-lists${qs ? `?${qs}` : ''}`);
  }

  async getPackingListById(id: string): Promise<ApiResponse<PackingList>> {
    return this.request<ApiResponse<PackingList>>(`/packing-lists/${id}`);
  }

  async getPackingListsForOrder(orderId: string): Promise<ApiResponse<OrderPackingListSummary[]>> {
    return this.request<ApiResponse<OrderPackingListSummary[]>>(`/packing-lists/order/${orderId}`);
  }

  async createPackingListFromOrder(orderId: string, data: CreatePackingListData): Promise<ApiResponse<{ id: string; packingListNumber: string }>> {
    return this.request<ApiResponse<{ id: string; packingListNumber: string }>>(`/packing-lists/from-order/${orderId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePackingList(id: string, data: CreatePackingListData): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/packing-lists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async finalizePackingList(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/packing-lists/${id}/finalize`, {
      method: 'POST',
    });
  }

  async cancelPackingList(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/packing-lists/${id}/cancel`, {
      method: 'POST',
    });
  }

  async downloadPackingListPDF(id: string): Promise<Blob> {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/packing-lists/${id}/pdf`;
    const headers: Record<string, string> = {};
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new ApiError('Failed to download PDF', 'PDF_DOWNLOAD_ERROR', response.status);
    }
    return response.blob();
  }

  // ============================================
  // FULFILLMENT ORCHESTRATION METHODS
  // ============================================

  /**
   * Generate a fulfillment plan for an order (preview only, no documents created)
   */
  async generateFulfillmentPlan(
    orderId: string,
    data: GenerateFulfillmentPlanData = {}
  ): Promise<ApiResponse<OrchestrationPlan>> {
    return this.request<ApiResponse<OrchestrationPlan>>(`/orders/${orderId}/fulfillment-plan`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Execute a fulfillment plan (creates all documents)
   */
  async executeFulfillmentPlan(
    orderId: string,
    data: ExecuteFulfillmentPlanData
  ): Promise<ApiResponse<ExecutionResult>> {
    return this.request<ApiResponse<ExecutionResult>>(`/orders/${orderId}/fulfillment-plan/execute`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update the fulfillment policy override for an order
   */
  async updateOrderFulfillmentPolicy(
    orderId: string,
    policy: FulfillmentPolicy | null
  ): Promise<ApiResponse<{ fulfillmentPolicyOverride: FulfillmentPolicy | null }>> {
    return this.request<ApiResponse<{ fulfillmentPolicyOverride: FulfillmentPolicy | null }>>(
      `/orders/${orderId}/fulfillment-policy`,
      {
        method: 'PATCH',
        body: JSON.stringify({ fulfillmentPolicyOverride: policy }),
      }
    );
  }

  // ============================================
  // PUBLIC PRODUCTS METHODS (No Auth Required)
  // ============================================

  /**
   * Get published products for public website (no prices)
   */
  async getPublicProducts(
    params: PublicProductsParams = {}
  ): Promise<ApiResponse<PublicProductsResponse>> {
    const searchParams = new URLSearchParams();
    if (params.categoryId) searchParams.append('categoryId', params.categoryId);
    if (params.categoryCode) searchParams.append('categoryCode', params.categoryCode);
    if (params.subCategoryId) searchParams.append('subCategoryId', params.subCategoryId);
    if (params.subCategoryCode) searchParams.append('subCategoryCode', params.subCategoryCode);
    if (params.search) searchParams.append('search', params.search);
    if (params.specs && Object.keys(params.specs).length > 0) {
      searchParams.append('specs', JSON.stringify(params.specs));
    }
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/public/products?${queryString}` : '/public/products';

    return this.request<ApiResponse<PublicProductsResponse>>(endpoint);
  }

  /**
   * Get single product by SKU for public website (no prices)
   */
  async getPublicProduct(sku: string): Promise<ApiResponse<PublicProductDetail>> {
    return this.request<ApiResponse<PublicProductDetail>>(`/public/products/${encodeURIComponent(sku)}`);
  }

  /**
   * Get related products for a product (same category/subcategory)
   */
  async getRelatedProducts(
    sku: string,
    limit: number = 8
  ): Promise<ApiResponse<RelatedProductsResponse>> {
    const params = new URLSearchParams();
    if (limit !== 8) params.append('limit', limit.toString());
    const query = params.toString();
    return this.request<ApiResponse<RelatedProductsResponse>>(
      `/public/products/${encodeURIComponent(sku)}/related${query ? `?${query}` : ''}`
    );
  }

  /**
   * Get unique specification keys and values for filter-based navigation
   */
  async getProductSpecifications(
    params: SpecificationsParams = {}
  ): Promise<ApiResponse<SpecificationsResponse>> {
    const searchParams = new URLSearchParams();
    if (params.categoryId) searchParams.append('categoryId', params.categoryId);
    if (params.categoryCode) searchParams.append('categoryCode', params.categoryCode);
    if (params.subCategoryId) searchParams.append('subCategoryId', params.subCategoryId);
    if (params.subCategoryCode) searchParams.append('subCategoryCode', params.subCategoryCode);

    const queryString = searchParams.toString();
    const endpoint = queryString
      ? `/public/products/specifications?${queryString}`
      : '/public/products/specifications';

    return this.request<ApiResponse<SpecificationsResponse>>(endpoint);
  }

  /**
   * Search products including cross-references (public, no prices)
   */
  async searchPublicProducts(
    params: PublicProductSearchParams
  ): Promise<ApiResponse<PublicProductSearchResponse>> {
    const searchParams = new URLSearchParams();
    searchParams.append('q', params.q);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString());

    return this.request<ApiResponse<PublicProductSearchResponse>>(
      `/public/products/search?${searchParams.toString()}`
    );
  }

  /**
   * Search by competitor part number (cross-reference lookup)
   */
  async searchCrossReference(
    params: PublicCrossRefSearchParams
  ): Promise<ApiResponse<PublicCrossRefSearchResponse>> {
    const searchParams = new URLSearchParams();
    searchParams.append('q', params.q);
    if (params.brand) searchParams.append('brand', params.brand);

    return this.request<ApiResponse<PublicCrossRefSearchResponse>>(
      `/public/products/cross-reference?${searchParams.toString()}`
    );
  }

  // ============================================
  // PUBLIC CATEGORIES API METHODS
  // ============================================

  /**
   * Get all categories with subcategories and product counts
   */
  async getPublicCategories(): Promise<ApiResponse<PublicCategoriesResponse>> {
    return this.request<ApiResponse<PublicCategoriesResponse>>('/public/categories');
  }

  /**
   * Get a single category by slug or code
   */
  async getPublicCategory(slugOrCode: string): Promise<ApiResponse<PublicCategory>> {
    return this.request<ApiResponse<PublicCategory>>(
      `/public/categories/${encodeURIComponent(slugOrCode)}`
    );
  }

  /**
   * Get a subcategory by category slug and subcategory slug
   */
  async getPublicSubCategory(
    categorySlug: string,
    subCategorySlug: string
  ): Promise<ApiResponse<PublicCategoryWithParent>> {
    return this.request<ApiResponse<PublicCategoryWithParent>>(
      `/public/categories/${encodeURIComponent(categorySlug)}/${encodeURIComponent(subCategorySlug)}`
    );
  }

  // ============================================
  // PRODUCT HISTORY API METHODS
  // ============================================

  async getProductPurchaseHistory(
    productId: string,
    params: { page?: number; pageSize?: number } = {}
  ): Promise<ApiResponse<{
    data: Array<{
      id: string;
      poId: string;
      poNumber: string;
      status: string;
      supplierName: string;
      supplierCode: string;
      quantityOrdered: number;
      quantityReceived: number;
      unitCost: number;
      lineTotal: number;
      expectedDate: string | null;
      createdAt: string;
    }>;
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
  }>> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    const query = searchParams.toString();
    return this.request(`/products/${productId}/purchase-history${query ? `?${query}` : ''}`);
  }

  async getProductSalesHistory(
    productId: string,
    params: { page?: number; pageSize?: number } = {}
  ): Promise<ApiResponse<{
    data: Array<{
      id: string;
      orderId: string;
      orderNumber: string;
      status: string;
      companyName: string;
      companyId: string;
      quantityOrdered: number;
      quantityPicked: number;
      quantityShipped: number;
      unitPrice: number;
      lineTotal: number;
      createdAt: string;
    }>;
    summary: {
      totalOrders: number;
      totalUnitsOrdered: number;
      totalRevenue: number;
      uniqueCustomers: number;
    };
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
  }>> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    const query = searchParams.toString();
    return this.request(`/products/${productId}/sales-history${query ? `?${query}` : ''}`);
  }

  // ============================================
  // FULFILLMENT DASHBOARD
  // ============================================

  async getFulfillmentDashboard(): Promise<ApiResponse<FulfillmentDashboardData>> {
    return this.request<ApiResponse<FulfillmentDashboardData>>('/fulfillment/dashboard');
  }

  // ============================================
  // REPORTS
  // ============================================

  async getSalesReport(params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<SalesReportData>> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    const query = searchParams.toString();
    return this.request<ApiResponse<SalesReportData>>(`/reports/sales${query ? '?' + query : ''}`);
  }

  // ============================================
  // COMPANIES (Admin)
  // ============================================

  async getCompanies(params?: {
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<{
    companies: CompanyListItem[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
  }>> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    const query = searchParams.toString();
    return this.request(`/admin/companies${query ? '?' + query : ''}`);
  }

  async getCompany(id: string): Promise<ApiResponse<CompanyDetail>> {
    return this.request(`/admin/companies/${id}`);
  }

  async updateCompany(
    id: string,
    data: {
      name?: string;
      tradingName?: string;
      registrationNumber?: string;
      vatNumber?: string;
      paymentTerms?: PaymentTermsType;
      tier?: string;
      isActive?: boolean;
      primaryWarehouse?: 'JHB' | 'CT' | null;
      fulfillmentPolicy?: string;
      assignedSalesRepId?: string | null;
      creditLimit?: number | null;
      creditStatus?: CreditStatusType;
      accountStatus?: AccountStatusType;
      territory?: string | null;
      discountOverride?: number | null;
      defaultShippingMethod?: ShippingMethodType | null;
      statementEmail?: string | null;
      invoiceEmail?: string | null;
      internalNotes?: string | null;
      bbbeeLevel?: number | null;
      bbbeeExpiryDate?: string | null;
    }
  ): Promise<ApiResponse<CompanyDetail>> {
    return this.request(`/admin/companies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async createCompany(data: {
    name: string;
    tradingName?: string;
    registrationNumber?: string;
    vatNumber?: string;
    tier?: 'END_USER' | 'OEM_RESELLER' | 'DISTRIBUTOR';
    primaryWarehouse?: 'JHB' | 'CT';
    fulfillmentPolicy?: 'SHIP_PARTIAL' | 'SHIP_COMPLETE' | 'SALES_DECISION';
    paymentTerms?: PaymentTermsType;
    creditLimit?: number;
    creditStatus?: CreditStatusType;
    accountStatus?: AccountStatusType;
    territory?: string;
    discountOverride?: number;
    defaultShippingMethod?: ShippingMethodType;
    statementEmail?: string;
    invoiceEmail?: string;
    internalNotes?: string;
    bbbeeLevel?: number;
    bbbeeExpiryDate?: string;
  }): Promise<ApiResponse<CompanyDetail>> {
    return this.request('/admin/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getStaffUsersForAssignment(): Promise<ApiResponse<StaffUserOption[]>> {
    return this.request('/admin/companies/staff-users');
  }

  // --- Company Addresses ---

  async createCompanyAddress(
    companyId: string,
    data: {
      type: 'BILLING' | 'SHIPPING';
      label?: string;
      line1: string;
      line2?: string;
      suburb?: string;
      city: string;
      province: string;
      postalCode: string;
      country?: string;
      isDefault?: boolean;
      deliveryInstructions?: string;
      contactName?: string;
      contactPhone?: string;
    }
  ): Promise<ApiResponse<CompanyAddress>> {
    return this.request(`/admin/companies/${companyId}/addresses`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCompanyAddress(
    companyId: string,
    addressId: string,
    data: {
      type?: 'BILLING' | 'SHIPPING';
      label?: string;
      line1?: string;
      line2?: string;
      suburb?: string;
      city?: string;
      province?: string;
      postalCode?: string;
      country?: string;
      isDefault?: boolean;
      deliveryInstructions?: string;
      contactName?: string;
      contactPhone?: string;
    }
  ): Promise<ApiResponse<CompanyAddress>> {
    return this.request(`/admin/companies/${companyId}/addresses/${addressId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCompanyAddress(companyId: string, addressId: string): Promise<ApiResponse<void>> {
    return this.request(`/admin/companies/${companyId}/addresses/${addressId}`, {
      method: 'DELETE',
    });
  }

  // --- Company Contacts ---

  async createCompanyContact(
    companyId: string,
    data: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      mobile?: string;
      jobTitle?: string;
      contactRole?: ContactRoleType;
      isPrimary?: boolean;
      isActive?: boolean;
    }
  ): Promise<ApiResponse<CompanyContact>> {
    return this.request(`/admin/companies/${companyId}/contacts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCompanyContact(
    companyId: string,
    contactId: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      mobile?: string;
      jobTitle?: string;
      contactRole?: ContactRoleType;
      isPrimary?: boolean;
      isActive?: boolean;
    }
  ): Promise<ApiResponse<CompanyContact>> {
    return this.request(`/admin/companies/${companyId}/contacts/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCompanyContact(companyId: string, contactId: string): Promise<ApiResponse<void>> {
    return this.request(`/admin/companies/${companyId}/contacts/${contactId}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // STAFF USERS (Admin)
  // ============================================

  async getStaffUsers(params?: {
    search?: string;
    role?: StaffRole;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<{
    users: StaffUserListItem[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
  }>> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.role) searchParams.set('role', params.role);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    const query = searchParams.toString();
    return this.request(`/admin/users${query ? '?' + query : ''}`);
  }

  async createStaffUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: StaffRole;
    employeeCode?: string;
    primaryWarehouse?: 'JHB' | 'CT';
    companyId?: string;
  }): Promise<ApiResponse<StaffUserListItem>> {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateStaffUser(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      role?: StaffRole;
      employeeCode?: string | null;
      primaryWarehouse?: 'JHB' | 'CT' | null;
      isActive?: boolean;
      password?: string;
    }
  ): Promise<ApiResponse<StaffUserListItem>> {
    return this.request(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = new ApiClient();
