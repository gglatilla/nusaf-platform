'use client';

import type { IssueFlagStatus } from '@/lib/api';

interface IssueFlagStatusBadgeProps {
  status: IssueFlagStatus;
}

const statusConfig: Record<IssueFlagStatus, { label: string; className: string }> = {
  OPEN: {
    label: 'Open',
    className: 'bg-red-100 text-red-700',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'bg-blue-100 text-blue-700',
  },
  PENDING_INFO: {
    label: 'Pending Info',
    className: 'bg-amber-100 text-amber-700',
  },
  RESOLVED: {
    label: 'Resolved',
    className: 'bg-green-100 text-green-700',
  },
  CLOSED: {
    label: 'Closed',
    className: 'bg-slate-100 text-slate-700',
  },
};

export function IssueFlagStatusBadge({ status }: IssueFlagStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.OPEN;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
