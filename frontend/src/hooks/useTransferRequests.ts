import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type TransferRequestsQueryParams,
  type CreateTransferRequestFromOrderData,
  type CreateStandaloneTransferRequestData,
} from '@/lib/api';

/**
 * Hook for fetching paginated transfer requests list
 */
export function useTransferRequests(params: TransferRequestsQueryParams = {}) {
  return useQuery({
    queryKey: ['transferRequests', params],
    queryFn: async () => {
      const response = await api.getTransferRequests(params);
      return response.data;
    },
  });
}

/**
 * Hook for fetching a single transfer request by ID
 */
export function useTransferRequest(id: string | null) {
  return useQuery({
    queryKey: ['transferRequest', id],
    queryFn: async () => {
      if (!id) throw new Error('Transfer request ID is required');
      const response = await api.getTransferRequestById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook for fetching transfer requests for a specific order
 */
export function useTransferRequestsForOrder(orderId: string | null) {
  return useQuery({
    queryKey: ['transferRequestsForOrder', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID is required');
      const response = await api.getTransferRequestsForOrder(orderId);
      return response.data;
    },
    enabled: !!orderId,
  });
}

/**
 * Hook for generating a transfer request from an order
 */
export function useGenerateTransferRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: CreateTransferRequestFromOrderData }) => {
      const response = await api.generateTransferRequest(orderId, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate transfer requests list and order-specific transfer requests
      queryClient.invalidateQueries({ queryKey: ['transferRequests'] });
      queryClient.invalidateQueries({ queryKey: ['transferRequestsForOrder', variables.orderId] });
      // Also invalidate the order in case we want to show transfer request status on order detail
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
    },
  });
}

/**
 * Hook for creating a standalone transfer request
 */
export function useCreateStandaloneTransferRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStandaloneTransferRequestData) => {
      const response = await api.createStandaloneTransferRequest(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferRequests'] });
    },
  });
}

/**
 * Hook for shipping a transfer request
 */
export function useShipTransferRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transferRequestId, shippedByName }: { transferRequestId: string; shippedByName: string }) => {
      const response = await api.shipTransferRequest(transferRequestId, shippedByName);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transferRequest', variables.transferRequestId] });
      queryClient.invalidateQueries({ queryKey: ['transferRequests'] });
      queryClient.invalidateQueries({ queryKey: ['transferRequestsForOrder'] });
    },
  });
}

/**
 * Hook for updating a transfer request line's received quantity
 */
export function useUpdateTransferRequestLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transferRequestId,
      lineId,
      receivedQuantity,
    }: {
      transferRequestId: string;
      lineId: string;
      receivedQuantity: number;
    }) => {
      const response = await api.updateTransferRequestLine(transferRequestId, lineId, receivedQuantity);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transferRequest', variables.transferRequestId] });
    },
  });
}

/**
 * Hook for receiving a transfer request
 */
export function useReceiveTransferRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transferRequestId, receivedByName }: { transferRequestId: string; receivedByName: string }) => {
      const response = await api.receiveTransferRequest(transferRequestId, receivedByName);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transferRequest', variables.transferRequestId] });
      queryClient.invalidateQueries({ queryKey: ['transferRequests'] });
      queryClient.invalidateQueries({ queryKey: ['transferRequestsForOrder'] });
    },
  });
}

/**
 * Hook for updating transfer request notes
 */
export function useUpdateTransferRequestNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transferRequestId, notes }: { transferRequestId: string; notes: string }) => {
      const response = await api.updateTransferRequestNotes(transferRequestId, notes);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transferRequest', variables.transferRequestId] });
    },
  });
}
