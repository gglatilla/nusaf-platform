import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type PurchaseRequisitionsQueryParams,
  type CreatePurchaseRequisitionData,
} from '@/lib/api';

/**
 * Fetch paginated list of purchase requisitions
 */
export function usePurchaseRequisitions(params: PurchaseRequisitionsQueryParams = {}) {
  return useQuery({
    queryKey: ['purchaseRequisitions', params],
    queryFn: async () => {
      const response = await api.getPurchaseRequisitions(params);
      if (!response.success) throw new Error(response.error?.message || 'Failed to fetch purchase requisitions');
      return response.data;
    },
  });
}

/**
 * Fetch a single purchase requisition by ID
 */
export function usePurchaseRequisition(id: string | null) {
  return useQuery({
    queryKey: ['purchaseRequisition', id],
    queryFn: async () => {
      if (!id) throw new Error('Purchase requisition ID is required');
      const response = await api.getPurchaseRequisitionById(id);
      if (!response.success) throw new Error(response.error?.message || 'Failed to fetch purchase requisition');
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Create a new purchase requisition
 */
export function useCreatePurchaseRequisition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePurchaseRequisitionData) => {
      const response = await api.createPurchaseRequisition(data);
      if (!response.success) throw new Error(response.error?.message || 'Failed to create purchase requisition');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseRequisitions'] });
    },
  });
}

/**
 * Approve a purchase requisition (auto-creates draft PO)
 */
export function useApprovePurchaseRequisition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.approvePurchaseRequisition(id);
      if (!response.success) throw new Error(response.error?.message || 'Failed to approve purchase requisition');
      return response.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['purchaseRequisition', id] });
      queryClient.invalidateQueries({ queryKey: ['purchaseRequisitions'] });
      // Invalidate PO queries since approval creates draft POs
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
  });
}

/**
 * Reject a purchase requisition
 */
export function useRejectPurchaseRequisition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await api.rejectPurchaseRequisition(id, reason);
      if (!response.success) throw new Error(response.error?.message || 'Failed to reject purchase requisition');
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchaseRequisition', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['purchaseRequisitions'] });
    },
  });
}

/**
 * Cancel a purchase requisition (creator only)
 */
export function useCancelPurchaseRequisition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.cancelPurchaseRequisition(id);
      if (!response.success) throw new Error(response.error?.message || 'Failed to cancel purchase requisition');
      return response.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['purchaseRequisition', id] });
      queryClient.invalidateQueries({ queryKey: ['purchaseRequisitions'] });
    },
  });
}
