'use client';

import type { PurchaseOrderLine, SupplierCurrency } from '@/lib/api';

interface POLineTableProps {
  lines: PurchaseOrderLine[];
  currency?: SupplierCurrency;
}

function formatCurrency(amount: number, currency: SupplierCurrency = 'EUR'): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function POLineTable({ lines, currency = 'EUR' }: POLineTableProps) {
  if (lines.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No lines added to this purchase order yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              #
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              SKU
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Description
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Unit Cost
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Qty Ordered
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Qty Received
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Line Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lines.map((line) => {
            const outstanding = line.quantityOrdered - line.quantityReceived;
            const fullyReceived = outstanding <= 0;

            return (
              <tr key={line.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                  {line.lineNumber}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm font-mono text-slate-900">{line.productSku}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-700">{line.productDescription}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span className="text-sm text-slate-600">{formatCurrency(line.unitCost, currency)}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span className="text-sm font-medium text-slate-900">{line.quantityOrdered}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span className={`text-sm font-medium ${fullyReceived ? 'text-green-600' : 'text-slate-600'}`}>
                    {line.quantityReceived}
                  </span>
                  {!fullyReceived && line.quantityReceived > 0 && (
                    <span className="text-xs text-slate-500 ml-1">
                      ({outstanding} outstanding)
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span className="text-sm font-medium text-slate-900">
                    {formatCurrency(line.lineTotal, currency)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
