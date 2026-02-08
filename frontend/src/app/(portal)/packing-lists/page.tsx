'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Boxes, MapPin } from 'lucide-react';
import { usePackingLists } from '@/hooks/usePackingLists';
import { PackingListStatusBadge } from '@/components/packing-lists/PackingListStatusBadge';
import { Pagination } from '@/components/products/Pagination';
import type { PackingListStatus, Warehouse } from '@/lib/api';

const STATUS_OPTIONS: Array<{ value: PackingListStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'FINALIZED', label: 'Finalized' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const LOCATION_OPTIONS: Array<{ value: Warehouse | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All Locations' },
  { value: 'JHB', label: 'Johannesburg' },
  { value: 'CT', label: 'Cape Town' },
];

export default function PackingListsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusParam = searchParams.get('status') as PackingListStatus | null;
  const locationParam = searchParams.get('location') as Warehouse | null;
  const pageParam = searchParams.get('page');

  const [status, setStatus] = useState<PackingListStatus | undefined>(statusParam || undefined);
  const [location, setLocation] = useState<Warehouse | undefined>(locationParam || undefined);
  const [page, setPage] = useState(pageParam ? parseInt(pageParam) : 1);

  const { data, isLoading } = usePackingLists({ status, location, page, pageSize: 20 });

  const updateUrl = (newStatus?: PackingListStatus, newLocation?: Warehouse, newPage?: number) => {
    const params = new URLSearchParams();
    if (newStatus) params.set('status', newStatus);
    if (newLocation) params.set('location', newLocation);
    if (newPage && newPage > 1) params.set('page', newPage.toString());
    const queryString = params.toString();
    router.push(queryString ? `/packing-lists?${queryString}` : '/packing-lists');
  };

  const handleStatusChange = (newStatus: PackingListStatus | 'ALL') => {
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
          <Boxes className="h-8 w-8 text-slate-400" />
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Packing Lists</h1>
            <p className="text-sm text-slate-600">Manage shipment packing lists and package details</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
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
          <div className="p-8 text-center text-slate-500 animate-pulse">Loading packing lists...</div>
        ) : !data?.packingLists.length ? (
          <div className="p-8 text-center text-slate-500">No packing lists found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">PL#</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Order#</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Location</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase">Packages</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase">Items</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.packingLists.map((pl) => (
                  <tr key={pl.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/packing-lists/${pl.id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        {pl.packingListNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/orders/${pl.orderId}`}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        {pl.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{pl.customerName}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {pl.location === 'JHB' ? 'Johannesburg' : 'Cape Town'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 text-center">{pl.packageCount}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 text-center">{pl.lineCount}</td>
                    <td className="px-4 py-3">
                      <PackingListStatusBadge status={pl.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {new Date(pl.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
