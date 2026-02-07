'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Check,
  XCircle,
  Ban,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import {
  usePurchaseRequisition,
  useApprovePurchaseRequisition,
  useRejectPurchaseRequisition,
  useCancelPurchaseRequisition,
} from '@/hooks/usePurchaseRequisitions';
import PurchaseRequisitionStatusBadge from '@/components/purchase-requisitions/PurchaseRequisitionStatusBadge';

const URGENCY_LABELS: Record<string, { label: string; className: string }> = {
  LOW: { label: 'Low', className: 'bg-slate-100 text-slate-600' },
  NORMAL: { label: 'Normal', className: 'bg-blue-100 text-blue-700' },
  HIGH: { label: 'High', className: 'bg-amber-100 text-amber-700' },
  CRITICAL: { label: 'Critical', className: 'bg-red-100 text-red-700' },
};

export default function PurchaseRequisitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const id = params.id as string;

  const { data: pr, isLoading, error } = usePurchaseRequisition(id);
  const approveMutation = useApprovePurchaseRequisition();
  const rejectMutation = useRejectPurchaseRequisition();
  const cancelMutation = useCancelPurchaseRequisition();

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [approveSuccess, setApproveSuccess] = useState<{ generatedPOIds: string[] } | null>(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading && user?.role === 'CUSTOMER') {
      router.push('/my/dashboard');
    }
  }, [user, authLoading, router]);

  const isProcessing = approveMutation.isPending || rejectMutation.isPending || cancelMutation.isPending;

  const canApprove =
    (user?.role === 'ADMIN' || user?.role === 'MANAGER') &&
    pr?.status === 'PENDING' &&
    pr?.requestedBy !== user?.id; // Self-approval prevention

  const isSelfRequest = pr?.requestedBy === user?.id;

  const canCancel = pr?.status === 'PENDING' && isSelfRequest;

  const handleApprove = async () => {
    try {
      setActionError(null);
      const result = await approveMutation.mutateAsync(id);
      setApproveSuccess({ generatedPOIds: result?.generatedPOIds || [] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to approve');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    try {
      setActionError(null);
      await rejectMutation.mutateAsync({ id, reason: rejectReason.trim() });
      setShowRejectForm(false);
      setRejectReason('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to reject');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this requisition?')) return;
    try {
      setActionError(null);
      await cancelMutation.mutateAsync(id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to cancel');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-slate-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-6 w-48 bg-slate-100 rounded animate-pulse" />
        <div className="h-32 bg-slate-100 rounded animate-pulse" />
        <div className="h-48 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  if (error || !pr) {
    return (
      <div className="p-6">
        <Link href="/purchase-requisitions" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Requisitions
        </Link>
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error instanceof Error ? error.message : 'Purchase requisition not found'}
        </div>
      </div>
    );
  }

  const urgency = URGENCY_LABELS[pr.urgency] || URGENCY_LABELS.NORMAL;
  const estimatedTotal = pr.lines.reduce(
    (sum, line) => sum + (line.estimatedLineTotal || 0),
    0
  );

  return (
    <div className="p-6 space-y-6">
      {/* Back link */}
      <Link href="/purchase-requisitions" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Back to Requisitions
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-mono">{pr.requisitionNumber}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Requested by {pr.requestedByName} on {new Date(pr.createdAt).toLocaleDateString()}
          </p>
        </div>
        <PurchaseRequisitionStatusBadge status={pr.status} />
      </div>

      {/* Status banners */}
      {pr.status === 'PENDING' && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Awaiting Approval</p>
            <p className="text-sm text-amber-700">This requisition is pending review by a manager.</p>
          </div>
        </div>
      )}

      {pr.status === 'CONVERTED_TO_PO' && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
          <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">
              Approved{pr.approvedByName ? ` by ${pr.approvedByName}` : ''}
              {pr.approvedAt ? ` on ${new Date(pr.approvedAt).toLocaleDateString()}` : ''}
            </p>
            {pr.generatedPOIds.length > 0 && (
              <p className="text-sm text-green-700">
                {pr.generatedPOIds.length} purchase order{pr.generatedPOIds.length !== 1 ? 's' : ''} generated
              </p>
            )}
          </div>
        </div>
      )}

      {pr.status === 'REJECTED' && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">
              Rejected{pr.rejectedBy ? ` on ${pr.rejectedAt ? new Date(pr.rejectedAt).toLocaleDateString() : ''}` : ''}
            </p>
            {pr.rejectionReason && (
              <p className="text-sm text-red-700">Reason: {pr.rejectionReason}</p>
            )}
          </div>
        </div>
      )}

      {pr.status === 'CANCELLED' && (
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-4">
          <Ban className="h-5 w-5 text-slate-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-slate-700">Cancelled</p>
            {pr.cancelledAt && (
              <p className="text-sm text-slate-600">
                Cancelled on {new Date(pr.cancelledAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Approval success banner */}
      {approveSuccess && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
          <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">Requisition approved successfully!</p>
            {approveSuccess.generatedPOIds.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-2">
                {approveSuccess.generatedPOIds.map((poId) => (
                  <Link
                    key={poId}
                    href={`/purchase-orders/${poId}`}
                    className="inline-flex items-center gap-1 text-sm text-green-700 hover:text-green-800 underline"
                  >
                    View Draft PO <ExternalLink className="h-3 w-3" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info grid */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Requester</p>
            <p className="mt-1 text-sm text-slate-900">{pr.requestedByName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Department</p>
            <p className="mt-1 text-sm text-slate-900">{pr.department || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Urgency</p>
            <span className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded text-xs font-medium ${urgency.className}`}>
              {urgency.label}
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Required By</p>
            <p className="mt-1 text-sm text-slate-900">
              {pr.requiredByDate ? new Date(pr.requiredByDate).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>

        {/* Reason */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-xs font-medium text-slate-500 uppercase mb-1">Reason</p>
          <p className="text-sm text-slate-900">{pr.reason}</p>
        </div>

        {/* Notes */}
        {pr.notes && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-xs font-medium text-slate-500 uppercase mb-1">Notes</p>
            <p className="text-sm text-slate-700">{pr.notes}</p>
          </div>
        )}
      </div>

      {/* Line items */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">
            Line Items ({pr.lines.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Supplier</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Qty</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Est. Unit Cost</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Est. Line Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pr.lines.map((line) => (
                <tr key={line.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-500">{line.lineNumber}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/inventory/items/${line.productSku}`}
                      className="text-sm text-primary-600 hover:text-primary-700 font-mono"
                    >
                      {line.productSku}
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5">{line.productDescription}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {line.supplierName || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900 text-right">{line.quantity}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 text-right">
                    {line.estimatedUnitCost != null
                      ? line.estimatedUnitCost.toLocaleString('en-ZA', { minimumFractionDigits: 2 })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900 text-right font-medium">
                    {line.estimatedLineTotal != null
                      ? `R ${line.estimatedLineTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{line.deliveryLocation}</td>
                </tr>
              ))}
              {/* Total row */}
              <tr className="bg-slate-50 font-medium">
                <td colSpan={5} className="px-4 py-3 text-sm text-slate-700 text-right">
                  Estimated Total
                </td>
                <td className="px-4 py-3 text-sm text-slate-900 text-right">
                  {estimatedTotal > 0
                    ? `R ${estimatedTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
                    : '—'}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Generated POs section */}
      {pr.generatedPOIds.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Generated Purchase Orders</h3>
          <div className="flex flex-wrap gap-2">
            {pr.generatedPOIds.map((poId) => (
              <Link
                key={poId}
                href={`/purchase-orders/${poId}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-md transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View PO
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Action error */}
      {actionError && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {actionError}
        </div>
      )}

      {/* Approval workflow */}
      {pr.status === 'PENDING' && (user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Approval Decision</h3>

          {/* Self-approval warning */}
          {isSelfRequest && (
            <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 border border-amber-200 px-4 py-3 rounded-lg mb-4">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              You cannot approve your own requisition. Another manager must review this.
            </div>
          )}

          {/* Reject form */}
          {showRejectForm && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <label className="block text-sm font-medium text-red-800 mb-1">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this requisition is being rejected..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            {canCancel && !showRejectForm && (
              <button
                onClick={handleCancel}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Requisition'}
              </button>
            )}

            {showRejectForm ? (
              <>
                <button
                  onClick={() => { setShowRejectForm(false); setRejectReason(''); }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Back
                </button>
                <button
                  onClick={handleReject}
                  disabled={isProcessing || !rejectReason.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
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
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isProcessing || !canApprove}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {approveMutation.isPending ? 'Approving...' : 'Approve & Create PO'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cancel button for creator (non-approver) */}
      {canCancel && user?.role !== 'ADMIN' && user?.role !== 'MANAGER' && (
        <div className="flex justify-end">
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
          >
            <Ban className="h-4 w-4" />
            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Requisition'}
          </button>
        </div>
      )}
    </div>
  );
}
