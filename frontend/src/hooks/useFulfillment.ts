import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, FulfillmentPolicy, OrchestrationPlan, ExecutionResult } from '@/lib/api';

/**
 * Hook to generate a fulfillment plan (preview only)
 */
export function useGenerateFulfillmentPlan() {
  return useMutation({
    mutationFn: async ({
      orderId,
      policyOverride,
    }: {
      orderId: string;
      policyOverride?: FulfillmentPolicy;
    }): Promise<OrchestrationPlan> => {
      const response = await api.generateFulfillmentPlan(orderId, { policyOverride });
      if (!response.data) {
        throw new Error('Failed to generate fulfillment plan');
      }
      return response.data;
    },
  });
}

/**
 * Hook to execute a fulfillment plan (creates all documents)
 */
export function useExecuteFulfillmentPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      plan,
    }: {
      orderId: string;
      plan: OrchestrationPlan;
    }): Promise<ExecutionResult> => {
      const response = await api.executeFulfillmentPlan(orderId, { plan });
      if (!response.data) {
        throw new Error('Failed to execute fulfillment plan');
      }
      return response.data;
    },
    onSuccess: (_, { orderId }) => {
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['pickingSlips', orderId] });
      queryClient.invalidateQueries({ queryKey: ['jobCards', orderId] });
      queryClient.invalidateQueries({ queryKey: ['transferRequests', orderId] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
  });
}

/**
 * Hook to update the fulfillment policy override for an order
 */
export function useUpdateFulfillmentPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      policy,
    }: {
      orderId: string;
      policy: FulfillmentPolicy | null;
    }): Promise<{ fulfillmentPolicyOverride: FulfillmentPolicy | null }> => {
      const response = await api.updateOrderFulfillmentPolicy(orderId, policy);
      if (!response.data) {
        throw new Error('Failed to update fulfillment policy');
      }
      return response.data;
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    },
  });
}
