// Authentication types shared between backend and frontend

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string; // UserRole from Prisma (uppercase) vs shared types (lowercase)
  company: {
    id: string;
    name: string;
    tier: string; // CustomerTier from Prisma (uppercase) vs shared types (lowercase)
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LogoutResponse {
  message: string;
}

export interface AuthState {
  user: AuthenticatedUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthError {
  code: string;
  message: string;
  details?: { field: string; message: string }[];
}
