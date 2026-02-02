'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, Plus } from 'lucide-react';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { POListTable } from '@/components/purchase-orders/POListTable';
import { Pagination } from '@/components/products/Pagination';
import type { PurchaseOrderStatus } from '@/lib/api';

const STATUS_OPTIONS: Array<{ value: PurchaseOrderStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All Purchase Orders' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { value: 'SENT', label: 'Sent' },
  { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
  { value: 'PARTIALLY_RECEIVED', label: 'Partially Received' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusParam = searchParams.get('status') as PurchaseOrderStatus | null;
  const pageParam = searchParams.get('page');

  const [status, setStatus] = useState<PurchaseOrderStatus | undefined>(statusParam || undefined);
  const [page, setPage] = useState(pageParam ? parseInt(pageParam) : 1);

  const { data, isLoading } = usePurchaseOrders({ status, page, pageSize: 20 });

  const updateUrl = (newStatus?: PurchaseOrderStatus, newPage?: number) => {
    const params = new URLSearchParams();
    if (newStatus) params.set('status', newStatus);
    if (newPage && newPage > 1) params.set('page', newPage.toString());

    const queryString = params.toString();
    router.push(queryString ? `/purchase-orders?${queryString}` : '/purchase-orders');
  };

  const handleStatusChange = (newStatus: PurchaseOrderStatus | 'ALL') => {
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
          <ShoppingCart className="h-8 w-8 text-slate-400" />
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Purchase Orders</h1>
            <p className="text-sm text-slate-600">Manage orders to suppliers</p>
          </div>
        </div>
        <Link
          href="/purchase-orders/new"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Purchase Order
        </Link>
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
            onChange={(e) => handleStatusChange(e.target.value as PurchaseOrderStatus | 'ALL')}
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
            {data.pagination.totalItems} purchase order{data.pagination.totalItems !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Purchase Orders List */}
      <POListTable purchaseOrders={data?.purchaseOrders || []} isLoading={isLoading} />

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
