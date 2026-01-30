'use client';

import { useState } from 'react';
import { Filter } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { IssueListTable } from '@/components/issues/IssueListTable';
import { useIssueFlags } from '@/hooks/useIssueFlags';
import type { IssueFlagStatus, IssueFlagSeverity, IssueFlagCategory } from '@/lib/api';

const STATUS_OPTIONS: { value: IssueFlagStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'PENDING_INFO', label: 'Pending Info' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

const SEVERITY_OPTIONS: { value: IssueFlagSeverity | ''; label: string }[] = [
  { value: '', label: 'All Severities' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

const CATEGORY_OPTIONS: { value: IssueFlagCategory | ''; label: string }[] = [
  { value: '', label: 'All Categories' },
  { value: 'STOCK', label: 'Stock' },
  { value: 'QUALITY', label: 'Quality' },
  { value: 'PRODUCTION', label: 'Production' },
  { value: 'TIMING', label: 'Timing' },
  { value: 'DOCUMENTATION', label: 'Documentation' },
];

export default function IssuesPage() {
  const [status, setStatus] = useState<IssueFlagStatus | ''>('');
  const [severity, setSeverity] = useState<IssueFlagSeverity | ''>('');
  const [category, setCategory] = useState<IssueFlagCategory | ''>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useIssueFlags({
    status: status || undefined,
    severity: severity || undefined,
    category: category || undefined,
    page,
    pageSize: 20,
  });

  const issues = data?.issueFlags ?? [];
  const pagination = data?.pagination;

  return (
    <>
      <PageHeader
        title="Issues"
        description="Track and resolve flagged issues"
      />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Filters</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as IssueFlagStatus | '');
                  setPage(1);
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => {
                  setSeverity(e.target.value as IssueFlagSeverity | '');
                  setPage(1);
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {SEVERITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as IssueFlagCategory | '');
                  setPage(1);
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Issues list */}
        <IssueListTable issues={issues} loading={isLoading} />

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} of{' '}
              {pagination.totalItems} issues
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
