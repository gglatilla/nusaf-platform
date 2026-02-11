'use client';

import { AlertTriangle } from 'lucide-react';
import type { SalesOrderLine } from '@/lib/api/types/orders';

interface BackorderSummarySectionProps {
  lines: SalesOrderLine[];
}

export function BackorderSummarySection({ lines }: BackorderSummarySectionProps) {
  const backorderedLines = lines.filter((l) => l.quantityBackorder > 0);

  if (backorderedLines.length === 0) {
    return null;
  }

  const totalBackorder = backorderedLines.reduce((sum, l) => sum + l.quantityBackorder, 0);

  return (
    <div className="bg-white rounded-lg border border-amber-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 bg-amber-50 border-b border-amber-200">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <h3 className="text-sm font-semibold text-amber-800">Items on Backorder</h3>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          {backorderedLines.length} line{backorderedLines.length !== 1 ? 's' : ''} &middot; {totalBackorder} unit{totalBackorder !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {backorderedLines.map((line) => (
          <div key={line.id} className="flex items-center justify-between px-6 py-3">
            <div>
              <span className="text-sm font-medium text-slate-900">{line.productSku}</span>
              <span className="text-sm text-slate-500 ml-2">{line.productDescription}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-500">
                Ordered: <span className="text-slate-900 font-medium">{line.quantityOrdered}</span>
              </span>
              <span className="text-amber-700 font-medium">
                {line.quantityBackorder} on B/O
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
