'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthenticatedUser, LoginRequest } from '@nusaf/shared';
import { api, ApiError } from '@/lib/api';

interface AuthState {
  user: AuthenticatedUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.login(credentials);

          if (response.success && response.data) {
            const { accessToken, refreshToken, user } = response.data;

            // Set token in API client
            api.setAccessToken(accessToken);

            set({
              user,
              accessToken,
              refreshToken,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          const message =
            error instanceof ApiError
              ? error.message
              : 'An unexpected error occurred';
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.logout();
        } catch {
          // Ignore logout errors
        } finally {
          api.setAccessToken(null);
          set(initialState);
        }
      },

      refreshTokens: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await api.refresh(refreshToken);

          if (response.success && response.data) {
            const { accessToken, refreshToken: newRefreshToken } = response.data;

            api.setAccessToken(accessToken);

            set({
              accessToken,
              refreshToken: newRefreshToken,
            });
          }
        } catch (error) {
          // Refresh failed, log out
          api.setAccessToken(null);
          set(initialState);
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'nusaf-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        // Restore access token to API client on hydration
        if (state?.accessToken) {
          api.setAccessToken(state.accessToken);
        }
      },
    }
  )
);
