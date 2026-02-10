'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { IssueFlagStatusBadge } from '@/components/issues/IssueFlagStatusBadge';
import { IssueFlagSeverityBadge } from '@/components/issues/IssueFlagSeverityBadge';
import { IssueFlagCategoryBadge } from '@/components/issues/IssueFlagCategoryBadge';
import { IssueCommentThread } from '@/components/issues/IssueCommentThread';
import {
  useIssueFlag,
  useUpdateIssueFlagStatus,
  useAddIssueComment,
  useResolveIssue,
  useCloseIssue,
} from '@/hooks/useIssueFlags';
import type { IssueFlagStatus } from '@/lib/api';

function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function formatSlaDeadline(dateString: string, status: IssueFlagStatus): { text: string; isOverdue: boolean } {
  if (status === 'RESOLVED' || status === 'CLOSED') {
    return { text: 'N/A', isOverdue: false };
  }

  const deadline = new Date(dateString);
  const now = new Date();
  const isOverdue = deadline < now;

  const diff = Math.abs(deadline.getTime() - now.getTime());
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (isOverdue) {
    if (hours < 24) {
      return { text: `${hours}h overdue`, isOverdue: true };
    }
    return { text: `${days}d overdue`, isOverdue: true };
  }

  if (hours < 24) {
    return { text: `${hours}h remaining`, isOverdue: false };
  }
  return { text: `${days}d remaining`, isOverdue: false };
}

export default function IssueDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: issue, isLoading } = useIssueFlag(id);
  const updateStatus = useUpdateIssueFlagStatus();
  const addComment = useAddIssueComment();
  const resolveIssue = useResolveIssue();
  const closeIssue = useCloseIssue();

  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolution, setResolution] = useState('');

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 xl:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-24 bg-slate-200 rounded" />
          <div className="h-48 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="p-4 sm:p-6 xl:p-8">
        <p className="text-slate-600">The requested issue could not be found.</p>
        <Link href="/issues" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
          Back to Issues
        </Link>
      </div>
    );
  }

  const sla = formatSlaDeadline(issue.slaDeadline, issue.status);
  const isClosed = issue.status === 'CLOSED';
  const isResolved = issue.status === 'RESOLVED';

  const handleStatusChange = async (newStatus: IssueFlagStatus) => {
    await updateStatus.mutateAsync({ id, status: newStatus });
  };

  const handleAddComment = async (content: string) => {
    await addComment.mutateAsync({ id, content });
  };

  const handleResolve = async () => {
    if (!resolution.trim()) return;
    await resolveIssue.mutateAsync({ id, resolution: resolution.trim() });
    setShowResolveModal(false);
    setResolution('');
  };

  const handleClose = async () => {
    await closeIssue.mutateAsync(id);
  };

  return (
    <>
      <div className="p-4 sm:p-6 xl:p-8 space-y-6">
        <Breadcrumb items={[{ label: 'Issues', href: '/issues' }, { label: issue.issueNumber }]} />

        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{issue.issueNumber}</h1>
          <p className="mt-1 text-sm text-slate-500">{issue.title}</p>
        </div>
        {/* Status and badges */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex flex-wrap gap-3 mb-6">
            <IssueFlagStatusBadge status={issue.status} />
            <IssueFlagSeverityBadge severity={issue.severity} isOverdue={sla.isOverdue} />
            <IssueFlagCategoryBadge category={issue.category} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* SLA */}
            <div className="flex items-start gap-3">
              <Clock className={`h-5 w-5 mt-0.5 ${sla.isOverdue ? 'text-red-500' : 'text-slate-400'}`} />
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">SLA Deadline</p>
                <p className={`text-sm font-medium ${sla.isOverdue ? 'text-red-600' : 'text-slate-900'}`}>
                  {sla.text}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDateTime(issue.slaDeadline)}
                </p>
              </div>
            </div>

            {/* Created */}
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Created</p>
              <p className="text-sm font-medium text-slate-900">{formatDateTime(issue.createdAt)}</p>
              <p className="text-xs text-slate-500">by {issue.createdByName}</p>
            </div>

            {/* Target */}
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Target</p>
              {issue.pickingSlip ? (
                <Link
                  href={`/picking-slips/${issue.pickingSlip.id}`}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  {issue.pickingSlip.pickingSlipNumber}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              ) : issue.jobCard ? (
                <Link
                  href={`/job-cards/${issue.jobCard.id}`}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  {issue.jobCard.jobCardNumber}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              ) : (
                <p className="text-sm text-slate-500">-</p>
              )}
              {(issue.pickingSlip || issue.jobCard) && (
                <p className="text-xs text-slate-500">
                  Order: {issue.pickingSlip?.orderNumber || issue.jobCard?.orderNumber}
                </p>
              )}
            </div>

            {/* Resolution */}
            {isResolved || isClosed ? (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Resolved</p>
                <p className="text-sm font-medium text-slate-900">
                  {issue.resolvedAt ? formatDateTime(issue.resolvedAt) : '-'}
                </p>
                {issue.resolvedByName && (
                  <p className="text-xs text-slate-500">by {issue.resolvedByName}</p>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-sm font-medium text-slate-900 mb-3">Description</h3>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{issue.description}</p>
        </div>

        {/* Resolution (if resolved) */}
        {issue.resolution && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="text-sm font-medium text-green-800">Resolution</h3>
            </div>
            <p className="text-sm text-green-700 whitespace-pre-wrap">{issue.resolution}</p>
          </div>
        )}

        {/* Actions */}
        {!isClosed && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-sm font-medium text-slate-900 mb-4">Actions</h3>
            <div className="flex flex-wrap gap-3">
              {issue.status === 'OPEN' && (
                <button
                  onClick={() => handleStatusChange('IN_PROGRESS')}
                  disabled={updateStatus.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  Start Working
                </button>
              )}
              {issue.status === 'IN_PROGRESS' && (
                <>
                  <button
                    onClick={() => handleStatusChange('PENDING_INFO')}
                    disabled={updateStatus.isPending}
                    className="px-4 py-2 bg-amber-600 text-white rounded-md text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
                  >
                    Request Info
                  </button>
                  <button
                    onClick={() => setShowResolveModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                  >
                    Resolve Issue
                  </button>
                </>
              )}
              {issue.status === 'PENDING_INFO' && (
                <button
                  onClick={() => handleStatusChange('IN_PROGRESS')}
                  disabled={updateStatus.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  Resume Working
                </button>
              )}
              {isResolved && (
                <button
                  onClick={handleClose}
                  disabled={closeIssue.isPending}
                  className="px-4 py-2 bg-slate-600 text-white rounded-md text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
                >
                  Close Issue
                </button>
              )}
              {!isResolved && (
                <button
                  onClick={() => setShowResolveModal(true)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50"
                >
                  Mark Resolved
                </button>
              )}
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-sm font-medium text-slate-900 mb-4">Comments</h3>
          <IssueCommentThread
            comments={issue.comments}
            onAddComment={handleAddComment}
            isSubmitting={addComment.isPending}
            disabled={isClosed}
          />
        </div>
      </div>

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowResolveModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h2 className="text-lg font-semibold text-slate-900">Resolve Issue</h2>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Resolution
                </label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Describe how the issue was resolved..."
                  rows={4}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolve}
                  disabled={!resolution.trim() || resolveIssue.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {resolveIssue.isPending ? 'Resolving...' : 'Resolve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
