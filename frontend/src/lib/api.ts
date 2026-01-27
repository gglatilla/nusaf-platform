import type {
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  AuthenticatedUser,
  ApiResponse,
} from '@nusaf/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

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
