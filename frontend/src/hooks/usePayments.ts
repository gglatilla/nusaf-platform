import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type RecordPaymentData } from '@/lib/api';

/**
 * Hook for fetching payments for a specific order
 */
export function useOrderPayments(orderId: string | null) {
  return useQuery({
    queryKey: ['orderPayments', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID is required');
      const response = await api.getOrderPayments(orderId);
      return response.data;
    },
    enabled: !!orderId,
  });
}

/**
 * Hook for recording a payment against an order
 */
export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: RecordPaymentData }) => {
      const response = await api.recordPayment(orderId, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orderPayments', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-timeline', variables.orderId] });
    },
  });
}

/**
 * Hook for voiding a payment
 */
export function useVoidPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentId, reason }: { paymentId: string; reason: string }) => {
      const response = await api.voidPayment(paymentId, reason);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orderPayments'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
