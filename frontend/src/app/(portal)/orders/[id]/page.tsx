'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Pause, Play, X, Calendar, Building, FileText, Package, ClipboardList, Wrench, Truck, Boxes, FileOutput, Receipt } from 'lucide-react';
import { useOrder, useOrderTimeline, useConfirmOrder, useHoldOrder, useReleaseOrderHold, useCancelOrder } from '@/hooks/useOrders';
import { usePickingSlipsForOrder, useGeneratePickingSlips } from '@/hooks/usePickingSlips';
import { useJobCardsForOrder, useCreateJobCard } from '@/hooks/useJobCards';
import { useTransferRequestsForOrder, useGenerateTransferRequest } from '@/hooks/useTransferRequests';
import { useDeliveryNotesForOrder, useCreateDeliveryNote } from '@/hooks/useDeliveryNotes';
import { useProformaInvoicesForOrder, useCreateProformaInvoice } from '@/hooks/useProformaInvoices';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { OrderLineTable } from '@/components/orders/OrderLineTable';
import { OrderTotals } from '@/components/orders/OrderTotals';
import {
  FulfillmentPipelineSteps,
  FulfillmentStatsBar,
  FulfillmentProgressBar,
  PickingSlipsSection,
  JobCardsSection,
  TransferRequestsSection,
  DeliveryNotesSection,
  ProformaInvoicesSection,
  OrderNotesSection,
  OrderTimelineSection,
} from '@/components/orders/order-detail';
import { GeneratePickingSlipModal } from '@/components/picking-slips/GeneratePickingSlipModal';
import { CreateJobCardModal } from '@/components/job-cards/CreateJobCardModal';
import { CreateTransferRequestModal } from '@/components/transfer-requests/CreateTransferRequestModal';
import { OrderDocumentsSection } from '@/components/documents';
import { FulfillmentPlanModal } from '@/components/fulfillment/FulfillmentPlanModal';

