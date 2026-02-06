'use client';

import Link from 'next/link';
import { User, Clock } from 'lucide-react';
import { JobCardStatusBadge } from '@/components/job-cards/JobCardStatusBadge';
import { JobTypeBadge } from '@/components/job-cards/JobTypeBadge';
import type { OrderJobCardSummary } from '@/lib/api/types/orders';

interface JobCardsSectionProps {
  jobCards: OrderJobCardSummary[];
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

export function JobCardsSection({ jobCards }: JobCardsSectionProps) {
  if (!jobCards || jobCards.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Job Cards</h2>
        <span className="text-sm text-slate-500">{jobCards.length} card{jobCards.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="space-y-3">
        {jobCards.map((jc) => (
          <div
            key={jc.id}
            className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href={`/job-cards/${jc.id}`}
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                {jc.jobCardNumber}
              </Link>
              <JobCardStatusBadge status={jc.status} />
              <JobTypeBadge jobType={jc.jobType} />
              {jc.assignedToName && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <User className="h-3.5 w-3.5" />
                  {jc.assignedToName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-sm text-slate-600">{jc.productSku}</span>
                <span className="text-xs text-slate-400 ml-2">Qty: {jc.quantity}</span>
              </div>
              <div className="text-xs text-slate-400 min-w-[100px] text-right">
                {jc.completedAt ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Done {formatShortDate(jc.completedAt)}
                  </span>
                ) : jc.startedAt ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Started {formatShortDate(jc.startedAt)}
                  </span>
                ) : (
                  <span>Created {formatShortDate(jc.createdAt)}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
