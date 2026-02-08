'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  XCircle,
  Calendar,
  Building,
  FileText,
  Receipt,
  User,
} from 'lucide-react';
import { useTaxInvoice, useVoidTaxInvoice, useDownloadTaxInvoicePDF } from '@/hooks/useTaxInvoices';

function formatDate(dateString: string | null): string {
  if (!dateString) return '\u2014';
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount);
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

export default function TaxInvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;

  const { data: invoice, isLoading, error } = useTaxInvoice(invoiceId);
  const voidInvoice = useVoidTaxInvoice();
  const download = useDownloadTaxInvoicePDF();

  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState('');

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-red-600 mb-4">Tax invoice not found</p>
        <Link href="/tax-invoices" className="text-primary-600 hover:text-primary-700">
          Back to Tax Invoices
        </Link>
      </div>
    );
  }

  const handleVoid = async () => {
    if (!voidReason.trim()) return;
    await voidInvoice.mutateAsync({ id: invoiceId, reason: voidReason });
    setShowVoidModal(false);
    setVoidReason('');
  };

  const handleDownload = () => {
    download.mutate({ id: invoiceId, invoiceNumber: invoice.invoiceNumber });
  };

  const canVoid = invoice.status === 'ISSUED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/tax-invoices" className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">{invoice.invoiceNumber}</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                TAX INVOICE
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  invoice.status === 'ISSUED'
                    ? 'bg-green-100 text-green-700'
                    : invoice.status === 'DRAFT'
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-red-100 text-red-600 line-through'
                }`}
              >
                {invoice.status === 'ISSUED' ? 'Issued' : invoice.status === 'DRAFT' ? 'Draft' : 'Voided'}
              </span>
            </div>
            <p className="text-sm text-slate-600">
              Issued on {formatDate(invoice.issueDate)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={download.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {download.isPending ? 'Downloading...' : 'Download PDF'}
          </button>
          {canVoid && (
            <button
              onClick={() => setShowVoidModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-md hover:bg-red-50"
            >
              <XCircle className="h-4 w-4" />
              Void
            </button>
          )}
        </div>
      </div>

      {/* Void banner */}
      {invoice.status === 'VOIDED' && invoice.voidReason && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-red-50 border-red-200 text-red-700">
          <XCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">Invoice Voided</p>
            <p className="text-xs">{invoice.voidReason}</p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Details */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Seller */}
              <div>
                <h3 className="text-xs font-medium text-slate-500 uppercase mb-2">From</h3>
                <p className="text-sm font-semibold text-slate-900">Nusaf Dynamic Technologies</p>
                <p className="text-xs text-slate-500 mt-1">VAT: 4290298106</p>
              </div>
              {/* Buyer */}
              <div>
                <h3 className="text-xs font-medium text-slate-500 uppercase mb-2">Bill To</h3>
                <p className="text-sm font-semibold text-slate-900">{invoice.customerName}</p>
                {invoice.customerVatNumber && (
                  <p className="text-xs text-slate-500 mt-1">VAT: {invoice.customerVatNumber}</p>
                )}
                {invoice.customerRegNumber && (
                  <p className="text-xs text-slate-500">Reg: {invoice.customerRegNumber}</p>
                )}
                {invoice.billingAddress && (
                  <p className="text-xs text-slate-500 mt-1">{invoice.billingAddress}</p>
                )}
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Line Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase pb-3 pr-4">#</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase pb-3 pr-4">SKU</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase pb-3 pr-4">Description</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase pb-3 pr-4">UoM</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase pb-3 pr-4">Qty</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase pb-3 pr-4">Unit Price</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase pb-3">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.lines.map((line) => (
                    <tr key={line.id}>
                      <td className="py-3 pr-4 text-sm text-slate-500">{line.lineNumber}</td>
                      <td className="py-3 pr-4 text-sm font-mono text-slate-700">{line.productSku}</td>
                      <td className="py-3 pr-4 text-sm text-slate-900">{line.productDescription}</td>
                      <td className="py-3 pr-4 text-sm text-slate-500">{line.unitOfMeasure}</td>
                      <td className="py-3 pr-4 text-sm text-slate-900 text-right">{line.quantity}</td>
                      <td className="py-3 pr-4 text-sm text-slate-900 text-right">{formatCurrency(line.unitPrice)}</td>
                      <td className="py-3 text-sm font-medium text-slate-900 text-right">{formatCurrency(line.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-6 border-t border-slate-200 pt-4">
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center justify-between w-64">
                  <span className="text-sm text-slate-600">Subtotal</span>
                  <span className="text-sm font-medium text-slate-900">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between w-64">
                  <span className="text-sm text-slate-600">VAT ({invoice.vatRate}%)</span>
                  <span className="text-sm font-medium text-slate-900">{formatCurrency(invoice.vatAmount)}</span>
                </div>
                <div className="flex items-center justify-between w-64 border-t border-slate-200 pt-2">
                  <span className="text-base font-semibold text-slate-900">Total</span>
                  <span className="text-base font-semibold text-slate-900">{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Notes</h2>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Details</h2>
            <dl className="space-y-3">
              <div className="flex items-start gap-3">
                <Receipt className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Invoice Number</dt>
                  <dd className="text-sm text-slate-900">{invoice.invoiceNumber}</dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Order</dt>
                  <dd className="text-sm">
                    <Link
                      href={`/orders/${invoice.orderId}`}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {invoice.orderNumber}
                    </Link>
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Customer</dt>
                  <dd className="text-sm text-slate-900">{invoice.customerName}</dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Issue Date</dt>
                  <dd className="text-sm text-slate-900">{formatDate(invoice.issueDate)}</dd>
                </div>
              </div>

              {invoice.dueDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Due Date</dt>
                    <dd className="text-sm text-slate-900">{formatDate(invoice.dueDate)}</dd>
                  </div>
                </div>
              )}

              {invoice.issuedByName && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Issued By</dt>
                    <dd className="text-sm text-slate-900">{invoice.issuedByName}</dd>
                  </div>
                </div>
              )}
            </dl>
          </div>

          {/* Totals Summary */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Summary</h2>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-slate-600">Subtotal</dt>
                <dd className="text-sm font-medium text-slate-900">{formatCurrency(invoice.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-slate-600">VAT ({invoice.vatRate}%)</dt>
                <dd className="text-sm font-medium text-slate-900">{formatCurrency(invoice.vatAmount)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <dt className="text-base font-semibold text-slate-900">Total</dt>
                <dd className="text-base font-semibold text-slate-900">{formatCurrency(invoice.total)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Void Modal */}
      {showVoidModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowVoidModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Void Tax Invoice
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                This will mark tax invoice <strong>{invoice.invoiceNumber}</strong> as voided. A new invoice can be generated afterward. This action cannot be undone.
              </p>
              <textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Enter reason for voiding..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowVoidModal(false);
                    setVoidReason('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVoid}
                  disabled={!voidReason.trim() || voidInvoice.isPending}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {voidInvoice.isPending ? 'Voiding...' : 'Void Invoice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
