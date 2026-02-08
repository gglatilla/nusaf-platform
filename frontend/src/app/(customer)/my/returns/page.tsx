'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, RotateCcw } from 'lucide-react';
import { useReturnAuthorizations } from '@/hooks/useReturnAuthorizations';
import ReturnAuthorizationStatusBadge from '@/components/return-authorizations/ReturnAuthorizationStatusBadge';
import { Pagination } from '@/components/products/Pagination';
import type { ReturnAuthorizationsQueryParams, ReturnAuthorizationStatus } from '@/lib/api';

const PAGE_SIZE = 20;

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Requested', value: 'REQUESTED' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Rejected', value: 'REJECTED' },
];

export default function CustomerReturnsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const params: ReturnAuthorizationsQueryParams = { page, pageSize: PAGE_SIZE };
  if (statusFilter) params.status = statusFilter as ReturnAuthorizationStatus;

  const { data, isLoading } = useReturnAuthorizations(params);

  const items = data?.returnAuthorizations || [];
  const pagination = data?.pagination;

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Returns</h1>
            <p className="mt-1 text-sm text-slate-500">Track your return requests</p>
          </div>
          <Link
            href="/my/returns/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Request Return
          </Link>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
              statusFilter === tab.value
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">RA #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Order</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Items</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <RotateCcw className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No returns found</p>
                  </td>
                </tr>
              ) : (
                items.map((ra) => (
                  <tr key={ra.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/my/returns/${ra.id}`}
                        className="text-sm font-mono text-primary-600 hover:text-primary-700"
                      >
                        {ra.raNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {ra.orderId ? (
                        <Link href={`/my/orders/${ra.orderId}`} className="text-primary-600 hover:text-primary-700">
                          {ra.orderNumber}
                        </Link>
                      ) : (
                        <span className="text-slate-400">&mdash;</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ReturnAuthorizationStatusBadge status={ra.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {ra.lineCount} line{ra.lineCount !== 1 ? 's' : ''} &middot; {ra.totalQuantityReturned} qty
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(ra.createdAt).toLocaleDateString()}
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
        <div className="mt-6">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageChange={setPage}
          />
        </div>
      )}
    </>
  );
}
