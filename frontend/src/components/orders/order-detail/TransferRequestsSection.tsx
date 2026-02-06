'use client';

import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { TransferRequestStatusBadge } from '@/components/transfer-requests/TransferRequestStatusBadge';
import type { OrderTransferRequestSummary } from '@/lib/api';

interface TransferRequestsSectionProps {
  transferRequests: OrderTransferRequestSummary[];
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

export function TransferRequestsSection({ transferRequests }: TransferRequestsSectionProps) {
  if (!transferRequests || transferRequests.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Transfer Requests</h2>
        <span className="text-sm text-slate-500">{transferRequests.length} transfer{transferRequests.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="space-y-3">
        {transferRequests.map((tr) => (
          <div
            key={tr.id}
            className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href={`/transfer-requests/${tr.id}`}
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                {tr.transferNumber}
              </Link>
              <TransferRequestStatusBadge status={tr.status} />
              <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium">
                {getLocationLabel(tr.fromLocation)}
                <ArrowRight className="h-3 w-3 text-slate-400" />
                {getLocationLabel(tr.toLocation)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              {tr.receivedAt ? (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Received {formatShortDate(tr.receivedAt)}
                </span>
              ) : tr.shippedAt ? (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Shipped {formatShortDate(tr.shippedAt)}
                </span>
              ) : (
                <span>Created {formatShortDate(tr.createdAt)}</span>
              )}
              <span className="text-slate-500">{tr.lineCount} line{tr.lineCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
