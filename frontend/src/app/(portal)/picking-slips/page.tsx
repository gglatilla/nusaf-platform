'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ClipboardList, MapPin } from 'lucide-react';
import { usePickingSlips } from '@/hooks/usePickingSlips';
import { PickingSlipListTable } from '@/components/picking-slips/PickingSlipListTable';
import { Pagination } from '@/components/products/Pagination';
import type { PickingSlipStatus, Warehouse } from '@/lib/api';

const STATUS_OPTIONS: Array<{ value: PickingSlipStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETE', label: 'Complete' },
];

const LOCATION_OPTIONS: Array<{ value: Warehouse | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All Locations' },
  { value: 'JHB', label: 'Johannesburg' },
  { value: 'CT', label: 'Cape Town' },
];

export default function PickingSlipsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusParam = searchParams.get('status') as PickingSlipStatus | null;
  const locationParam = searchParams.get('location') as Warehouse | null;
  const pageParam = searchParams.get('page');

  const [status, setStatus] = useState<PickingSlipStatus | undefined>(statusParam || undefined);
  const [location, setLocation] = useState<Warehouse | undefined>(locationParam || undefined);
  const [page, setPage] = useState(pageParam ? parseInt(pageParam) : 1);

  const { data, isLoading } = usePickingSlips({ status, location, page, pageSize: 20 });

  const updateUrl = (newStatus?: PickingSlipStatus, newLocation?: Warehouse, newPage?: number) => {
    const params = new URLSearchParams();
    if (newStatus) params.set('status', newStatus);
    if (newLocation) params.set('location', newLocation);
    if (newPage && newPage > 1) params.set('page', newPage.toString());

    const queryString = params.toString();
    router.push(queryString ? `/picking-slips?${queryString}` : '/picking-slips');
  };

  const handleStatusChange = (newStatus: PickingSlipStatus | 'ALL') => {
    const statusValue = newStatus === 'ALL' ? undefined : newStatus;
    setStatus(statusValue);
    setPage(1);
    updateUrl(statusValue, location, 1);
  };

  const handleLocationChange = (newLocation: Warehouse | 'ALL') => {
    const locationValue = newLocation === 'ALL' ? undefined : newLocation;
    setLocation(locationValue);
    setPage(1);
    updateUrl(status, locationValue, 1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrl(status, location, newPage);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-slate-400" />
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Picking Slips</h1>
            <p className="text-sm text-slate-600">Warehouse picking instructions for orders</p>
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
            onChange={(e) => handleStatusChange(e.target.value as PickingSlipStatus | 'ALL')}
            className="px-3 py-2 border border-slate-200 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-400" />
          <label htmlFor="location" className="text-sm font-medium text-slate-700">
            Location:
          </label>
          <select
            id="location"
            value={location || 'ALL'}
            onChange={(e) => handleLocationChange(e.target.value as Warehouse | 'ALL')}
            className="px-3 py-2 border border-slate-200 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {LOCATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {data && (
          <span className="text-sm text-slate-600">
            {data.pagination.totalItems} picking slip{data.pagination.totalItems !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Picking Slip List */}
      <PickingSlipListTable pickingSlips={data?.pickingSlips || []} isLoading={isLoading} />

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
