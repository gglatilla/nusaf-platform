'use client';

import type { GrvLine } from '@/lib/api';

interface GRVLineTableProps {
  lines: GrvLine[];
}

export function GRVLineTable({ lines }: GRVLineTableProps) {
  if (lines.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No lines in this goods receipt.
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
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Expected
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Received
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Rejected
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Rejection Reason
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lines.map((line) => (
            <tr key={line.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                {line.lineNumber}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-sm font-mono text-slate-900">{line.productSku}</span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right">
                <span className="text-sm text-slate-600">{line.quantityExpected}</span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right">
                <span className="text-sm font-medium text-green-600">{line.quantityReceived}</span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right">
                {line.quantityRejected > 0 ? (
                  <span className="text-sm font-medium text-red-600">{line.quantityRejected}</span>
                ) : (
                  <span className="text-sm text-slate-400">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                {line.rejectionReason ? (
                  <span className="text-sm text-red-600">{line.rejectionReason}</span>
                ) : (
                  <span className="text-sm text-slate-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
