import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type PurchaseOrdersQueryParams,
  type CreatePurchaseOrderData,
  type UpdatePurchaseOrderData,
  type AddPurchaseOrderLineData,
  type UpdatePurchaseOrderLineData,
  type RejectPurchaseOrderData,
  type SendPurchaseOrderData,
} from '@/lib/api';

/**
 * Hook for fetching paginated purchase orders list
 */
export function usePurchaseOrders(params: PurchaseOrdersQueryParams = {}) {
  return useQuery({
    queryKey: ['purchase-orders', params],
    queryFn: async () => {
      const response = await api.getPurchaseOrders(params);
      return response.data;
    },
  });
}

/**
 * Hook for fetching a single purchase order by ID
 */
export function usePurchaseOrder(id: string | null) {
  return useQuery({
    queryKey: ['purchase-order', id],
    queryFn: async () => {
      if (!id) throw new Error('Purchase Order ID is required');
      const response = await api.getPurchaseOrderById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook for fetching receiving summary for a PO
 */
export function usePurchaseOrderReceivingSummary(poId: string | null) {
  return useQuery({
    queryKey: ['purchase-order-receiving-summary', poId],
    queryFn: async () => {
      if (!poId) throw new Error('Purchase Order ID is required');
      const response = await api.getPurchaseOrderReceivingSummary(poId);
      return response.data;
    },
    enabled: !!poId,
  });
}

/**
 * Hook for fetching GRVs for a PO
 */
export function usePurchaseOrderGrvs(poId: string | null) {
  return useQuery({
    queryKey: ['purchase-order-grvs', poId],
    queryFn: async () => {
      if (!poId) throw new Error('Purchase Order ID is required');
      const response = await api.getPurchaseOrderGrvs(poId);
      return response.data;
    },
    enabled: !!poId,
  });
}

/**
 * Hook for creating a new purchase order
 */
export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePurchaseOrderData) => {
      const response = await api.createPurchaseOrder(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}

/**
 * Hook for updating a purchase order
 */
export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePurchaseOrderData }) => {
      const response = await api.updatePurchaseOrder(id, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}

/**
 * Hook for cancelling a purchase order
 */
export function useCancelPurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.cancelPurchaseOrder(id);
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}

// ============================================
// LINE MANAGEMENT HOOKS
// ============================================

/**
 * Hook for adding a line to a purchase order
 */
export function useAddPurchaseOrderLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ poId, data }: { poId: string; data: AddPurchaseOrderLineData }) => {
      const response = await api.addPurchaseOrderLine(poId, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', variables.poId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}

/**
 * Hook for updating a purchase order line
 */
export function useUpdatePurchaseOrderLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ poId, lineId, data }: { poId: string; lineId: string; data: UpdatePurchaseOrderLineData }) => {
      const response = await api.updatePurchaseOrderLine(poId, lineId, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', variables.poId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}

/**
 * Hook for removing a purchase order line
 */
export function useRemovePurchaseOrderLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ poId, lineId }: { poId: string; lineId: string }) => {
      await api.removePurchaseOrderLine(poId, lineId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', variables.poId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}

// ============================================
// WORKFLOW ACTION HOOKS
// ============================================

/**
 * Hook for submitting a PO for approval (DRAFT -> PENDING_APPROVAL)
 */
export function useSubmitPurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.submitPurchaseOrder(id);
      return response.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}

/**
 * Hook for approving a purchase order
 */
export function useApprovePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.approvePurchaseOrder(id);
      return response.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}

/**
 * Hook for rejecting a purchase order
 */
export function useRejectPurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RejectPurchaseOrderData }) => {
      const response = await api.rejectPurchaseOrder(id, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}

/**
 * Hook for sending a PO to supplier
 */
export function useSendPurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data?: SendPurchaseOrderData }) => {
      const response = await api.sendPurchaseOrder(id, data || {});
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}

/**
 * Hook for acknowledging a purchase order
 */
export function useAcknowledgePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.acknowledgePurchaseOrder(id);
      return response.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}

/**
 * Hook for downloading PO PDF
 */
export function useDownloadPurchaseOrderPdf() {
  return useMutation({
    mutationFn: async ({ id, poNumber }: { id: string; poNumber: string }) => {
      const blob = await api.downloadPurchaseOrderPdf(id);
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${poNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
}
