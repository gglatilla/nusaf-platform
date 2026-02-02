'use client';

import { ArrowRight, MapPin } from 'lucide-react';
import type { TransferPlan } from '@/lib/api';

interface TransferPlanSectionProps {
  transfers: TransferPlan[];
}

function getWarehouseLabel(warehouse: string): string {
  return warehouse === 'JHB' ? 'Johannesburg' : 'Cape Town';
}

export function TransferPlanSection({ transfers }: TransferPlanSectionProps) {
  return (
    <div className="divide-y divide-slate-100">
      {transfers.map((transfer, index) => (
        <div key={index} className="p-4">
          {/* Transfer Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-slate-100">
              <MapPin className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">
                {getWarehouseLabel(transfer.fromWarehouse)}
              </span>
            </div>
            <ArrowRight className="h-4 w-4 text-blue-500" />
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-blue-100">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                {getWarehouseLabel(transfer.toWarehouse)}
              </span>
            </div>
            <span className="text-sm text-slate-500 ml-2">
              ({transfer.lines.length} line{transfer.lines.length !== 1 ? 's' : ''})
            </span>
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
                {transfer.lines.map((line) => (
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
                      {line.quantity}
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
