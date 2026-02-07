'use client';

import Link from 'next/link';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import type { FulfillmentDashboardData } from '@/lib/api';

interface ReadyToShipSectionProps {
  data: FulfillmentDashboardData['readyToShip'];
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ReadyToShipSection({ data }: ReadyToShipSectionProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold text-slate-900">Ready to Ship</h2>
          {data.count > 0 && (
            <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {data.count}
            </span>
          )}
        </div>
        <Link
          href="/orders?status=READY_TO_SHIP"
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          View All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {data.recentItems.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">No orders ready to ship</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {data.recentItems.map((item) => (
            <Link
              key={item.id}
              href={`/orders/${item.id}`}
              className="flex items-center justify-between py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">{item.orderNumber}</span>
                  <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded">
                    Ready
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.customerName && (
                    <span className="text-xs text-slate-500">{item.customerName}</span>
                  )}
                  <span className="text-xs text-slate-400">{item.lineCount} lines</span>
                </div>
              </div>
              <div className="text-right ml-4">
                <span className="text-xs font-medium text-slate-700">
                  {formatCurrency(item.total)}
                </span>
                <p className="text-xs text-slate-400">{formatDate(item.createdAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
