'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Truck } from 'lucide-react';
import { useTransferRequests } from '@/hooks/useTransferRequests';
import { TransferRequestListTable } from '@/components/transfer-requests/TransferRequestListTable';
import { Pagination } from '@/components/products/Pagination';
import type { TransferRequestStatus } from '@/lib/api';

const STATUS_OPTIONS: Array<{ value: TransferRequestStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'RECEIVED', label: 'Received' },
];

export default function TransferRequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusParam = searchParams.get('status') as TransferRequestStatus | null;
  const pageParam = searchParams.get('page');

  const [status, setStatus] = useState<TransferRequestStatus | undefined>(statusParam || undefined);
  const [page, setPage] = useState(pageParam ? parseInt(pageParam) : 1);

  const { data, isLoading } = useTransferRequests({ status, page, pageSize: 20 });

  const updateUrl = (newStatus?: TransferRequestStatus, newPage?: number) => {
    const params = new URLSearchParams();
    if (newStatus) params.set('status', newStatus);
    if (newPage && newPage > 1) params.set('page', newPage.toString());

    const queryString = params.toString();
    router.push(queryString ? `/transfer-requests?${queryString}` : '/transfer-requests');
  };

  const handleStatusChange = (newStatus: TransferRequestStatus | 'ALL') => {
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
          <Truck className="h-8 w-8 text-slate-400" />
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Transfer Requests</h1>
            <p className="text-sm text-slate-600">Inter-branch stock movements (JHB → Cape Town)</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="status" className="text-sm font-medium text-slate-700">
            Status:
          </label>
          <select
            id="status"
            value={status || 'ALL'}
            onChange={(e) => handleStatusChange(e.target.value as TransferRequestStatus | 'ALL')}
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
            {data.pagination.totalItems} transfer{data.pagination.totalItems !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Transfer Request List */}
      <TransferRequestListTable transferRequests={data?.transferRequests || []} isLoading={isLoading} />

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
