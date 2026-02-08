'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Receipt, Search, Download } from 'lucide-react';
import { useTaxInvoices } from '@/hooks/useTaxInvoices';
import { useDownloadTaxInvoicePDF } from '@/hooks/useTaxInvoices';
import { Pagination } from '@/components/products/Pagination';
import type { TaxInvoiceStatus } from '@/lib/api';

const STATUS_OPTIONS: Array<{ value: TaxInvoiceStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ISSUED', label: 'Issued' },
  { value: 'VOIDED', label: 'Voided' },
];

function formatShortDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'short',
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

export default function TaxInvoicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusParam = searchParams.get('status') as TaxInvoiceStatus | null;
  const searchParam = searchParams.get('search');
  const pageParam = searchParams.get('page');

  const [status, setStatus] = useState<TaxInvoiceStatus | undefined>(statusParam || undefined);
  const [search, setSearch] = useState(searchParam || '');
  const [searchInput, setSearchInput] = useState(searchParam || '');
  const [page, setPage] = useState(pageParam ? parseInt(pageParam) : 1);

  const { data, isLoading } = useTaxInvoices({ status, search: search || undefined, page, pageSize: 20 });
  const download = useDownloadTaxInvoicePDF();

  const updateUrl = (newStatus?: TaxInvoiceStatus, newSearch?: string, newPage?: number) => {
    const params = new URLSearchParams();
    if (newStatus) params.set('status', newStatus);
    if (newSearch) params.set('search', newSearch);
    if (newPage && newPage > 1) params.set('page', newPage.toString());
    const queryString = params.toString();
    router.push(queryString ? `/tax-invoices?${queryString}` : '/tax-invoices');
  };

  const handleStatusChange = (newStatus: TaxInvoiceStatus | 'ALL') => {
    const statusValue = newStatus === 'ALL' ? undefined : newStatus;
    setStatus(statusValue);
    setPage(1);
    updateUrl(statusValue, search || undefined, 1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
    updateUrl(status, searchInput || undefined, 1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrl(status, search || undefined, newPage);
  };

  const invoices = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Receipt className="h-8 w-8 text-slate-400" />
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Tax Invoices</h1>
            <p className="text-sm text-slate-600">SARS-compliant tax invoices for delivered orders</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                (status === option.value) || (option.value === 'ALL' && !status)
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by invoice #, order #, or company..."
              className="pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-md w-80 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 animate-pulse">Loading tax invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            {search || status ? 'No tax invoices match your filters.' : 'No tax invoices have been created yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Invoice #</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Order #</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Customer</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Issue Date</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Total</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((ti) => (
                  <tr key={ti.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/tax-invoices/${ti.id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        {ti.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/orders/${ti.orderId}`}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        {ti.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">{ti.customerName}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatShortDate(ti.issueDate)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 text-right">
                      {formatCurrency(ti.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          ti.status === 'ISSUED'
                            ? 'bg-green-100 text-green-700'
                            : ti.status === 'DRAFT'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-slate-100 text-slate-500 line-through'
                        }`}
                      >
                        {ti.status === 'ISSUED' ? 'Issued' : ti.status === 'DRAFT' ? 'Draft' : 'Voided'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => download.mutate({ id: ti.id, invoiceNumber: ti.invoiceNumber })}
                        disabled={download.isPending}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary-600 bg-primary-50 rounded hover:bg-primary-100 disabled:opacity-50"
                        title="Download PDF"
                      >
                        <Download className="h-3.5 w-3.5" />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={data?.pageSize ?? 20}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
