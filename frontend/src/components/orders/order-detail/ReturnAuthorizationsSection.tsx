'use client';

import Link from 'next/link';
import { Clock } from 'lucide-react';
import ReturnAuthorizationStatusBadge from '@/components/return-authorizations/ReturnAuthorizationStatusBadge';
import type { OrderReturnAuthorizationSummary } from '@/lib/api';

interface ReturnAuthorizationsSectionProps {
  returnAuthorizations: OrderReturnAuthorizationSummary[];
  isCustomer?: boolean;
}

function formatShortDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

export function ReturnAuthorizationsSection({ returnAuthorizations, isCustomer }: ReturnAuthorizationsSectionProps) {
  if (!returnAuthorizations || returnAuthorizations.length === 0) return null;

  const linkPrefix = isCustomer ? '/my/returns' : '/return-authorizations';

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Returns</h2>
        <span className="text-sm text-slate-500">
          {returnAuthorizations.length} return{returnAuthorizations.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-3">
        {returnAuthorizations.map((ra) => (
          <div
            key={ra.id}
            className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href={`${linkPrefix}/${ra.id}`}
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                {ra.raNumber}
              </Link>
              <ReturnAuthorizationStatusBadge status={ra.status} />
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatShortDate(ra.createdAt)}
              </span>
              <span className="text-slate-500">
                {ra.lineCount} line{ra.lineCount !== 1 ? 's' : ''} &middot; {ra.totalQuantityReturned} qty
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
