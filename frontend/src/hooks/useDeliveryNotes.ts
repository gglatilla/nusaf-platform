import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type DeliveryNotesQueryParams,
  type CreateDeliveryNoteData,
  type ConfirmDeliveryData,
} from '@/lib/api';

/**
 * Hook for fetching paginated delivery notes list
 */
export function useDeliveryNotes(params: DeliveryNotesQueryParams = {}) {
  return useQuery({
    queryKey: ['deliveryNotes', params],
    queryFn: async () => {
      const response = await api.getDeliveryNotes(params);
      return response.data;
    },
  });
}

/**
 * Hook for fetching a single delivery note by ID
 */
export function useDeliveryNote(id: string | null) {
  return useQuery({
    queryKey: ['deliveryNote', id],
    queryFn: async () => {
      if (!id) throw new Error('Delivery note ID is required');
      const response = await api.getDeliveryNoteById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook for fetching delivery notes for a specific order
 */
export function useDeliveryNotesForOrder(orderId: string | null) {
  return useQuery({
    queryKey: ['deliveryNotesForOrder', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID is required');
      const response = await api.getDeliveryNotesForOrder(orderId);
      return response.data;
    },
    enabled: !!orderId,
  });
}

/**
 * Hook for creating a delivery note from an order
 */
export function useCreateDeliveryNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: CreateDeliveryNoteData }) => {
      const response = await api.createDeliveryNoteFromOrder(orderId, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deliveryNotes'] });
      queryClient.invalidateQueries({ queryKey: ['deliveryNotesForOrder', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['order-timeline', variables.orderId] });
    },
  });
}

/**
 * Hook for dispatching a delivery note (DRAFT -> DISPATCHED)
 */
export function useDispatchDeliveryNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.dispatchDeliveryNote(id);
      return response.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['deliveryNote', id] });
      queryClient.invalidateQueries({ queryKey: ['deliveryNotes'] });
      queryClient.invalidateQueries({ queryKey: ['deliveryNotesForOrder'] });
    },
  });
}

/**
 * Hook for confirming delivery (DISPATCHED -> DELIVERED)
 */
export function useConfirmDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ConfirmDeliveryData }) => {
      const response = await api.confirmDelivery(id, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deliveryNote', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['deliveryNotes'] });
      queryClient.invalidateQueries({ queryKey: ['deliveryNotesForOrder'] });
    },
  });
}

/**
 * Hook for cancelling a delivery note
 */
export function useCancelDeliveryNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.cancelDeliveryNote(id);
      return response.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['deliveryNote', id] });
      queryClient.invalidateQueries({ queryKey: ['deliveryNotes'] });
      queryClient.invalidateQueries({ queryKey: ['deliveryNotesForOrder'] });
    },
  });
}
