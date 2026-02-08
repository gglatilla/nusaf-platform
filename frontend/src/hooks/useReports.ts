import { useQuery } from '@tanstack/react-query';
import { api, type SalesReportData } from '@/lib/api';

export function useSalesReport(startDate?: string, endDate?: string) {
  return useQuery<SalesReportData>({
    queryKey: ['reports', 'sales', startDate, endDate],
    queryFn: async () => {
      const response = await api.getSalesReport({ startDate, endDate });
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch sales report');
      }
      return response.data!;
    },
  });
}
