'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Check,
  X,
  Download,
  Pencil,
  MapPin,
  Calendar,
  FileText,
  Package,
  Boxes,
  AlertTriangle,
} from 'lucide-react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import {
  usePackingList,
  useFinalizePackingList,
  useCancelPackingList,
  useDownloadPackingListPDF,
} from '@/hooks/usePackingLists';
import { PackingListStatusBadge } from '@/components/packing-lists/PackingListStatusBadge';
import type { PackingListStatus, PackingListLine } from '@/lib/api';

function formatDate(dateString: string | null): string {
  if (!dateString) return '\u2014';
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function formatDateShort(dateString: string | null): string {
  if (!dateString) return '\u2014';
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

function getLocationLabel(location: string): string {
  return location === 'JHB' ? 'Johannesburg' : 'Cape Town';
}

const PIPELINE_STEPS: Array<{ status: PackingListStatus; label: string }> = [
  { status: 'DRAFT', label: 'Draft' },
  { status: 'FINALIZED', label: 'Finalized' },
];

export default function PackingListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: packingList, isLoading, error } = usePackingList(id);
  const finalizeMutation = useFinalizePackingList();
  const cancelMutation = useCancelPackingList();
  const downloadPDF = useDownloadPackingListPDF();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading packing list...</div>;
  }

  if (error || !packingList) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Packing list not found</p>
        <Link href="/packing-lists" className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block">
          Back to Packing Lists
        </Link>
      </div>
    );
  }

  const isCancelled = packingList.status === 'CANCELLED';
  const isDraft = packingList.status === 'DRAFT';
  const isFinalized = packingList.status === 'FINALIZED';

  const handleFinalize = async () => {
    if (!window.confirm('Finalize this packing list? It will be locked for editing.')) return;
    await finalizeMutation.mutateAsync(id);
  };

  const handleCancel = async () => {
    await cancelMutation.mutateAsync(id);
    setShowCancelConfirm(false);
  };

  const handleDownloadPDF = async () => {
    try {
      const blob = await downloadPDF.mutateAsync(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${packingList.packingListNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download failed:', err);
    }
  };

  // Group lines by package number
  const linesByPackage = new Map<number, PackingListLine[]>();
  for (const line of packingList.lines) {
    const existing = linesByPackage.get(line.packageNumber) || [];
    existing.push(line);
    linesByPackage.set(line.packageNumber, existing);
  }

  const totalGrossWeight = packingList.packages.reduce((sum, p) => sum + (p.grossWeight ?? 0), 0);
  const totalNetWeight = packingList.packages.reduce((sum, p) => sum + (p.netWeight ?? 0), 0);
  const totalItems = packingList.lines.reduce((sum, l) => sum + l.quantity, 0);

  // Pipeline step progress
  const statusIndex = PIPELINE_STEPS.findIndex((s) => s.status === packingList.status);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Packing Lists', href: '/packing-lists' }, { label: packingList.packingListNumber }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">{packingList.packingListNumber}</h1>
            <PackingListStatusBadge status={packingList.status} />
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Created {formatDateShort(packingList.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isDraft && (
            <>
              <Link
                href={`/packing-lists/${id}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
              <button
                onClick={handleFinalize}
                disabled={finalizeMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                {finalizeMutation.isPending ? 'Finalizing...' : 'Finalize'}
              </button>
            </>
          )}
          {isFinalized && (
            <button
              onClick={handleDownloadPDF}
              disabled={downloadPDF.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {downloadPDF.isPending ? 'Generating...' : 'Download PDF'}
            </button>
          )}
          {!isCancelled && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-md hover:bg-red-50"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Cancelled Banner */}
      {isCancelled && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">This packing list has been cancelled.</p>
        </div>
      )}

      {/* Pipeline Steps */}
      {!isCancelled && (
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-center gap-8">
            {PIPELINE_STEPS.map((step, index) => {
              const isActive = index <= statusIndex;
              const isCurrent = step.status === packingList.status;
              return (
                <div key={step.status} className="flex items-center gap-3">
                  {index > 0 && (
                    <div className={`w-16 h-0.5 ${isActive ? 'bg-green-500' : 'bg-slate-200'}`} />
                  )}
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isActive
                          ? isCurrent
                            ? 'bg-green-500 text-white'
                            : 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isActive && !isCurrent ? <Check className="h-4 w-4" /> : index + 1}
                    </div>
                    <span className={`text-xs ${isActive ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Grid */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-medium text-slate-900 mb-4">Shipment Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Order</span>
                <Link
                  href={`/orders/${packingList.orderId}`}
                  className="block text-primary-600 hover:text-primary-700 font-medium"
                >
                  {packingList.orderNumber}
                </Link>
              </div>
              <div>
                <span className="text-slate-500">Customer</span>
                <p className="text-slate-900 font-medium">{packingList.customerName}</p>
              </div>
              {packingList.deliveryNoteNumber && (
                <div>
                  <span className="text-slate-500">Delivery Note</span>
                  <Link
                    href={`/delivery-notes/${packingList.deliveryNoteId}`}
                    className="block text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {packingList.deliveryNoteNumber}
                  </Link>
                </div>
              )}
              <div>
                <span className="text-slate-500">Location</span>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-slate-900">{getLocationLabel(packingList.location)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Package Summary */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-slate-400" />
              Packages ({packingList.packages.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {packingList.packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="border border-slate-200 rounded-lg p-4 bg-slate-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900">Package {pkg.packageNumber}</span>
                    <span className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded font-medium text-slate-600">
                      {pkg.packageType}
                    </span>
                  </div>
                  {(pkg.length != null && pkg.width != null && pkg.height != null) && (
                    <p className="text-xs text-slate-500">
                      {pkg.length} x {pkg.width} x {pkg.height} cm
                    </p>
                  )}
                  <div className="flex gap-4 mt-1 text-xs text-slate-500">
                    {pkg.grossWeight != null && <span>Gross: {pkg.grossWeight} kg</span>}
                    {pkg.netWeight != null && <span>Net: {pkg.netWeight} kg</span>}
                  </div>
                  {pkg.notes && (
                    <p className="text-xs text-slate-400 mt-1">{pkg.notes}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Totals Bar */}
            <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-slate-500">Total Packages:</span>{' '}
                <span className="font-medium text-slate-900">{packingList.packages.length}</span>
              </div>
              <div>
                <span className="text-slate-500">Total Items:</span>{' '}
                <span className="font-medium text-slate-900">{totalItems}</span>
              </div>
              {totalGrossWeight > 0 && (
                <div>
                  <span className="text-slate-500">Total Gross:</span>{' '}
                  <span className="font-medium text-slate-900">{totalGrossWeight.toFixed(2)} kg</span>
                </div>
              )}
              {totalNetWeight > 0 && (
                <div>
                  <span className="text-slate-500">Total Net:</span>{' '}
                  <span className="font-medium text-slate-900">{totalNetWeight.toFixed(2)} kg</span>
                </div>
              )}
            </div>
          </div>

          {/* Items by Package */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
              <Boxes className="h-5 w-5 text-slate-400" />
              Items by Package
            </h2>
            <div className="space-y-4">
              {Array.from(linesByPackage.entries())
                .sort(([a], [b]) => a - b)
                .map(([pkgNum, lines]) => {
                  const pkg = packingList.packages.find((p) => p.packageNumber === pkgNum);
                  return (
                    <div key={pkgNum}>
                      <div className="bg-sky-50 border border-sky-200 rounded-t-md px-4 py-2">
                        <span className="text-sm font-medium text-sky-800">
                          Package {pkgNum}{pkg ? ` \u2014 ${pkg.packageType}` : ''}
                        </span>
                      </div>
                      <div className="border border-t-0 border-slate-200 rounded-b-md overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">#</th>
                              <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">SKU</th>
                              <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Description</th>
                              <th className="text-right px-4 py-2 text-xs font-medium text-slate-500">Qty</th>
                              <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">UoM</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {lines.map((line) => (
                              <tr key={line.id} className="hover:bg-slate-50">
                                <td className="px-4 py-2 text-sm text-slate-500">{line.lineNumber}</td>
                                <td className="px-4 py-2">
                                  <Link
                                    href={`/inventory/items/${encodeURIComponent(line.productSku)}`}
                                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                  >
                                    {line.productSku}
                                  </Link>
                                </td>
                                <td className="px-4 py-2 text-sm text-slate-700">{line.productDescription}</td>
                                <td className="px-4 py-2 text-sm text-slate-900 text-right font-medium">{line.quantity}</td>
                                <td className="px-4 py-2 text-sm text-slate-500">{line.unitOfMeasure}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Handling Instructions */}
          {packingList.handlingInstructions && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-amber-800 mb-1">Handling Instructions</h3>
              <p className="text-sm text-amber-700">{packingList.handlingInstructions}</p>
            </div>
          )}

          {/* Notes */}
          {packingList.notes && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-sm font-medium text-slate-900 mb-2">Notes</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{packingList.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-sm font-medium text-slate-900 mb-4">Audit Trail</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-slate-500">Created</p>
                  <p className="text-slate-900">{formatDate(packingList.createdAt)}</p>
                </div>
              </div>
              {packingList.finalizedAt && (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-slate-500">Finalized</p>
                    <p className="text-slate-900">{formatDate(packingList.finalizedAt)}</p>
                    {packingList.finalizedByName && (
                      <p className="text-slate-500">by {packingList.finalizedByName}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-slate-900 mb-2">Cancel Packing List</h3>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to cancel packing list {packingList.packingListNumber}? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md"
              >
                Keep
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Packing List'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
