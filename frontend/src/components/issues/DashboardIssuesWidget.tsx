'use client';

import Link from 'next/link';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { useIssueFlagStats } from '@/hooks/useIssueFlags';

export function DashboardIssuesWidget() {
  const { data: stats, isLoading } = useIssueFlagStats();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-slate-200 rounded w-1/3 mb-4" />
          <div className="h-20 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900">Open Issues</h2>
          </div>
          <Link href="/issues" className="text-sm text-primary-600 hover:text-primary-700">
            View all
          </Link>
        </div>
        <div className="text-center py-4">
          <p className="text-slate-500 text-sm">No open issues</p>
          <p className="text-slate-400 text-xs mt-1">
            All issues have been resolved
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-slate-900">Open Issues</h2>
        </div>
        <Link href="/issues" className="text-sm text-primary-600 hover:text-primary-700">
          View all
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-xs text-slate-500">Open issues</p>
        </div>
        {stats.overdue > 0 && (
          <div className="bg-red-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            <p className="text-xs text-red-600">Overdue</p>
          </div>
        )}
      </div>

      {/* Severity breakdown */}
      <div className="space-y-2">
        {stats.bySeverity.CRITICAL > 0 && (
          <Link href="/issues?severity=CRITICAL" className="flex items-center justify-between p-2 rounded hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-sm text-slate-700">Critical</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-900">{stats.bySeverity.CRITICAL}</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>
          </Link>
        )}
        {stats.bySeverity.HIGH > 0 && (
          <Link href="/issues?severity=HIGH" className="flex items-center justify-between p-2 rounded hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-sm text-slate-700">High</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-900">{stats.bySeverity.HIGH}</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>
          </Link>
        )}
        {stats.bySeverity.MEDIUM > 0 && (
          <Link href="/issues?severity=MEDIUM" className="flex items-center justify-between p-2 rounded hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-sm text-slate-700">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-900">{stats.bySeverity.MEDIUM}</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>
          </Link>
        )}
        {stats.bySeverity.LOW > 0 && (
          <Link href="/issues?severity=LOW" className="flex items-center justify-between p-2 rounded hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-sm text-slate-700">Low</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-900">{stats.bySeverity.LOW}</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
