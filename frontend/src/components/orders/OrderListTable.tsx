'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { SalesOrderListItem } from '@/lib/api';
import { OrderStatusBadge } from './OrderStatusBadge';

interface OrderListTableProps {
  orders: SalesOrderListItem[];
  isLoading?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-28" />
      </td>
      <td className="px-6 py-4">
        <div className="h-5 bg-slate-200 rounded w-20" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-28" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-24" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-8" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-24" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-20" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-4" />
      </td>
    </tr>
  );
}

export function OrderListTable({ orders, isLoading }: OrderListTableProps) {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Order #
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Quote #
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                PO #
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Lines
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[...Array(5)].map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
        <div className="text-slate-400 text-5xl mb-4">📦</div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No orders yet</h3>
        <p className="text-sm text-slate-600 mb-4">
          When you create orders from quotes, they will appear here.
        </p>
        <Link
          href="/quotes"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
        >
          View Quotes
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Order #
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Quote #
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              PO #
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Lines
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Total
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/orders/${order.id}`}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  {order.orderNumber}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <OrderStatusBadge status={order.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                {order.quoteNumber || '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                {order.customerPoNumber || '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                {order.lineCount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                {formatCurrency(order.total)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                {formatDate(order.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <Link
                  href={`/orders/${order.id}`}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
