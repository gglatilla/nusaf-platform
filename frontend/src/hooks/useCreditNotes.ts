import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type CreditNotesQueryParams } from '@/lib/api';

/**
 * Hook for listing all credit notes with filters (staff)
 */
export function useCreditNotes(params: CreditNotesQueryParams = {}) {
  return useQuery({
    queryKey: ['creditNotes', params],
    queryFn: async () => {
      const response = await api.getCreditNotes(params);
      return response.data;
    },
  });
}

/**
 * Hook for fetching credit notes for a specific return authorization
 */
export function useCreditNotesForRA(raId: string | null) {
  return useQuery({
    queryKey: ['creditNotesForRA', raId],
    queryFn: async () => {
      if (!raId) throw new Error('RA ID is required');
      const response = await api.getCreditNotesForRA(raId);
      return response.data;
    },
    enabled: !!raId,
  });
}

/**
 * Hook for fetching credit notes for a specific order
 */
export function useCreditNotesForOrder(orderId: string | null) {
  return useQuery({
    queryKey: ['creditNotesForOrder', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID is required');
      const response = await api.getCreditNotesForOrder(orderId);
      return response.data;
    },
    enabled: !!orderId,
  });
}

/**
 * Hook for fetching a single credit note by ID
 */
export function useCreditNote(id: string | null) {
  return useQuery({
    queryKey: ['creditNote', id],
    queryFn: async () => {
      if (!id) throw new Error('Credit note ID is required');
      const response = await api.getCreditNoteById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook for voiding a credit note
 */
export function useVoidCreditNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await api.voidCreditNote(id, reason);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditNotesForRA'] });
      queryClient.invalidateQueries({ queryKey: ['creditNotes'] });
      queryClient.invalidateQueries({ queryKey: ['creditNote'] });
    },
  });
}

/**
 * Hook for downloading a credit note PDF
 */
export function useDownloadCreditNotePDF() {
  return useMutation({
    mutationFn: async ({ id, creditNoteNumber }: { id: string; creditNoteNumber: string }) => {
      const blob = await api.downloadCreditNotePDF(id);

      // Trigger browser download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${creditNoteNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
}
