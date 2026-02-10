'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import {
  ArrowLeft,
  Building,
  Calendar,
  Check,
  Download,
  FileText,
  Mail,
  MapPin,
  Package,
  Send,
  ShoppingCart,
  ThumbsDown,
  ThumbsUp,
  X,
} from 'lucide-react';
import {
  usePurchaseOrder,
  usePurchaseOrderGrvs,
  usePurchaseOrderReceivingSummary,
  useSubmitPurchaseOrder,
  useApprovePurchaseOrder,
  useRejectPurchaseOrder,
  useSendPurchaseOrder,
  useAcknowledgePurchaseOrder,
  useCancelPurchaseOrder,
  useDownloadPurchaseOrderPdf,
} from '@/hooks/usePurchaseOrders';
import { POStatusBadge } from '@/components/purchase-orders/POStatusBadge';
import { POLineTable } from '@/components/purchase-orders/POLineTable';
import {
  POPipelineSteps,
  POReceivingProgress,
  GoodsReceiptsSection,
  PONotesSection,
} from '@/components/purchase-orders/po-detail';
import { ReceiveGoodsModal } from '@/components/goods-receipts/ReceiveGoodsModal';
import { ApiError } from '@/lib/api';
import type { SupplierCurrency } from '@/lib/api';

function formatDate(dateString: string | null): string {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
}

function formatCurrency(amount: number, currency: SupplierCurrency = 'EUR'): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

