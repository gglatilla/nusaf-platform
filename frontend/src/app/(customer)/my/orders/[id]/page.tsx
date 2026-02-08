'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Package,
  Pause,
  RotateCcw,
  X,
} from 'lucide-react';
import { useOrder } from '@/hooks/useOrders';
import { useDeliveryNotesForOrder } from '@/hooks/useDeliveryNotes';
import { useProformaInvoicesForOrder } from '@/hooks/useProformaInvoices';
import { useReturnAuthorizationsForOrder } from '@/hooks/useReturnAuthorizations';
import { usePackingListsForOrder } from '@/hooks/usePackingLists';
import { ProformaInvoicesSection, ReturnAuthorizationsSection, PackingListsSection } from '@/components/orders/order-detail';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { OrderLineTable } from '@/components/orders/OrderLineTable';
import { OrderTotals } from '@/components/orders/OrderTotals';
import { FulfillmentPipelineSteps } from '@/components/orders/order-detail';
import { DeliveryNoteStatusBadge } from '@/components/delivery-notes/DeliveryNoteStatusBadge';

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

export default function CustomerOrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const { data: order, isLoading, error } = useOrder(orderId);
  const { data: deliveryNotes } = useDeliveryNotesForOrder(orderId);
  const { data: proformaInvoices } = useProformaInvoicesForOrder(orderId);
  const { data: returnAuthorizations } = useReturnAuthorizationsForOrder(orderId);
  const { data: packingLists } = usePackingListsForOrder(orderId);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-red-600 mb-4">Order not found</p>
        <Link
          href="/my/orders"
          className="text-primary-600 hover:text-primary-700"
        >
          Back to My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/my/orders"
            className="text-slate-400 hover:text-slate-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">
                {order.orderNumber}
              </h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-sm text-slate-600">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        {order.status === 'DELIVERED' && (
          <Link
            href={`/my/returns/new?orderId=${orderId}`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-orange-300 text-orange-600 rounded-md hover:bg-orange-50"
          >
            <RotateCcw className="h-4 w-4" />
            Request Return
          </Link>
        )}
      </div>

      {/* Hold / Cancel Banners */}
      {order.status === 'ON_HOLD' && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-amber-50 border-amber-200 text-amber-700">
          <Pause className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">Order on Hold</p>
            <p className="text-xs">This order is temporarily on hold. We&apos;ll notify you when it resumes.</p>
          </div>
        </div>
      )}
      {order.status === 'CANCELLED' && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-red-50 border-red-200 text-red-700">
          <X className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">Order Cancelled</p>
            <p className="text-xs">This order has been cancelled.</p>
          </div>
        </div>
      )}

      {/* Fulfillment Pipeline Steps */}
      <FulfillmentPipelineSteps orderStatus={order.status} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Lines */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Items
            </h2>
            <OrderLineTable
              lines={order.lines}
              hideOperationalColumns
            />
          </div>

          {/* Delivery Notes */}
          {deliveryNotes && deliveryNotes.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Deliveries</h2>
                <span className="text-sm text-slate-500">
                  {deliveryNotes.length} delivery note{deliveryNotes.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-3">
                {deliveryNotes.map((dn) => (
                  <div
                    key={dn.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <Link
                        href={`/my/delivery-notes/${dn.id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        {dn.deliveryNoteNumber}
                      </Link>
                      <DeliveryNoteStatusBadge status={dn.status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      {dn.deliveredAt ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Delivered {new Intl.DateTimeFormat('en-ZA', { month: 'short', day: 'numeric' }).format(new Date(dn.deliveredAt))}
                        </span>
                      ) : dn.dispatchedAt ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Dispatched {new Intl.DateTimeFormat('en-ZA', { month: 'short', day: 'numeric' }).format(new Date(dn.dispatchedAt))}
                        </span>
                      ) : null}
                      <span className="text-slate-500">{dn.lineCount} item{dn.lineCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Packing Lists (finalized only for customers) */}
          <PackingListsSection
            packingLists={packingLists ?? []}
            isCustomer={true}
          />

          {/* Proforma Invoices */}
          <ProformaInvoicesSection
            proformaInvoices={proformaInvoices ?? []}
            isCustomer={true}
          />

          <ReturnAuthorizationsSection
            returnAuthorizations={returnAuthorizations ?? []}
            isCustomer={true}
          />

          {/* Customer Notes */}
          {order.customerNotes && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Notes
              </h2>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">
                {order.customerNotes}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Totals */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Summary
            </h2>
            <OrderTotals
              subtotal={order.subtotal}
              vatRate={order.vatRate}
              vatAmount={order.vatAmount}
              total={order.total}
            />
          </div>

          {/* Details */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Details
            </h2>
            <dl className="space-y-3">
              {order.quoteNumber && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">
                      Source Quote
                    </dt>
                    <dd className="text-sm text-slate-900">
                      {order.quoteId ? (
                        <Link
                          href={`/my/quotes/${order.quoteId}`}
                          className="text-primary-600 hover:text-primary-700"
                        >
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
                    <dt className="text-xs text-slate-500 uppercase">
                      Your PO Number
                    </dt>
                    <dd className="text-sm text-slate-900">
                      {order.customerPoNumber}
                    </dd>
                  </div>
                </div>
              )}

              {order.requiredDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">
                      Required Date
                    </dt>
                    <dd className="text-sm text-slate-900">
                      {formatDate(order.requiredDate)}
                    </dd>
                  </div>
                </div>
              )}

              {order.confirmedAt && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">
                      Confirmed
                    </dt>
                    <dd className="text-sm text-slate-900">
                      {formatDate(order.confirmedAt)}
                    </dd>
                  </div>
                </div>
              )}

              {order.shippedDate && (
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">
                      Shipped
                    </dt>
                    <dd className="text-sm text-slate-900">
                      {formatDate(order.shippedDate)}
                    </dd>
                  </div>
                </div>
              )}

              {order.deliveredDate && (
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">
                      Delivered
                    </dt>
                    <dd className="text-sm text-slate-900">
                      {formatDate(order.deliveredDate)}
                    </dd>
                  </div>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
