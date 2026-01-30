import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type IssueFlagsQueryParams,
  type CreateIssueFlagData,
  type IssueFlagStatus,
} from '@/lib/api';

/**
 * Hook for listing issue flags with filters
 */
export function useIssueFlags(params: IssueFlagsQueryParams = {}) {
  return useQuery({
    queryKey: ['issueFlags', params],
    queryFn: async () => {
      const response = await api.getIssueFlags(params);
      return response.data;
    },
  });
}

/**
 * Hook for getting issue flag details
 */
export function useIssueFlag(id: string | undefined) {
  return useQuery({
    queryKey: ['issueFlag', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.getIssueFlagById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook for getting issue flag stats (dashboard)
 */
export function useIssueFlagStats() {
  return useQuery({
    queryKey: ['issueFlagStats'],
    queryFn: async () => {
      const response = await api.getIssueFlagStats();
      return response.data;
    },
  });
}

/**
 * Hook for getting issues for a picking slip
 */
export function useIssuesForPickingSlip(pickingSlipId: string | undefined) {
  return useQuery({
    queryKey: ['issuesForPickingSlip', pickingSlipId],
    queryFn: async () => {
      if (!pickingSlipId) return [];
      const response = await api.getIssuesForPickingSlip(pickingSlipId);
      return response.data;
    },
    enabled: !!pickingSlipId,
  });
}

/**
 * Hook for getting issues for a job card
 */
export function useIssuesForJobCard(jobCardId: string | undefined) {
  return useQuery({
    queryKey: ['issuesForJobCard', jobCardId],
    queryFn: async () => {
      if (!jobCardId) return [];
      const response = await api.getIssuesForJobCard(jobCardId);
      return response.data;
    },
    enabled: !!jobCardId,
  });
}

/**
 * Hook for creating an issue flag
 */
export function useCreateIssueFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateIssueFlagData) => {
      const response = await api.createIssueFlag(data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['issueFlags'] });
      queryClient.invalidateQueries({ queryKey: ['issueFlagStats'] });
      if (variables.pickingSlipId) {
        queryClient.invalidateQueries({ queryKey: ['issuesForPickingSlip', variables.pickingSlipId] });
      }
      if (variables.jobCardId) {
        queryClient.invalidateQueries({ queryKey: ['issuesForJobCard', variables.jobCardId] });
      }
    },
  });
}

/**
 * Hook for updating issue flag status
 */
export function useUpdateIssueFlagStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: IssueFlagStatus }) => {
      const response = await api.updateIssueFlagStatus(id, status);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['issueFlags'] });
      queryClient.invalidateQueries({ queryKey: ['issueFlag', id] });
      queryClient.invalidateQueries({ queryKey: ['issueFlagStats'] });
    },
  });
}

/**
 * Hook for adding a comment to an issue
 */
export function useAddIssueComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const response = await api.addIssueComment(id, content);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['issueFlag', id] });
    },
  });
}

/**
 * Hook for resolving an issue
 */
export function useResolveIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, resolution }: { id: string; resolution: string }) => {
      const response = await api.resolveIssue(id, resolution);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['issueFlags'] });
      queryClient.invalidateQueries({ queryKey: ['issueFlag', id] });
      queryClient.invalidateQueries({ queryKey: ['issueFlagStats'] });
    },
  });
}

/**
 * Hook for closing an issue
 */
export function useCloseIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.closeIssue(id);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['issueFlags'] });
      queryClient.invalidateQueries({ queryKey: ['issueFlag', id] });
      queryClient.invalidateQueries({ queryKey: ['issueFlagStats'] });
    },
  });
}
