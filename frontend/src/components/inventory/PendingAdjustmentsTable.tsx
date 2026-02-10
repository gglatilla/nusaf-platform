'use client';

import { useState } from 'react';
import { ClipboardCheck, Eye } from 'lucide-react';
import { useStockAdjustments } from '@/hooks/useInventory';
import { AdjustmentApproveModal } from './AdjustmentApproveModal';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/formatting';

const REASON_LABELS: Record<string, string> = {
  INITIAL_COUNT: 'Initial Count',
  CYCLE_COUNT: 'Cycle Count',
  DAMAGED: 'Damaged',
  EXPIRED: 'Expired',
  FOUND: 'Found',
  LOST: 'Lost',
  DATA_CORRECTION: 'Data Correction',
  OTHER: 'Other',
};

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4 px-4 py-3">
          <div className="h-5 bg-slate-200 rounded w-28 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded w-32 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded w-16 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded w-20 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded w-24 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded w-32 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded w-20 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

interface PendingAdjustmentsTableProps {
  canApprove: boolean;
}

export function PendingAdjustmentsTable({ canApprove }: PendingAdjustmentsTableProps) {
  const [selectedAdjustmentId, setSelectedAdjustmentId] = useState<string | null>(null);

  const { data, isLoading, error } = useStockAdjustments({
    status: 'PENDING',
    pageSize: 50,
  });

  const adjustments = data?.adjustments ?? [];

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
        Failed to load pending adjustments: {error.message}
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Adjustment #
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Location
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Items
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Reason
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Created By
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7}>
                    <TableSkeleton />
                  </td>
                </tr>
              ) : adjustments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <ClipboardCheck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-lg font-medium text-slate-900 mb-1">No pending adjustments</p>
                    <p className="text-sm text-slate-500">All adjustments have been processed</p>
                  </td>
                </tr>
              ) : (
                adjustments.map((adj) => (
                  <tr key={adj.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-mono text-slate-900">
                      {adj.adjustmentNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDate(adj.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                          adj.location === 'JHB'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        )}
                      >
                        {adj.location}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {adj.lines.length} {adj.lines.length === 1 ? 'item' : 'items'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {REASON_LABELS[adj.reason] || adj.reason}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {adj.createdBy}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedAdjustmentId(adj.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval Modal */}
      {selectedAdjustmentId && (
        <AdjustmentApproveModal
          adjustmentId={selectedAdjustmentId}
          canApprove={canApprove}
          onClose={() => setSelectedAdjustmentId(null)}
        />
      )}
    </>
  );
}
