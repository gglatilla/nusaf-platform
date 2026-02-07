'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FileText, ShoppingCart } from 'lucide-react';
import { QuoteListTable } from '@/components/quotes/QuoteListTable';
import { Pagination } from '@/components/products';
import { useQuotes, useActiveQuote } from '@/hooks/useQuotes';
import type { QuoteStatus } from '@/lib/api';

type StatusFilter = 'ALL' | 'DRAFT' | 'CREATED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'DRAFT', label: 'Drafts' },
  { value: 'CREATED', label: 'Submitted' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CONVERTED', label: 'Ordered' },
];

export default function CustomerQuotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlStatus = (searchParams.get('status') || 'ALL') as StatusFilter;
  const urlPage = parseInt(searchParams.get('page') || '1', 10);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>(urlStatus);
  const [page, setPage] = useState(urlPage);

  const { data: activeQuote } = useActiveQuote();
  const { data: quotesData, isLoading } = useQuotes({
    status: statusFilter !== 'ALL' ? statusFilter as QuoteStatus : undefined,
    page,
    pageSize: 20,
  });

  const quotes = quotesData?.quotes ?? [];
  const pagination = quotesData?.pagination ?? {
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
    hasMore: false,
  };

  const updateUrl = (params: { status?: StatusFilter; page?: number }) => {
    const newParams = new URLSearchParams();
    const newStatus = params.status ?? statusFilter;
    const newPage = params.page ?? page;
    if (newStatus !== 'ALL') newParams.set('status', newStatus);
    if (newPage > 1) newParams.set('page', newPage.toString());
    const query = newParams.toString();
    router.push(query ? `/my/quotes?${query}` : '/my/quotes', { scroll: false });
  };

  const handleStatusChange = (status: StatusFilter) => {
    setStatusFilter(status);
    setPage(1);
    updateUrl({ status, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrl({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Quotes</h1>
            <p className="mt-1 text-sm text-slate-500">
              View and manage your quote requests
            </p>
          </div>
          <Link
            href="/my/products"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
          >
            <ShoppingCart className="h-4 w-4" />
            Browse Products
          </Link>
        </div>
      </div>

      {/* Active draft banner */}
      {activeQuote && activeQuote.items.length > 0 && (
        <div className="mb-6 bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary-600" />
              <div>
                <p className="text-sm font-medium text-primary-900">
                  Active Quote: {activeQuote.quoteNumber}
                </p>
                <p className="text-xs text-primary-700">
                  {activeQuote.items.length} {activeQuote.items.length === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>
            <Link
              href={`/my/quotes/${activeQuote.id}`}
              className="text-sm font-medium text-primary-700 hover:text-primary-800"
            >
              View Quote
            </Link>
          </div>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleStatusChange(tab.value)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
              statusFilter === tab.value
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Quote list */}
      <QuoteListTable
        quotes={quotes}
        isLoading={isLoading}
        linkPrefix="/my/quotes"
        browseHref="/my/products"
      />

      {/* Pagination */}
      {!isLoading && pagination.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </>
  );
}
