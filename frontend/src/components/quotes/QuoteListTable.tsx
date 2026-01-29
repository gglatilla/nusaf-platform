'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { QuoteListItem } from '@/lib/api';
import { QuoteStatusBadge } from './QuoteStatusBadge';

interface QuoteListTableProps {
  quotes: QuoteListItem[];
  isLoading?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

function getExpiryInfo(validUntil: string | null, status: string): { text: string; className: string } | null {
  if (!validUntil || status !== 'CREATED') return null;

  const now = new Date();
  const expiry = new Date(validUntil);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (status === 'EXPIRED' || diffDays < 0) {
    return { text: 'Expired', className: 'text-red-600 bg-red-50' };
  }

  if (diffDays === 0) {
    return { text: 'Expires today', className: 'text-amber-600 bg-amber-50' };
  }

  if (diffDays <= 7) {
    return { text: `${diffDays}d left`, className: 'text-amber-600 bg-amber-50' };
  }

  return { text: `${diffDays}d left`, className: 'text-slate-600 bg-slate-50' };
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-28" />
      </td>
      <td className="px-6 py-4">
        <div className="h-5 bg-slate-200 rounded w-20" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-8" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-24" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-16" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-20" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-4" />
      </td>
    </tr>
  );
}

export function QuoteListTable({ quotes, isLoading }: QuoteListTableProps) {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Quote #
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Valid Until
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[...Array(5)].map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
        <div className="text-slate-400 text-5xl mb-4">📋</div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No quotes yet</h3>
        <p className="text-sm text-slate-600 mb-4">
          When you create quotes, they will appear here.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Quote #
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Items
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Total
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Valid Until
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {quotes.map((quote) => {
            const expiryInfo = getExpiryInfo(quote.validUntil, quote.status);
            return (
              <tr key={quote.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/quotes/${quote.id}`}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    {quote.quoteNumber}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <QuoteStatusBadge status={quote.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {quote.itemCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                  {formatCurrency(quote.total)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {expiryInfo ? (
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${expiryInfo.className}`}>
                      {expiryInfo.text}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {formatDate(quote.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <Link
                    href={`/quotes/${quote.id}`}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
