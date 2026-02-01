import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type AddBomComponentInput,
  type UpdateBomComponentInput,
} from '@/lib/api';

/**
 * Hook for fetching BOM components for a product
 */
export function useGetBom(productId: string | null) {
  return useQuery({
    queryKey: ['bom', productId],
    queryFn: async () => {
      if (!productId) throw new Error('Product ID is required');
      const response = await api.getProductBom(productId);
      return response.data;
    },
    enabled: !!productId,
  });
}

/**
 * Hook for adding a component to a product's BOM
 */
export function useAddBomComponent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      data,
    }: {
      productId: string;
      data: AddBomComponentInput;
    }) => {
      const response = await api.addBomComponent(productId, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bom', variables.productId] });
    },
  });
}

/**
 * Hook for updating a BOM component
 */
export function useUpdateBomComponent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      componentId,
      data,
    }: {
      productId: string;
      componentId: string;
      data: UpdateBomComponentInput;
    }) => {
      const response = await api.updateBomComponent(productId, componentId, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bom', variables.productId] });
    },
  });
}

/**
 * Hook for removing a component from BOM
 */
export function useRemoveBomComponent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      componentId,
    }: {
      productId: string;
      componentId: string;
    }) => {
      await api.removeBomComponent(productId, componentId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bom', variables.productId] });
    },
  });
}

/**
 * Hook for checking BOM stock availability
 */
export function useCheckBomStock(
  productId: string | null,
  quantity: number = 1,
  warehouse: 'JHB' | 'CT' = 'JHB'
) {
  return useQuery({
    queryKey: ['bomStock', productId, quantity, warehouse],
    queryFn: async () => {
      if (!productId) throw new Error('Product ID is required');
      const response = await api.checkBomStock(productId, quantity, warehouse);
      return response.data;
    },
    enabled: !!productId,
  });
}

/**
 * Hook for fetching "where used" - products that use this as a component
 */
export function useGetWhereUsed(productId: string | null) {
  return useQuery({
    queryKey: ['whereUsed', productId],
    queryFn: async () => {
      if (!productId) throw new Error('Product ID is required');
      const response = await api.getWhereUsed(productId);
      return response.data;
    },
    enabled: !!productId,
  });
}

/**
 * Hook for copying BOM from one product to another
 */
export function useCopyBom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      targetProductId,
      sourceProductId,
    }: {
      targetProductId: string;
      sourceProductId: string;
    }) => {
      const response = await api.copyBom(targetProductId, sourceProductId);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bom', variables.targetProductId] });
    },
  });
}
