'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Eye, AlertCircle, RotateCcw } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useReturnAuthorizations } from '@/hooks/useReturnAuthorizations';
import ReturnAuthorizationStatusBadge from '@/components/return-authorizations/ReturnAuthorizationStatusBadge';
import { Pagination } from '@/components/products/Pagination';
import { WAREHOUSE_NAMES } from '@/lib/constants/reference-routes';
import type { ReturnAuthorizationsQueryParams, ReturnAuthorizationStatus } from '@/lib/api';

const PAGE_SIZE = 20;

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Requested', value: 'REQUESTED' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Items Received', value: 'ITEMS_RECEIVED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function ReturnAuthorizationsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!authLoading && user?.role === 'CUSTOMER') {
      router.push('/my/dashboard');
    }
  }, [user, authLoading, router]);

  const params: ReturnAuthorizationsQueryParams = { page, pageSize: PAGE_SIZE };
  if (statusFilter) params.status = statusFilter as ReturnAuthorizationStatus;
  if (search) params.search = search;

  const { data, isLoading, error } = useReturnAuthorizations(params);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  if (authLoading || !user) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (user?.role === 'CUSTOMER') return null;

  const items = data?.returnAuthorizations || [];
  const pagination = data?.pagination;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Return Authorizations</h1>
          <p className="mt-1 text-sm text-slate-600">Manage customer returns and restocking</p>
        </div>
        <Link
          href="/return-authorizations/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Return
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === tab.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search RA#, order#, customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-md bg-white w-64"
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error instanceof Error ? error.message : 'Failed to load return authorizations'}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">RA #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Order</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Requested By</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Lines</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Warehouse</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <RotateCcw className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No return authorizations found</p>
                  </td>
                </tr>
              ) : (
                items.map((ra) => (
                  <tr key={ra.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/return-authorizations/${ra.id}`}
                        className="text-sm font-mono text-primary-600 hover:text-primary-700"
                      >
                        {ra.raNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {ra.orderId ? (
                        <Link href={`/orders/${ra.orderId}`} className="text-primary-600 hover:text-primary-700">
                          {ra.orderNumber}
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">{ra.customerName}</td>
                    <td className="px-4 py-3">
                      <ReturnAuthorizationStatusBadge status={ra.status} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-900">{ra.requestedByName}</p>
                      <p className="text-xs text-slate-500">{ra.requestedByRole === 'CUSTOMER' ? 'Customer' : 'Staff'}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{ra.lineCount}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{ra.totalQuantityReturned}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{WAREHOUSE_NAMES[ra.warehouse] || ra.warehouse}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(ra.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/return-authorizations/${ra.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))
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
  );
}
