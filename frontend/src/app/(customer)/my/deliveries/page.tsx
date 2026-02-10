'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Truck } from 'lucide-react';
import { useDeliveryNotes } from '@/hooks/useDeliveryNotes';
import { DeliveryNoteStatusBadge } from '@/components/delivery-notes/DeliveryNoteStatusBadge';
import { Pagination } from '@/components/products/Pagination';
import type { DeliveryNoteStatus } from '@/lib/api';
import { formatDate } from '@/lib/formatting';

type StatusFilter = DeliveryNoteStatus | 'ALL';

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'DISPATCHED', label: 'In Transit' },
  { value: 'DELIVERED', label: 'Delivered' },
];

export default function CustomerDeliveriesPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useDeliveryNotes({
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    page,
    pageSize: 20,
  });

  const deliveryNotes = data?.deliveryNotes ?? [];
  const pagination = data?.pagination;

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Deliveries</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track your deliveries and confirm receipt
        </p>
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
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Delivery #
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="hidden sm:table-cell px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Order
                </th>
                <th className="hidden md:table-cell px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Items
                </th>
                <th className="hidden md:table-cell px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Dispatched
                </th>
                <th className="hidden lg:table-cell px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Delivered
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 lg:px-6 py-4"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                    <td className="px-4 lg:px-6 py-4"><div className="h-5 bg-slate-200 rounded w-20" /></td>
                    <td className="hidden sm:table-cell px-4 lg:px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                    <td className="hidden md:table-cell px-4 lg:px-6 py-4"><div className="h-4 bg-slate-200 rounded w-8" /></td>
                    <td className="hidden md:table-cell px-4 lg:px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                    <td className="hidden lg:table-cell px-4 lg:px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                  </tr>
                ))
              ) : deliveryNotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Truck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-lg font-medium text-slate-900 mb-1">No deliveries yet</p>
                    <p className="text-sm text-slate-500">
                      Delivery notes will appear here once your orders are dispatched.
                    </p>
                  </td>
                </tr>
              ) : (
                deliveryNotes.map((dn) => (
                  <tr key={dn.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/my/delivery-notes/${dn.id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        {dn.deliveryNoteNumber}
                      </Link>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <DeliveryNoteStatusBadge status={dn.status} />
                    </td>
                    <td className="hidden sm:table-cell px-4 lg:px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/my/orders/${dn.orderId}`}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        {dn.orderNumber}
                      </Link>
                    </td>
                    <td className="hidden md:table-cell px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {dn.lineCount}
                    </td>
                    <td className="hidden md:table-cell px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {formatDate(dn.dispatchedAt)}
                    </td>
                    <td className="hidden lg:table-cell px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {formatDate(dn.deliveredAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && pagination && pagination.totalPages > 1 && (
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
