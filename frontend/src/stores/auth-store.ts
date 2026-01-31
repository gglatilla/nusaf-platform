'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('Auth store hydration error:', error);
          }
        };
      },
    }
  )
);

// Set up token restoration after store is created (safe: no circular reference)
if (typeof window !== 'undefined') {
  // Restore token when hydration finishes
  useAuthStore.persist.onFinishHydration((state) => {
    if (state?.accessToken) {
      api.setAccessToken(state.accessToken);
    }
  });

  // Also restore token immediately if already hydrated (hot reload case)
  const state = useAuthStore.getState();
  if (useAuthStore.persist.hasHydrated() && state.accessToken) {
    api.setAccessToken(state.accessToken);
  }
}

// Helper hook to check hydration status using Zustand's built-in API
export const useAuthHydrated = () => useAuthStore.persist.hasHydrated();
