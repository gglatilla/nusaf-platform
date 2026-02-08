'use client';

import type { PackingListStatus } from '@/lib/api';

interface PackingListStatusBadgeProps {
  status: PackingListStatus;
}

const statusConfig: Record<PackingListStatus, { label: string; className: string }> = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-slate-100 text-slate-700',
  },
  FINALIZED: {
    label: 'Finalized',
    className: 'bg-green-100 text-green-700',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-700',
  },
};

export function PackingListStatusBadge({ status }: PackingListStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.DRAFT;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
