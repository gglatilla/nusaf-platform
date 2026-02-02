'use client';

import type { PurchaseOrderStatus } from '@/lib/api';

interface POStatusBadgeProps {
  status: PurchaseOrderStatus;
}

const statusConfig: Record<PurchaseOrderStatus, { label: string; className: string }> = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-slate-100 text-slate-700',
  },
  PENDING_APPROVAL: {
    label: 'Pending Approval',
    className: 'bg-amber-100 text-amber-700',
  },
  SENT: {
    label: 'Sent',
    className: 'bg-blue-100 text-blue-700',
  },
  ACKNOWLEDGED: {
    label: 'Acknowledged',
    className: 'bg-cyan-100 text-cyan-700',
  },
  PARTIALLY_RECEIVED: {
    label: 'Partially Received',
    className: 'bg-violet-100 text-violet-700',
  },
  RECEIVED: {
    label: 'Received',
    className: 'bg-green-100 text-green-700',
  },
  CLOSED: {
    label: 'Closed',
    className: 'bg-slate-200 text-slate-600',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-700',
  },
};

export function POStatusBadge({ status }: POStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.DRAFT;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
