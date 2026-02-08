import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type ReturnAuthorizationsQueryParams,
  type CreateReturnAuthorizationData,
  type ReceiveReturnItemsData,
  type CompleteReturnAuthorizationData,
} from '@/lib/api';

/**
 * Hook for fetching paginated return authorizations list
 */
export function useReturnAuthorizations(params: ReturnAuthorizationsQueryParams = {}) {
  return useQuery({
    queryKey: ['returnAuthorizations', params],
    queryFn: async () => {
      const response = await api.getReturnAuthorizations(params);
      return response.data;
    },
  });
}

/**
 * Hook for fetching a single return authorization by ID
 */
export function useReturnAuthorization(id: string | null) {
  return useQuery({
    queryKey: ['returnAuthorization', id],
    queryFn: async () => {
      if (!id) throw new Error('Return authorization ID is required');
      const response = await api.getReturnAuthorizationById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook for fetching return authorizations for a specific order
 */
export function useReturnAuthorizationsForOrder(orderId: string | null) {
  return useQuery({
    queryKey: ['returnAuthorizationsForOrder', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID is required');
      const response = await api.getReturnAuthorizationsForOrder(orderId);
      return response.data;
    },
    enabled: !!orderId,
  });
}

/**
 * Hook for creating a return authorization
 */
export function useCreateReturnAuthorization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateReturnAuthorizationData) => {
      const response = await api.createReturnAuthorization(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returnAuthorizations'] });
      queryClient.invalidateQueries({ queryKey: ['returnAuthorizationsForOrder'] });
    },
  });
}

/**
 * Hook for approving a return authorization (REQUESTED -> APPROVED)
 */
export function useApproveReturnAuthorization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.approveReturnAuthorization(id);
      return response.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['returnAuthorization', id] });
      queryClient.invalidateQueries({ queryKey: ['returnAuthorizations'] });
      queryClient.invalidateQueries({ queryKey: ['returnAuthorizationsForOrder'] });
    },
  });
}

/**
 * Hook for rejecting a return authorization (REQUESTED -> REJECTED)
 */
export function useRejectReturnAuthorization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await api.rejectReturnAuthorization(id, reason);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['returnAuthorization', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['returnAuthorizations'] });
      queryClient.invalidateQueries({ queryKey: ['returnAuthorizationsForOrder'] });
    },
  });
}

/**
 * Hook for recording received return items (APPROVED -> ITEMS_RECEIVED)
 */
export function useReceiveReturnItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ReceiveReturnItemsData }) => {
      const response = await api.receiveReturnItems(id, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['returnAuthorization', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['returnAuthorizations'] });
    },
  });
}

/**
 * Hook for completing a return authorization (ITEMS_RECEIVED -> COMPLETED)
 */
export function useCompleteReturnAuthorization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CompleteReturnAuthorizationData }) => {
      const response = await api.completeReturnAuthorization(id, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['returnAuthorization', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['returnAuthorizations'] });
      queryClient.invalidateQueries({ queryKey: ['returnAuthorizationsForOrder'] });
      // Invalidate inventory queries since stock may have changed
      queryClient.invalidateQueries({ queryKey: ['stockLevels'] });
      queryClient.invalidateQueries({ queryKey: ['stockMovements'] });
    },
  });
}

/**
 * Hook for cancelling a return authorization
 */
export function useCancelReturnAuthorization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.cancelReturnAuthorization(id);
      return response.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['returnAuthorization', id] });
      queryClient.invalidateQueries({ queryKey: ['returnAuthorizations'] });
      queryClient.invalidateQueries({ queryKey: ['returnAuthorizationsForOrder'] });
    },
  });
}
