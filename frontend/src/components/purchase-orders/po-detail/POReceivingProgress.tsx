'use client';

import { Package, AlertTriangle, CheckCircle } from 'lucide-react';
import type { ReceivingSummary } from '@/lib/api';

interface POReceivingProgressProps {
  summary: ReceivingSummary;
}

export function POReceivingProgress({ summary }: POReceivingProgressProps) {
  const { totalQuantityOrdered, totalQuantityReceived, totalQuantityRejected } = summary;
  const outstanding = totalQuantityOrdered - totalQuantityReceived;
  const percentReceived = totalQuantityOrdered > 0
    ? Math.round((totalQuantityReceived / totalQuantityOrdered) * 100)
    : 0;
  const isFullyReceived = outstanding <= 0;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Receiving Progress</h2>
        <span className={`text-sm font-semibold ${isFullyReceived ? 'text-green-600' : 'text-amber-600'}`}>
          {percentReceived}% received
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-100 rounded-full h-3 mb-4">
        <div
          className={`h-3 rounded-full transition-all ${isFullyReceived ? 'bg-green-500' : 'bg-primary-500'}`}
          style={{ width: `${Math.min(percentReceived, 100)}%` }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Ordered</p>
            <p className="text-sm font-semibold text-slate-900">{totalQuantityOrdered}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <div>
            <p className="text-xs text-slate-500">Received</p>
            <p className="text-sm font-semibold text-green-600">{totalQuantityReceived}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {outstanding > 0 ? (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          <div>
            <p className="text-xs text-slate-500">Outstanding</p>
            <p className={`text-sm font-semibold ${outstanding > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {Math.max(outstanding, 0)}
            </p>
          </div>
        </div>
      </div>

      {totalQuantityRejected > 0 && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
          <AlertTriangle className="h-4 w-4" />
          <span>{totalQuantityRejected} units rejected across all receipts</span>
        </div>
      )}
    </div>
  );
}
