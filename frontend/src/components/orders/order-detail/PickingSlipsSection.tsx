'use client';

import Link from 'next/link';
import { MapPin, User, Clock } from 'lucide-react';
import { PickingSlipStatusBadge } from '@/components/picking-slips/PickingSlipStatusBadge';
import type { OrderPickingSlipSummary } from '@/lib/api/types/orders';

interface PickingSlipsSectionProps {
  pickingSlips: OrderPickingSlipSummary[];
}

function formatShortDate(dateString: string | null): string {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('en-ZA', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function getLocationLabel(location: string): string {
  return location === 'JHB' ? 'Johannesburg' : 'Cape Town';
}

export function PickingSlipsSection({ pickingSlips }: PickingSlipsSectionProps) {
  if (!pickingSlips || pickingSlips.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Picking Slips</h2>
        <span className="text-sm text-slate-500">{pickingSlips.length} slip{pickingSlips.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="space-y-3">
        {pickingSlips.map((slip) => (
          <div
            key={slip.id}
            className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href={`/picking-slips/${slip.id}`}
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                {slip.pickingSlipNumber}
              </Link>
              <PickingSlipStatusBadge status={slip.status} />
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5" />
                {getLocationLabel(slip.location)}
              </span>
              {slip.assignedToName && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <User className="h-3.5 w-3.5" />
                  {slip.assignedToName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              {slip.completedAt ? (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Completed {formatShortDate(slip.completedAt)}
                </span>
              ) : slip.startedAt ? (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Started {formatShortDate(slip.startedAt)}
                </span>
              ) : (
                <span>Created {formatShortDate(slip.createdAt)}</span>
              )}
              <span className="text-slate-500">{slip.lineCount} line{slip.lineCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
