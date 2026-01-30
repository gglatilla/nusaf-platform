'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Pause, Play, X, Calendar, Building, FileText, Package, ClipboardList, MapPin } from 'lucide-react';
import { useOrder, useConfirmOrder, useHoldOrder, useReleaseOrderHold, useCancelOrder } from '@/hooks/useOrders';
import { usePickingSlipsForOrder, useGeneratePickingSlips } from '@/hooks/usePickingSlips';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { OrderLineTable } from '@/components/orders/OrderLineTable';
import { OrderTotals } from '@/components/orders/OrderTotals';
import { GeneratePickingSlipModal } from '@/components/picking-slips/GeneratePickingSlipModal';
import { PickingSlipStatusBadge } from '@/components/picking-slips/PickingSlipStatusBadge';

function formatDate(dateString: string | null): string {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
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

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const { data: order, isLoading, error } = useOrder(orderId);
  const { data: pickingSlips } = usePickingSlipsForOrder(orderId);
  const confirm = useConfirmOrder();
  const hold = useHoldOrder();
  const release = useReleaseOrderHold();
  const cancel = useCancelOrder();
  const generatePickingSlips = useGeneratePickingSlips();

  const [holdReason, setHoldReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showGeneratePickingSlipModal, setShowGeneratePickingSlipModal] = useState(false);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-red-600 mb-4">Order not found</p>
        <Link href="/orders" className="text-primary-600 hover:text-primary-700">
          Back to Orders
        </Link>
      </div>
    );
  }

  const canConfirm = order.status === 'DRAFT';
  const canHold = ['CONFIRMED', 'PROCESSING', 'READY_TO_SHIP', 'PARTIALLY_SHIPPED'].includes(order.status);
  const canRelease = order.status === 'ON_HOLD';
  const canCancel = ['DRAFT', 'CONFIRMED', 'PROCESSING', 'ON_HOLD'].includes(order.status);

  // Can generate picking slips if order is CONFIRMED and no picking slips exist yet
  const hasPickingSlips = pickingSlips && pickingSlips.length > 0;
  const canGeneratePickingSlips = order.status === 'CONFIRMED' && !hasPickingSlips;

  const handleConfirm = async () => {
    if (window.confirm('Confirm this order? It will be sent for processing.')) {
      await confirm.mutateAsync(orderId);
    }
  };

  const handleHold = async () => {
    if (!holdReason.trim()) return;
    await hold.mutateAsync({ orderId, reason: holdReason });
    setShowHoldModal(false);
    setHoldReason('');
  };

  const handleRelease = async () => {
    if (window.confirm('Release this order from hold?')) {
      await release.mutateAsync(orderId);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    await cancel.mutateAsync({ orderId, reason: cancelReason });
    setShowCancelModal(false);
    setCancelReason('');
  };

  const handleGeneratePickingSlips = async (lines: Array<{
    orderLineId: string;
    lineNumber: number;
    productId: string;
    productSku: string;
    productDescription: string;
    quantityToPick: number;
    location: 'JHB' | 'CT';
  }>) => {
    await generatePickingSlips.mutateAsync({
      orderId,
      data: { lines },
    });
    setShowGeneratePickingSlipModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/orders" className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">{order.orderNumber}</h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-sm text-slate-600">
              Created on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {canGeneratePickingSlips && (
            <button
              onClick={() => setShowGeneratePickingSlipModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
            >
              <ClipboardList className="h-4 w-4" />
              Generate Picking Slips
            </button>
          )}

          {canConfirm && (
            <button
              onClick={handleConfirm}
              disabled={confirm.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {confirm.isPending ? 'Confirming...' : 'Confirm Order'}
            </button>
          )}

          {canHold && (
            <button
              onClick={() => setShowHoldModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-amber-300 text-amber-600 text-sm font-medium rounded-md hover:bg-amber-50"
            >
              <Pause className="h-4 w-4" />
              Put on Hold
            </button>
          )}

          {canRelease && (
            <button
              onClick={handleRelease}
              disabled={release.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              {release.isPending ? 'Releasing...' : 'Release Hold'}
            </button>
          )}

          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-md hover:bg-red-50"
            >
              <X className="h-4 w-4" />
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Hold Reason Banner */}
      {order.status === 'ON_HOLD' && order.holdReason && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-amber-50 border-amber-200 text-amber-700">
          <Pause className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">Order on Hold</p>
            <p className="text-xs">{order.holdReason}</p>
          </div>
        </div>
      )}

      {/* Cancel Reason Banner */}
      {order.status === 'CANCELLED' && order.cancelReason && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-red-50 border-red-200 text-red-700">
          <X className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">Order Cancelled</p>
            <p className="text-xs">{order.cancelReason}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Lines</h2>
            <OrderLineTable lines={order.lines} />
          </div>

          {/* Picking Slips Section */}
          {hasPickingSlips && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Picking Slips</h2>
              <div className="space-y-3">
                {pickingSlips.map((slip) => (
                  <div
                    key={slip.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/picking-slips/${slip.id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        {slip.pickingSlipNumber}
                      </Link>
                      <PickingSlipStatusBadge status={slip.status} />
                      <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {getLocationLabel(slip.location)}
                      </span>
                    </div>
                    <span className="text-sm text-slate-500">{slip.lineCount} line{slip.lineCount !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {(order.customerNotes || order.internalNotes) && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Notes</h2>
              {order.customerNotes && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-slate-700 mb-1">Customer Notes</h3>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{order.customerNotes}</p>
                </div>
              )}
              {order.internalNotes && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-1">Internal Notes</h3>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{order.internalNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Totals */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Summary</h2>
            <OrderTotals
              subtotal={order.subtotal}
              vatRate={order.vatRate}
              vatAmount={order.vatAmount}
              total={order.total}
            />
          </div>

          {/* Details */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Details</h2>
            <dl className="space-y-3">
              <div className="flex items-start gap-3">
                <Building className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Company</dt>
                  <dd className="text-sm text-slate-900">{order.company.name}</dd>
                </div>
              </div>

              {order.quoteNumber && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Source Quote</dt>
                    <dd className="text-sm text-slate-900">
                      {order.quoteId ? (
                        <Link href={`/quotes/${order.quoteId}`} className="text-primary-600 hover:text-primary-700">
                          {order.quoteNumber}
                        </Link>
                      ) : (
                        order.quoteNumber
                      )}
                    </dd>
                  </div>
                </div>
              )}

              {order.customerPoNumber && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Customer PO</dt>
                    <dd className="text-sm text-slate-900">{order.customerPoNumber}</dd>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Warehouse</dt>
                  <dd className="text-sm text-slate-900">
                    {order.warehouse === 'JHB' ? 'Johannesburg' : 'Cape Town'}
                  </dd>
                </div>
              </div>

              {order.requiredDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Required Date</dt>
                    <dd className="text-sm text-slate-900">{formatDate(order.requiredDate)}</dd>
                  </div>
                </div>
              )}

              {order.confirmedAt && (
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Confirmed</dt>
                    <dd className="text-sm text-slate-900">{formatDate(order.confirmedAt)}</dd>
                  </div>
                </div>
              )}

              {order.shippedDate && (
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Shipped</dt>
                    <dd className="text-sm text-slate-900">{formatDate(order.shippedDate)}</dd>
                  </div>
                </div>
              )}

              {order.deliveredDate && (
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Delivered</dt>
                    <dd className="text-sm text-slate-900">{formatDate(order.deliveredDate)}</dd>
                  </div>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* Hold Modal */}
      {showHoldModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowHoldModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Put Order on Hold</h3>
              <textarea
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                placeholder="Enter reason for hold..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowHoldModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleHold}
                  disabled={!holdReason.trim() || hold.isPending}
                  className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-700 disabled:opacity-50"
                >
                  {hold.isPending ? 'Holding...' : 'Put on Hold'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowCancelModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Cancel Order</h3>
              <p className="text-sm text-slate-600 mb-4">
                This action cannot be undone. Please provide a reason for cancellation.
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter reason for cancellation..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  Keep Order
                </button>
                <button
                  onClick={handleCancel}
                  disabled={!cancelReason.trim() || cancel.isPending}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {cancel.isPending ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Picking Slip Modal */}
      <GeneratePickingSlipModal
        isOpen={showGeneratePickingSlipModal}
        onClose={() => setShowGeneratePickingSlipModal(false)}
        orderLines={order.lines}
        onGenerate={handleGeneratePickingSlips}
        isGenerating={generatePickingSlips.isPending}
      />
    </div>
  );
}
