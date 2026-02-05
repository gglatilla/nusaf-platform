import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type ProductsQueryParams,
  type CreateProductData,
  type UpdateProductData,
} from '@/lib/api';

/**
 * Hook for fetching paginated products with filters
 * Always includes stockSummary for displaying stock badges
 */
export function useProducts(params: ProductsQueryParams = {}, options?: { enabled?: boolean }) {
  // Always include stockSummary for stock badges on product cards
  const queryParams: ProductsQueryParams = {
    ...params,
    include: 'stockSummary',
  };

  return useQuery({
    queryKey: ['products', queryParams],
    queryFn: async () => {
      const response = await api.getProducts(queryParams);
      return response.data;
    },
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook for fetching a single product by ID
 */
export function useProduct(id: string | null) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) throw new Error('Product ID is required');
      const response = await api.getProductById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook for fetching categories (with long cache time as they rarely change)
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.getCategories();
      return response.data;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - categories rarely change
  });
}

/**
 * Hook for creating a new product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductData) => {
      const response = await api.createProduct(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

/**
 * Hook for updating a product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProductData }) => {
      const response = await api.updateProduct(id, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      // Also invalidate inventory queries if they exist
      queryClient.invalidateQueries({ queryKey: ['productInventory', variables.id] });
    },
  });
}

/**
 * Hook for deleting (soft delete) a product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.deleteProduct(id);
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

/**
 * Hook for publishing a product to the website
 */
export function usePublishProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.publishProduct(id);
      return response.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['productInventory', id] });
    },
  });
}

/**
 * Hook for unpublishing a product from the website
 */
export function useUnpublishProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.unpublishProduct(id);
      return response.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['productInventory', id] });
    },
  });
}

/**
 * Hook for bulk publishing/unpublishing multiple products
 */
export function useBulkPublishProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productIds, action }: { productIds: string[]; action: 'publish' | 'unpublish' }) => {
      const response = await api.bulkPublishProducts(productIds, action);
      return response.data;
    },
    onSuccess: (_data, { productIds }) => {
      // Invalidate individual products
      productIds.forEach(id => {
        queryClient.invalidateQueries({ queryKey: ['product', id] });
      });
      // Invalidate product list
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
