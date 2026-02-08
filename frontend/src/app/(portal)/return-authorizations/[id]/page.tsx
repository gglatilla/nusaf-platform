'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Check, X, Package, Loader2, AlertCircle,
  RotateCcw, Truck, CheckCircle, Ban,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import {
  useReturnAuthorization,
  useApproveReturnAuthorization,
  useRejectReturnAuthorization,
  useReceiveReturnItems,
  useCompleteReturnAuthorization,
  useCancelReturnAuthorization,
} from '@/hooks/useReturnAuthorizations';
import ReturnAuthorizationStatusBadge from '@/components/return-authorizations/ReturnAuthorizationStatusBadge';
import { WAREHOUSE_NAMES } from '@/lib/constants/reference-routes';
import type { ReturnResolution } from '@/lib/api';

const RETURN_REASON_LABELS: Record<string, string> = {
  DEFECTIVE: 'Defective',
  DAMAGED_IN_TRANSIT: 'Damaged in Transit',
  WRONG_ITEM: 'Wrong Item',
  NOT_AS_DESCRIBED: 'Not as Described',
  NO_LONGER_NEEDED: 'No Longer Needed',
  OTHER: 'Other',
};

const RESOLUTION_LABELS: Record<string, string> = {
  RESTOCK: 'Restock',
  SCRAP: 'Scrap',
  REPLACE: 'Replace',
};

const PIPELINE_STEPS = [
  { key: 'REQUESTED', label: 'Requested', icon: RotateCcw },
  { key: 'APPROVED', label: 'Approved', icon: Check },
  { key: 'ITEMS_RECEIVED', label: 'Items Received', icon: Package },
  { key: 'COMPLETED', label: 'Completed', icon: CheckCircle },
];

function getPipelineIndex(status: string): number {
  if (status === 'REJECTED' || status === 'CANCELLED') return -1;
  return PIPELINE_STEPS.findIndex((s) => s.key === status);
}

