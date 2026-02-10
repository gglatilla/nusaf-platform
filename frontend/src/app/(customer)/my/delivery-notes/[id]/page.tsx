'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, MapPin, Calendar, FileText, User } from 'lucide-react';
import { useDeliveryNote, useConfirmDelivery } from '@/hooks/useDeliveryNotes';
import { DeliveryNoteStatusBadge } from '@/components/delivery-notes/DeliveryNoteStatusBadge';
import type { DeliveryNoteStatus, ConfirmDeliveryLineInput } from '@/lib/api';
import { formatDate } from '@/lib/formatting';

const PIPELINE_STEPS: Array<{ status: DeliveryNoteStatus; label: string }> = [
  { status: 'DRAFT', label: 'Preparing' },
  { status: 'DISPATCHED', label: 'Dispatched' },
  { status: 'DELIVERED', label: 'Delivered' },
];

function getStepState(
  stepStatus: DeliveryNoteStatus,
  currentStatus: DeliveryNoteStatus,
): 'completed' | 'current' | 'upcoming' | 'cancelled' {
  if (currentStatus === 'CANCELLED') return 'cancelled';
  const order = ['DRAFT', 'DISPATCHED', 'DELIVERED'];
  const stepIdx = order.indexOf(stepStatus);
  const currentIdx = order.indexOf(currentStatus);
  if (stepIdx < currentIdx) return 'completed';
  if (stepIdx === currentIdx) return 'current';
  return 'upcoming';
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-6 w-6 bg-slate-200 rounded" />
        <div className="h-8 bg-slate-200 rounded w-48" />
      </div>
      <div className="h-48 bg-slate-200 rounded-lg" />
    </div>
  );
}

