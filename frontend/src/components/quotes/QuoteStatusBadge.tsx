'use client';

import type { QuoteStatus } from '@/lib/api';

interface QuoteStatusBadgeProps {
  status: QuoteStatus;
}

const statusConfig: Record<QuoteStatus, { label: string; className: string }> = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-slate-100 text-slate-700',
  },
  CREATED: {
    label: 'Submitted',
    className: 'bg-blue-100 text-blue-700',
  },
  ACCEPTED: {
    label: 'Accepted',
    className: 'bg-green-100 text-green-700',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-700',
  },
  EXPIRED: {
    label: 'Expired',
    className: 'bg-amber-100 text-amber-700',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-slate-100 text-slate-500',
  },
  CONVERTED: {
    label: 'Converted',
    className: 'bg-purple-100 text-purple-700',
  },
};

export function QuoteStatusBadge({ status }: QuoteStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.DRAFT;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
