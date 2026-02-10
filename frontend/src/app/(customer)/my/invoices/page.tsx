'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Download, Receipt } from 'lucide-react';
import { useTaxInvoices, useDownloadTaxInvoicePDF } from '@/hooks/useTaxInvoices';
import { Pagination } from '@/components/products/Pagination';
import { formatCurrency, formatDate } from '@/lib/formatting';

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  ISSUED: { label: 'Issued', className: 'bg-green-100 text-green-700' },
  VOIDED: { label: 'Voided', className: 'bg-red-100 text-red-700' },
};

export default function CustomerInvoicesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useTaxInvoices({ page, pageSize: 20 });
  const download = useDownloadTaxInvoicePDF();

  const invoices = data?.data ?? [];
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  const handleDownload = async (invoiceId: string, invoiceNumber: string) => {
    try {
      await download.mutateAsync({ id: invoiceId, invoiceNumber });
    } catch {
      // Download error handled by mutation
    }
  };

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Invoices</h1>
        <p className="mt-1 text-sm text-slate-500">
          View and download your tax invoices
        </p>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="hidden sm:table-cell px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Total
                </th>
                <th className="hidden md:table-cell px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Issue Date
                </th>
                <th className="hidden lg:table-cell px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 lg:px-6 py-4"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                    <td className="px-4 lg:px-6 py-4"><div className="h-5 bg-slate-200 rounded w-16" /></td>
                    <td className="hidden sm:table-cell px-4 lg:px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                    <td className="px-4 lg:px-6 py-4"><div className="h-4 bg-slate-200 rounded w-20" /></td>
                    <td className="hidden md:table-cell px-4 lg:px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                    <td className="hidden lg:table-cell px-4 lg:px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                    <td className="px-4 lg:px-6 py-4"><div className="h-4 bg-slate-200 rounded w-8" /></td>
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-lg font-medium text-slate-900 mb-1">No invoices yet</p>
                    <p className="text-sm text-slate-500">
                      Invoices will appear here once your orders are delivered and invoiced.
                    </p>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => {
                  const badge = STATUS_BADGE[invoice.status];
                  const isOverdue = invoice.dueDate && invoice.status === 'ISSUED' && new Date(invoice.dueDate) < new Date();

                  return (
                    <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/tax-invoices/${invoice.id}`}
                          className="text-sm font-medium text-primary-600 hover:text-primary-700"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge?.className || 'bg-slate-100 text-slate-600'}`}>
                          {badge?.label || invoice.status}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell px-4 lg:px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/my/orders/${invoice.orderId}`}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          {invoice.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {formatCurrency(invoice.total)}
                      </td>
                      <td className="hidden md:table-cell px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {formatDate(invoice.issueDate)}
                      </td>
                      <td className="hidden lg:table-cell px-4 lg:px-6 py-4 whitespace-nowrap text-sm">
                        {invoice.dueDate ? (
                          <span className={isOverdue ? 'text-red-600 font-medium' : 'text-slate-600'}>
                            {formatDate(invoice.dueDate)}
                            {isOverdue && ' (overdue)'}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDownload(invoice.id, invoice.invoiceNumber)}
                          disabled={download.isPending}
                          className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
                          title="Download PDF"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            page={data?.page ?? 1}
            totalPages={totalPages}
            totalItems={data?.total ?? 0}
            pageSize={data?.pageSize ?? 20}
            onPageChange={setPage}
          />
        </div>
      )}
    </>
  );
}
