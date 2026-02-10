'use client';

import { useState } from 'react';
import { Download, FileText, XCircle } from 'lucide-react';
import { useDownloadProformaInvoicePDF, useVoidProformaInvoice } from '@/hooks/useProformaInvoices';
import type { ProformaInvoiceSummary } from '@/lib/api';
import { formatCurrency } from '@/lib/formatting';

interface ProformaInvoicesSectionProps {
  proformaInvoices: ProformaInvoiceSummary[];
  isCustomer?: boolean;
  canVoid?: boolean;
}

function formatShortDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

export function ProformaInvoicesSection({
  proformaInvoices,
  isCustomer = false,
  canVoid = false,
}: ProformaInvoicesSectionProps) {
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const download = useDownloadProformaInvoicePDF();
  const voidPI = useVoidProformaInvoice();

  // Customers only see ACTIVE proformas
  const filtered = isCustomer
    ? proformaInvoices.filter((pi) => pi.status === 'ACTIVE')
    : proformaInvoices;

  if (!filtered || filtered.length === 0) return null;

  const handleVoid = async (id: string) => {
    if (!voidReason.trim()) return;
    await voidPI.mutateAsync({ id, reason: voidReason });
    setVoidingId(null);
    setVoidReason('');
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-900">Proforma Invoices</h2>
        </div>
        <span className="text-sm text-slate-500">
          {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-3">
        {filtered.map((pi) => (
          <div
            key={pi.id}
            className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-slate-900">
                {pi.proformaNumber}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  pi.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-500 line-through'
                }`}
              >
                {pi.status === 'ACTIVE' ? 'Active' : 'Voided'}
              </span>
              <span className="text-xs text-slate-500">
                {formatShortDate(pi.issueDate)}
              </span>
              <span className="text-sm font-medium text-slate-700">
                {formatCurrency(pi.total)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  download.mutate({ id: pi.id, proformaNumber: pi.proformaNumber })
                }
                disabled={download.isPending}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 disabled:opacity-50"
                title="Download PDF"
              >
                <Download className="h-3.5 w-3.5" />
                PDF
              </button>

              {canVoid && pi.status === 'ACTIVE' && (
                <button
                  onClick={() => setVoidingId(pi.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
                  title="Void proforma invoice"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Void
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Void confirmation modal */}
      {voidingId && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setVoidingId(null)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Void Proforma Invoice
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                This will mark the proforma invoice as voided. It cannot be undone.
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
                    setVoidingId(null);
                    setVoidReason('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleVoid(voidingId)}
                  disabled={!voidReason.trim() || voidPI.isPending}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {voidPI.isPending ? 'Voiding...' : 'Void Invoice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
