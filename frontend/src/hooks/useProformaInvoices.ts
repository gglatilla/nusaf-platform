import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type CreateProformaInvoiceData } from '@/lib/api';

/**
 * Hook for fetching proforma invoices for a specific order
 */
export function useProformaInvoicesForOrder(orderId: string | null) {
  return useQuery({
    queryKey: ['proformaInvoicesForOrder', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID is required');
      const response = await api.getProformaInvoicesForOrder(orderId);
      return response.data;
    },
    enabled: !!orderId,
  });
}

/**
 * Hook for creating a proforma invoice from an order
 */
export function useCreateProformaInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data?: CreateProformaInvoiceData }) => {
      const response = await api.createProformaInvoice(orderId, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proformaInvoicesForOrder', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['order-timeline', variables.orderId] });
    },
  });
}

/**
 * Hook for voiding a proforma invoice
 */
export function useVoidProformaInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await api.voidProformaInvoice(id, reason);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proformaInvoicesForOrder'] });
    },
  });
}

/**
 * Hook for downloading a proforma invoice PDF
 */
export function useDownloadProformaInvoicePDF() {
  return useMutation({
    mutationFn: async ({ id, proformaNumber }: { id: string; proformaNumber: string }) => {
      const blob = await api.downloadProformaInvoicePDF(id);

      // Trigger browser download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${proformaNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
}
