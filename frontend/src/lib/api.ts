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

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/products?${queryString}` : '/products';
    return this.request<ApiResponse<ProductsResponse>>(endpoint);
  }

  async getProductById(id: string): Promise<ApiResponse<CatalogProduct>> {
    return this.request<ApiResponse<CatalogProduct>>(`/products/${id}`);
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
