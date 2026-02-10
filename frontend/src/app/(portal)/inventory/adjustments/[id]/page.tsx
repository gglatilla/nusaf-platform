'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  useStockAdjustment,
  useApproveStockAdjustment,
  useRejectStockAdjustment,
} from '@/hooks/useInventory';
import {
  ArrowLeft,
  Check,
  XCircle,
  AlertCircle,
  Clock,
  CheckCircle2,
  Ban,
} from 'lucide-react';
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

export default function StockAdjustmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user, isLoading: authLoading } = useAuthStore();

  const { data: adjustment, isLoading, error } = useStockAdjustment(id);
  const approveMutation = useApproveStockAdjustment();
  const rejectMutation = useRejectStockAdjustment();

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user && user.role === 'CUSTOMER') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="p-4 sm:p-6 xl:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-64" />
          <div className="h-96 bg-slate-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (user?.role === 'CUSTOMER') return null;

  const canApprove =
    (user.role === 'ADMIN' || user.role === 'MANAGER') &&
    adjustment?.status === 'PENDING';

  const isProcessing = approveMutation.isPending || rejectMutation.isPending;

  const handleApprove = async () => {
    if (!window.confirm('Approve this stock adjustment? This will update stock levels immediately and cannot be undone.')) return;
    try {
      setActionError(null);
      await approveMutation.mutateAsync(id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to approve adjustment');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setActionError('Please provide a reason for rejection');
      return;
    }
    try {
      setActionError(null);
      await rejectMutation.mutateAsync({ id, reason: rejectReason });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to reject adjustment');
    }
  };

  // Compute total net change
  const totalChange = adjustment?.lines.reduce((sum, line) => sum + line.difference, 0) ?? 0;

  return (
    <>
      <PageHeader
        title={adjustment?.adjustmentNumber ?? 'Adjustment Detail'}
        description="View adjustment details and line items"
      />
      <div className="p-4 sm:p-6 xl:p-8">
        {/* Back link */}
        <Link
          href="/inventory/adjustments"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Adjustments
        </Link>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm mb-6">
            Failed to load adjustment: {error.message}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-slate-200 rounded-lg" />
            <div className="h-64 bg-slate-200 rounded-lg" />
          </div>
        )}

        {adjustment && (
          <div className="space-y-6">
            {/* Status banner */}
            {adjustment.status === 'APPROVED' && (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">Approved</p>
                  <p className="text-xs text-green-700">
                    {adjustment.approvedBy && `by ${adjustment.approvedBy}`}
                    {adjustment.approvedAt && ` on ${formatDate(adjustment.approvedAt)}`}
                  </p>
                </div>
              </div>
            )}
            {adjustment.status === 'REJECTED' && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                <Ban className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Rejected</p>
                  <p className="text-xs text-red-700">
                    {adjustment.rejectedBy && `by ${adjustment.rejectedBy}`}
                    {adjustment.rejectedAt && ` on ${formatDate(adjustment.rejectedAt)}`}
                  </p>
                  {adjustment.rejectionReason && (
                    <p className="text-sm text-red-700 mt-1">
                      Reason: {adjustment.rejectionReason}
                    </p>
                  )}
                </div>
              </div>
            )}
            {adjustment.status === 'PENDING' && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Pending Approval</p>
                  <p className="text-xs text-amber-700">
                    This adjustment is waiting for review
                  </p>
                </div>
              </div>
            )}

            {/* Info grid */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
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
                  <p className="mt-1 text-sm text-slate-900">{formatDate(adjustment.createdAt)}</p>
                  <p className="text-xs text-slate-500">{adjustment.createdBy}</p>
                </div>
              </div>
              {adjustment.notes && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1">Notes</p>
                  <p className="text-sm text-slate-700">{adjustment.notes}</p>
                </div>
              )}
            </div>

            {/* Line items */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900">
                  Line Items ({adjustment.lines.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Current Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Adjusted Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Change
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {adjustment.lines.map((line) => (
                      <tr key={line.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {line.lineNumber}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/inventory/items/${line.productSku}`}
                            className="text-sm font-mono text-primary-600 hover:text-primary-700"
                          >
                            {line.productSku}
                          </Link>
                          <p className="text-xs text-slate-500 truncate max-w-[250px]">
                            {line.productDescription}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-mono text-slate-600">
                          {line.currentQuantity}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-mono text-slate-900 font-semibold">
                          {line.adjustedQuantity}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-mono font-semibold">
                          <span
                            className={cn(
                              line.difference > 0
                                ? 'text-green-600'
                                : line.difference < 0
                                  ? 'text-red-600'
                                  : 'text-slate-500'
                            )}
                          >
                            {line.difference > 0 ? '+' : ''}
                            {line.difference}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 max-w-[200px] truncate">
                          {line.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                        Net Change
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-mono font-bold">
                        <span
                          className={cn(
                            totalChange > 0
                              ? 'text-green-600'
                              : totalChange < 0
                                ? 'text-red-600'
                                : 'text-slate-500'
                          )}
                        >
                          {totalChange > 0 ? '+' : ''}
                          {totalChange}
                        </span>
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Action error */}
            {actionError && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {actionError}
              </div>
            )}

            {/* Reject form */}
            {showRejectForm && canApprove && (
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

            {/* Action buttons */}
            {canApprove && (
              <div className="flex items-center justify-end gap-3">
                {showRejectForm ? (
                  <>
                    <button
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectReason('');
                        setActionError(null);
                      }}
                      disabled={isProcessing}
                      className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 disabled:opacity-50"
                    >
                      Cancel
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
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