export default function ReturnAuthorizationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { user, isLoading: authLoading } = useAuthStore();

  const { data: ra, isLoading, error } = useReturnAuthorization(id);
  const approve = useApproveReturnAuthorization();
  const reject = useRejectReturnAuthorization();
  const receiveItems = useReceiveReturnItems();
  const complete = useCompleteReturnAuthorization();
  const cancel = useCancelReturnAuthorization();

  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiveLines, setReceiveLines] = useState<Array<{ lineId: string; quantityReceived: number; max: number; sku: string }>>([]);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeLines, setCompleteLines] = useState<Array<{ lineId: string; resolution: ReturnResolution; sku: string }>>([]);

  useEffect(() => {
    if (!authLoading && user?.role === 'CUSTOMER') {
      router.push('/my/dashboard');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="p-6">
        <div className="h-8 w-48 bg-slate-100 rounded animate-pulse mb-6" />
        <div className="h-64 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !ra) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-600">Return authorization not found</p>
          <Link href="/return-authorizations" className="text-primary-600 hover:underline text-sm mt-2 inline-block">
            Back to list
          </Link>
        </div>
      </div>
    );
  }

  const pipelineIndex = getPipelineIndex(ra.status);
  const canApprove = ra.status === 'REQUESTED';
  const canReject = ra.status === 'REQUESTED';
  const canReceive = ra.status === 'APPROVED';
  const canComplete = ra.status === 'ITEMS_RECEIVED';
  const canCancel = ra.status === 'REQUESTED' || ra.status === 'APPROVED';

  const handleApprove = async () => {
    try {
      await approve.mutateAsync(ra.id);
    } catch (e) { /* handled by React Query */ }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    try {
      await reject.mutateAsync({ id: ra.id, reason: rejectReason.trim() });
      setShowRejectModal(false);
      setRejectReason('');
    } catch (e) { /* handled by React Query */ }
  };

  const openReceiveModal = () => {
    setReceiveLines(
      ra.lines.map((l) => ({
        lineId: l.id,
        quantityReceived: l.quantityReturned,
        max: l.quantityReturned,
        sku: l.productSku,
      }))
    );
    setShowReceiveModal(true);
  };

  const handleReceive = async () => {
    try {
      await receiveItems.mutateAsync({
        id: ra.id,
        data: {
          lines: receiveLines.map((l) => ({
            lineId: l.lineId,
            quantityReceived: l.quantityReceived,
          })),
        },
      });
      setShowReceiveModal(false);
    } catch (e) { /* handled by React Query */ }
  };

  const openCompleteModal = () => {
    setCompleteLines(
      ra.lines.map((l) => ({
        lineId: l.id,
        resolution: 'RESTOCK' as ReturnResolution,
        sku: l.productSku,
      }))
    );
    setShowCompleteModal(true);
  };

  const handleComplete = async () => {
    try {
      await complete.mutateAsync({
        id: ra.id,
        data: {
          lines: completeLines.map((l) => ({
            lineId: l.lineId,
            resolution: l.resolution,
          })),
        },
      });
      setShowCompleteModal(false);
    } catch (e) { /* handled by React Query */ }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this return authorization?')) return;
    try {
      await cancel.mutateAsync(ra.id);
    } catch (e) { /* handled by React Query */ }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/return-authorizations" className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{ra.raNumber}</h1>
              <ReturnAuthorizationStatusBadge status={ra.status} />
            </div>
            <p className="mt-1 text-sm text-slate-600">Return Authorization for {ra.customerName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canApprove && (
            <button
              onClick={handleApprove}
              disabled={approve.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"
            >
              {approve.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Approve
            </button>
          )}
          {canReject && (
            <button
              onClick={() => setShowRejectModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
            >
              <X className="h-4 w-4" />
              Reject
            </button>
          )}
          {canReceive && (
            <button
              onClick={openReceiveModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md"
            >
              <Package className="h-4 w-4" />
              Receive Items
            </button>
          )}
          {canComplete && (
            <button
              onClick={openCompleteModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
            >
              <CheckCircle className="h-4 w-4" />
              Complete
            </button>
          )}
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancel.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md disabled:opacity-50"
            >
              <Ban className="h-4 w-4" />
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Status banners */}
      {ra.status === 'REJECTED' && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm font-medium text-red-800">This return was rejected</p>
          {ra.rejectionReason && <p className="text-sm text-red-600 mt-1">{ra.rejectionReason}</p>}
        </div>
      )}
      {ra.status === 'CANCELLED' && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
          <p className="text-sm font-medium text-slate-600">This return was cancelled</p>
        </div>
      )}

      {/* Pipeline Steps */}
      {pipelineIndex >= 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            {PIPELINE_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isComplete = index <= pipelineIndex;
              const isCurrent = index === pipelineIndex;
              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isComplete ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400'
                    } ${isCurrent ? 'ring-2 ring-primary-200' : ''}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`text-xs mt-1 ${isComplete ? 'text-primary-600 font-medium' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < PIPELINE_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${index < pipelineIndex ? 'bg-primary-600' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Lines */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info grid */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Details</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">RA Number</dt>
                <dd className="font-mono text-slate-900">{ra.raNumber}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd><ReturnAuthorizationStatusBadge status={ra.status} /></dd>
              </div>
              {ra.orderId && (
                <div>
                  <dt className="text-slate-500">Order</dt>
                  <dd>
                    <Link href={`/orders/${ra.orderId}`} className="text-primary-600 hover:text-primary-700">
                      {ra.orderNumber}
                    </Link>
                  </dd>
                </div>
              )}
              {ra.deliveryNoteId && (
                <div>
                  <dt className="text-slate-500">Delivery Note</dt>
                  <dd>
                    <Link href={`/delivery-notes/${ra.deliveryNoteId}`} className="text-primary-600 hover:text-primary-700">
                      {ra.deliveryNoteNumber}
                    </Link>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-slate-500">Customer</dt>
                <dd className="text-slate-900">{ra.customerName}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Warehouse</dt>
                <dd className="text-slate-900">{WAREHOUSE_NAMES[ra.warehouse] || ra.warehouse}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Requested By</dt>
                <dd className="text-slate-900">
                  {ra.requestedByName}
                  <span className="text-xs text-slate-500 ml-1">({ra.requestedByRole === 'CUSTOMER' ? 'Customer' : 'Staff'})</span>
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Created</dt>
                <dd className="text-slate-900">{new Date(ra.createdAt).toLocaleString()}</dd>
              </div>
            </dl>
          </div>

          {/* Lines table */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Return Items
              <span className="text-sm font-normal text-slate-500 ml-2">{ra.lines.length} item{ra.lines.length !== 1 ? 's' : ''}</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">#</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Product</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">UoM</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Qty Returned</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Qty Received</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Reason</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Resolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {ra.lines.map((line) => (
                    <tr key={line.id}>
                      <td className="px-3 py-2 text-sm text-slate-500">{line.lineNumber}</td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/inventory/items/${line.productSku}`}
                          className="text-sm text-primary-600 hover:text-primary-700 font-mono"
                        >
                          {line.productSku}
                        </Link>
                        <p className="text-xs text-slate-500">{line.productDescription}</p>
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-600">{line.unitOfMeasure}</td>
                      <td className="px-3 py-2 text-sm text-slate-900 text-right">{line.quantityReturned}</td>
                      <td className="px-3 py-2 text-sm text-right">
                        {line.quantityReceived > 0 ? (
                          <span className="text-slate-900">{line.quantityReceived}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-sm text-slate-700">{RETURN_REASON_LABELS[line.returnReason] || line.returnReason}</span>
                        {line.reasonNotes && (
                          <p className="text-xs text-slate-500 mt-0.5">{line.reasonNotes}</p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {line.resolution ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            line.resolution === 'RESTOCK' ? 'bg-green-100 text-green-700' :
                            line.resolution === 'SCRAP' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {RESOLUTION_LABELS[line.resolution]}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Notes */}
          {ra.notes && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Notes</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{ra.notes}</p>
            </div>
          )}

          {/* Audit trail */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Timeline</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-slate-700">Requested by {ra.requestedByName}</p>
                  <p className="text-xs text-slate-500">{new Date(ra.createdAt).toLocaleString()}</p>
                </div>
              </div>
              {ra.approvedAt && (
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-700">Approved by {ra.approvedByName}</p>
                    <p className="text-xs text-slate-500">{new Date(ra.approvedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
              {ra.rejectedAt && (
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-700">Rejected</p>
                    {ra.rejectionReason && <p className="text-xs text-red-600">{ra.rejectionReason}</p>}
                    <p className="text-xs text-slate-500">{new Date(ra.rejectedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
              {ra.itemsReceivedAt && (
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-700">Items received by {ra.itemsReceivedByName}</p>
                    <p className="text-xs text-slate-500">{new Date(ra.itemsReceivedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
              {ra.completedAt && (
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-700">Completed by {ra.completedByName}</p>
                    <p className="text-xs text-slate-500">{new Date(ra.completedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
              {ra.cancelledAt && (
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-700">Cancelled</p>
                    <p className="text-xs text-slate-500">{new Date(ra.cancelledAt).toLocaleString()}</p>
                  </div>
                </div>
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
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Reject Return Authorization</h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm resize-none h-24"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || reject.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
                >
                  {reject.isPending ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receive Items Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowReceiveModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Receive Returned Items</h3>
              <p className="text-sm text-slate-600 mb-4">Enter the quantity actually received for each item.</p>
              <div className="space-y-3">
                {receiveLines.map((line, index) => (
                  <div key={line.lineId} className="flex items-center gap-3">
                    <span className="text-sm font-mono text-slate-700 w-32 truncate">{line.sku}</span>
                    <input
                      type="number"
                      min={0}
                      max={line.max}
                      value={line.quantityReceived}
                      onChange={(e) => {
                        const updated = [...receiveLines];
                        updated[index] = { ...updated[index], quantityReceived: Math.min(Number(e.target.value), line.max) };
                        setReceiveLines(updated);
                      }}
                      className="w-20 px-2 py-1 border border-slate-300 rounded text-sm text-right"
                    />
                    <span className="text-xs text-slate-500">/ {line.max}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowReceiveModal(false)}
                  className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReceive}
                  disabled={receiveItems.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md disabled:opacity-50"
                >
                  {receiveItems.isPending ? 'Saving...' : 'Confirm Receipt'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowCompleteModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Complete Return — Set Resolutions</h3>
              <p className="text-sm text-slate-600 mb-4">Choose what to do with each returned item.</p>
              <div className="space-y-3">
                {completeLines.map((line, index) => (
                  <div key={line.lineId} className="flex items-center gap-3">
                    <span className="text-sm font-mono text-slate-700 w-32 truncate">{line.sku}</span>
                    <select
                      value={line.resolution}
                      onChange={(e) => {
                        const updated = [...completeLines];
                        updated[index] = { ...updated[index], resolution: e.target.value as ReturnResolution };
                        setCompleteLines(updated);
                      }}
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
                    >
                      <option value="RESTOCK">Restock (return to inventory)</option>
                      <option value="SCRAP">Scrap (write off)</option>
                      <option value="REPLACE">Replace (new delivery)</option>
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowCompleteModal(false)}
                  className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleComplete}
                  disabled={complete.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50"
                >
                  {complete.isPending ? 'Completing...' : 'Complete Return'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
