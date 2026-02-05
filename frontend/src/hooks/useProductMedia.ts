import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ============================================
// PRODUCT IMAGES HOOKS
// ============================================

/**
 * Hook for fetching product images
 */
export function useProductImages(productId: string | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['productImages', productId],
    queryFn: async () => {
      if (!productId) throw new Error('Product ID is required');
      const response = await api.getProductImages(productId);
      return response.data.images;
    },
    enabled: (options?.enabled ?? true) && !!productId,
  });
}

/**
 * Hook for uploading a product image
 * Returns mutation with progress tracking
 */
export function useUploadProductImage(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      altText,
      caption,
      isPrimary,
      sortOrder,
    }: {
      file: File;
      altText?: string;
      caption?: string;
      isPrimary?: boolean;
      sortOrder?: number;
    }) => {
      const response = await api.uploadProductImage(productId, file, {
        altText,
        caption,
        isPrimary,
        sortOrder,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productImages', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['productInventory', productId] });
    },
  });
}

/**
 * Hook for updating product image metadata
 */
export function useUpdateProductImage(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      imageId,
      data,
    }: {
      imageId: string;
      data: {
        altText?: string | null;
        caption?: string | null;
        isPrimary?: boolean;
        sortOrder?: number;
      };
    }) => {
      const response = await api.updateProductImage(productId, imageId, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productImages', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
  });
}

/**
 * Hook for deleting a product image
 */
export function useDeleteProductImage(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imageId: string) => {
      await api.deleteProductImage(productId, imageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productImages', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
  });
}

/**
 * Hook for setting an image as primary
 */
export function useSetPrimaryImage(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imageId: string) => {
      const response = await api.updateProductImage(productId, imageId, { isPrimary: true });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productImages', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
  });
}

/**
 * Hook for reordering images (updates sortOrder for multiple images)
 */
export function useReorderImages(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imageIds: string[]) => {
      // Update each image with its new sort order
      const updates = imageIds.map((imageId, index) =>
        api.updateProductImage(productId, imageId, { sortOrder: index })
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productImages', productId] });
    },
  });
}

// ============================================
// PRODUCT DOCUMENTS HOOKS
// ============================================

/**
 * Hook for fetching product documents
 */
export function useProductDocuments(productId: string | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['productDocuments', productId],
    queryFn: async () => {
      if (!productId) throw new Error('Product ID is required');
      const response = await api.getProductDocuments(productId);
      return response.data.documents;
    },
    enabled: (options?.enabled ?? true) && !!productId,
  });
}

/**
 * Hook for uploading a product document
 */
export function useUploadProductDocument(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      type,
      name,
      sortOrder,
    }: {
      file: File;
      type: string;
      name: string;
      sortOrder?: number;
    }) => {
      const response = await api.uploadProductDocument(productId, file, {
        type,
        name,
        sortOrder,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productDocuments', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
  });
}

/**
 * Hook for deleting a product document
 */
export function useDeleteProductDocument(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      await api.deleteProductDocument(productId, documentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productDocuments', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
  });
}
