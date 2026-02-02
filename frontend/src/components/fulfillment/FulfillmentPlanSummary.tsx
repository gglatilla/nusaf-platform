'use client';

import { Package, ClipboardList, Wrench, Truck, ShoppingCart } from 'lucide-react';
import type { OrchestrationSummary } from '@/lib/api';

interface FulfillmentPlanSummaryProps {
  summary: OrchestrationSummary;
}

function getProgressColor(percent: number): string {
  if (percent >= 80) return 'bg-emerald-500';
  if (percent >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function getProgressBgColor(percent: number): string {
  if (percent >= 80) return 'bg-emerald-100';
  if (percent >= 50) return 'bg-amber-100';
  return 'bg-red-100';
}

export function FulfillmentPlanSummary({ summary }: FulfillmentPlanSummaryProps) {
  const percent = Math.round(summary.immediatelyFulfillablePercent);

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Fulfillment Progress</span>
          <span className={`text-lg font-bold ${
            percent >= 80 ? 'text-emerald-600' : percent >= 50 ? 'text-amber-600' : 'text-red-600'
          }`}>
            {percent}%
          </span>
        </div>
        <div className={`h-3 rounded-full ${getProgressBgColor(percent)}`}>
          <div
            className={`h-full rounded-full transition-all duration-300 ${getProgressColor(percent)}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-xs text-slate-500">
          {summary.canFulfillCompletely
            ? 'All items can be fulfilled immediately'
            : `${summary.linesFromStock} of ${summary.totalOrderLines} lines from stock`}
        </p>
      </div>

      {/* Line Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
          <Package className="h-4 w-4 text-slate-500" />
          <div>
            <p className="text-xs text-slate-500">From Stock</p>
            <p className="text-sm font-semibold text-slate-900">{summary.linesFromStock}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
          <Wrench className="h-4 w-4 text-purple-500" />
          <div>
            <p className="text-xs text-slate-500">Assembly</p>
            <p className="text-sm font-semibold text-slate-900">{summary.linesRequiringAssembly}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
          <Truck className="h-4 w-4 text-blue-500" />
          <div>
            <p className="text-xs text-slate-500">Transfer</p>
            <p className="text-sm font-semibold text-slate-900">{summary.linesRequiringTransfer}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
          <ShoppingCart className="h-4 w-4 text-amber-500" />
          <div>
            <p className="text-xs text-slate-500">Backorder</p>
            <p className="text-sm font-semibold text-slate-900">{summary.linesBackordered}</p>
          </div>
        </div>
      </div>

      {/* Documents to Create */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-500">Documents to create:</span>
        {summary.pickingSlipsToCreate > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
            <ClipboardList className="h-3 w-3" />
            {summary.pickingSlipsToCreate} Picking Slip{summary.pickingSlipsToCreate !== 1 ? 's' : ''}
          </span>
        )}
        {summary.jobCardsToCreate > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
            <Wrench className="h-3 w-3" />
            {summary.jobCardsToCreate} Job Card{summary.jobCardsToCreate !== 1 ? 's' : ''}
          </span>
        )}
        {summary.transfersToCreate > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
            <Truck className="h-3 w-3" />
            {summary.transfersToCreate} Transfer{summary.transfersToCreate !== 1 ? 's' : ''}
          </span>
        )}
        {summary.purchaseOrdersToCreate > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
            <ShoppingCart className="h-3 w-3" />
            {summary.purchaseOrdersToCreate} PO{summary.purchaseOrdersToCreate !== 1 ? 's' : ''}
          </span>
        )}
        {summary.pickingSlipsToCreate === 0 &&
          summary.jobCardsToCreate === 0 &&
          summary.transfersToCreate === 0 &&
          summary.purchaseOrdersToCreate === 0 && (
            <span className="text-xs text-slate-400">None</span>
          )}
      </div>
    </div>
  );
}
