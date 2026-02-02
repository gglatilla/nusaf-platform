'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PackageCheck } from 'lucide-react';
import { useGoodsReceipts } from '@/hooks/useGoodsReceipts';
import { GRVListTable } from '@/components/goods-receipts/GRVListTable';
import { Pagination } from '@/components/products/Pagination';
import type { Warehouse } from '@/lib/api';

const LOCATION_OPTIONS: Array<{ value: Warehouse | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All Locations' },
  { value: 'JHB', label: 'Johannesburg' },
  { value: 'CT', label: 'Cape Town' },
];

export default function GoodsReceiptsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const locationParam = searchParams.get('location') as Warehouse | null;
  const pageParam = searchParams.get('page');
  const searchParam = searchParams.get('search');

  const [location, setLocation] = useState<Warehouse | undefined>(locationParam || undefined);
  const [search, setSearch] = useState(searchParam || '');
  const [page, setPage] = useState(pageParam ? parseInt(pageParam) : 1);

  const { data, isLoading } = useGoodsReceipts({ location, search: search || undefined, page, pageSize: 20 });

  const updateUrl = (newLocation?: Warehouse, newSearch?: string, newPage?: number) => {
    const params = new URLSearchParams();
    if (newLocation) params.set('location', newLocation);
    if (newSearch) params.set('search', newSearch);
    if (newPage && newPage > 1) params.set('page', newPage.toString());

    const queryString = params.toString();
    router.push(queryString ? `/goods-receipts?${queryString}` : '/goods-receipts');
  };

  const handleLocationChange = (newLocation: Warehouse | 'ALL') => {
    const locationValue = newLocation === 'ALL' ? undefined : newLocation;
    setLocation(locationValue);
    setPage(1);
    updateUrl(locationValue, search, 1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    updateUrl(location, search, 1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrl(location, search, newPage);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PackageCheck className="h-8 w-8 text-slate-400" />
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Goods Receipts</h1>
            <p className="text-sm text-slate-600">Track received stock against purchase orders</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Location Filter */}
        <div className="flex items-center gap-2">
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

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search GRV or PO number..."
            className="px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
          >
            Search
          </button>
        </form>

        {data && (
          <span className="text-sm text-slate-600 ml-auto">
            {data.pagination.totalItems} goods receipt{data.pagination.totalItems !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Goods Receipts List */}
      <GRVListTable goodsReceipts={data?.goodsReceipts || []} isLoading={isLoading} />

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
