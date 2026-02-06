'use client';

import Link from 'next/link';
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
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Receiving
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
            const percentReceived = line.quantityOrdered > 0
              ? Math.round((line.quantityReceived / line.quantityOrdered) * 100)
              : 0;

            return (
              <tr key={line.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                  {line.lineNumber}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Link
                    href={`/inventory/items/${encodeURIComponent(line.productSku)}`}
                    className="text-sm font-mono text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    {line.productSku}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-700">{line.productDescription}</span>
                  {line.salesOrderLineId && (
                    <span className="block text-xs text-slate-400 mt-0.5">Linked to sales order</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span className="text-sm text-slate-600">{formatCurrency(line.unitCost, currency)}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span className="text-sm font-medium text-slate-900">{line.quantityOrdered}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex flex-col items-center gap-1 min-w-[100px]">
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${fullyReceived ? 'bg-green-500' : line.quantityReceived > 0 ? 'bg-primary-500' : 'bg-slate-200'}`}
                        style={{ width: `${Math.min(percentReceived, 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${fullyReceived ? 'text-green-600' : 'text-slate-600'}`}>
                      {line.quantityReceived} / {line.quantityOrdered}
                      {fullyReceived && <span className="ml-1">✓</span>}
                    </span>
                  </div>
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
