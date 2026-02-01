'use client';

import { useState } from 'react';
import { X, Check, XCircle, AlertCircle } from 'lucide-react';
import { useStockAdjustment, useApproveStockAdjustment, useRejectStockAdjustment } from '@/hooks/useInventory';
import { cn } from '@/lib/utils';

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

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

interface AdjustmentApproveModalProps {
  adjustmentId: string;
  canApprove: boolean;
  onClose: () => void;
}

export function AdjustmentApproveModal({ adjustmentId, canApprove, onClose }: AdjustmentApproveModalProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: adjustment, isLoading } = useStockAdjustment(adjustmentId);
  const approveMutation = useApproveStockAdjustment();
  const rejectMutation = useRejectStockAdjustment();

  const handleApprove = async () => {
    try {
      setError(null);
      await approveMutation.mutateAsync(adjustmentId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve adjustment');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    try {
      setError(null);
      await rejectMutation.mutateAsync({ id: adjustmentId, reason: rejectReason });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject adjustment');
    }
  };

  const isProcessing = approveMutation.isPending || rejectMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              Review Adjustment
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-48" />
                <div className="h-4 bg-slate-200 rounded w-32" />
                <div className="h-32 bg-slate-200 rounded" />
              </div>
            ) : adjustment ? (
              <div className="space-y-6">
                {/* Adjustment Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Adjustment #</p>
                    <p className="mt-1 text-sm font-mono text-slate-900">{adjustment.adjustmentNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Location</p>
                    <p className="mt-1">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                          adjustment.location === 'JHB'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        )}
                      >
                        {adjustment.location === 'JHB' ? 'Johannesburg' : 'Cape Town'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Reason</p>
                    <p className="mt-1 text-sm text-slate-900">
                      {REASON_LABELS[adjustment.reason] || adjustment.reason}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Created</p>
                    <p className="mt-1 text-sm text-slate-900">
                      {formatDate(adjustment.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">
                    Items ({adjustment.lines.length})
                  </h3>
                  <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Product</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600">Current</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600">Adjusted</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600">Change</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {adjustment.lines.map((line) => (
                          <tr key={line.id}>
                            <td className="px-4 py-2">
                              <p className="text-sm font-mono text-slate-900">{line.productSku}</p>
                              <p className="text-xs text-slate-500 truncate max-w-[200px]">{line.productDescription}</p>
                            </td>
                            <td className="px-4 py-2 text-right text-sm font-mono text-slate-600">
                              {line.currentQuantity}
                            </td>
                            <td className="px-4 py-2 text-right text-sm font-mono text-slate-900 font-semibold">
                              {line.adjustedQuantity}
                            </td>
                            <td className="px-4 py-2 text-right text-sm font-mono font-semibold">
                              <span
                                className={cn(
                                  line.difference > 0 ? 'text-green-600' : line.difference < 0 ? 'text-red-600' : 'text-slate-500'
                                )}
                              >
                                {line.difference > 0 ? '+' : ''}{line.difference}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Reject Form */}
                {showRejectForm && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-red-800 mb-2">
                      Rejection Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Explain why this adjustment is being rejected..."
                      rows={3}
                      className="w-full px-3 py-2 border border-red-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500">Adjustment not found</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 disabled:opacity-50"
            >
              Cancel
            </button>

            {canApprove && adjustment && (
              <>
                {showRejectForm ? (
                  <>
                    <button
                      onClick={() => setShowRejectForm(false)}
                      disabled={isProcessing}
                      className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={isProcessing || !rejectReason.trim()}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle className="h-4 w-4" />
                      {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setShowRejectForm(true)}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      {approveMutation.isPending ? 'Approving...' : 'Approve'}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
