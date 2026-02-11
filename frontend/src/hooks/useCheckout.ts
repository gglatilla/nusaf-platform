import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type CheckoutQuoteData, type CheckoutQuoteResponse, type CompanyAddress, type Quote } from '@/lib/api';

/**
 * Hook for the checkout mutation — accepts quote and creates order with checkout data
 */
export function useCheckout(): ReturnType<typeof useMutation<CheckoutQuoteResponse, Error, { quoteId: string; data: CheckoutQuoteData }>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quoteId, data }: { quoteId: string; data: CheckoutQuoteData }) => {
      const response = await api.checkoutQuote(quoteId, data);
      return response.data as CheckoutQuoteResponse;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quote', variables.quoteId] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

/**
 * Hook for fetching the quote data needed for checkout
 */
export function useQuoteForCheckout(quoteId: string | null): ReturnType<typeof useQuery<Quote>> {
  return useQuery({
    queryKey: ['quote', quoteId],
    queryFn: async () => {
      if (!quoteId) throw new Error('Quote ID is required');
      const response = await api.getQuoteById(quoteId);
      return response.data as Quote;
    },
    enabled: !!quoteId,
  });
}

/**
 * Hook for fetching company shipping addresses for checkout address selector
 */
export function useCompanyShippingAddresses(companyId: string | null): ReturnType<typeof useQuery<CompanyAddress[]>> {
  return useQuery({
    queryKey: ['company-addresses', companyId, 'shipping'],
    queryFn: async () => {
      if (!companyId) throw new Error('Company ID is required');
      const response = await api.getCompany(companyId);
      if (!response.data) return [];
      // Filter to shipping addresses only
      return (response.data.addresses ?? []).filter((a: CompanyAddress) => a.type === 'SHIPPING');
    },
    enabled: !!companyId,
  });
}
