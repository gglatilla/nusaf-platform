import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type PickingSlipsQueryParams,
  type GeneratePickingSlipsData,
} from '@/lib/api';

/**
 * Hook for fetching paginated picking slips list
 */
export function usePickingSlips(params: PickingSlipsQueryParams = {}) {
  return useQuery({
    queryKey: ['pickingSlips', params],
    queryFn: async () => {
      const response = await api.getPickingSlips(params);
      return response.data;
    },
  });
}

/**
 * Hook for fetching a single picking slip by ID
 */
export function usePickingSlip(id: string | null) {
  return useQuery({
    queryKey: ['pickingSlip', id],
    queryFn: async () => {
      if (!id) throw new Error('Picking slip ID is required');
      const response = await api.getPickingSlipById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook for fetching picking slips for a specific order
 */
export function usePickingSlipsForOrder(orderId: string | null) {
  return useQuery({
    queryKey: ['pickingSlipsForOrder', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID is required');
      const response = await api.getPickingSlipsForOrder(orderId);
      return response.data;
    },
    enabled: !!orderId,
  });
}

/**
 * Hook for generating picking slips from an order
 */
export function useGeneratePickingSlips() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: GeneratePickingSlipsData }) => {
      const response = await api.generatePickingSlips(orderId, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate picking slips list and order-specific picking slips
      queryClient.invalidateQueries({ queryKey: ['pickingSlips'] });
      queryClient.invalidateQueries({ queryKey: ['pickingSlipsForOrder', variables.orderId] });
      // Also invalidate the order in case we want to show picking slip status on order detail
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
    },
  });
}

/**
 * Hook for assigning a picking slip to a user
 */
export function useAssignPickingSlip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pickingSlipId,
      assignedTo,
      assignedToName,
    }: {
      pickingSlipId: string;
      assignedTo: string;
      assignedToName: string;
    }) => {
      const response = await api.assignPickingSlip(pickingSlipId, assignedTo, assignedToName);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pickingSlip', variables.pickingSlipId] });
      queryClient.invalidateQueries({ queryKey: ['pickingSlips'] });
    },
  });
}

/**
 * Hook for starting picking on a slip
 */
export function useStartPicking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pickingSlipId: string) => {
      const response = await api.startPicking(pickingSlipId);
      return response.data;
    },
    onSuccess: (_data, pickingSlipId) => {
      queryClient.invalidateQueries({ queryKey: ['pickingSlip', pickingSlipId] });
      queryClient.invalidateQueries({ queryKey: ['pickingSlips'] });
    },
  });
}

/**
 * Hook for updating a picking slip line's picked quantity
 */
export function useUpdatePickingSlipLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pickingSlipId,
      lineId,
      quantityPicked,
    }: {
      pickingSlipId: string;
      lineId: string;
      quantityPicked: number;
    }) => {
      const response = await api.updatePickingSlipLine(pickingSlipId, lineId, quantityPicked);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pickingSlip', variables.pickingSlipId] });
    },
  });
}

/**
 * Hook for completing picking on a slip
 */
export function useCompletePicking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pickingSlipId: string) => {
      const response = await api.completePicking(pickingSlipId);
      return response.data;
    },
    onSuccess: (_data, pickingSlipId) => {
      queryClient.invalidateQueries({ queryKey: ['pickingSlip', pickingSlipId] });
      queryClient.invalidateQueries({ queryKey: ['pickingSlips'] });
      queryClient.invalidateQueries({ queryKey: ['pickingSlipsForOrder'] });
    },
  });
}
