import { useQuery } from '@tanstack/react-query';
import {
  api,
  type ProductsQueryParams,
} from '@/lib/api';

/**
 * Hook for fetching paginated products with filters
 */
export function useProducts(params: ProductsQueryParams = {}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const response = await api.getProducts(params);
      return response.data;
    },
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
