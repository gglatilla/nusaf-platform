'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/layout/PageHeader';
import { Pagination } from '@/components/products/Pagination';
import { useStockAdjustments } from '@/hooks/useInventory';
import { ClipboardList, Plus, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StockAdjustmentsQueryParams } from '@/lib/api';
import { formatDate } from '@/lib/formatting';

const REASON_LABELS: Record<string, string> = {
  INITIAL_COUNT: 'Initial Count',
  CYCLE_COUNT: 'Cycle Count',
  DAMAGED: 'Damaged',
  EXPIRED: 'Expired',
  FOUND: 'Found',
  LOST: 'Lost',
  DATA_CORRECTION: 'Data Correction',
  OTHER: 'Other',
};

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
] as const;

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'Approved', className: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
};

const PAGE_SIZE = 20;

export default function StockAdjustmentsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!authLoading && user && user.role === 'CUSTOMER') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const params: StockAdjustmentsQueryParams = {
    page,
    pageSize: PAGE_SIZE,
  };
  if (statusFilter) params.status = statusFilter as 'PENDING' | 'APPROVED' | 'REJECTED';
  if (locationFilter) params.location = locationFilter;

  const { data, isLoading, error } = useStockAdjustments(params);
  const allAdjustments = data?.adjustments ?? [];
  const adjustments = search
    ? allAdjustments.filter((adj) =>
        adj.adjustmentNumber.toLowerCase().includes(search.toLowerCase())
      )
    : allAdjustments;
  const pagination = data?.pagination;

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, locationFilter, search]);

  if (authLoading || !user) {
    return (
      <div className="p-4 sm:p-6 xl:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="h-64 bg-slate-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (user?.role === 'CUSTOMER') return null;

  const canCreate = user.role === 'ADMIN' || user.role === 'MANAGER';

  return (
    <>
      <PageHeader
        title="Stock Adjustments"
        description="Create, review, and approve stock quantity adjustments"
      />
      <div className="p-4 sm:p-6 xl:p-8 space-y-4">
        {/* Search */}
        <div className="max-w-sm">
          <input
            type="text"
            placeholder="Search by adjustment number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Status tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  statusFilter === tab.value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Location filter */}
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Warehouses</option>
              <option value="JHB">Johannesburg</option>
              <option value="CT">Cape Town</option>
            </select>

            {/* Create button */}
            {canCreate && (
              <Link
                href="/inventory/adjustments/new"
                className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
              >
                <Plus className="h-4 w-4" />
                New Adjustment
              </Link>
            )}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            Failed to load adjustments: {error.message}
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Adjustment #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={8} className="px-4 py-3">
                        <div className="flex gap-4">
                          <div className="h-5 bg-slate-200 rounded w-28 animate-pulse" />
                          <div className="h-5 bg-slate-200 rounded w-32 animate-pulse" />
                          <div className="h-5 bg-slate-200 rounded w-16 animate-pulse" />
                          <div className="h-5 bg-slate-200 rounded w-16 animate-pulse" />
                          <div className="h-5 bg-slate-200 rounded w-12 animate-pulse" />
                          <div className="h-5 bg-slate-200 rounded w-24 animate-pulse" />
                          <div className="h-5 bg-slate-200 rounded w-24 animate-pulse" />
                          <div className="h-5 bg-slate-200 rounded w-16 animate-pulse" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : adjustments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <ClipboardList className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-lg font-medium text-slate-900 mb-1">No adjustments found</p>
                      <p className="text-sm text-slate-500">
                        {statusFilter
                          ? `No ${statusFilter.toLowerCase()} adjustments`
                          : 'Create a new adjustment to get started'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  adjustments.map((adj) => {
                    const badge = STATUS_BADGE[adj.status];
                    return (
                      <tr key={adj.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <Link
                            href={`/inventory/adjustments/${adj.id}`}
                            className="text-sm font-mono text-primary-600 hover:text-primary-700"
                          >
                            {adj.adjustmentNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {formatDate(adj.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                              badge?.className
                            )}
                          >
                            {badge?.label || adj.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                              adj.location === 'JHB'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            )}
                          >
                            {adj.location}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {adj.lines.length} {adj.lines.length === 1 ? 'item' : 'items'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {REASON_LABELS[adj.reason] || adj.reason}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {adj.createdBy}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/inventory/adjustments/${adj.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageChange={setPage}
          />
        )}
      </div>
    </>
  );
}
