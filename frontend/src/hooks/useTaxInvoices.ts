import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type TaxInvoicesQueryParams } from '@/lib/api';

/**
 * Hook for listing all tax invoices with filters (staff)
 */
export function useTaxInvoices(params: TaxInvoicesQueryParams = {}) {
  return useQuery({
    queryKey: ['taxInvoices', params],
    queryFn: async () => {
      const response = await api.getTaxInvoices(params);
      return response.data;
    },
  });
}

/**
 * Hook for fetching tax invoices for a specific order
 */
export function useTaxInvoicesForOrder(orderId: string | null) {
  return useQuery({
    queryKey: ['taxInvoicesForOrder', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID is required');
      const response = await api.getTaxInvoicesForOrder(orderId);
      return response.data;
    },
    enabled: !!orderId,
  });
}

/**
 * Hook for fetching a single tax invoice by ID
 */
export function useTaxInvoice(id: string | null) {
  return useQuery({
    queryKey: ['taxInvoice', id],
    queryFn: async () => {
      if (!id) throw new Error('Tax invoice ID is required');
      const response = await api.getTaxInvoiceById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook for creating a tax invoice from an order
 */
export function useCreateTaxInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data?: { notes?: string } }) => {
      const response = await api.createTaxInvoice(orderId, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['taxInvoicesForOrder', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['taxInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['order-timeline', variables.orderId] });
    },
  });
}

/**
 * Hook for voiding a tax invoice
 */
export function useVoidTaxInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await api.voidTaxInvoice(id, reason);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxInvoicesForOrder'] });
      queryClient.invalidateQueries({ queryKey: ['taxInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['taxInvoice'] });
    },
  });
}

/**
 * Hook for downloading a tax invoice PDF
 */
export function useDownloadTaxInvoicePDF() {
  return useMutation({
    mutationFn: async ({ id, invoiceNumber }: { id: string; invoiceNumber: string }) => {
      const blob = await api.downloadTaxInvoicePDF(id);

      // Trigger browser download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
}
