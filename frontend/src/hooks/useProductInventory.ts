import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type ProductWithInventory,
  type CreateStockAdjustmentData,
} from '@/lib/api';

/**
 * Hook for fetching a product with inventory data
 * Only fetches when productId is provided and enabled
 */
export function useProductWithInventory(
  productId: string | null,
  options: { enabled?: boolean; movementLimit?: number } = {}
) {
  const { enabled = true, movementLimit = 20 } = options;

  return useQuery({
    queryKey: ['product', productId, 'inventory', { movementLimit }],
    queryFn: async () => {
      if (!productId) throw new Error('Product ID is required');
      const response = await api.getProductWithInventory(
        productId,
        'inventory,movements',
        movementLimit
      );
      return response.data;
    },
    enabled: !!productId && enabled,
    staleTime: 30 * 1000, // 30 seconds - stock can change but not instantly
  });
}

/**
 * Hook for creating stock adjustments
 */
export function useCreateStockAdjustment(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStockAdjustmentData) => {
      const response = await api.createStockAdjustment(productId, data);
      if (!response.data) {
        throw new Error('Failed to create stock adjustment');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate product inventory queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['product', productId, 'inventory'] });
    },
  });
}