function getLocationLabel(location: string): string {
  return location === 'JHB' ? 'Johannesburg' : 'Cape Town';
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-6 w-6 bg-slate-200 rounded" />
        <div className="h-8 bg-slate-200 rounded w-48" />
      </div>
      <div className="h-16 bg-slate-200 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="h-48 bg-slate-200 rounded-lg" />
          <div className="h-32 bg-slate-200 rounded-lg" />
        </div>
        <div className="h-64 bg-slate-200 rounded-lg" />
      </div>
    </div>
  );
}

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const poId = params.id as string;

  const { data: po, isLoading, error, refetch } = usePurchaseOrder(poId);
  const { data: grvs } = usePurchaseOrderGrvs(poId);
  const { data: receivingSummary } = usePurchaseOrderReceivingSummary(poId);

  const submit = useSubmitPurchaseOrder();
  const approve = useApprovePurchaseOrder();
  const reject = useRejectPurchaseOrder();
  const send = useSendPurchaseOrder();
  const acknowledge = useAcknowledgePurchaseOrder();
  const cancel = useCancelPurchaseOrder();
  const downloadPdf = useDownloadPurchaseOrderPdf();

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendEmail, setSendEmail] = useState('');
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !po) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-red-600 mb-4">Purchase Order not found</p>
        <Link href="/purchase-orders" className="text-primary-600 hover:text-primary-700">
          Back to Purchase Orders
        </Link>
      </div>
    );
  }

  // Role-based visibility
  const { user } = useAuthStore();
  const userRole = user?.role;
  const isAdmin = userRole === 'ADMIN';
  const isManager = userRole === 'MANAGER';
  const isPurchaser = userRole === 'PURCHASER';
  const isWarehouse = userRole === 'WAREHOUSE';
  const isAdminOrManager = isAdmin || isManager;

  // Role groups
  const canSeePurchasingActions = isAdminOrManager || isPurchaser;  // submit, send, acknowledge, cancel
  const canSeeApprovalActions = isAdminOrManager;                    // approve, reject (not purchaser)
  const canSeeReceiveAction = isAdminOrManager || isWarehouse || isPurchaser; // receive goods

  // Permission logic (status + role)
  const isDraft = po.status === 'DRAFT';
  const isPendingApproval = po.status === 'PENDING_APPROVAL';
  const isSent = po.status === 'SENT';
  const canReceive = canSeeReceiveAction && ['SENT', 'ACKNOWLEDGED', 'PARTIALLY_RECEIVED'].includes(po.status);
  const canSubmit = canSeePurchasingActions && isDraft;
  const canApprove = canSeeApprovalActions && isPendingApproval;
  const canReject = canSeeApprovalActions && isPendingApproval;
  const canSend = canSeePurchasingActions && (isDraft || isPendingApproval);
  const canAcknowledge = canSeePurchasingActions && isSent;
  const canCancel = canSeePurchasingActions && ['DRAFT', 'PENDING_APPROVAL'].includes(po.status);

  // Show receiving progress for POs that have been sent or beyond
  const showReceivingProgress = ['SENT', 'ACKNOWLEDGED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED'].includes(po.status);

  const handleVersionConflict = (err: unknown) => {
    if (err instanceof ApiError && err.statusCode === 409) {
      window.alert('This purchase order was modified by another user. The page will now refresh.');
      refetch();
      return true;
    }
    return false;
  };

  const handleSubmit = async () => {
    if (window.confirm('Submit this purchase order for approval?')) {
      try {
        await submit.mutateAsync(poId);
      } catch (err) {
        if (!handleVersionConflict(err)) throw err;
      }
    }
  };

  const handleApprove = async () => {
    if (window.confirm('Approve this purchase order?')) {
      try {
        await approve.mutateAsync(poId);
      } catch (err) {
        if (!handleVersionConflict(err)) throw err;
      }
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    try {
      await reject.mutateAsync({ id: poId, data: { reason: rejectReason } });
      setShowRejectModal(false);
      setRejectReason('');
    } catch (err) {
      if (!handleVersionConflict(err)) throw err;
    }
  };

  const handleSend = async () => {
    const emailTo = sendEmail.trim() || po.supplier.email || undefined;
    try {
      await send.mutateAsync({ id: poId, data: { emailTo } });
      setShowSendModal(false);
      setSendEmail('');
    } catch (err) {
      if (!handleVersionConflict(err)) throw err;
    }
  };

  const handleAcknowledge = async () => {
    if (window.confirm('Mark this order as acknowledged by the supplier?')) {
      try {
        await acknowledge.mutateAsync(poId);
      } catch (err) {
        if (!handleVersionConflict(err)) throw err;
      }
    }
  };

  const handleCancel = async () => {
    if (window.confirm('Cancel this purchase order? This cannot be undone.')) {
      try {
        await cancel.mutateAsync(poId);
      } catch (err) {
        if (!handleVersionConflict(err)) throw err;
      }
    }
  };

  const handleDownloadPdf = async () => {
    await downloadPdf.mutateAsync({ id: poId, poNumber: po.poNumber });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/purchase-orders" className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">{po.poNumber}</h1>
              <POStatusBadge status={po.status} />
            </div>
            <p className="text-sm text-slate-600">
              Created on {formatDate(po.createdAt)}
              {po.supplier && (
                <span className="ml-2">
                  · Supplier: <span className="font-medium">{po.supplier.name}</span>
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPdf}
            disabled={downloadPdf.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {downloadPdf.isPending ? 'Downloading...' : 'PDF'}
          </button>

          {canReceive && (
            <button
              onClick={() => setShowReceiveModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
            >
              <Package className="h-4 w-4" />
              Receive Goods
            </button>
          )}

          {canSubmit && (
            <button
              onClick={handleSubmit}
              disabled={submit.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {submit.isPending ? 'Submitting...' : 'Submit for Approval'}
            </button>
          )}

          {canApprove && (
            <button
              onClick={handleApprove}
              disabled={approve.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <ThumbsUp className="h-4 w-4" />
              {approve.isPending ? 'Approving...' : 'Approve'}
            </button>
          )}

          {canReject && (
            <button
              onClick={() => setShowRejectModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-md hover:bg-red-50"
            >
              <ThumbsDown className="h-4 w-4" />
              Reject
            </button>
          )}

          {canSend && (
            <button
              onClick={() => setShowSendModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
            >
              <Mail className="h-4 w-4" />
              Send to Supplier
            </button>
          )}

          {canAcknowledge && (
            <button
              onClick={handleAcknowledge}
              disabled={acknowledge.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-md hover:bg-cyan-700 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {acknowledge.isPending ? 'Acknowledging...' : 'Acknowledged'}
            </button>
          )}

          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancel.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-md hover:bg-red-50 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              {cancel.isPending ? 'Cancelling...' : 'Cancel PO'}
            </button>
          )}
        </div>
      </div>

      {/* Rejection Reason Banner */}
      {po.status === 'DRAFT' && po.rejectionReason && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-red-50 border-red-200 text-red-700">
          <ThumbsDown className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">Previously Rejected</p>
            <p className="text-xs">{po.rejectionReason}</p>
          </div>
        </div>
      )}

      {/* Cancelled Banner */}
      {po.status === 'CANCELLED' && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-red-50 border-red-200 text-red-700">
          <X className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">This purchase order has been cancelled</p>
        </div>
      )}

      {/* Status Pipeline */}
      <POPipelineSteps status={po.status} />

      {/* Receiving Progress */}
      {showReceivingProgress && receivingSummary && (
        <POReceivingProgress summary={receivingSummary} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Order Lines
              <span className="text-sm font-normal text-slate-500 ml-2">
                {po.lines.length} item{po.lines.length !== 1 ? 's' : ''}
              </span>
            </h2>
            <POLineTable lines={po.lines} currency={po.currency} />
          </div>

          {/* Goods Receipts */}
          <GoodsReceiptsSection grvs={grvs || []} />

          {/* Notes */}
          <PONotesSection
            supplierNotes={po.supplierNotes}
            internalNotes={po.internalNotes}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Totals */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Summary</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-slate-600">Lines</dt>
                <dd className="text-sm font-medium text-slate-900">{po.lines.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-slate-600">Subtotal</dt>
                <dd className="text-sm font-medium text-slate-900">
                  {formatCurrency(po.subtotal, po.currency)}
                </dd>
              </div>
              <div className="flex justify-between border-t pt-3">
                <dt className="text-sm font-medium text-slate-900">Total</dt>
                <dd className="text-lg font-bold text-slate-900">
                  {formatCurrency(po.total, po.currency)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Details */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Details</h2>
            <dl className="space-y-3">
              <div className="flex items-start gap-3">
                <Building className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Supplier</dt>
                  <dd className="text-sm text-slate-900">{po.supplier.name}</dd>
                  <dd className="text-xs text-slate-500">{po.supplier.code}</dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Delivery Location</dt>
                  <dd className="text-sm text-slate-900">{getLocationLabel(po.deliveryLocation)}</dd>
                </div>
              </div>

              {po.expectedDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Expected Date</dt>
                    <dd className="text-sm text-slate-900">{formatDate(po.expectedDate)}</dd>
                  </div>
                </div>
              )}

              {po.sentAt && (
                <div className="flex items-start gap-3">
                  <Send className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Sent to Supplier</dt>
                    <dd className="text-sm text-slate-900">{formatDate(po.sentAt)}</dd>
                  </div>
                </div>
              )}

              {po.approvedAt && (
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Approved</dt>
                    <dd className="text-sm text-slate-900">{formatDate(po.approvedAt)}</dd>
                  </div>
                </div>
              )}

              {po.sourceOrderId && (
                <div className="flex items-start gap-3">
                  <ShoppingCart className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Source Order</dt>
                    <dd>
                      <Link
                        href={`/orders/${po.sourceOrderId}`}
                        className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
                      >
                        View Sales Order
                      </Link>
                    </dd>
                  </div>
                </div>
              )}
            </dl>
          </div>

          {/* Audit Trail */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Timeline</h2>
            <div className="space-y-3">
              <TimelineEntry
                label="Created"
                date={po.createdAt}
              />
              {po.approvedAt && (
                <TimelineEntry
                  label="Approved"
                  date={po.approvedAt}
                />
              )}
              {po.rejectedAt && (
                <TimelineEntry
                  label="Rejected"
                  date={po.rejectedAt}
                  detail={po.rejectionReason || undefined}
                  variant="red"
                />
              )}
              {po.sentAt && (
                <TimelineEntry
                  label="Sent to Supplier"
                  date={po.sentAt}
                />
              )}
              {grvs && grvs.length > 0 && grvs.map((grv) => (
                <TimelineEntry
                  key={grv.id}
                  label={`Received: ${grv.grvNumber}`}
                  date={grv.receivedAt}
                  detail={`${grv.lines.reduce((s, l) => s + l.quantityReceived, 0)} units at ${getLocationLabel(grv.location)}`}
                  variant="green"
                />
              ))}
              {po.status === 'RECEIVED' && (
                <TimelineEntry
                  label="Fully Received"
                  date={po.updatedAt}
                  variant="green"
                />
              )}
              {po.status === 'CLOSED' && (
                <TimelineEntry
                  label="Closed"
                  date={po.updatedAt}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowRejectModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Reject Purchase Order</h3>
              <p className="text-sm text-slate-600 mb-4">
                Please provide a reason for rejection. The PO will return to DRAFT status for revision.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || reject.isPending}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {reject.isPending ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send to Supplier Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowSendModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Send to Supplier</h3>
              <p className="text-sm text-slate-600 mb-4">
                This will generate a PDF and send it to the supplier via email.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={sendEmail || po.supplier.email || ''}
                    onChange={(e) => setSendEmail(e.target.value)}
                    placeholder={po.supplier.email || 'Enter supplier email...'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {po.supplier.email && !sendEmail && (
                    <p className="text-xs text-slate-500 mt-1">
                      Will use default supplier email: {po.supplier.email}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowSendModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={send.isPending}
                  className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {send.isPending ? 'Sending...' : 'Send PO'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receive Goods Modal */}
      <ReceiveGoodsModal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        purchaseOrderId={poId}
        poNumber={po.poNumber}
        deliveryLocation={po.deliveryLocation}
      />
    </div>
  );
}

// --- Timeline Entry sub-component ---

function TimelineEntry({
  label,
  date,
  detail,
  variant = 'default',
}: {
  label: string;
  date: string;
  detail?: string;
  variant?: 'default' | 'green' | 'red';
}) {
  const dotColor = {
    default: 'bg-slate-400',
    green: 'bg-green-500',
    red: 'bg-red-500',
  }[variant];

  return (
    <div className="flex items-start gap-3">
      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`} />
      <div className="min-w-0">
        <p className="text-sm text-slate-700">{label}</p>
        <p className="text-xs text-slate-500">{formatDate(date)}</p>
        {detail && <p className="text-xs text-slate-500 mt-0.5">{detail}</p>}
      </div>
    </div>
  );
}
