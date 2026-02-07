'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/layout/PageHeader';
import { useCycleCounts } from '@/hooks/useInventory';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CycleCountStatus } from '@/lib/api';

const STATUS_TABS: { value: CycleCountStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'RECONCILED', label: 'Reconciled' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  OPEN: { label: 'Open', className: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-amber-100 text-amber-700' },
  COMPLETED: { label: 'Completed', className: 'bg-purple-100 text-purple-700' },
  RECONCILED: { label: 'Reconciled', className: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
};

const WAREHOUSE_NAMES: Record<string, string> = { JHB: 'Johannesburg', CT: 'Cape Town' };

export default function CycleCountsListPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<CycleCountStatus | 'ALL'>('ALL');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useCycleCounts({
    status: activeTab === 'ALL' ? undefined : activeTab,
    location: locationFilter || undefined,
    page,
    pageSize: 20,
  });

  const canCreate = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'WAREHOUSE';

  return (
    <>
      <PageHeader
        title="Cycle Counts"
        description="Manage physical stock verification sessions"
        actions={
          canCreate ? (
            <Link
              href="/inventory/cycle-counts/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Count
            </Link>
          ) : undefined
        }
      />
      <div className="p-4 sm:p-6 xl:p-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          {/* Status tabs */}
          <div className="flex flex-wrap gap-1 bg-slate-100 rounded-lg p-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setActiveTab(tab.value); setPage(1); }}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                  activeTab === tab.value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Location filter */}
          <select
            value={locationFilter}
            onChange={(e) => { setLocationFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Warehouses</option>
            <option value="JHB">Johannesburg</option>
            <option value="CT">Cape Town</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-pulse space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 bg-slate-100 rounded" />
                ))}
              </div>
            </div>
          ) : data && data.sessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Session #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Adjustment
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-20">
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.sessions.map((session) => {
                    const badge = STATUS_BADGE[session.status];
                    return (
                      <tr key={session.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <Link
                            href={`/inventory/cycle-counts/${session.id}`}
                            className="text-sm font-mono font-semibold text-primary-600 hover:text-primary-800 hover:underline"
                          >
                            {session.sessionNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {new Date(session.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex px-2 py-0.5 text-xs font-medium rounded-full', badge.className)}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
                            {WAREHOUSE_NAMES[session.location] || session.location}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-200 rounded-full h-1.5">
                              <div
                                className={cn(
                                  'h-1.5 rounded-full',
                                  session.countedLineCount === session.lineCount ? 'bg-green-500' : 'bg-primary-500'
                                )}
                                style={{
                                  width: `${session.lineCount > 0 ? (session.countedLineCount / session.lineCount) * 100 : 0}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs font-mono text-slate-500">
                              {session.countedLineCount}/{session.lineCount}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {session.adjustmentNumber ? (
                            <span className="font-mono text-slate-700">{session.adjustmentNumber}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/inventory/cycle-counts/${session.id}`}
                            className="text-xs font-medium text-primary-600 hover:text-primary-800"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-900 mb-1">No cycle counts found</p>
              <p className="text-sm text-slate-500 mb-4">
                {activeTab !== 'ALL'
                  ? `No cycle counts with status "${STATUS_TABS.find((t) => t.value === activeTab)?.label}"`
                  : 'Create your first cycle count to start verifying stock'}
              </p>
              {canCreate && activeTab === 'ALL' && (
                <Link
                  href="/inventory/cycle-counts/new"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
                >
                  <Plus className="h-4 w-4" />
                  New Count
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-slate-600">
              Page {data.pagination.page} of {data.pagination.totalPages}
              {' '}({data.pagination.totalItems} total)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page >= data.pagination.totalPages}
                className="p-2 text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
