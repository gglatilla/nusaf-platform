'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { IssueFlagListItem } from '@/lib/api';
import { IssueFlagStatusBadge } from './IssueFlagStatusBadge';
import { IssueFlagSeverityBadge } from './IssueFlagSeverityBadge';
import { IssueFlagCategoryBadge } from './IssueFlagCategoryBadge';

interface IssueListTableProps {
  issues: IssueFlagListItem[];
  loading?: boolean;
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(dateString));
}

function formatSlaDeadline(dateString: string): { text: string; isOverdue: boolean } {
  const deadline = new Date(dateString);
  const now = new Date();
  const isOverdue = deadline < now;

  if (isOverdue) {
    const hoursOverdue = Math.floor((now.getTime() - deadline.getTime()) / (1000 * 60 * 60));
    if (hoursOverdue < 24) {
      return { text: `${hoursOverdue}h overdue`, isOverdue: true };
    }
    const daysOverdue = Math.floor(hoursOverdue / 24);
    return { text: `${daysOverdue}d overdue`, isOverdue: true };
  }

  const hoursLeft = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
  if (hoursLeft < 24) {
    return { text: `${hoursLeft}h left`, isOverdue: false };
  }
  const daysLeft = Math.floor(hoursLeft / 24);
  return { text: `${daysLeft}d left`, isOverdue: false };
}

export function IssueListTable({ issues, loading }: IssueListTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="animate-pulse p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <p className="text-slate-500">No issues found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Issue
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Severity
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Target
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              SLA
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Created
            </th>
            <th className="relative px-4 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {issues.map((issue) => {
            const sla = issue.status !== 'RESOLVED' && issue.status !== 'CLOSED'
              ? formatSlaDeadline(issue.slaDeadline)
              : { text: '-', isOverdue: false };

            return (
              <tr key={issue.id} className="hover:bg-slate-50">
                <td className="px-4 py-4">
                  <div>
                    <Link
                      href={`/issues/${issue.id}`}
                      className="text-sm font-medium text-slate-900 hover:text-primary-600"
                    >
                      {issue.issueNumber}
                    </Link>
                    <p className="text-sm text-slate-500 truncate max-w-xs" title={issue.title}>
                      {issue.title}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <IssueFlagCategoryBadge category={issue.category} />
                </td>
                <td className="px-4 py-4">
                  <IssueFlagSeverityBadge severity={issue.severity} isOverdue={sla.isOverdue} />
                </td>
                <td className="px-4 py-4">
                  <IssueFlagStatusBadge status={issue.status} />
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-slate-600">
                    {issue.pickingSlipNumber || issue.jobCardNumber || '-'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-sm ${sla.isOverdue ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
                    {sla.text}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div>
                    <p className="text-sm text-slate-900">{formatDate(issue.createdAt)}</p>
                    <p className="text-xs text-slate-500">{issue.createdByName}</p>
                  </div>
                </td>
                <td className="px-4 py-4 text-right">
                  <Link
                    href={`/issues/${issue.id}`}
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
