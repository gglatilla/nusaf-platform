'use client';

import { Building, Package, AlertCircle } from 'lucide-react';
import type { PurchaseOrderPlan } from '@/lib/api';
import { formatCurrency } from '@/lib/formatting';

interface PurchaseOrderPlanSectionProps {
  purchaseOrders: PurchaseOrderPlan[];
}

function ReasonBadge({ reason }: { reason: string }) {
  const isBackorder = reason === 'FINISHED_GOODS_BACKORDER';
  return (
    <span className={`
      inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium
      ${isBackorder ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}
    `}>
      <AlertCircle className="h-3 w-3" />
      {isBackorder ? 'Backorder' : 'Component Shortage'}
    </span>
  );
}

export function PurchaseOrderPlanSection({ purchaseOrders }: PurchaseOrderPlanSectionProps) {
  return (
    <div className="divide-y divide-slate-100">
      {purchaseOrders.map((po, index) => {
        const totalCost = po.lines.reduce(
          (sum, line) => sum + line.quantity * line.estimatedUnitCost,
          0
        );

        return (
          <div key={index} className="p-4">
            {/* PO Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <Building className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">
                      {po.supplierName}
                    </span>
                    <span className="text-sm text-slate-500">
                      ({po.supplierCode})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <ReasonBadge reason={po.reason} />
                    <span className="text-xs text-slate-500">
                      Currency: {po.currency}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-slate-900">
                  {formatCurrency(totalCost, po.currency)}
                </span>
                <p className="text-xs text-slate-500">estimated total</p>
              </div>
            </div>

            {/* Lines Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 pr-4 font-medium text-slate-500 text-xs uppercase">
                      SKU
                    </th>
                    <th className="text-left py-2 pr-4 font-medium text-slate-500 text-xs uppercase">
                      Description
                    </th>
                    <th className="text-right py-2 pr-4 font-medium text-slate-500 text-xs uppercase">
                      Qty
                    </th>
                    <th className="text-right py-2 pr-4 font-medium text-slate-500 text-xs uppercase">
                      Unit Cost
                    </th>
                    <th className="text-right py-2 font-medium text-slate-500 text-xs uppercase">
                      Line Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {po.lines.map((line, lineIndex) => (
                    <tr key={lineIndex} className="hover:bg-slate-50">
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-slate-400" />
                          <span className="font-mono text-slate-900">{line.productSku}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-4 text-slate-600 max-w-xs truncate">
                        {line.productDescription}
                      </td>
                      <td className="py-2 pr-4 text-right font-medium text-slate-900">
                        {line.quantity}
                      </td>
                      <td className="py-2 pr-4 text-right text-slate-600">
                        {formatCurrency(line.estimatedUnitCost, po.currency)}
                      </td>
                      <td className="py-2 text-right font-medium text-slate-900">
                        {formatCurrency(line.quantity * line.estimatedUnitCost, po.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
