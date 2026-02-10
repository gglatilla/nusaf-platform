'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  useCycleCount,
  useSubmitCycleCountLines,
  useCompleteCycleCount,
  useReconcileCycleCount,
  useReconcileAndApplyCycleCount,
  useCancelCycleCount,
} from '@/hooks/useInventory';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ClipboardCheck,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  OPEN: { label: 'Open', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  COMPLETED: { label: 'Completed', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  RECONCILED: { label: 'Reconciled', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
};

const WAREHOUSE_NAMES: Record<string, string> = { JHB: 'Johannesburg', CT: 'Cape Town' };

export default function CycleCountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const sessionId = params.id as string;

  const { data: session, isLoading, error: fetchError } = useCycleCount(sessionId);

  const submitMutation = useSubmitCycleCountLines();
  const completeMutation = useCompleteCycleCount();
  const reconcileMutation = useReconcileCycleCount();
  const reconcileAndApplyMutation = useReconcileAndApplyCycleCount();
  const cancelMutation = useCancelCycleCount();

  // Local state for counting
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [lineNotes, setLineNotes] = useState<Record<string, string>>({});
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showReconcileConfirm, setShowReconcileConfirm] = useState(false);
  const [showReconcileAndApplyConfirm, setShowReconcileAndApplyConfirm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isCountingMode = session?.status === 'OPEN' || session?.status === 'IN_PROGRESS';
  const isCompletedMode = session?.status === 'COMPLETED';
  const isReconciledMode = session?.status === 'RECONCILED';
  const isCancelledMode = session?.status === 'CANCELLED';
  const canReconcile = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  // Count progress
  const countedCount = useMemo(() => {
    if (!session) return 0;
    return session.lines.filter((l) => {
      if (l.countedQuantity !== null) return true;
      // Also consider locally-filled counts
      const localVal = counts[l.id];
      return localVal !== undefined && localVal !== '';
    }).length;
  }, [session, counts]);

  const totalLines = session?.lineCount ?? 0;

  // Check if all lines have counts (either server-side or locally)
  const allLinesCounted = useMemo(() => {
    if (!session) return false;
    return session.lines.every((l) => {
      if (l.countedQuantity !== null) return true;
      const localVal = counts[l.id];
      return localVal !== undefined && localVal !== '';
    });
  }, [session, counts]);

  // Variance summary for COMPLETED/RECONCILED modes
  const varianceSummary = useMemo(() => {
    if (!session) return { withVariance: 0, surplus: 0, shortage: 0, netVariance: 0 };
    let withVariance = 0;
    let surplus = 0;
    let shortage = 0;
    let netVariance = 0;

    for (const line of session.lines) {
      if (line.variance !== null && line.variance !== 0) {
        withVariance++;
        if (line.variance > 0) surplus += line.variance;
        else shortage += Math.abs(line.variance);
        netVariance += line.variance;
      }
    }
    return { withVariance, surplus, shortage, netVariance };
  }, [session]);

  // Lines that have local changes (new or updated counts)
  const dirtyLines = useMemo(() => {
    if (!session) return [];
    return session.lines.filter((l) => {
      const localVal = counts[l.id];
      if (localVal === undefined || localVal === '') return false;
      const parsed = parseInt(localVal, 10);
      if (isNaN(parsed) || parsed < 0) return false;
      // Changed if previously uncounted, or if different from server value
      return l.countedQuantity === null || parsed !== l.countedQuantity;
    });
  }, [session, counts]);

  const handleSaveProgress = async () => {
    if (dirtyLines.length === 0) return;
    setActionError(null);

    try {
      await submitMutation.mutateAsync({
        sessionId,
        data: {
          lines: dirtyLines.map((l) => ({
            lineId: l.id,
            countedQuantity: parseInt(counts[l.id], 10),
            notes: lineNotes[l.id]?.trim() || undefined,
          })),
        },
      });
      // Clear local state for saved lines
      setCounts({});
      setLineNotes({});
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to save counts');
    }
  };

  const handleComplete = async () => {
    setActionError(null);
    // Save any unsaved counts first
    if (dirtyLines.length > 0) {
      try {
        await submitMutation.mutateAsync({
          sessionId,
          data: {
            lines: dirtyLines.map((l) => ({
              lineId: l.id,
              countedQuantity: parseInt(counts[l.id], 10),
              notes: lineNotes[l.id]?.trim() || undefined,
            })),
          },
        });
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Failed to save counts');
        return;
      }
    }

    try {
      await completeMutation.mutateAsync(sessionId);
      setCounts({});
      setLineNotes({});
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to complete count');
    }
  };

  const handleReconcile = async () => {
    setActionError(null);
    setShowReconcileConfirm(false);
    try {
      const result = await reconcileMutation.mutateAsync(sessionId);
      if (result?.adjustmentId) {
        // Stay on this page to see the reconciled state
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to reconcile');
    }
  };

  const handleReconcileAndApply = async () => {
    setActionError(null);
    setShowReconcileAndApplyConfirm(false);
    try {
      const result = await reconcileAndApplyMutation.mutateAsync(sessionId);
      if (result?.adjustmentId && !result.applied) {
        setActionError(result.message || 'Reconciled but auto-approval failed. Adjustment requires manual approval.');
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to reconcile and apply');
    }
  };

  const handleCancel = async () => {
    setActionError(null);
    setShowCancelConfirm(false);
    try {
      await cancelMutation.mutateAsync(sessionId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to cancel session');
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 xl:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="h-64 bg-slate-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (fetchError || !session) {
    return (
      <div className="p-4 sm:p-6 xl:p-8">
        <Link
          href="/inventory/cycle-counts"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cycle Counts
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">
            {fetchError instanceof Error ? fetchError.message : 'Cycle count session not found'}
          </p>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[session.status];

  return (
    <>
      <PageHeader
        title={`Cycle Count ${session.sessionNumber}`}
        description={isCountingMode ? 'Enter counted quantities for each product' : 'Cycle count session details'}
      />
      <div className="p-4 sm:p-6 xl:p-8 max-w-6xl">
        <Link
          href="/inventory/cycle-counts"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cycle Counts
        </Link>

        {/* Status banner */}
        <div className={cn('border rounded-lg p-4 mb-6', statusConfig.bg)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {session.status === 'RECONCILED' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              {session.status === 'CANCELLED' && <XCircle className="h-5 w-5 text-red-600" />}
              {isCountingMode && <ClipboardCheck className="h-5 w-5 text-amber-600" />}
              {isCompletedMode && <ArrowUpDown className="h-5 w-5 text-purple-600" />}
              <span className={cn('font-semibold', statusConfig.color)}>
                {statusConfig.label}
              </span>
            </div>
            {session.completedAt && (
              <span className="text-sm text-slate-600">
                Completed {new Date(session.completedAt).toLocaleDateString()}
              </span>
            )}
            {session.cancelledAt && (
              <span className="text-sm text-slate-600">
                Cancelled {new Date(session.cancelledAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Session info grid */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Session #</p>
              <p className="text-sm font-mono font-semibold text-slate-900">{session.sessionNumber}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Warehouse</p>
              <p className="text-sm font-semibold text-slate-900">
                {WAREHOUSE_NAMES[session.location] || session.location}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Created</p>
              <p className="text-sm text-slate-900">
                {new Date(session.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Products</p>
              <p className="text-sm text-slate-900">{session.lineCount} items</p>
            </div>
          </div>
          {session.notes && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-xs font-medium text-slate-500 uppercase mb-1">Notes</p>
              <p className="text-sm text-slate-700">{session.notes}</p>
            </div>
          )}
        </div>

        {/* Progress bar (counting mode) */}
        {isCountingMode && (
          <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-700">Counting Progress</p>
              <p className="text-sm font-mono text-slate-600">
                {countedCount} / {totalLines} counted
              </p>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all',
                  countedCount === totalLines ? 'bg-green-500' : 'bg-primary-500'
                )}
                style={{ width: `${totalLines > 0 ? (countedCount / totalLines) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Variance summary cards (COMPLETED/RECONCILED modes) */}
        {(isCompletedMode || isReconciledMode) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase">Lines with Variance</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{varianceSummary.withVariance}</p>
              <p className="text-xs text-slate-500">of {totalLines} total</p>
            </div>
            <div className="bg-white border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                <p className="text-xs font-medium text-green-600 uppercase">Surplus</p>
              </div>
              <p className="text-2xl font-bold text-green-700 mt-1">+{varianceSummary.surplus}</p>
            </div>
            <div className="bg-white border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-1">
                <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                <p className="text-xs font-medium text-red-600 uppercase">Shortage</p>
              </div>
              <p className="text-2xl font-bold text-red-700 mt-1">-{varianceSummary.shortage}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase">Net Variance</p>
              <p className={cn(
                'text-2xl font-bold mt-1',
                varianceSummary.netVariance > 0 ? 'text-green-700' :
                varianceSummary.netVariance < 0 ? 'text-red-700' : 'text-slate-700'
              )}>
                {varianceSummary.netVariance > 0 ? '+' : ''}{varianceSummary.netVariance}
              </p>
            </div>
          </div>
        )}

        {/* Reconciled: link to adjustment */}
        {isReconciledMode && session.adjustmentId && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <FileText className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Stock Adjustment Created
              </p>
              <p className="text-sm text-green-700">
                Adjustment{' '}
                <Link
                  href={`/inventory/adjustments/${session.adjustmentId}`}
                  className="font-mono font-semibold underline hover:text-green-900"
                >
                  {session.adjustmentNumber}
                </Link>
                {' '}has been created and requires approval before stock levels are updated.
              </p>
            </div>
          </div>
        )}

        {isReconciledMode && !session.adjustmentId && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700">
              All counts matched system quantities. No stock adjustment was necessary.
            </p>
          </div>
        )}

        {/* Lines table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-10">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Description
                  </th>
                  {/* System Qty - hidden during blind counting */}
                  {!isCountingMode && (
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-28">
                      System Qty
                    </th>
                  )}
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-28">
                    {isCountingMode ? 'Counted Qty' : 'Counted'}
                  </th>
                  {/* Variance - only after completion */}
                  {!isCountingMode && (
                    <>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-24">
                        Variance
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-20">
                        Var %
                      </th>
                    </>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-40">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {session.lines.map((line, idx) => {
                  const localCount = counts[line.id];
                  const displayCount = localCount !== undefined ? localCount : (line.countedQuantity?.toString() ?? '');
                  const isCounted = line.countedQuantity !== null || (localCount !== undefined && localCount !== '');

                  const variance = line.variance;
                  const variancePct = line.systemQuantity > 0 && variance !== null
                    ? ((variance / line.systemQuantity) * 100).toFixed(1)
                    : variance !== null && variance !== 0 ? '---' : '0.0';

                  return (
                    <tr key={line.id} className={cn('hover:bg-slate-50', isCountingMode && !isCounted && 'bg-amber-50/30')}>
                      <td className="px-4 py-3 text-sm text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/inventory/items/${line.productSku}`}
                          className="text-sm font-mono text-primary-600 hover:text-primary-800 hover:underline"
                        >
                          {line.productSku}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 truncate max-w-[250px]">
                        {line.productDescription}
                      </td>
                      {/* System Qty - hidden during counting */}
                      {!isCountingMode && (
                        <td className="px-4 py-3 text-sm font-mono text-right text-slate-900">
                          {line.systemQuantity}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        {isCountingMode ? (
                          <input
                            type="number"
                            min="0"
                            value={displayCount}
                            onChange={(e) =>
                              setCounts((prev) => ({ ...prev, [line.id]: e.target.value }))
                            }
                            placeholder={line.countedQuantity !== null ? line.countedQuantity.toString() : '—'}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm text-right font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        ) : (
                          <p className="text-sm font-mono text-right text-slate-900">
                            {line.countedQuantity ?? '—'}
                          </p>
                        )}
                      </td>
                      {/* Variance columns */}
                      {!isCountingMode && (
                        <>
                          <td className="px-4 py-3 text-right">
                            {variance !== null ? (
                              <span className={cn(
                                'text-sm font-mono font-semibold inline-flex items-center gap-0.5',
                                variance > 0 ? 'text-green-700' :
                                variance < 0 ? 'text-red-700' : 'text-slate-500'
                              )}>
                                {variance > 0 && <TrendingUp className="h-3.5 w-3.5" />}
                                {variance < 0 && <TrendingDown className="h-3.5 w-3.5" />}
                                {variance === 0 && <Minus className="h-3.5 w-3.5" />}
                                {variance > 0 ? '+' : ''}{variance}
                              </span>
                            ) : (
                              <span className="text-sm text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-mono text-slate-600">
                            {variance !== null ? `${variancePct}%` : '—'}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3">
                        {isCountingMode ? (
                          <input
                            type="text"
                            value={lineNotes[line.id] ?? line.notes ?? ''}
                            onChange={(e) =>
                              setLineNotes((prev) => ({ ...prev, [line.id]: e.target.value }))
                            }
                            placeholder="Notes..."
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        ) : (
                          <p className="text-xs text-slate-500 truncate">{line.notes || '—'}</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Error */}
        {actionError && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-lg mb-6">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {actionError}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: cancel */}
          {(isCountingMode || isCompletedMode) && (
            <div>
              {showCancelConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Cancel this session?</span>
                  <button
                    onClick={handleCancel}
                    disabled={cancelMutation.isPending}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
                  >
                    {cancelMutation.isPending ? 'Cancelling...' : 'Yes, Cancel'}
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                >
                  Cancel Session
                </button>
              )}
            </div>
          )}

          {/* Spacer for cancelled/reconciled */}
          {(isCancelledMode || isReconciledMode) && <div />}

          {/* Right: primary actions */}
          <div className="flex items-center gap-3">
            {isCountingMode && (
              <>
                <button
                  onClick={handleSaveProgress}
                  disabled={dirtyLines.length === 0 || submitMutation.isPending}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
                    'text-slate-700 border border-slate-300 hover:bg-slate-50',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  <Save className="h-4 w-4" />
                  {submitMutation.isPending ? 'Saving...' : `Save Progress${dirtyLines.length > 0 ? ` (${dirtyLines.length})` : ''}`}
                </button>
                <button
                  onClick={handleComplete}
                  disabled={!allLinesCounted || completeMutation.isPending || submitMutation.isPending}
                  className={cn(
                    'inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white rounded-md transition-colors',
                    'bg-primary-600 hover:bg-primary-700',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {completeMutation.isPending ? 'Completing...' : 'Complete Count'}
                </button>
              </>
            )}

            {isCompletedMode && canReconcile && (
              <>
                {showReconcileConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">
                      {varianceSummary.withVariance > 0
                        ? `Create adjustment for ${varianceSummary.withVariance} line(s) with variance?`
                        : 'Close session (no variances found)?'}
                    </span>
                    <button
                      onClick={handleReconcile}
                      disabled={reconcileMutation.isPending}
                      className="px-4 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50"
                    >
                      {reconcileMutation.isPending ? 'Reconciling...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setShowReconcileConfirm(false)}
                      className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900"
                    >
                      Back
                    </button>
                  </div>
                ) : showReconcileAndApplyConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">
                      {varianceSummary.withVariance > 0
                        ? `Reconcile and immediately apply stock changes for ${varianceSummary.withVariance} line(s)?`
                        : 'Close session (no variances found)?'}
                    </span>
                    <button
                      onClick={handleReconcileAndApply}
                      disabled={reconcileAndApplyMutation.isPending}
                      className="px-4 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"
                    >
                      {reconcileAndApplyMutation.isPending ? 'Applying...' : 'Confirm & Apply'}
                    </button>
                    <button
                      onClick={() => setShowReconcileAndApplyConfirm(false)}
                      className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900"
                    >
                      Back
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowReconcileConfirm(true)}
                      className={cn(
                        'inline-flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-md transition-colors',
                        'text-slate-700 border border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <ArrowUpDown className="h-4 w-4" />
                      Reconcile
                    </button>
                    <button
                      onClick={() => setShowReconcileAndApplyConfirm(true)}
                      className={cn(
                        'inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-md transition-colors',
                        'bg-green-600 hover:bg-green-700'
                      )}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Reconcile &amp; Apply
                    </button>
                  </div>
                )}
              </>
            )}

            {isCompletedMode && !canReconcile && (
              <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg">
                A Manager or Admin must reconcile this count.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
