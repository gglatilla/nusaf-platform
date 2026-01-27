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

  async getImportCategories(): Promise<ApiResponse<ImportCategory[]>> {
    return this.request<ApiResponse<ImportCategory[]>>('/admin/imports/categories');
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
