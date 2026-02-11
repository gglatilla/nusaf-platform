'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  X,
  Send,
  Calendar,
  Trash2,
  ShoppingCart,
  CheckCircle,
} from 'lucide-react';
import {
  useQuote,
  useFinalizeQuote,
  useRejectQuote,
  useUpdateQuoteNotes,
  useDeleteQuote,
} from '@/hooks/useQuotes';
import { QuoteStatusBadge } from '@/components/quotes/QuoteStatusBadge';
import { QuoteItemsTable } from '@/components/quotes/QuoteItemsTable';
import { QuoteTotals } from '@/components/quotes/QuoteTotals';
import { formatDate } from '@/lib/formatting';

function getValidityInfo(
  validUntil: string | null,
  status: string
): { text: string; className: string } | null {
  if (!validUntil || status !== 'CREATED') return null;

  const now = new Date();
  const expiry = new Date(validUntil);
  const diffDays = Math.ceil(
    (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) {
    return {
      text: 'This quote has expired',
      className: 'bg-red-50 border-red-200 text-red-700',
    };
  }
  if (diffDays === 0) {
    return {
      text: 'Quote expires today',
      className: 'bg-amber-50 border-amber-200 text-amber-700',
    };
  }
  if (diffDays <= 7) {
    return {
      text: `Quote expires in ${diffDays} day${diffDays === 1 ? '' : 's'}`,
      className: 'bg-amber-50 border-amber-200 text-amber-700',
    };
  }
  return {
    text: `Valid for ${diffDays} days`,
    className: 'bg-green-50 border-green-200 text-green-700',
  };
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-6 w-6 bg-slate-200 rounded" />
        <div className="h-8 bg-slate-200 rounded w-48" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="h-48 bg-slate-200 rounded-lg" />
          <div className="h-32 bg-slate-200 rounded-lg" />
        </div>
        <div className="h-64 bg-slate-200 rounded-lg" />
      </div>
    </div>
  );
}

export default function CustomerQuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;

  const { data: quote, isLoading, error } = useQuote(quoteId);
  const finalize = useFinalizeQuote();
  const reject = useRejectQuote();
  const deleteQuote = useDeleteQuote();
  const updateNotes = useUpdateQuoteNotes();

  const [notes, setNotes] = useState('');
  const [notesEditing, setNotesEditing] = useState(false);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !quote) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-red-600 mb-4">Quote not found</p>
        <Link
          href="/my/quotes"
          className="text-primary-600 hover:text-primary-700"
        >
          Back to My Quotes
        </Link>
      </div>
    );
  }

  const isEditable = quote.status === 'DRAFT';
  const canFinalize = quote.status === 'DRAFT' && quote.items.length > 0;
  const canCheckout = quote.status === 'CREATED';
  const validityInfo = getValidityInfo(quote.validUntil, quote.status);

  const handleFinalize = async () => {
    if (
      confirm(
        'Submit this quote for review? It will be locked for editing and valid for 30 days.'
      )
    ) {
      await finalize.mutateAsync(quoteId);
    }
  };

  const handleReject = async () => {
    if (confirm('Reject this quote?')) {
      await reject.mutateAsync(quoteId);
    }
  };

  const handleDelete = async () => {
    if (confirm('Delete this draft quote?')) {
      await deleteQuote.mutateAsync(quoteId);
      router.push('/my/quotes');
    }
  };

  const handleSaveNotes = async () => {
    await updateNotes.mutateAsync({ quoteId, notes });
    setNotesEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/my/quotes"
            className="text-slate-400 hover:text-slate-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">
                {quote.quoteNumber}
              </h1>
              <QuoteStatusBadge status={quote.status} />
            </div>
            <p className="text-sm text-slate-600">
              Created on {formatDate(quote.createdAt)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isEditable && (
            <button
              onClick={handleDelete}
              disabled={deleteQuote.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-md hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {deleteQuote.isPending ? 'Deleting...' : 'Delete'}
            </button>
          )}

          {canFinalize && (
            <button
              onClick={handleFinalize}
              disabled={finalize.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {finalize.isPending ? 'Submitting...' : 'Submit Quote'}
            </button>
          )}

          {canCheckout && (
            <>
              <Link
                href={`/my/quotes/${quoteId}/checkout`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
              >
                <ShoppingCart className="h-4 w-4" />
                Proceed to Checkout
              </Link>
              <button
                onClick={handleReject}
                disabled={reject.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                {reject.isPending ? 'Rejecting...' : 'Reject'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Order Created Banner */}
      {quote.convertedOrder && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-green-50 border-green-200 text-green-700">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Your order has been created</p>
          </div>
          <Link
            href={`/my/orders/${quote.convertedOrder.id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-800"
          >
            View Order {quote.convertedOrder.orderNumber} &rarr;
          </Link>
        </div>
      )}

      {/* Validity Banner */}
      {validityInfo && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${validityInfo.className}`}
        >
          <Calendar className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">{validityInfo.text}</p>
            {quote.validUntil && (
              <p className="text-xs opacity-75">
                Expires on {formatDate(quote.validUntil)}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Items
            </h2>
            <QuoteItemsTable
              quoteId={quoteId}
              items={quote.items}
              isEditable={isEditable}
              isCustomer
            />
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Notes
            </h2>
            {isEditable ? (
              notesEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes or special instructions..."
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveNotes}
                      disabled={updateNotes.isPending}
                      className="px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50"
                    >
                      {updateNotes.isPending ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setNotesEditing(false)}
                      className="px-3 py-1.5 text-slate-600 text-sm font-medium hover:text-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {quote.customerNotes ? (
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">
                      {quote.customerNotes}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400 italic">
                      No notes added
                    </p>
                  )}
                  <button
                    onClick={() => {
                      setNotes(quote.customerNotes || '');
                      setNotesEditing(true);
                    }}
                    className="mt-3 text-sm text-primary-600 hover:text-primary-700"
                  >
                    {quote.customerNotes ? 'Edit notes' : 'Add notes'}
                  </button>
                </div>
              )
            ) : (
              <div>
                {quote.customerNotes ? (
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    {quote.customerNotes}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 italic">No notes</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Totals */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Summary
            </h2>
            <QuoteTotals
              subtotal={quote.subtotal}
              vatRate={quote.vatRate}
              vatAmount={quote.vatAmount}
              total={quote.total}
            />
          </div>

          {/* Details */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Details
            </h2>
            <dl className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-slate-500 uppercase">
                    {quote.validUntil ? 'Valid Until' : 'Last Updated'}
                  </dt>
                  <dd className="text-sm text-slate-900">
                    {quote.validUntil
                      ? formatDate(quote.validUntil)
                      : formatDate(quote.updatedAt)}
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          {/* Continue Shopping */}
          {isEditable && (
            <Link
              href="/my/products"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-primary-600 text-primary-600 text-sm font-medium rounded-md hover:bg-primary-50 transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              Continue Shopping
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
