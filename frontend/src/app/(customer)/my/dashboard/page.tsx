'use client';

import Link from 'next/link';
import {
  FileText,
  ShoppingCart,
  ArrowRight,
  Package,
  Building,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useQuotes, useActiveQuote } from '@/hooks/useQuotes';
import { useOrders } from '@/hooks/useOrders';
import { QuoteStatusBadge } from '@/components/quotes/QuoteStatusBadge';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { formatCurrency, formatDate } from '@/lib/formatting';

export default function CustomerDashboardPage() {
  const { user } = useAuthStore();
  const { data: quotesData } = useQuotes({ page: 1, pageSize: 5 });
  const { data: ordersData } = useOrders({ page: 1, pageSize: 5 });
  const { data: activeQuote } = useActiveQuote();

  const quotes = quotesData?.quotes ?? [];
  const orders = ordersData?.orders ?? [];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {user?.firstName}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {user?.company?.name} &middot; {user?.company?.tier} tier
        </p>
      </div>

      {/* Active Quote Banner */}
      {activeQuote && activeQuote.itemCount > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-900">
                Active Quote: {activeQuote.quoteNumber}
              </p>
              <p className="text-xs text-primary-700">
                {activeQuote.itemCount} item{activeQuote.itemCount !== 1 ? 's' : ''} &middot; {formatCurrency(activeQuote.total)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/my/products"
              className="text-sm font-medium text-primary-700 hover:text-primary-800"
            >
              Continue Shopping
            </Link>
            <Link
              href={`/my/quotes/${activeQuote.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
            >
              View Quote
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {quotesData?.pagination?.totalItems ?? 0}
              </p>
              <p className="text-sm text-slate-500">Total Quotes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {ordersData?.pagination?.totalItems ?? 0}
              </p>
              <p className="text-sm text-slate-500">Total Orders</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center">
              <Building className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                {user?.company?.name}
              </p>
              <p className="text-sm text-slate-500">
                {user?.company?.tier} &middot; {user?.company?.primaryWarehouse ?? 'JHB'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two column grid: Recent Quotes & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quotes */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent Quotes</h2>
            <Link
              href="/my/quotes"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View All
            </Link>
          </div>
          {quotes.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 mb-4">No quotes yet</p>
              <Link
                href="/my/products"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
              >
                <Package className="h-4 w-4" />
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {quotes.map((quote) => (
                <Link
                  key={quote.id}
                  href={`/my/quotes/${quote.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {quote.quoteNumber}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(quote.createdAt)} &middot; {quote.itemCount} item{quote.itemCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-900">
                      {formatCurrency(quote.total)}
                    </span>
                    <QuoteStatusBadge status={quote.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent Orders</h2>
            <Link
              href="/my/orders"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View All
            </Link>
          </div>
          {orders.length === 0 ? (
            <div className="p-8 text-center">
              <ShoppingCart className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No orders yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Orders are created from accepted quotes
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/my/orders/${order.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(order.createdAt)} &middot; {order.lineCount} line{order.lineCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-900">
                      {formatCurrency(order.total)}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