export default function CustomerDeliveryNoteDetailPage() {
  const params = useParams();
  const deliveryNoteId = params.id as string;

  const { data: deliveryNote, isLoading, error } = useDeliveryNote(deliveryNoteId);
  const confirmDelivery = useConfirmDelivery();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deliveredByName, setDeliveredByName] = useState('');
  const [signatureNotes, setSignatureNotes] = useState('');
  const [confirmLines, setConfirmLines] = useState<
    Array<{ lineId: string; quantityReceived: number; quantityDamaged: number; damageNotes: string }>
  >([]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !deliveryNote) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-red-600 mb-4">Delivery note not found</p>
        <Link href="/my/orders" className="text-primary-600 hover:text-primary-700">
          Back to My Orders
        </Link>
      </div>
    );
  }

  const canConfirmReceipt = deliveryNote.status === 'DISPATCHED';

  const openConfirmModal = () => {
    setConfirmLines(
      deliveryNote.lines.map((line) => ({
        lineId: line.id,
        quantityReceived: line.quantityDispatched,
        quantityDamaged: 0,
        damageNotes: '',
      })),
    );
    setDeliveredByName('');
    setSignatureNotes('');
    setShowConfirmModal(true);
  };

  const handleConfirmReceipt = async () => {
    if (!deliveredByName.trim()) return;

    const lines: ConfirmDeliveryLineInput[] = confirmLines.map((cl) => ({
      lineId: cl.lineId,
      quantityReceived: cl.quantityReceived,
      quantityDamaged: cl.quantityDamaged > 0 ? cl.quantityDamaged : undefined,
      damageNotes: cl.damageNotes.trim() || undefined,
    }));

    await confirmDelivery.mutateAsync({
      id: deliveryNoteId,
      data: {
        deliveredByName: deliveredByName.trim(),
        signatureNotes: signatureNotes.trim() || undefined,
        lines,
      },
    });
    setShowConfirmModal(false);
  };

  const updateConfirmLine = (
    lineId: string,
    field: 'quantityReceived' | 'quantityDamaged' | 'damageNotes',
    value: number | string,
  ) => {
    setConfirmLines((prev) =>
      prev.map((cl) => (cl.lineId === lineId ? { ...cl, [field]: value } : cl)),
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/my/orders/${deliveryNote.orderId}`} className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">
                {deliveryNote.deliveryNoteNumber}
              </h1>
              <DeliveryNoteStatusBadge status={deliveryNote.status} />
            </div>
            <p className="text-sm text-slate-600">
              Created on {formatDate(deliveryNote.createdAt)}
            </p>
          </div>
        </div>

        {canConfirmReceipt && (
          <button
            onClick={openConfirmModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
          >
            <Check className="h-4 w-4" />
            Confirm Receipt
          </button>
        )}
      </div>

      {/* Pipeline Steps */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          {PIPELINE_STEPS.map((step, idx) => {
            const state = getStepState(step.status, deliveryNote.status);
            return (
              <div key={step.status} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      state === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : state === 'current'
                          ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500'
                          : state === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {state === 'completed' ? <Check className="h-4 w-4" /> : idx + 1}
                  </div>
                  <span
                    className={`text-xs mt-1 ${
                      state === 'completed' || state === 'current'
                        ? 'text-slate-900 font-medium'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < PIPELINE_STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 ${
                      state === 'completed' ? 'bg-green-300' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Items</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Product
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                      Qty Dispatched
                    </th>
                    {deliveryNote.status === 'DELIVERED' && (
                      <>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                          Received
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                          Damaged
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {deliveryNote.lines.map((line) => (
                    <tr key={line.id}>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-slate-900">{line.productSku}</div>
                        <div className="text-xs text-slate-500">{line.productDescription}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900 font-medium text-right">
                        {line.quantityDispatched} {line.unitOfMeasure}
                      </td>
                      {deliveryNote.status === 'DELIVERED' && (
                        <>
                          <td className="px-4 py-3 text-sm text-green-600 font-medium text-right">
                            {line.quantityReceived}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {line.quantityDamaged > 0 ? (
                              <span className="text-red-600 font-medium">{line.quantityDamaged}</span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Damage notes */}
            {deliveryNote.status === 'DELIVERED' &&
              deliveryNote.lines.some((l) => l.quantityDamaged > 0 && l.damageNotes) && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                  <h3 className="text-sm font-medium text-red-800 mb-2">Damage Notes</h3>
                  <ul className="space-y-1">
                    {deliveryNote.lines
                      .filter((l) => l.quantityDamaged > 0 && l.damageNotes)
                      .map((l) => (
                        <li key={l.id} className="text-sm text-red-700">
                          <span className="font-medium">{l.productSku}:</span> {l.damageNotes}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
          </div>

          {/* Delivery Confirmation Notes */}
          {deliveryNote.signatureNotes && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Delivery Notes</h2>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{deliveryNote.signatureNotes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Details</h2>
            <dl className="space-y-3">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Order</dt>
                  <dd className="text-sm">
                    <Link
                      href={`/my/orders/${deliveryNote.orderId}`}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {deliveryNote.orderNumber}
                    </Link>
                  </dd>
                </div>
              </div>

              {deliveryNote.deliveryAddress && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Delivery Address</dt>
                    <dd className="text-sm text-slate-900 whitespace-pre-line">
                      {deliveryNote.deliveryAddress}
                    </dd>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Created</dt>
                  <dd className="text-sm text-slate-900">{formatDate(deliveryNote.createdAt)}</dd>
                </div>
              </div>

              {deliveryNote.dispatchedAt && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Dispatched</dt>
                    <dd className="text-sm text-slate-900">{formatDate(deliveryNote.dispatchedAt)}</dd>
                  </div>
                </div>
              )}

              {deliveryNote.deliveredAt && (
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Delivered</dt>
                    <dd className="text-sm text-slate-900">{formatDate(deliveryNote.deliveredAt)}</dd>
                    {deliveryNote.deliveredByName && (
                      <dd className="text-xs text-slate-500">
                        Received by {deliveryNote.deliveredByName}
                      </dd>
                    )}
                  </div>
                </div>
              )}
            </dl>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Summary</h2>
            <dl className="space-y-2">
              <div className="flex justify-between text-sm">
                <dt className="text-slate-600">Total Items</dt>
                <dd className="font-medium text-slate-900">{deliveryNote.lines.length}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-slate-600">Qty Dispatched</dt>
                <dd className="font-medium text-slate-900">
                  {deliveryNote.lines.reduce((sum, l) => sum + l.quantityDispatched, 0)}
                </dd>
              </div>
              {deliveryNote.status === 'DELIVERED' && (
                <div className="flex justify-between text-sm">
                  <dt className="text-slate-600">Qty Received</dt>
                  <dd className="font-medium text-green-600">
                    {deliveryNote.lines.reduce((sum, l) => sum + l.quantityReceived, 0)}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* Confirm Receipt Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowConfirmModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Confirm Receipt</h3>
              <p className="text-sm text-slate-600 mb-4">
                Please confirm that you have received the goods below and note any damage.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={deliveredByName}
                    onChange={(e) => setDeliveredByName(e.target.value)}
                    placeholder="Name of person receiving goods"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={signatureNotes}
                    onChange={(e) => setSignatureNotes(e.target.value)}
                    placeholder="Any additional notes about the delivery..."
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Items Received</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">
                            Product
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">
                            Dispatched
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">
                            Received
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">
                            Damaged
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">
                            Damage Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {deliveryNote.lines.map((line) => {
                          const cl = confirmLines.find((c) => c.lineId === line.id);
                          if (!cl) return null;
                          return (
                            <tr key={line.id}>
                              <td className="px-3 py-2">
                                <div className="font-medium text-slate-900">{line.productSku}</div>
                                <div className="text-xs text-slate-500">{line.productDescription}</div>
                              </td>
                              <td className="px-3 py-2 text-right text-slate-600">
                                {line.quantityDispatched}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <input
                                  type="number"
                                  min={0}
                                  max={line.quantityDispatched}
                                  value={cl.quantityReceived}
                                  onChange={(e) =>
                                    updateConfirmLine(line.id, 'quantityReceived', parseInt(e.target.value) || 0)
                                  }
                                  className="w-20 px-2 py-1 border border-slate-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary-500"
                                />
                              </td>
                              <td className="px-3 py-2 text-right">
                                <input
                                  type="number"
                                  min={0}
                                  max={cl.quantityReceived}
                                  value={cl.quantityDamaged}
                                  onChange={(e) =>
                                    updateConfirmLine(line.id, 'quantityDamaged', parseInt(e.target.value) || 0)
                                  }
                                  className="w-20 px-2 py-1 border border-slate-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary-500"
                                />
                              </td>
                              <td className="px-3 py-2">
                                {cl.quantityDamaged > 0 && (
                                  <input
                                    type="text"
                                    value={cl.damageNotes}
                                    onChange={(e) =>
                                      updateConfirmLine(line.id, 'damageNotes', e.target.value)
                                    }
                                    placeholder="Describe damage..."
                                    className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                                  />
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReceipt}
                  disabled={!deliveredByName.trim() || confirmDelivery.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {confirmDelivery.isPending ? 'Confirming...' : 'Confirm Receipt'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
