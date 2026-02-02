import type {
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  AuthenticatedUser,
  ApiResponse,
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
}

// Inventory types
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'ON_ORDER' | 'OVERSTOCK';
export type StockMovementType =
  | 'RECEIPT'
  | 'ISSUE'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'MANUFACTURE_IN'
  | 'MANUFACTURE_OUT'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'
  | 'SCRAP';

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
  costPrice: number | null;
  listPrice: number | null;
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

  // Inventory data (when ?include=inventory)
  inventory?: ProductInventory;
  // Movements (when ?include=movements)
  movements?: StockMovement[];
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
  warehouseId: string;
  warehouseName: string;
  type: string;
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
  createdBy: string;
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
}

// Recalculate prices response
export interface RecalculatePricesResult {
  updated: number;
  total: number;
}

// Quote types
export type QuoteStatus = 'DRAFT' | 'CREATED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED' | 'CONVERTED';

export interface QuoteItem {
  id: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  status: QuoteStatus;
  customerTier: string;
  company: {
    id: string;
    name: string;
  };
  items: QuoteItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  customerNotes: string | null;
  validUntil: string | null;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteListItem {
  id: string;
  quoteNumber: string;
  status: QuoteStatus;
  itemCount: number;
  total: number;
  validUntil: string | null;
  createdAt: string;
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

// Sales Order types
export type SalesOrderStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'READY_TO_SHIP'
  | 'PARTIALLY_SHIPPED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'INVOICED'
  | 'CLOSED'
  | 'ON_HOLD'
  | 'CANCELLED';

export type FulfillmentType = 'STOCK_ONLY' | 'ASSEMBLY_REQUIRED' | 'MIXED';
export type Warehouse = 'JHB' | 'CT';
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

export interface SalesOrder {
  id: string;
  orderNumber: string;
  status: SalesOrderStatus;
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
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SalesOrderListItem {
  id: string;
  orderNumber: string;
  status: SalesOrderStatus;
  quoteNumber: string | null;
  customerPoNumber: string | null;
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

export interface CreateOrderResponse {
  id: string;
  orderNumber: string;
}

export interface OrdersQueryParams {
  status?: SalesOrderStatus;
  page?: number;
  pageSize?: number;
}

// Picking Slip types
export type PickingSlipStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETE';

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
}

// Job Card types
export type JobCardStatus = 'PENDING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETE';
export type JobType = 'MACHINING' | 'ASSEMBLY';

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
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
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
}

// Transfer Request types
export type TransferRequestStatus = 'PENDING' | 'IN_TRANSIT' | 'RECEIVED';

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

export type FulfillmentPolicy = 'SHIP_PARTIAL' | 'SHIP_COMPLETE' | 'SALES_DECISION';

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

class ApiClient {
  private accessToken: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

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
  async createQuote(): Promise<ApiResponse<CreateQuoteResponse>> {
    return this.request<ApiResponse<CreateQuoteResponse>>('/quotes', {
      method: 'POST',
      body: JSON.stringify({}),
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

  async getActiveQuote(): Promise<ApiResponse<ActiveDraftQuote | null>> {
    return this.request<ApiResponse<ActiveDraftQuote | null>>('/quotes/active');
  }

  async updateQuoteNotes(id: string, customerNotes: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/quotes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ customerNotes }),
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

  async acceptQuote(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/quotes/${id}/accept`, {
      method: 'POST',
      body: JSON.stringify({}),
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

  async startJobCard(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/job-cards/${id}/start`, {
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
