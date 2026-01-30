import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type QuotesQueryParams,
  type AddQuoteItemData,
  type ActiveDraftQuote,
  type CatalogProduct,
} from '@/lib/api';

/**
 * Hook for fetching paginated quotes list
 */
export function useQuotes(params: QuotesQueryParams = {}) {
  return useQuery({
    queryKey: ['quotes', params],
    queryFn: async () => {
      const response = await api.getQuotes(params);
      return response.data;
    },
  });
}

/**
 * Hook for fetching a single quote by ID
 */
export function useQuote(id: string | null) {
  return useQuery({
    queryKey: ['quote', id],
    queryFn: async () => {
      if (!id) throw new Error('Quote ID is required');
      const response = await api.getQuoteById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook for fetching the active draft quote (for cart display)
 */
export function useActiveQuote() {
  return useQuery({
    queryKey: ['activeQuote'],
    queryFn: async () => {
      const response = await api.getActiveQuote();
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook for creating a new quote or getting existing draft
 */
export function useCreateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.createQuote();
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['activeQuote'] });
    },
  });
}

/**
 * Hook for adding an item to a quote
 * Optimized: Uses optimistic updates for instant UI feedback
 */
export function useAddQuoteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quoteId, data, product }: {
      quoteId: string;
      data: AddQuoteItemData;
      product?: CatalogProduct; // Optional: for optimistic update
    }) => {
      const response = await api.addQuoteItem(quoteId, data);
      return response.data;
    },
    onMutate: async ({ quoteId, data, product }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['activeQuote'] });
      await queryClient.cancelQueries({ queryKey: ['quote', quoteId] });

      // Snapshot current value for rollback
      const previousActiveQuote = queryClient.getQueryData<ActiveDraftQuote | null>(['activeQuote']);

      // Optimistic update (only if we have product info)
      if (previousActiveQuote && product && product.price) {
        const existingItem = previousActiveQuote.items.find(
          (item) => item.productId === data.productId
        );

        const lineTotal = product.price * data.quantity;

        let updatedItems;
        if (existingItem) {
          // Update existing item quantity
          updatedItems = previousActiveQuote.items.map((item) =>
            item.productId === data.productId
              ? {
                  ...item,
                  quantity: item.quantity + data.quantity,
                  lineTotal: item.lineTotal + lineTotal,
                }
              : item
          );
        } else {
          // Add new item
          const newItem = {
            id: `optimistic-${Date.now()}`,
            lineNumber: previousActiveQuote.items.length + 1,
            productId: data.productId,
            productSku: product.nusafSku,
            productDescription: product.description,
            quantity: data.quantity,
            unitPrice: product.price,
            lineTotal,
          };
          updatedItems = [...previousActiveQuote.items, newItem];
        }

        const newSubtotal = updatedItems.reduce((sum, item) => sum + item.lineTotal, 0);
        const newVatAmount = Math.round(newSubtotal * 0.15 * 100) / 100;
        const newTotal = Math.round((newSubtotal + newVatAmount) * 100) / 100;

        queryClient.setQueryData<ActiveDraftQuote>(['activeQuote'], {
          ...previousActiveQuote,
          items: updatedItems,
          itemCount: updatedItems.length,
          subtotal: newSubtotal,
          vatAmount: newVatAmount,
          total: newTotal,
        });
      }

      return { previousActiveQuote };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousActiveQuote !== undefined) {
        queryClient.setQueryData(['activeQuote'], context.previousActiveQuote);
      }
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch to ensure consistency with server
      queryClient.invalidateQueries({ queryKey: ['quote', variables.quoteId] });
      queryClient.invalidateQueries({ queryKey: ['activeQuote'] });
    },
  });
}

/**
 * Hook for updating quote item quantity
 */
export function useUpdateQuoteItemQuantity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quoteId, itemId, quantity }: { quoteId: string; itemId: string; quantity: number }) => {
      const response = await api.updateQuoteItemQuantity(quoteId, itemId, quantity);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quote', variables.quoteId] });
      queryClient.invalidateQueries({ queryKey: ['activeQuote'] });
    },
  });
}

/**
 * Hook for removing an item from a quote
 */
export function useRemoveQuoteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quoteId, itemId }: { quoteId: string; itemId: string }) => {
      const response = await api.removeQuoteItem(quoteId, itemId);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quote', variables.quoteId] });
      queryClient.invalidateQueries({ queryKey: ['activeQuote'] });
    },
  });
}

/**
 * Hook for updating quote notes
 */
export function useUpdateQuoteNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quoteId, notes }: { quoteId: string; notes: string }) => {
      const response = await api.updateQuoteNotes(quoteId, notes);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quote', variables.quoteId] });
    },
  });
}

/**
 * Hook for finalizing a quote (DRAFT -> CREATED)
 */
export function useFinalizeQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quoteId: string) => {
      const response = await api.finalizeQuote(quoteId);
      return response.data;
    },
    onSuccess: (_data, quoteId) => {
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['activeQuote'] });
    },
  });
}

/**
 * Hook for accepting a quote (CREATED -> ACCEPTED)
 */
export function useAcceptQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quoteId: string) => {
      const response = await api.acceptQuote(quoteId);
      return response.data;
    },
    onSuccess: (_data, quoteId) => {
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

/**
 * Hook for rejecting a quote (CREATED -> REJECTED)
 */
export function useRejectQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quoteId: string) => {
      const response = await api.rejectQuote(quoteId);
      return response.data;
    },
    onSuccess: (_data, quoteId) => {
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

/**
 * Hook for deleting a draft quote
 */
export function useDeleteQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quoteId: string) => {
      const response = await api.deleteQuote(quoteId);
      return response.data;
    },
    onSuccess: (_data, quoteId) => {
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['activeQuote'] });
    },
  });
}