function formatDate(dateString: string | null): string {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-6 w-6 bg-slate-200 rounded" />
        <div className="h-8 bg-slate-200 rounded w-48" />
      </div>
      <div className="h-16 bg-slate-200 rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-slate-200 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
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
  const orderId = params.id as string;

  const { data: order, isLoading, error } = useOrder(orderId);
  const { data: timelineEvents, isLoading: isTimelineLoading } = useOrderTimeline(orderId);
  const { data: pickingSlips } = usePickingSlipsForOrder(orderId);
  const { data: jobCards } = useJobCardsForOrder(orderId);
  const { data: transferRequests } = useTransferRequestsForOrder(orderId);
  const { data: deliveryNotes } = useDeliveryNotesForOrder(orderId);
  const { data: proformaInvoices } = useProformaInvoicesForOrder(orderId);
  const confirm = useConfirmOrder();
  const hold = useHoldOrder();
  const release = useReleaseOrderHold();
  const cancel = useCancelOrder();
  const generatePickingSlips = useGeneratePickingSlips();
  const createJobCard = useCreateJobCard();
  const generateTransferRequest = useGenerateTransferRequest();
  const createDeliveryNote = useCreateDeliveryNote();
  const createProformaInvoice = useCreateProformaInvoice();

  const [holdReason, setHoldReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showGeneratePickingSlipModal, setShowGeneratePickingSlipModal] = useState(false);
  const [showCreateJobCardModal, setShowCreateJobCardModal] = useState(false);
  const [showCreateTransferRequestModal, setShowCreateTransferRequestModal] = useState(false);
  const [showFulfillmentPlanModal, setShowFulfillmentPlanModal] = useState(false);

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
  const canGeneratePickingSlips = order.status === 'CONFIRMED' && (!pickingSlips || pickingSlips.length === 0);
  const canCreateJobCard = order.status === 'CONFIRMED' || order.status === 'PROCESSING';
  const canCreateTransferRequest = order.status === 'CONFIRMED' || order.status === 'PROCESSING';
  const canGenerateFulfillmentPlan = order.status === 'CONFIRMED';
  const canCreateDeliveryNote = ['READY_TO_SHIP', 'PARTIALLY_SHIPPED', 'SHIPPED'].includes(order.status);
  const canCreateProformaInvoice = order.status === 'CONFIRMED';

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
    await generatePickingSlips.mutateAsync({ orderId, data: { lines } });
    setShowGeneratePickingSlipModal(false);
  };

  const handleCreateJobCard = async (data: {
    orderLineId: string;
    jobType: 'MACHINING' | 'ASSEMBLY';
    notes?: string;
  }) => {
    await createJobCard.mutateAsync({
      orderId,
      orderLineId: data.orderLineId,
      jobType: data.jobType,
      notes: data.notes,
    });
    setShowCreateJobCardModal(false);
  };

  const handleCreateTransferRequest = async (lines: Array<{
    orderLineId: string;
    lineNumber: number;
    productId: string;
    productSku: string;
    productDescription: string;
    quantity: number;
  }>) => {
    await generateTransferRequest.mutateAsync({ orderId, data: { lines } });
    setShowCreateTransferRequestModal(false);
  };

  const handleCreateDeliveryNote = async () => {
    if (window.confirm('Create a delivery note for this order?')) {
      await createDeliveryNote.mutateAsync({ orderId, data: { lines: [] } });
    }
  };

  const handleCreateProformaInvoice = async () => {
    const hasActive = proformaInvoices?.some((pi) => pi.status === 'ACTIVE');
    const message = hasActive
      ? 'An active proforma invoice already exists. Creating a new one will void the previous. Continue?'
      : 'Generate a proforma invoice for this order?';
    if (window.confirm(message)) {
      await createProformaInvoice.mutateAsync({ orderId });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
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
              {order.fulfillmentType !== 'STOCK_ONLY' && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                  {order.fulfillmentType === 'ASSEMBLY_REQUIRED' ? 'Assembly Required' : 'Mixed'}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {canCreateProformaInvoice && (
            <button
              onClick={handleCreateProformaInvoice}
              disabled={createProformaInvoice.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-700 disabled:opacity-50"
            >
              <Receipt className="h-4 w-4" />
              {createProformaInvoice.isPending ? 'Generating...' : 'Proforma Invoice'}
            </button>
          )}
          {canGenerateFulfillmentPlan && (
            <button
              onClick={() => setShowFulfillmentPlanModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
            >
              <Boxes className="h-4 w-4" />
              Fulfillment Plan
            </button>
          )}
          {canGeneratePickingSlips && (
            <button
              onClick={() => setShowGeneratePickingSlipModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
            >
              <ClipboardList className="h-4 w-4" />
              Picking Slips
            </button>
          )}
          {canCreateJobCard && (
            <button
              onClick={() => setShowCreateJobCardModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700"
            >
              <Wrench className="h-4 w-4" />
              Job Card
            </button>
          )}
          {canCreateTransferRequest && (
            <button
              onClick={() => setShowCreateTransferRequestModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              <Truck className="h-4 w-4" />
              Transfer
            </button>
          )}
          {canCreateDeliveryNote && (
            <button
              onClick={handleCreateDeliveryNote}
              disabled={createDeliveryNote.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-md hover:bg-teal-700 disabled:opacity-50"
            >
              <FileOutput className="h-4 w-4" />
              {createDeliveryNote.isPending ? 'Creating...' : 'Delivery Note'}
            </button>
          )}
          {canConfirm && (
            <button
              onClick={handleConfirm}
              disabled={confirm.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {confirm.isPending ? 'Confirming...' : 'Confirm'}
            </button>
          )}
          {canHold && (
            <button
              onClick={() => setShowHoldModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-amber-300 text-amber-600 text-sm font-medium rounded-md hover:bg-amber-50"
            >
              <Pause className="h-4 w-4" />
              Hold
            </button>
          )}
          {canRelease && (
            <button
              onClick={handleRelease}
              disabled={release.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              {release.isPending ? 'Releasing...' : 'Release'}
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-md hover:bg-red-50"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Hold / Cancel Banners */}
      {order.status === 'ON_HOLD' && order.holdReason && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-amber-50 border-amber-200 text-amber-700">
          <Pause className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">Order on Hold</p>
            <p className="text-xs">{order.holdReason}</p>
          </div>
        </div>
      )}
      {order.status === 'CANCELLED' && order.cancelReason && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-red-50 border-red-200 text-red-700">
          <X className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">Order Cancelled</p>
            <p className="text-xs">{order.cancelReason}</p>
          </div>
        </div>
      )}

      {/* Fulfillment Pipeline Steps (full width) */}
      <FulfillmentPipelineSteps orderStatus={order.status} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Fulfillment Stats + Progress */}
          <FulfillmentStatsBar lines={order.lines} />
          <FulfillmentProgressBar lines={order.lines} />

          {/* Order Lines */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Lines</h2>
            <OrderLineTable lines={order.lines} />
          </div>

          {/* Fulfillment Documents */}
          <PickingSlipsSection pickingSlips={pickingSlips ?? []} />
          <JobCardsSection jobCards={jobCards ?? []} />
          <TransferRequestsSection transferRequests={transferRequests ?? []} />
          <DeliveryNotesSection deliveryNotes={deliveryNotes ?? []} />
          <ProformaInvoicesSection
            proformaInvoices={proformaInvoices ?? []}
            canVoid={true}
          />

          {/* Notes */}
          <OrderNotesSection
            customerNotes={order.customerNotes}
            internalNotes={order.internalNotes}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Summary</h2>
            <OrderTotals
              subtotal={order.subtotal}
              vatRate={order.vatRate}
              vatAmount={order.vatAmount}
              total={order.total}
            />
          </div>

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

          <OrderDocumentsSection orderId={orderId} orderNumber={order.orderNumber} />

          <OrderTimelineSection
            events={timelineEvents ?? []}
            isLoading={isTimelineLoading}
          />
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

      {/* Modals */}
      <GeneratePickingSlipModal
        isOpen={showGeneratePickingSlipModal}
        onClose={() => setShowGeneratePickingSlipModal(false)}
        orderLines={order.lines}
        onGenerate={handleGeneratePickingSlips}
        isGenerating={generatePickingSlips.isPending}
      />
      <CreateJobCardModal
        isOpen={showCreateJobCardModal}
        onClose={() => setShowCreateJobCardModal(false)}
        orderLines={order.lines}
        onCreateJobCard={handleCreateJobCard}
        isCreating={createJobCard.isPending}
      />
      <CreateTransferRequestModal
        isOpen={showCreateTransferRequestModal}
        onClose={() => setShowCreateTransferRequestModal(false)}
        orderLines={order.lines}
        onCreateTransfer={handleCreateTransferRequest}
        isCreating={generateTransferRequest.isPending}
      />
      <FulfillmentPlanModal
        isOpen={showFulfillmentPlanModal}
        onClose={() => setShowFulfillmentPlanModal(false)}
        orderId={orderId}
      />
    </div>
  );
}
