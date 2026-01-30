'use client';

import type { JobCardStatus } from '@/lib/api';

interface JobCardStatusBadgeProps {
  status: JobCardStatus;
}

const statusConfig: Record<JobCardStatus, { label: string; className: string }> = {
  PENDING: {
    label: 'Pending',
    className: 'bg-slate-100 text-slate-700',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'bg-blue-100 text-blue-700',
  },
  ON_HOLD: {
    label: 'On Hold',
    className: 'bg-amber-100 text-amber-700',
  },
  COMPLETE: {
    label: 'Complete',
    className: 'bg-green-100 text-green-700',
  },
};

export function JobCardStatusBadge({ status }: JobCardStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
