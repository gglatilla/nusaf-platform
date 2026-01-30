import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type JobCardsQueryParams,
  type CreateJobCardData,
} from '@/lib/api';

/**
 * Hook for fetching paginated job cards list
 */
export function useJobCards(params: JobCardsQueryParams = {}) {
  return useQuery({
    queryKey: ['jobCards', params],
    queryFn: async () => {
      const response = await api.getJobCards(params);
      return response.data;
    },
  });
}

/**
 * Hook for fetching a single job card by ID
 */
export function useJobCard(id: string | null) {
  return useQuery({
    queryKey: ['jobCard', id],
    queryFn: async () => {
      if (!id) throw new Error('Job card ID is required');
      const response = await api.getJobCardById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook for fetching job cards for a specific order
 */
export function useJobCardsForOrder(orderId: string | null) {
  return useQuery({
    queryKey: ['jobCardsForOrder', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID is required');
      const response = await api.getJobCardsForOrder(orderId);
      return response.data;
    },
    enabled: !!orderId,
  });
}

/**
 * Hook for creating a job card
 */
export function useCreateJobCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateJobCardData) => {
      const response = await api.createJobCard(data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate job cards list and order-specific job cards
      queryClient.invalidateQueries({ queryKey: ['jobCards'] });
      queryClient.invalidateQueries({ queryKey: ['jobCardsForOrder', variables.orderId] });
      // Also invalidate the order in case we want to show job card status on order detail
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
    },
  });
}

/**
 * Hook for assigning a job card to a user
 */
export function useAssignJobCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobCardId,
      assignedTo,
      assignedToName,
    }: {
      jobCardId: string;
      assignedTo: string;
      assignedToName: string;
    }) => {
      const response = await api.assignJobCard(jobCardId, assignedTo, assignedToName);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobCard', variables.jobCardId] });
      queryClient.invalidateQueries({ queryKey: ['jobCards'] });
    },
  });
}

/**
 * Hook for starting a job card
 */
export function useStartJobCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobCardId: string) => {
      const response = await api.startJobCard(jobCardId);
      return response.data;
    },
    onSuccess: (_data, jobCardId) => {
      queryClient.invalidateQueries({ queryKey: ['jobCard', jobCardId] });
      queryClient.invalidateQueries({ queryKey: ['jobCards'] });
    },
  });
}

/**
 * Hook for putting a job card on hold
 */
export function usePutJobCardOnHold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobCardId,
      holdReason,
    }: {
      jobCardId: string;
      holdReason: string;
    }) => {
      const response = await api.putJobCardOnHold(jobCardId, holdReason);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobCard', variables.jobCardId] });
      queryClient.invalidateQueries({ queryKey: ['jobCards'] });
    },
  });
}

/**
 * Hook for resuming a job card from hold
 */
export function useResumeJobCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobCardId: string) => {
      const response = await api.resumeJobCard(jobCardId);
      return response.data;
    },
    onSuccess: (_data, jobCardId) => {
      queryClient.invalidateQueries({ queryKey: ['jobCard', jobCardId] });
      queryClient.invalidateQueries({ queryKey: ['jobCards'] });
    },
  });
}

/**
 * Hook for completing a job card
 */
export function useCompleteJobCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobCardId: string) => {
      const response = await api.completeJobCard(jobCardId);
      return response.data;
    },
    onSuccess: (_data, jobCardId) => {
      queryClient.invalidateQueries({ queryKey: ['jobCard', jobCardId] });
      queryClient.invalidateQueries({ queryKey: ['jobCards'] });
      queryClient.invalidateQueries({ queryKey: ['jobCardsForOrder'] });
    },
  });
}

/**
 * Hook for updating job card notes
 */
export function useUpdateJobCardNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobCardId,
      notes,
    }: {
      jobCardId: string;
      notes: string;
    }) => {
      const response = await api.updateJobCardNotes(jobCardId, notes);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobCard', variables.jobCardId] });
    },
  });
}
