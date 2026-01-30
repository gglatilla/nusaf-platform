import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type DocumentsQueryParams,
  type UploadDocumentData,
} from '@/lib/api';

/**
 * Hook for listing documents with filters
 */
export function useDocuments(params: DocumentsQueryParams = {}) {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: async () => {
      const response = await api.getDocuments(params);
      return response.data;
    },
  });
}

/**
 * Hook for getting documents for an order
 */
export function useDocumentsForOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: ['documentsForOrder', orderId],
    queryFn: async () => {
      if (!orderId) return [];
      const response = await api.getDocumentsForOrder(orderId);
      return response.data;
    },
    enabled: !!orderId,
  });
}

/**
 * Hook for uploading a document
 */
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UploadDocumentData) => {
      const response = await api.uploadDocument(data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['documentsForOrder', variables.orderId] });
    },
  });
}

/**
 * Hook for getting a download URL for a document
 */
export function useDocumentDownload() {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.getDocumentDownloadUrl(id);
      return response.data;
    },
  });
}

/**
 * Hook for deleting a document
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, orderId }: { id: string; orderId: string }) => {
      await api.deleteDocument(id);
      return { id, orderId };
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['documentsForOrder', orderId] });
    },
  });
}
