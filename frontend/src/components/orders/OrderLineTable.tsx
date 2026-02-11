'use client';

import type { SalesOrderLine } from '@/lib/api';
import { formatCurrency } from '@/lib/formatting';

interface OrderLineTableProps {
  lines: SalesOrderLine[];
  hideOperationalColumns?: boolean; // Hide Status and Picked columns (customer view)
}

const lineStatusLabels: Record<string, string> = {
  PENDING: 'Pending',
  PICKING: 'Picking',
  PICKED: 'Picked',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
};

const lineStatusColors: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-600',
  PICKING: 'bg-amber-100 text-amber-700',
  PICKED: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
};

function getStatusDisplay(line: SalesOrderLine): { label: string; color: string } {
  if (line.status === 'PENDING' && line.quantityBackorder > 0) {
    return { label: 'On Backorder', color: 'bg-amber-100 text-amber-700' };
  }
  return {
    label: lineStatusLabels[line.status] || line.status,
    color: lineStatusColors[line.status] || lineStatusColors.PENDING,
  };
}

export function OrderLineTable({ lines, hideOperationalColumns }: OrderLineTableProps) {
  if (lines.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <p className="text-sm text-slate-600">No items in this order.</p>
      </div>
    );
  }

  const hasAnyBackorder = lines.some((l) => l.quantityBackorder > 0);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              #
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Product
            </th>
            {!hideOperationalColumns && (
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Status
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Unit Price
            </th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Ordered
            </th>
            {!hideOperationalColumns && (
              <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Picked
              </th>
            )}
            {!hideOperationalColumns && hasAnyBackorder && (
              <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Backorder
              </th>
            )}
            <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Shipped
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Line Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lines.map((line) => {
            const statusDisplay = getStatusDisplay(line);
            return (
              <tr key={line.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {line.lineNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-900">{line.productSku}</div>
                  <div className="text-sm text-slate-500 truncate max-w-xs">{line.productDescription}</div>
                  {hideOperationalColumns && line.quantityBackorder > 0 && (
                    <div className="text-xs text-amber-600 mt-0.5">
                      {line.quantityBackorder} unit{line.quantityBackorder !== 1 ? 's' : ''} on backorder
                    </div>
                  )}
                </td>
                {!hideOperationalColumns && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusDisplay.color}`}>
                      {statusDisplay.label}
                    </span>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {formatCurrency(line.unitPrice)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-center">
                  {line.quantityOrdered}
                </td>
                {!hideOperationalColumns && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span className={line.quantityPicked > 0 ? 'text-slate-900' : 'text-slate-400'}>
                      {line.quantityPicked}
                    </span>
                  </td>
                )}
                {!hideOperationalColumns && hasAnyBackorder && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {line.quantityBackorder > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                        {line.quantityBackorder} on B/O
                      </span>
                    ) : (
                      <span className="text-slate-400">&mdash;</span>
                    )}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <span className={line.quantityShipped > 0 ? 'text-slate-900' : 'text-slate-400'}>
                    {line.quantityShipped}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                  {formatCurrency(line.lineTotal)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
