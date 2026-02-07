import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type OrdersQueryParams,
  type CreateOrderFromQuoteData,
} from '@/lib/api';

/**
 * Hook for fetching paginated orders list
 */
export function useOrders(params: OrdersQueryParams = {}) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: async () => {
      const response = await api.getOrders(params);
      return response.data;
    },
  });
}

/**
 * Hook for fetching a single order by ID
 */
export function useOrder(id: string | null) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      if (!id) throw new Error('Order ID is required');
      const response = await api.getOrderById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook for creating an order from an accepted quote
 */
export function useCreateOrderFromQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrderFromQuoteData) => {
      const response = await api.createOrderFromQuote(data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      // Invalidate the quote that was converted
      queryClient.invalidateQueries({ queryKey: ['quote', variables.quoteId] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

/**
 * Hook for confirming an order (DRAFT -> CONFIRMED)
 */
export function useConfirmOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await api.confirmOrder(orderId);
      return response.data;
    },
    onSuccess: (_data, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

/**
 * Hook for putting an order on hold
 */
export function useHoldOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const response = await api.holdOrder(orderId, reason);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

/**
 * Hook for releasing an order from hold
 */
export function useReleaseOrderHold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await api.releaseOrderHold(orderId);
      return response.data;
    },
    onSuccess: (_data, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

/**
 * Hook for cancelling an order
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const response = await api.cancelOrder(orderId, reason);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

/**
 * Hook for fetching the activity timeline of an order
 */
export function useOrderTimeline(orderId: string | null) {
  return useQuery({
    queryKey: ['order-timeline', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID is required');
      const response = await api.getOrderTimeline(orderId);
      return response.data;
    },
    enabled: !!orderId,
  });
}

/**
 * Hook for updating order notes
 */
export function useUpdateOrderNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, notes }: { orderId: string; notes: { internalNotes?: string; customerNotes?: string } }) => {
      const response = await api.updateOrderNotes(orderId, notes);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
    },
  });
}
