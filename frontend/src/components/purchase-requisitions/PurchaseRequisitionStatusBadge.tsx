'use client';

import type { PurchaseRequisitionStatus } from '@/lib/api';

const STATUS_CONFIG: Record<PurchaseRequisitionStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
  CONVERTED_TO_PO: { label: 'Converted to PO', className: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Cancelled', className: 'bg-slate-100 text-slate-600' },
};

interface PurchaseRequisitionStatusBadgeProps {
  status: PurchaseRequisitionStatus;
}

export default function PurchaseRequisitionStatusBadge({ status }: PurchaseRequisitionStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'bg-slate-100 text-slate-600' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
