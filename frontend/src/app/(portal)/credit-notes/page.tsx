'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, Search, Download, Filter, X } from 'lucide-react';
import { useCreditNotes, useDownloadCreditNotePDF } from '@/hooks/useCreditNotes';
import { Pagination } from '@/components/products/Pagination';
import type { CreditNoteStatus } from '@/lib/api';
import { formatCurrency } from '@/lib/formatting';

const STATUS_OPTIONS: Array<{ value: CreditNoteStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ISSUED', label: 'Issued' },
  { value: 'VOIDED', label: 'Voided' },
];

function formatShortDate(dateString: string | null): string {
  if (!dateString) return '\u2014';
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

export default function CreditNotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusParam = searchParams.get('status') as CreditNoteStatus | null;
  const searchParam = searchParams.get('search');
  const pageParam = searchParams.get('page');

  const [status, setStatus] = useState<CreditNoteStatus | undefined>(statusParam || undefined);
  const [search, setSearch] = useState(searchParam || '');
  const [searchInput, setSearchInput] = useState(searchParam || '');
  const [page, setPage] = useState(pageParam ? parseInt(pageParam) : 1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useCreditNotes({
    status,
    search: search || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    pageSize: 20,
  });
  const download = useDownloadCreditNotePDF();

  const updateUrl = (newStatus?: CreditNoteStatus, newSearch?: string, newPage?: number) => {
    const params = new URLSearchParams();
    if (newStatus) params.set('status', newStatus);
    if (newSearch) params.set('search', newSearch);
    if (newPage && newPage > 1) params.set('page', newPage.toString());
    const queryString = params.toString();
    router.push(queryString ? `/credit-notes?${queryString}` : '/credit-notes');
  };

  const handleStatusChange = (newStatus: CreditNoteStatus | 'ALL') => {
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

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setShowFilters(false);
  };

  const hasActiveFilters = !!dateFrom || !!dateTo;

  const creditNotes = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-slate-400" />
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Credit Notes</h1>
            <p className="text-sm text-slate-600">Credit notes issued for returned goods</p>
          </div>
        </div>
      </div>

      {/* Filters Row */}
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
              placeholder="Search by CN #, RA #, order #, or company..."
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

        {/* More Filters Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors ${
            hasActiveFilters
              ? 'bg-primary-50 border-primary-200 text-primary-700'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-100 text-primary-700 rounded-full">!</span>
          )}
        </button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Issue Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Issue Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900"
              >
                <X className="h-3.5 w-3.5" />
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 animate-pulse">Loading credit notes...</div>
        ) : creditNotes.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            {search || status || hasActiveFilters ? 'No credit notes match your filters.' : 'No credit notes have been created yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Credit Note #</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">RA #</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Order #</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Customer</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Issue Date</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Total</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {creditNotes.map((cn) => (
                  <tr key={cn.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/credit-notes/${cn.id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        {cn.creditNoteNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                      {cn.raNumber}
                    </td>
                    <td className="px-4 py-3">
                      {cn.orderId ? (
                        <Link
                          href={`/orders/${cn.orderId}`}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          {cn.orderNumber}
                        </Link>
                      ) : (
                        <span className="text-sm text-slate-400">&mdash;</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">{cn.customerName}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatShortDate(cn.issueDate)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 text-right">
                      {formatCurrency(cn.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          cn.status === 'ISSUED'
                            ? 'bg-green-100 text-green-700'
                            : cn.status === 'DRAFT'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-slate-100 text-slate-500 line-through'
                        }`}
                      >
                        {cn.status === 'ISSUED' ? 'Issued' : cn.status === 'DRAFT' ? 'Draft' : 'Voided'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => download.mutate({ id: cn.id, creditNoteNumber: cn.creditNoteNumber })}
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
