'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { OrderListTable } from '@/components/orders/OrderListTable';
import { Pagination } from '@/components/products';
import { useOrders } from '@/hooks/useOrders';
import type { SalesOrderStatus } from '@nusaf/shared';

type StatusFilter = 'ALL' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'INVOICED' | 'CLOSED' | 'CANCELLED';

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'INVOICED', label: 'Invoiced' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function CustomerOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlStatus = (searchParams.get('status') || 'ALL') as StatusFilter;
  const urlPage = parseInt(searchParams.get('page') || '1', 10);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>(urlStatus);
  const [page, setPage] = useState(urlPage);

  const { data: ordersData, isLoading } = useOrders({
    status: statusFilter !== 'ALL' ? statusFilter as SalesOrderStatus : undefined,
    page,
    pageSize: 20,
  });

  const orders = ordersData?.orders ?? [];
  const pagination = ordersData?.pagination ?? {
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
  };

  const updateUrl = (params: { status?: StatusFilter; page?: number }) => {
    const newParams = new URLSearchParams();
    const newStatus = params.status ?? statusFilter;
    const newPage = params.page ?? page;
    if (newStatus !== 'ALL') newParams.set('status', newStatus);
    if (newPage > 1) newParams.set('page', newPage.toString());
    const query = newParams.toString();
    router.push(query ? `/my/orders?${query}` : '/my/orders', { scroll: false });
  };

  const handleStatusChange = (status: StatusFilter) => {
    setStatusFilter(status);
    setPage(1);
    updateUrl({ status, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrl({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
            <p className="mt-1 text-sm text-slate-500">
              Track and manage your orders
            </p>
          </div>
          <Link
            href="/my/quotes"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
          >
            <FileText className="h-4 w-4" />
            View Quotes
          </Link>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleStatusChange(tab.value)}
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

      {/* Order list */}
      <OrderListTable
        orders={orders}
        isLoading={isLoading}
        linkPrefix="/my/orders"
        quotesHref="/my/quotes"
      />

      {/* Pagination */}
      {!isLoading && pagination.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </>
  );
}
