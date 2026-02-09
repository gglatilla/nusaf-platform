'use client';

import type { TransferRequestStatus } from '@/lib/api';

interface TransferRequestStatusBadgeProps {
  status: TransferRequestStatus;
}

const statusConfig: Record<TransferRequestStatus, { label: string; className: string }> = {
  PENDING: {
    label: 'Pending',
    className: 'bg-slate-100 text-slate-700',
  },
  IN_TRANSIT: {
    label: 'In Transit',
    className: 'bg-blue-100 text-blue-700',
  },
  RECEIVED: {
    label: 'Received',
    className: 'bg-green-100 text-green-700',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-700',
  },
};

export function TransferRequestStatusBadge({ status }: TransferRequestStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
