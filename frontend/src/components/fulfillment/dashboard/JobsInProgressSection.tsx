'use client';

import Link from 'next/link';
import { Wrench, ArrowRight } from 'lucide-react';
import { JobCardStatusBadge } from '@/components/job-cards/JobCardStatusBadge';
import type { FulfillmentDashboardData } from '@/lib/api';
import { formatDate } from '@/lib/formatting';

interface JobsInProgressSectionProps {
  data: FulfillmentDashboardData['jobCards'];
}

export function JobsInProgressSection({ data }: JobsInProgressSectionProps) {
  const totalCount = data.pendingCount + data.inProgressCount + data.onHoldCount;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-slate-900">Jobs</h2>
          {totalCount > 0 && (
            <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {totalCount}
            </span>
          )}
        </div>
        <Link
          href="/job-cards"
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          View All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="flex gap-4 mb-4 text-sm text-slate-500">
        <span>{data.pendingCount} pending</span>
        <span>{data.inProgressCount} in progress</span>
        {data.onHoldCount > 0 && (
          <span className="text-amber-600">{data.onHoldCount} on hold</span>
        )}
      </div>

      {data.recentItems.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">No active job cards</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {data.recentItems.map((item) => (
            <Link
              key={item.id}
              href={`/job-cards/${item.id}`}
              className="flex items-center justify-between py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">{item.jobCardNumber}</span>
                  <JobCardStatusBadge status={item.status} />
                  <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                    {item.jobType}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500 truncate max-w-[180px]">{item.productSku}</span>
                  <span className="text-xs text-slate-400">qty {item.quantity}</span>
                  {item.assignedToName && (
                    <span className="text-xs text-slate-400">{item.assignedToName}</span>
                  )}
                </div>
              </div>
              <div className="text-right ml-4">
                <Link
                  href={`/orders/${item.orderId}`}
                  className="text-xs text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.orderNumber}
                </Link>
                <p className="text-xs text-slate-400">{formatDate(item.createdAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
