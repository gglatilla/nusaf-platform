'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/layout/PageHeader';
import { useQuotes } from '@/hooks/useQuotes';
import { QuoteStatusBadge } from '@/components/quotes/QuoteStatusBadge';
import { DashboardIssuesWidget } from '@/components/issues/DashboardIssuesWidget';
import { formatCurrency, formatDate } from '@/lib/formatting';

export default function DashboardPage() {
  const { user } = useAuthStore();

  // Fetch quotes data for dashboard stats
  const { data: draftQuotes } = useQuotes({ status: 'DRAFT', pageSize: 5 });
  const { data: createdQuotes } = useQuotes({ status: 'CREATED', pageSize: 5 });
  const { data: allQuotes } = useQuotes({ pageSize: 5 });

  const draftCount = draftQuotes?.pagination.totalItems ?? 0;
  const pendingCount = createdQuotes?.pagination.totalItems ?? 0;
  const recentQuotes = allQuotes?.quotes ?? [];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.firstName}`}
      />

      <div className="p-4 sm:p-6 xl:p-8">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Active Orders"
            value="0"
            change="No orders yet"
          />
          <StatCard
            label="Draft Quotes"
            value={draftCount.toString()}
            change={draftCount > 0 ? `${draftCount} in progress` : 'No drafts'}
          />
          <StatCard
            label="Submitted Quotes"
            value={pendingCount.toString()}
            change={pendingCount > 0 ? `${pendingCount} awaiting response` : 'No pending quotes'}
          />
          <StatCard
            label="Last Order"
            value="—"
            change="No recent orders"
          />
        </div>

        {/* Content cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Recent Orders
            </h2>
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">No orders yet</p>
              <p className="text-slate-400 text-xs mt-1">
                Your recent orders will appear here
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Recent Quotes
              </h2>
              <Link href="/quotes" className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
            {recentQuotes.length > 0 ? (
              <div className="space-y-3">
                {recentQuotes.map((quote) => (
                  <Link
                    key={quote.id}
                    href={`/quotes/${quote.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{quote.quoteNumber}</p>
                        <p className="text-xs text-slate-500">{formatDate(quote.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <QuoteStatusBadge status={quote.status} />
                      <span className="text-sm font-medium text-slate-900">{formatCurrency(quote.total)}</span>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm">No quotes yet</p>
                <p className="text-slate-400 text-xs mt-1">
                  Browse products to request a quote
                </p>
                <Link
                  href="/catalog"
                  className="inline-block mt-4 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
                >
                  Browse Products
                </Link>
              </div>
            )}
          </div>

          {/* Issues Widget */}
          <DashboardIssuesWidget />
        </div>

        {/* Account info */}
        <div className="mt-6 bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Account Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Company
              </p>
              <p className="mt-1 text-base font-semibold text-slate-900">
                {user?.company.name}
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Tier
              </p>
              <p className="mt-1 text-base font-semibold text-slate-900">
                {user?.company.tier.replace('_', ' ')}
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Role
              </p>
              <p className="mt-1 text-base font-semibold text-slate-900">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
}

function StatCard({ label, value, change, positive }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {change && (
        <p
          className={`mt-1 text-xs ${
            positive === true
              ? 'text-success'
              : positive === false
                ? 'text-error'
                : 'text-slate-400'
          }`}
        >
          {change}
        </p>
      )}
    </div>
  );
}
