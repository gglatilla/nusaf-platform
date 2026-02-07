'use client';

import Link from 'next/link';
import { Package, ArrowRight } from 'lucide-react';
import { POStatusBadge } from '@/components/purchase-orders/POStatusBadge';
import type { FulfillmentDashboardData } from '@/lib/api';

interface AwaitingDeliverySectionProps {
  data: FulfillmentDashboardData['awaitingDelivery'];
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency === 'EUR' ? 'EUR' : 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AwaitingDeliverySection({ data }: AwaitingDeliverySectionProps) {
  const totalCount = data.sentCount + data.acknowledgedCount + data.partiallyReceivedCount;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-slate-900">Awaiting Delivery</h2>
          {totalCount > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {totalCount}
            </span>
          )}
        </div>
        <Link
          href="/purchase-orders"
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          View All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="flex gap-4 mb-4 text-sm text-slate-500">
        <span>{data.sentCount} sent</span>
        <span>{data.acknowledgedCount} acknowledged</span>
        <span>{data.partiallyReceivedCount} partial</span>
        {data.overdueCount > 0 && (
          <span className="text-red-600 font-medium">{data.overdueCount} overdue</span>
        )}
      </div>

      {data.recentItems.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">No POs awaiting delivery</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {data.recentItems.map((item) => (
            <Link
              key={item.id}
              href={`/purchase-orders/${item.id}`}
              className="flex items-center justify-between py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">{item.poNumber}</span>
                  <POStatusBadge status={item.status} />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500">{item.supplierName}</span>
                  <span className="text-xs text-slate-400">{item.lineCount} lines</span>
                </div>
              </div>
              <div className="text-right ml-4">
                <span className="text-xs font-medium text-slate-700">
                  {formatCurrency(item.total, item.currency)}
                </span>
                {item.expectedDate && (
                  <p className={`text-xs ${new Date(item.expectedDate) < new Date() ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                    Due {formatDate(item.expectedDate)}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
