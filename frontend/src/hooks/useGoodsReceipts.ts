import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type GrvsQueryParams,
  type CreateGrvData,
} from '@/lib/api';

/**
 * Hook for fetching paginated goods receipts list
 */
export function useGoodsReceipts(params: GrvsQueryParams = {}) {
  return useQuery({
    queryKey: ['goods-receipts', params],
    queryFn: async () => {
      const response = await api.getGoodsReceipts(params);
      return response.data;
    },
  });
}

/**
 * Hook for fetching a single goods receipt by ID
 */
export function useGoodsReceipt(id: string | null) {
  return useQuery({
    queryKey: ['goods-receipt', id],
    queryFn: async () => {
      if (!id) throw new Error('GRV ID is required');
      const response = await api.getGoodsReceiptById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook for fetching goods receipts for a specific PO
 */
export function useGoodsReceiptsForPO(poId: string | null) {
  return useQuery({
    queryKey: ['goods-receipts-for-po', poId],
    queryFn: async () => {
      if (!poId) throw new Error('Purchase Order ID is required');
      const response = await api.getGoodsReceiptsForPO(poId);
      return response.data;
    },
    enabled: !!poId,
  });
}

/**
 * Hook for fetching receiving summary for a PO
 * Includes staleTime to prevent rapid modal open/close issues
 */
export function useReceivingSummary(poId: string | null) {
  return useQuery({
    queryKey: ['receiving-summary', poId],
    queryFn: async () => {
      if (!poId) throw new Error('Purchase Order ID is required');
      const response = await api.getReceivingSummary(poId);
      return response.data;
    },
    enabled: !!poId,
    staleTime: 30000, // 30 second cache to prevent rapid open/close issues
  });
}

/**
 * Hook for creating a goods receipt (receiving goods)
 */
export function useCreateGoodsReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateGrvData) => {
      const response = await api.createGoodsReceipt(data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate GRV lists
      queryClient.invalidateQueries({ queryKey: ['goods-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['goods-receipts-for-po', variables.purchaseOrderId] });
      // Invalidate receiving summary
      queryClient.invalidateQueries({ queryKey: ['receiving-summary', variables.purchaseOrderId] });
      // Invalidate the PO (status may have changed)
      queryClient.invalidateQueries({ queryKey: ['purchase-order', variables.purchaseOrderId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      // Invalidate inventory data (stock levels changed)
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] });
    },
  });
}
