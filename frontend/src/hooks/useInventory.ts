'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  StockLevelsQueryParams,
  StockAdjustmentsQueryParams,
  StockMovementsQueryParams,
  UpdateReorderSettingsData,
  CreateInventoryAdjustmentData,
} from '@/lib/api';

/**
 * Hook for fetching inventory summary data
 */
export function useInventorySummary() {
  return useQuery({
    queryKey: ['inventory', 'summary'],
    queryFn: async () => {
      const response = await api.getInventorySummary();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch inventory summary');
      }
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds - dashboard data refreshes frequently
  });
}

/**
 * Hook for fetching stock levels with filtering
 */
export function useStockLevels(params: StockLevelsQueryParams = {}) {
  return useQuery({
    queryKey: ['inventory', 'stockLevels', params],
    queryFn: async () => {
      const response = await api.getStockLevels(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch stock levels');
      }
      return response.data;
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Hook for fetching stock adjustments with filtering
 */
export function useStockAdjustments(params: StockAdjustmentsQueryParams = {}) {
  return useQuery({
    queryKey: ['inventory', 'adjustments', params],
    queryFn: async () => {
      const response = await api.getStockAdjustments(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch stock adjustments');
      }
      return response.data;
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Hook for fetching a single stock adjustment by ID
 */
export function useStockAdjustment(id: string | undefined) {
  return useQuery({
    queryKey: ['inventory', 'adjustment', id],
    queryFn: async () => {
      if (!id) throw new Error('No adjustment ID provided');
      const response = await api.getStockAdjustmentById(id);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch stock adjustment');
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook for approving a stock adjustment
 */
export function useApproveStockAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.approveStockAdjustment(id);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to approve adjustment');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['inventory', 'adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'stockLevels'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'movements'] });
    },
  });
}

/**
 * Hook for rejecting a stock adjustment
 */
export function useRejectStockAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await api.rejectStockAdjustment(id, reason);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to reject adjustment');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['inventory', 'adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'summary'] });
    },
  });
}

/**
 * Hook for creating a multi-product inventory adjustment
 */
export function useCreateInventoryAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInventoryAdjustmentData) => {
      const response = await api.createInventoryAdjustment(data);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to create adjustment');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'summary'] });
    },
  });
}

/**
 * Hook for fetching stock movements with filtering
 */
export function useStockMovements(params: StockMovementsQueryParams = {}) {
  return useQuery({
    queryKey: ['inventory', 'movements', params],
    queryFn: async () => {
      const response = await api.getStockMovements(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch stock movements');
      }
      return response.data;
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Hook for updating reorder settings
 */
export function useUpdateReorderSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      location,
      data,
    }: {
      productId: string;
      location: string;
      data: UpdateReorderSettingsData;
    }) => {
      const response = await api.updateReorderSettings(productId, location, data);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to update reorder settings');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['inventory', 'stockLevels'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'summary'] });
    },
  });
}
