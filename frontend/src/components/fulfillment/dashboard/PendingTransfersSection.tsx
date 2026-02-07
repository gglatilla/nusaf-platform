'use client';

import Link from 'next/link';
import { Truck, ArrowRight } from 'lucide-react';
import { TransferRequestStatusBadge } from '@/components/transfer-requests/TransferRequestStatusBadge';
import type { FulfillmentDashboardData } from '@/lib/api';

interface PendingTransfersSectionProps {
  data: FulfillmentDashboardData['transfers'];
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

export function PendingTransfersSection({ data }: PendingTransfersSectionProps) {
  const totalCount = data.pendingCount + data.inTransitCount;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">Transfers</h2>
          {totalCount > 0 && (
            <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {totalCount}
            </span>
          )}
        </div>
        <Link
          href="/transfer-requests"
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          View All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="flex gap-4 mb-4 text-sm text-slate-500">
        <span>{data.pendingCount} pending</span>
        <span>{data.inTransitCount} in transit</span>
      </div>

      {data.recentItems.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">No pending transfers</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {data.recentItems.map((item) => (
            <Link
              key={item.id}
              href={`/transfer-requests/${item.id}`}
              className="flex items-center justify-between py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">{item.transferNumber}</span>
                  <TransferRequestStatusBadge status={item.status} />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500">{item.fromLocation} → {item.toLocation}</span>
                  {item.orderNumber && (
                    <Link
                      href={`/orders/${item.orderId}`}
                      className="text-xs text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.orderNumber}
                    </Link>
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
