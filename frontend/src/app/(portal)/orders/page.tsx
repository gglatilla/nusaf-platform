'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Package } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { OrderListTable } from '@/components/orders/OrderListTable';
import { Pagination } from '@/components/products/Pagination';
import type { SalesOrderStatus } from '@/lib/api';

const STATUS_OPTIONS: Array<{ value: SalesOrderStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All Orders' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'READY_TO_SHIP', label: 'Ready to Ship' },
  { value: 'PARTIALLY_SHIPPED', label: 'Partially Shipped' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'INVOICED', label: 'Invoiced' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusParam = searchParams.get('status') as SalesOrderStatus | null;
  const pageParam = searchParams.get('page');

  const [status, setStatus] = useState<SalesOrderStatus | undefined>(statusParam || undefined);
  const [page, setPage] = useState(pageParam ? parseInt(pageParam) : 1);

  const { data, isLoading } = useOrders({ status, page, pageSize: 20 });

  const updateUrl = (newStatus?: SalesOrderStatus, newPage?: number) => {
    const params = new URLSearchParams();
    if (newStatus) params.set('status', newStatus);
    if (newPage && newPage > 1) params.set('page', newPage.toString());

    const queryString = params.toString();
    router.push(queryString ? `/orders?${queryString}` : '/orders');
  };

  const handleStatusChange = (newStatus: SalesOrderStatus | 'ALL') => {
    const statusValue = newStatus === 'ALL' ? undefined : newStatus;
    setStatus(statusValue);
    setPage(1);
    updateUrl(statusValue, 1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrl(status, newPage);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-slate-400" />
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Orders</h1>
            <p className="text-sm text-slate-600">View and manage your sales orders</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="status" className="text-sm font-medium text-slate-700">
            Status:
          </label>
          <select
            id="status"
            value={status || 'ALL'}
            onChange={(e) => handleStatusChange(e.target.value as SalesOrderStatus | 'ALL')}
            className="px-3 py-2 border border-slate-200 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {data && (
          <span className="text-sm text-slate-600">
            {data.pagination.totalItems} order{data.pagination.totalItems !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Order List */}
      <OrderListTable orders={data?.orders || []} isLoading={isLoading} />

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={data.pagination.totalPages}
          totalItems={data.pagination.totalItems}
          pageSize={data.pagination.pageSize}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
