'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FileOutput, MapPin } from 'lucide-react';
import { useDeliveryNotes } from '@/hooks/useDeliveryNotes';
import { DeliveryNoteListTable } from '@/components/delivery-notes/DeliveryNoteListTable';
import { Pagination } from '@/components/products/Pagination';
import type { DeliveryNoteStatus, Warehouse } from '@/lib/api';

const STATUS_OPTIONS: Array<{ value: DeliveryNoteStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'DISPATCHED', label: 'Dispatched' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const LOCATION_OPTIONS: Array<{ value: Warehouse | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All Locations' },
  { value: 'JHB', label: 'Johannesburg' },
  { value: 'CT', label: 'Cape Town' },
];

export default function DeliveryNotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusParam = searchParams.get('status') as DeliveryNoteStatus | null;
  const locationParam = searchParams.get('location') as Warehouse | null;
  const pageParam = searchParams.get('page');

  const [status, setStatus] = useState<DeliveryNoteStatus | undefined>(statusParam || undefined);
  const [location, setLocation] = useState<Warehouse | undefined>(locationParam || undefined);
  const [page, setPage] = useState(pageParam ? parseInt(pageParam) : 1);

  const { data, isLoading } = useDeliveryNotes({ status, location, page, pageSize: 20 });

  const updateUrl = (newStatus?: DeliveryNoteStatus, newLocation?: Warehouse, newPage?: number) => {
    const params = new URLSearchParams();
    if (newStatus) params.set('status', newStatus);
    if (newLocation) params.set('location', newLocation);
    if (newPage && newPage > 1) params.set('page', newPage.toString());

    const queryString = params.toString();
    router.push(queryString ? `/delivery-notes?${queryString}` : '/delivery-notes');
  };

  const handleStatusChange = (newStatus: DeliveryNoteStatus | 'ALL') => {
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
          <FileOutput className="h-8 w-8 text-slate-400" />
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Delivery Notes</h1>
            <p className="text-sm text-slate-600">Track goods dispatched and delivered to customers</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                (status === option.value) || (option.value === 'ALL' && !status)
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Location Filter */}
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-400" />
          <select
            value={location || 'ALL'}
            onChange={(e) => handleLocationChange(e.target.value as Warehouse | 'ALL')}
            className="text-sm border border-slate-200 rounded-md px-3 py-1.5"
          >
            {LOCATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 animate-pulse">Loading delivery notes...</div>
        ) : (
          <DeliveryNoteListTable deliveryNotes={data?.deliveryNotes ?? []} />
        )}
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <Pagination
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          totalItems={data.pagination.totalItems}
          pageSize={data.pagination.pageSize}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
