'use client';

import { MapPin, ArrowRight } from 'lucide-react';
import type { PickingSlipPlan } from '@/lib/api';

interface PickingSlipPlanSectionProps {
  pickingSlips: PickingSlipPlan[];
}

function getWarehouseLabel(warehouse: string): string {
  return warehouse === 'JHB' ? 'Johannesburg' : 'Cape Town';
}

export function PickingSlipPlanSection({ pickingSlips }: PickingSlipPlanSectionProps) {
  return (
    <div className="divide-y divide-slate-100">
      {pickingSlips.map((slip, index) => (
        <div key={index} className="p-4">
          {/* Warehouse Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-indigo-500" />
              <span className="font-medium text-slate-900">
                {getWarehouseLabel(slip.warehouse)}
              </span>
              <span className="text-sm text-slate-500">
                ({slip.lines.length} line{slip.lines.length !== 1 ? 's' : ''})
              </span>
            </div>
            {slip.isTransferSource && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                <ArrowRight className="h-3 w-3" />
                Transfer Source
              </span>
            )}
          </div>

          {/* Lines Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 pr-4 font-medium text-slate-500 text-xs uppercase">
                    #
                  </th>
                  <th className="text-left py-2 pr-4 font-medium text-slate-500 text-xs uppercase">
                    SKU
                  </th>
                  <th className="text-left py-2 pr-4 font-medium text-slate-500 text-xs uppercase">
                    Description
                  </th>
                  <th className="text-right py-2 font-medium text-slate-500 text-xs uppercase">
                    Qty
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {slip.lines.map((line) => (
                  <tr key={line.orderLineId} className="hover:bg-slate-50">
                    <td className="py-2 pr-4 text-slate-500">
                      {line.lineNumber}
                    </td>
                    <td className="py-2 pr-4 font-mono text-slate-900">
                      {line.productSku}
                    </td>
                    <td className="py-2 pr-4 text-slate-600 max-w-xs truncate">
                      {line.productDescription}
                    </td>
                    <td className="py-2 text-right font-medium text-slate-900">
                      {line.quantityToPick}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
