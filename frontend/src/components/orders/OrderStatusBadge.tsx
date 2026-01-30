'use client';

import type { SalesOrderStatus } from '@/lib/api';

interface OrderStatusBadgeProps {
  status: SalesOrderStatus;
}

const statusConfig: Record<SalesOrderStatus, { label: string; className: string }> = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-slate-100 text-slate-700',
  },
  CONFIRMED: {
    label: 'Confirmed',
    className: 'bg-blue-100 text-blue-700',
  },
  PROCESSING: {
    label: 'Processing',
    className: 'bg-cyan-100 text-cyan-700',
  },
  READY_TO_SHIP: {
    label: 'Ready to Ship',
    className: 'bg-indigo-100 text-indigo-700',
  },
  PARTIALLY_SHIPPED: {
    label: 'Partially Shipped',
    className: 'bg-violet-100 text-violet-700',
  },
  SHIPPED: {
    label: 'Shipped',
    className: 'bg-purple-100 text-purple-700',
  },
  DELIVERED: {
    label: 'Delivered',
    className: 'bg-emerald-100 text-emerald-700',
  },
  INVOICED: {
    label: 'Invoiced',
    className: 'bg-green-100 text-green-700',
  },
  CLOSED: {
    label: 'Closed',
    className: 'bg-slate-200 text-slate-600',
  },
  ON_HOLD: {
    label: 'On Hold',
    className: 'bg-amber-100 text-amber-700',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-700',
  },
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.DRAFT;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
