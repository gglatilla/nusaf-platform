'use client';

import type { DeliveryNoteStatus } from '@/lib/api';

interface DeliveryNoteStatusBadgeProps {
  status: DeliveryNoteStatus;
}

const statusConfig: Record<DeliveryNoteStatus, { label: string; className: string }> = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-slate-100 text-slate-700',
  },
  DISPATCHED: {
    label: 'Dispatched',
    className: 'bg-blue-100 text-blue-700',
  },
  DELIVERED: {
    label: 'Delivered',
    className: 'bg-green-100 text-green-700',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-700',
  },
};

export function DeliveryNoteStatusBadge({ status }: DeliveryNoteStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.DRAFT;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
