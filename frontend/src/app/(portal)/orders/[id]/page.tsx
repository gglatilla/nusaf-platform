'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Check, Pause, Play, X, Calendar, Building, FileText, Package, ClipboardList, Wrench, Truck, Boxes, FileOutput, Receipt, RotateCcw, Banknote, Lock } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { OrderActionMenu } from '@/components/orders/OrderActionMenu';
import { useOrder, useOrderTimeline, useConfirmOrder, useHoldOrder, useReleaseOrderHold, useCancelOrder, useCloseOrder } from '@/hooks/useOrders';
import { usePickingSlipsForOrder, useGeneratePickingSlips } from '@/hooks/usePickingSlips';
import { useJobCardsForOrder, useCreateJobCard } from '@/hooks/useJobCards';
import { useTransferRequestsForOrder, useGenerateTransferRequest } from '@/hooks/useTransferRequests';
import { useDeliveryNotesForOrder, useCreateDeliveryNote } from '@/hooks/useDeliveryNotes';
import { useProformaInvoicesForOrder, useCreateProformaInvoice } from '@/hooks/useProformaInvoices';
import { useTaxInvoicesForOrder, useCreateTaxInvoice } from '@/hooks/useTaxInvoices';
import { useReturnAuthorizationsForOrder } from '@/hooks/useReturnAuthorizations';
import { usePackingListsForOrder } from '@/hooks/usePackingLists';
import { useCreditNotesForOrder } from '@/hooks/useCreditNotes';
import { useOrderPayments } from '@/hooks/usePayments';
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
  BackorderSummarySection,
  DeliveryNotesSection,
  ProformaInvoicesSection,
  TaxInvoicesSection,
  ReturnAuthorizationsSection,
  PackingListsSection,
  PaymentsSection,
  RecordPaymentModal,
  OrderNotesSection,
  OrderTimelineSection,
  CreditNotesSection,
} from '@/components/orders/order-detail';
import { GeneratePickingSlipModal } from '@/components/picking-slips/GeneratePickingSlipModal';
import { CreateJobCardModal } from '@/components/job-cards/CreateJobCardModal';
import { CreateTransferRequestModal } from '@/components/transfer-requests/CreateTransferRequestModal';
import { OrderDocumentsSection } from '@/components/documents';
import { FulfillmentPlanModal } from '@/components/fulfillment/FulfillmentPlanModal';
import { useAuthStore } from '@/stores/auth-store';
import { formatDate } from '@/lib/formatting';

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
  const { user } = useAuthStore();

  const { data: order, isLoading, error } = useOrder(orderId);
  const { data: timelineEvents, isLoading: isTimelineLoading } = useOrderTimeline(orderId);
  const { data: pickingSlips } = usePickingSlipsForOrder(orderId);
  const { data: jobCards } = useJobCardsForOrder(orderId);
  const { data: transferRequests } = useTransferRequestsForOrder(orderId);
  const { data: deliveryNotes } = useDeliveryNotesForOrder(orderId);
  const { data: proformaInvoices } = useProformaInvoicesForOrder(orderId);
  const { data: taxInvoices } = useTaxInvoicesForOrder(orderId);
  const { data: returnAuthorizations } = useReturnAuthorizationsForOrder(orderId);
  const { data: packingLists } = usePackingListsForOrder(orderId);
  const { data: creditNotes } = useCreditNotesForOrder(orderId);
  const { data: payments } = useOrderPayments(orderId);
  const confirm = useConfirmOrder();
  const hold = useHoldOrder();
  const release = useReleaseOrderHold();
  const cancel = useCancelOrder();
  const close = useCloseOrder();
  const generatePickingSlips = useGeneratePickingSlips();
  const createJobCard = useCreateJobCard();
  const generateTransferRequest = useGenerateTransferRequest();
  const createDeliveryNote = useCreateDeliveryNote();
  const createProformaInvoice = useCreateProformaInvoice();
  const createTaxInvoice = useCreateTaxInvoice();

  const [holdReason, setHoldReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showGeneratePickingSlipModal, setShowGeneratePickingSlipModal] = useState(false);
  const [showCreateJobCardModal, setShowCreateJobCardModal] = useState(false);
  const [showCreateTransferRequestModal, setShowCreateTransferRequestModal] = useState(false);
  const [showFulfillmentPlanModal, setShowFulfillmentPlanModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [paymentSuccessBanner, setPaymentSuccessBanner] = useState<string | null>(null);

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

  // Role-based visibility groups
  const userRole = user?.role;
  const isAdmin = userRole === 'ADMIN';
  const isManager = userRole === 'MANAGER';
  const isSales = userRole === 'SALES';
  const isWarehouse = userRole === 'WAREHOUSE';
  const isAdminOrManager = isAdmin || isManager;

  // Which role groups can see which action categories
  const canSeeOrderActions = isAdminOrManager || isSales;           // confirm, hold, release, cancel
  const canSeeFinancialActions = isAdminOrManager || isSales;       // payment, proforma, tax invoice
  const canSeeWarehouseActions = isAdminOrManager || isWarehouse;   // picking, jobs, transfers, fulfillment plan
  const canSeeShippingActions = isAdminOrManager || isSales || isWarehouse; // delivery note, packing list
  const canSeeCloseAction = isAdminOrManager;                       // close order
  const canSeeReturnAction = isAdminOrManager || isSales;           // request return

  // Status + role combined checks
  const isPrepay = order.paymentTerms === 'PREPAY' || order.paymentTerms === 'COD';
  const hasActiveProforma = proformaInvoices?.some((pi) => pi.status === 'ACTIVE');
  const hasActiveTaxInvoice = taxInvoices?.some((ti) => ti.status === 'ISSUED');

  const canConfirm = canSeeOrderActions && order.status === 'DRAFT';
  const canHold = canSeeOrderActions && ['CONFIRMED', 'PROCESSING', 'READY_TO_SHIP', 'PARTIALLY_SHIPPED'].includes(order.status);
  const canRelease = canSeeOrderActions && order.status === 'ON_HOLD';
  const canCancel = canSeeOrderActions && ['DRAFT', 'CONFIRMED', 'PROCESSING', 'ON_HOLD'].includes(order.status);
  // When prepay is unpaid, ALL fulfillment/warehouse actions are blocked
  const prepayBlocked = isPrepay && order.paymentStatus !== 'PAID';
  const canGeneratePickingSlips = canSeeWarehouseActions && order.status === 'CONFIRMED' && (!pickingSlips || pickingSlips.length === 0) && !prepayBlocked;
  const canCreateJobCard = canSeeWarehouseActions && (order.status === 'CONFIRMED' || order.status === 'PROCESSING') && !prepayBlocked;
  const canCreateTransferRequest = canSeeWarehouseActions && (order.status === 'CONFIRMED' || order.status === 'PROCESSING') && !prepayBlocked;
  const canGenerateFulfillmentPlan = canSeeWarehouseActions && order.status === 'CONFIRMED' && !prepayBlocked;
  const fulfillmentBlockedByPayment = canSeeWarehouseActions && order.status === 'CONFIRMED' && prepayBlocked;
  const canRecordPayment = canSeeFinancialActions && order.status !== 'CANCELLED' && order.paymentStatus !== 'PAID' && order.paymentStatus !== 'NOT_REQUIRED';
  const canCreateDeliveryNote = canSeeShippingActions && ['READY_TO_SHIP', 'PARTIALLY_SHIPPED', 'SHIPPED'].includes(order.status);
  const canCreatePackingList = canSeeShippingActions && ['READY_TO_SHIP', 'PARTIALLY_SHIPPED', 'SHIPPED'].includes(order.status);
  const canCreateProformaInvoice = canSeeFinancialActions && order.status === 'CONFIRMED' && isPrepay && !hasActiveProforma;
  const canCreateTaxInvoice = canSeeFinancialActions && ['DELIVERED', 'INVOICED', 'CLOSED'].includes(order.status) && !hasActiveTaxInvoice;
  const canRequestReturn = canSeeReturnAction && ['SHIPPED', 'DELIVERED', 'INVOICED', 'CLOSED'].includes(order.status);
  const canClose = canSeeCloseAction && order.status === 'INVOICED';

  // Determine primary (next step) action for highlighting
  type PrimaryAction = 'confirm' | 'release' | 'recordPayment' | 'fulfillmentPlan' | 'deliveryNote' | 'taxInvoice' | 'close' | null;
  let primaryAction: PrimaryAction = null;
  if (order.status === 'DRAFT') {
    primaryAction = 'confirm';
  } else if (order.status === 'ON_HOLD') {
    primaryAction = 'release';
  } else if (order.status === 'CONFIRMED' && isPrepay && order.paymentStatus !== 'PAID') {
    primaryAction = 'recordPayment';
  } else if (order.status === 'CONFIRMED' && (!isPrepay || order.paymentStatus === 'PAID')) {
    primaryAction = 'fulfillmentPlan';
  } else if (['READY_TO_SHIP', 'PARTIALLY_SHIPPED'].includes(order.status)) {
    primaryAction = 'deliveryNote';
  } else if (order.status === 'DELIVERED' && !hasActiveTaxInvoice) {
    primaryAction = 'taxInvoice';
  } else if (order.status === 'INVOICED') {
    primaryAction = 'close';
  }
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

  const handleCreateTaxInvoice = async () => {
    if (window.confirm('Generate a tax invoice for this order? This will transition the order to INVOICED status.')) {
      await createTaxInvoice.mutateAsync({ orderId });
    }
  };

  const handleClose = async () => {
    if (window.confirm('Close this order? This marks the order as fully complete. This action cannot be undone.')) {
      await close.mutateAsync(orderId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment success banner */}
      {paymentSuccessBanner && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-green-800">{paymentSuccessBanner}</p>
          <button onClick={() => setPaymentSuccessBanner(null)} className="text-green-600 hover:text-green-800 text-sm font-medium">Dismiss</button>
        </div>
      )}
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Orders', href: '/orders' }, { label: order.orderNumber }]} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">{order.orderNumber}</h1>
            <OrderStatusBadge status={order.status} />
            {/* Payment Terms Badge */}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isPrepay
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {order.paymentTerms === 'PREPAY' ? 'Prepay'
                : order.paymentTerms === 'COD' ? 'COD'
                : order.paymentTerms === 'NET_60' ? 'Net 60'
                : order.paymentTerms === 'NET_90' ? 'Net 90'
                : 'Net 30'}
            </span>
            {/* Payment Status Badge */}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                order.paymentStatus === 'PAID'
                  ? 'bg-green-100 text-green-700'
                  : order.paymentStatus === 'PARTIALLY_PAID'
                    ? 'bg-amber-100 text-amber-700'
                    : order.paymentStatus === 'NOT_REQUIRED'
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-red-100 text-red-700'
              }`}
            >
              {order.paymentStatus === 'PAID'
                ? 'Paid'
                : order.paymentStatus === 'PARTIALLY_PAID'
                  ? 'Partially Paid'
                  : order.paymentStatus === 'NOT_REQUIRED'
                    ? 'On Account'
                    : 'Unpaid'}
            </span>
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

        {/* Actions — Primary action + grouped dropdown */}
        <OrderActionMenu
          primaryAction={
            primaryAction === 'confirm' && canConfirm ? {
              label: 'Confirm Order',
              icon: <Check className="h-4 w-4" />,
              onClick: handleConfirm,
              loading: confirm.isPending,
              loadingLabel: 'Confirming...',
            }
            : primaryAction === 'release' && canRelease ? {
              label: 'Release from Hold',
              icon: <Play className="h-4 w-4" />,
              onClick: handleRelease,
              loading: release.isPending,
              loadingLabel: 'Releasing...',
            }
            : primaryAction === 'recordPayment' && canRecordPayment ? {
              label: 'Record Payment',
              icon: <Banknote className="h-4 w-4" />,
              onClick: () => setShowRecordPaymentModal(true),
            }
            : primaryAction === 'fulfillmentPlan' && canGenerateFulfillmentPlan ? {
              label: 'Generate Fulfillment',
              icon: <Boxes className="h-4 w-4" />,
              onClick: () => setShowFulfillmentPlanModal(true),
            }
            : primaryAction === 'deliveryNote' && canCreateDeliveryNote ? {
              label: 'Create Delivery Note',
              icon: <FileOutput className="h-4 w-4" />,
              onClick: handleCreateDeliveryNote,
              loading: createDeliveryNote.isPending,
              loadingLabel: 'Creating...',
            }
            : primaryAction === 'taxInvoice' && canCreateTaxInvoice ? {
              label: 'Create Tax Invoice',
              icon: <Receipt className="h-4 w-4" />,
              onClick: handleCreateTaxInvoice,
              loading: createTaxInvoice.isPending,
              loadingLabel: 'Generating...',
            }
            : primaryAction === 'close' && canClose ? {
              label: 'Close Order',
              icon: <Lock className="h-4 w-4" />,
              onClick: handleClose,
              loading: close.isPending,
              loadingLabel: 'Closing...',
            }
            : null
          }
          nextStepText={
            primaryAction === 'confirm' ? 'Confirm this order'
            : primaryAction === 'release' ? 'Release from hold'
            : primaryAction === 'recordPayment' ? 'Record payment to unblock fulfillment'
            : primaryAction === 'fulfillmentPlan' ? 'Generate fulfillment plan'
            : primaryAction === 'deliveryNote' ? 'Create delivery note'
            : primaryAction === 'taxInvoice' ? 'Generate tax invoice'
            : primaryAction === 'close' ? 'Close this order'
            : undefined
          }
          groups={[
            {
              label: 'Financial',
              items: [
                ...(canCreateProformaInvoice ? [{
                  key: 'proforma',
                  label: 'Proforma Invoice',
                  icon: <Receipt className="h-4 w-4" />,
                  onClick: handleCreateProformaInvoice,
                }] : []),
                ...(canRecordPayment && primaryAction !== 'recordPayment' ? [{
                  key: 'payment',
                  label: 'Record Payment',
                  icon: <Banknote className="h-4 w-4" />,
                  onClick: () => setShowRecordPaymentModal(true),
                }] : []),
                ...(canCreateTaxInvoice && primaryAction !== 'taxInvoice' ? [{
                  key: 'taxInvoice',
                  label: 'Tax Invoice',
                  icon: <Receipt className="h-4 w-4" />,
                  onClick: handleCreateTaxInvoice,
                }] : []),
              ],
            },
            {
              label: 'Fulfillment',
              items: [
                ...(canGenerateFulfillmentPlan && primaryAction !== 'fulfillmentPlan' ? [{
                  key: 'fulfillment',
                  label: 'Fulfillment Plan',
                  icon: <Boxes className="h-4 w-4" />,
                  onClick: () => setShowFulfillmentPlanModal(true),
                }] : []),
                ...(fulfillmentBlockedByPayment ? [{
                  key: 'fulfillment-blocked',
                  label: 'Fulfillment Plan',
                  icon: <Boxes className="h-4 w-4" />,
                  disabled: true,
                  disabledReason: 'Payment required before fulfillment',
                }] : []),
                ...(canGeneratePickingSlips ? [{
                  key: 'picking',
                  label: 'Generate Picking Slips',
                  icon: <ClipboardList className="h-4 w-4" />,
                  onClick: () => setShowGeneratePickingSlipModal(true),
                }] : []),
                ...(canCreateJobCard ? [{
                  key: 'jobCard',
                  label: 'Create Job Card',
                  icon: <Wrench className="h-4 w-4" />,
                  onClick: () => setShowCreateJobCardModal(true),
                }] : []),
                ...(canCreateTransferRequest ? [{
                  key: 'transfer',
                  label: 'Create Transfer',
                  icon: <Truck className="h-4 w-4" />,
                  onClick: () => setShowCreateTransferRequestModal(true),
                }] : []),
              ],
            },
            {
              label: 'Shipping',
              items: [
                ...(canCreateDeliveryNote && primaryAction !== 'deliveryNote' ? [{
                  key: 'deliveryNote',
                  label: 'Create Delivery Note',
                  icon: <FileOutput className="h-4 w-4" />,
                  onClick: handleCreateDeliveryNote,
                }] : []),
                ...(canCreatePackingList ? [{
                  key: 'packingList',
                  label: 'Create Packing List',
                  icon: <Boxes className="h-4 w-4" />,
                  href: `/packing-lists/new?orderId=${orderId}`,
                }] : []),
              ],
            },
            {
              label: 'Order Management',
              items: [
                ...(canConfirm && primaryAction !== 'confirm' ? [{
                  key: 'confirm',
                  label: 'Confirm Order',
                  icon: <Check className="h-4 w-4" />,
                  onClick: handleConfirm,
                }] : []),
                ...(canHold ? [{
                  key: 'hold',
                  label: 'Put on Hold',
                  icon: <Pause className="h-4 w-4" />,
                  onClick: () => setShowHoldModal(true),
                  variant: 'warning' as const,
                }] : []),
                ...(canRelease && primaryAction !== 'release' ? [{
                  key: 'release',
                  label: 'Release from Hold',
                  icon: <Play className="h-4 w-4" />,
                  onClick: handleRelease,
                }] : []),
                ...(canRequestReturn ? [{
                  key: 'return',
                  label: 'Request Return',
                  icon: <RotateCcw className="h-4 w-4" />,
                  href: `/return-authorizations/new?orderId=${orderId}`,
                }] : []),
                ...(canClose && primaryAction !== 'close' ? [{
                  key: 'close',
                  label: 'Close Order',
                  icon: <Lock className="h-4 w-4" />,
                  onClick: handleClose,
                }] : []),
                ...(canCancel ? [{
                  key: 'cancel',
                  label: 'Cancel Order',
                  icon: <X className="h-4 w-4" />,
                  onClick: () => setShowCancelModal(true),
                  variant: 'danger' as const,
                }] : []),
              ],
            },
          ]}
        />
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
          <BackorderSummarySection lines={order.lines} />
          <DeliveryNotesSection deliveryNotes={deliveryNotes ?? []} />
          <PackingListsSection packingLists={packingLists ?? []} />
          <ProformaInvoicesSection
            proformaInvoices={proformaInvoices ?? []}
            canVoid={isAdminOrManager}
          />
          <TaxInvoicesSection
            taxInvoices={taxInvoices ?? []}
            canVoid={isAdminOrManager}
          />
          <PaymentsSection
            payments={payments ?? []}
            orderTotal={order.total}
            paymentTerms={order.paymentTerms}
            paymentStatus={order.paymentStatus}
            canRecordPayment={canRecordPayment}
            canVoid={isAdminOrManager}
            onRecordPayment={() => setShowRecordPaymentModal(true)}
          />
          <ReturnAuthorizationsSection returnAuthorizations={returnAuthorizations ?? []} />

          <CreditNotesSection
            creditNotes={creditNotes ?? []}
            canVoid={user?.role === 'ADMIN'}
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

              {/* Cash customer details */}
              {order.cashCustomerName && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3 -mx-1">
                  <h3 className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1.5">Cash Customer</h3>
                  <dl className="space-y-1 text-sm">
                    <dd className="text-slate-900 font-medium">{order.cashCustomerName}</dd>
                    {order.cashCustomerCompany && (
                      <dd className="text-slate-600">{order.cashCustomerCompany}</dd>
                    )}
                    {order.cashCustomerPhone && (
                      <dd className="text-slate-600">{order.cashCustomerPhone}</dd>
                    )}
                    {order.cashCustomerEmail && (
                      <dd className="text-slate-600">{order.cashCustomerEmail}</dd>
                    )}
                    {order.cashCustomerVat && (
                      <dd className="text-slate-500 text-xs">VAT: {order.cashCustomerVat}</dd>
                    )}
                  </dl>
                </div>
              )}

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
      <RecordPaymentModal
        isOpen={showRecordPaymentModal}
        onClose={() => setShowRecordPaymentModal(false)}
        orderId={orderId}
        balanceRemaining={Math.max(
          0,
          order.total -
            (payments ?? [])
              .filter((p) => p.status === 'CONFIRMED')
              .reduce((sum, p) => sum + Number(p.amount), 0)
        )}
        onSuccess={({ fulfillmentTriggered, fulfillmentError }) => {
          if (fulfillmentTriggered) {
            setPaymentSuccessBanner('Payment recorded. Fulfillment has been automatically initiated.');
          } else if (fulfillmentError) {
            setPaymentSuccessBanner(`Payment recorded. Fulfillment could not be auto-triggered: ${fulfillmentError}. Staff can trigger manually.`);
          } else {
            setPaymentSuccessBanner('Payment recorded successfully.');
          }
          setTimeout(() => setPaymentSuccessBanner(null), 8000);
        }}
      />
    </div>
  );
}
