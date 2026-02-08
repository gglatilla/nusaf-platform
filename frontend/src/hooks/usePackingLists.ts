import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type PackingListsQueryParams,
  type CreatePackingListData,
} from '@/lib/api';

/**
 * Hook for fetching paginated packing lists
 */
export function usePackingLists(params: PackingListsQueryParams = {}) {
  return useQuery({
    queryKey: ['packingLists', params],
    queryFn: async () => {
      const response = await api.getPackingLists(params);
      return response.data;
    },
  });
}

/**
 * Hook for fetching a single packing list by ID
 */
export function usePackingList(id: string | null) {
  return useQuery({
    queryKey: ['packingList', id],
    queryFn: async () => {
      if (!id) throw new Error('Packing list ID is required');
      const response = await api.getPackingListById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook for fetching packing lists for a specific order
 */
export function usePackingListsForOrder(orderId: string | null) {
  return useQuery({
    queryKey: ['packingListsForOrder', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID is required');
      const response = await api.getPackingListsForOrder(orderId);
      return response.data;
    },
    enabled: !!orderId,
  });
}

/**
 * Hook for creating a packing list from an order
 */
export function useCreatePackingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: CreatePackingListData }) => {
      const response = await api.createPackingListFromOrder(orderId, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['packingLists'] });
      queryClient.invalidateQueries({ queryKey: ['packingListsForOrder', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['order-timeline', variables.orderId] });
    },
  });
}

/**
 * Hook for updating a draft packing list
 */
export function useUpdatePackingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreatePackingListData }) => {
      const response = await api.updatePackingList(id, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['packingList', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['packingLists'] });
    },
  });
}

/**
 * Hook for finalizing a packing list (DRAFT -> FINALIZED)
 */
export function useFinalizePackingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.finalizePackingList(id);
      return response.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['packingList', id] });
      queryClient.invalidateQueries({ queryKey: ['packingLists'] });
      queryClient.invalidateQueries({ queryKey: ['packingListsForOrder'] });
    },
  });
}

/**
 * Hook for cancelling a packing list
 */
export function useCancelPackingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.cancelPackingList(id);
      return response.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['packingList', id] });
      queryClient.invalidateQueries({ queryKey: ['packingLists'] });
      queryClient.invalidateQueries({ queryKey: ['packingListsForOrder'] });
    },
  });
}

/**
 * Hook for downloading packing list PDF
 */
export function useDownloadPackingListPDF() {
  return useMutation({
    mutationFn: async (id: string) => {
      const blob = await api.downloadPackingListPDF(id);
      return blob;
    },
  });
}
