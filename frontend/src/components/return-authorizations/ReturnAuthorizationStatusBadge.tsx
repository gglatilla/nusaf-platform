'use client';

import type { ReturnAuthorizationStatus } from '@/lib/api';

const STATUS_CONFIG: Record<ReturnAuthorizationStatus, { label: string; className: string }> = {
  REQUESTED: { label: 'Requested', className: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'Approved', className: 'bg-blue-100 text-blue-700' },
  REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
  ITEMS_RECEIVED: { label: 'Items Received', className: 'bg-purple-100 text-purple-700' },
  COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Cancelled', className: 'bg-slate-100 text-slate-600' },
};

interface ReturnAuthorizationStatusBadgeProps {
  status: ReturnAuthorizationStatus;
}

export default function ReturnAuthorizationStatusBadge({ status }: ReturnAuthorizationStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'bg-slate-100 text-slate-600' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
