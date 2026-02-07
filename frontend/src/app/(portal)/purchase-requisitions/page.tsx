'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Eye, AlertCircle, FileInput } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { usePurchaseRequisitions } from '@/hooks/usePurchaseRequisitions';
import PurchaseRequisitionStatusBadge from '@/components/purchase-requisitions/PurchaseRequisitionStatusBadge';
import { Pagination } from '@/components/products/Pagination';
import type { PurchaseRequisitionsQueryParams, PurchaseRequisitionStatus, PurchaseRequisitionUrgency } from '@/lib/api';

const PAGE_SIZE = 20;

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Converted', value: 'CONVERTED_TO_PO' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const URGENCY_BADGE: Record<string, { label: string; className: string }> = {
  LOW: { label: 'Low', className: 'text-slate-500' },
  NORMAL: { label: 'Normal', className: 'text-slate-700' },
  HIGH: { label: 'High', className: 'text-amber-600 font-semibold' },
  CRITICAL: { label: 'Critical', className: 'text-red-600 font-semibold' },
};

export default function PurchaseRequisitionsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [page, setPage] = useState(1);

  // Auth guard
  useEffect(() => {
    if (!authLoading && user?.role === 'CUSTOMER') {
      router.push('/my/dashboard');
    }
  }, [user, authLoading, router]);

  // Build query params
  const params: PurchaseRequisitionsQueryParams = { page, pageSize: PAGE_SIZE };
  if (statusFilter) params.status = statusFilter as PurchaseRequisitionStatus;
  if (urgencyFilter) params.urgency = urgencyFilter as PurchaseRequisitionUrgency;

  const { data, isLoading, error } = usePurchaseRequisitions(params);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, urgencyFilter]);

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

  const items = data?.items || [];
  const pagination = data?.pagination;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchase Requisitions</h1>
          <p className="mt-1 text-sm text-slate-600">Request and track procurement approvals</p>
        </div>
        <Link
          href="/purchase-requisitions/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Requisition
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Status tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                statusFilter === tab.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Urgency filter */}
        <select
          value={urgencyFilter}
          onChange={(e) => setUrgencyFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-md bg-white"
        >
          <option value="">All Urgency</option>
          <option value="LOW">Low</option>
          <option value="NORMAL">Normal</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error instanceof Error ? error.message : 'Failed to load purchase requisitions'}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">PR #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Requester</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Urgency</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Items</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Est. Total</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <FileInput className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No purchase requisitions found</p>
                  </td>
                </tr>
              ) : (
                items.map((pr) => {
                  const urgency = URGENCY_BADGE[pr.urgency] || URGENCY_BADGE.NORMAL;
                  return (
                    <tr key={pr.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/purchase-requisitions/${pr.id}`}
                          className="text-sm font-mono text-primary-600 hover:text-primary-700"
                        >
                          {pr.requisitionNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(pr.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-900">{pr.requestedByName}</p>
                        {pr.department && (
                          <p className="text-xs text-slate-500">{pr.department}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${urgency.className}`}>{urgency.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <PurchaseRequisitionStatusBadge status={pr.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{pr.lineCount}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {pr.estimatedTotal != null
                          ? `R ${pr.estimatedTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/purchase-requisitions/${pr.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md"
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
          totalItems={pagination.total}
          pageSize={pagination.pageSize}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
