'use client';

import Link from 'next/link';
import { ClipboardList, ArrowRight } from 'lucide-react';
import { PickingSlipStatusBadge } from '@/components/picking-slips/PickingSlipStatusBadge';
import type { FulfillmentDashboardData } from '@/lib/api';

interface PickingQueueSectionProps {
  data: FulfillmentDashboardData['pickingQueue'];
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

export function PickingQueueSection({ data }: PickingQueueSectionProps) {
  const totalCount = data.pendingCount + data.inProgressCount;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-900">Picking Queue</h2>
          {totalCount > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {totalCount}
            </span>
          )}
        </div>
        <Link
          href="/picking-slips"
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          View All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="flex gap-4 mb-4 text-sm text-slate-500">
        <span>{data.pendingCount} pending</span>
        <span>{data.inProgressCount} in progress</span>
      </div>

      {data.recentItems.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">No picking slips awaiting action</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {data.recentItems.map((item) => (
            <Link
              key={item.id}
              href={`/picking-slips/${item.id}`}
              className="flex items-center justify-between py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">{item.pickingSlipNumber}</span>
                  <PickingSlipStatusBadge status={item.status} />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Link
                    href={`/orders/${item.orderId}`}
                    className="text-xs text-blue-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item.orderNumber}
                  </Link>
                  <span className="text-xs text-slate-400">{item.location}</span>
                  {item.assignedToName && (
                    <span className="text-xs text-slate-400">{item.assignedToName}</span>
                  )}
                </div>
              </div>
              <div className="text-right ml-4">
                <span className="text-xs text-slate-400">{item.lineCount} lines</span>
                <p className="text-xs text-slate-400">{formatDate(item.createdAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
