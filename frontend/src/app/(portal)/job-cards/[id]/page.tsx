'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Play, Pause, Check, Calendar, FileText, User, Package, AlertCircle, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { BomComponent, BomStatus } from '@/lib/api';
import {
  useJobCard,
  useStartJobCard,
  usePutJobCardOnHold,
  useResumeJobCard,
  useCompleteJobCard,
  useUpdateJobCardNotes,
} from '@/hooks/useJobCards';
import { useIssuesForJobCard, useCreateIssueFlag } from '@/hooks/useIssueFlags';
import { JobCardStatusBadge } from '@/components/job-cards/JobCardStatusBadge';
import { JobTypeBadge } from '@/components/job-cards/JobTypeBadge';
import { IssueFlagStatusBadge } from '@/components/issues/IssueFlagStatusBadge';
import { IssueFlagSeverityBadge } from '@/components/issues/IssueFlagSeverityBadge';
import { CreateIssueFlagModal } from '@/components/issues/CreateIssueFlagModal';

function formatDate(dateString: string | null): string {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function formatDateShort(dateString: string | null): string {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
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
        </div>
        <div className="h-64 bg-slate-200 rounded-lg" />
      </div>
    </div>
  );
}

export default function JobCardDetailPage() {
  const params = useParams();
  const jobCardId = params.id as string;

  const { data: jobCard, isLoading, error } = useJobCard(jobCardId);
  const { data: issues } = useIssuesForJobCard(jobCardId);
  const startJob = useStartJobCard();
  const putOnHold = usePutJobCardOnHold();
  const resumeJob = useResumeJobCard();
  const completeJob = useCompleteJobCard();
  const updateNotes = useUpdateJobCardNotes();
  const createIssue = useCreateIssueFlag();

  const [showHoldModal, setShowHoldModal] = useState(false);
  const [holdReason, setHoldReason] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [showFlagIssueModal, setShowFlagIssueModal] = useState(false);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !jobCard) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-red-600 mb-4">Job card not found</p>
        <Link href="/job-cards" className="text-primary-600 hover:text-primary-700">
          Back to Job Cards
        </Link>
      </div>
    );
  }

  const canStart = jobCard.status === 'PENDING';
  const canHold = jobCard.status === 'IN_PROGRESS';
  const canResume = jobCard.status === 'ON_HOLD';
  const canComplete = jobCard.status === 'IN_PROGRESS';

  const handleStartJob = async () => {
    const hasShortage = jobCard.bomStatus === 'SHORTAGE' || jobCard.bomStatus === 'PARTIAL';
    const message = hasShortage
      ? 'Warning: Insufficient raw materials for this job. Continue anyway?'
      : 'Start work on this job card?';
    if (window.confirm(message)) {
      await startJob.mutateAsync(jobCardId);
    }
  };

  const handlePutOnHold = async () => {
    if (!holdReason.trim()) return;
    await putOnHold.mutateAsync({ jobCardId, holdReason });
    setShowHoldModal(false);
    setHoldReason('');
  };

  const handleResumeJob = async () => {
    if (window.confirm('Resume work on this job card?')) {
      await resumeJob.mutateAsync(jobCardId);
    }
  };

  const handleCompleteJob = async () => {
    if (window.confirm('Mark this job card as complete?')) {
      await completeJob.mutateAsync(jobCardId);
    }
  };

  const handleEditNotes = () => {
    setEditedNotes(jobCard.notes || '');
    setIsEditingNotes(true);
  };

  const handleSaveNotes = async () => {
    await updateNotes.mutateAsync({ jobCardId, notes: editedNotes });
    setIsEditingNotes(false);
  };

  const handleCancelEditNotes = () => {
    setEditedNotes('');
    setIsEditingNotes(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/job-cards" className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">
                {jobCard.jobCardNumber}
              </h1>
              <JobCardStatusBadge status={jobCard.status} />
              <JobTypeBadge jobType={jobCard.jobType} />
            </div>
            <p className="text-sm text-slate-600">
              Created on {formatDateShort(jobCard.createdAt)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {canStart && (
            <button
              onClick={handleStartJob}
              disabled={startJob.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              {startJob.isPending ? 'Starting...' : 'Start Job'}
            </button>
          )}

          {canHold && (
            <button
              onClick={() => setShowHoldModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-amber-300 text-amber-600 text-sm font-medium rounded-md hover:bg-amber-50"
            >
              <Pause className="h-4 w-4" />
              Put on Hold
            </button>
          )}

          {canResume && (
            <button
              onClick={handleResumeJob}
              disabled={resumeJob.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              {resumeJob.isPending ? 'Resuming...' : 'Resume Job'}
            </button>
          )}

          {canComplete && (
            <button
              onClick={handleCompleteJob}
              disabled={completeJob.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {completeJob.isPending ? 'Completing...' : 'Complete Job'}
            </button>
          )}

          <button
            onClick={() => setShowFlagIssueModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-amber-300 bg-amber-50 text-amber-700 text-sm font-medium rounded-md hover:bg-amber-100"
          >
            <AlertTriangle className="h-4 w-4" />
            Flag Issue
          </button>
        </div>
      </div>

      {/* Hold Reason Banner */}
      {jobCard.status === 'ON_HOLD' && jobCard.holdReason && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-amber-50 border-amber-200 text-amber-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">Job on Hold</p>
            <p className="text-xs">{jobCard.holdReason}</p>
          </div>
        </div>
      )}

      {/* BOM Shortage Warning Banner */}
      {jobCard.bomStatus === 'SHORTAGE' && jobCard.bomComponents.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-red-50 border-red-200 text-red-700">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">Insufficient Raw Materials</p>
            <p className="text-xs">Review the bill of materials below before starting production.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Info */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Product Details</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-slate-500 uppercase">SKU</dt>
                <dd className="text-sm font-medium text-slate-900">{jobCard.productSku}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 uppercase">Description</dt>
                <dd className="text-sm text-slate-900">{jobCard.productDescription}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 uppercase">Quantity</dt>
                <dd className="text-sm font-medium text-slate-900">{jobCard.quantity}</dd>
              </div>
            </dl>
          </div>

          {/* BOM Components */}
          <BomComponentsSection
            bomComponents={jobCard.bomComponents}
            bomStatus={jobCard.bomStatus}
          />

          {/* Notes */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Notes</h2>
              {!isEditingNotes && jobCard.status !== 'COMPLETE' && (
                <button
                  onClick={handleEditNotes}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Edit
                </button>
              )}
            </div>

            {isEditingNotes ? (
              <div className="space-y-3">
                <textarea
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  placeholder="Add notes or special instructions..."
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleCancelEditNotes}
                    className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    disabled={updateNotes.isPending}
                    className="px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    {updateNotes.isPending ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-600 whitespace-pre-wrap">
                {jobCard.notes || 'No notes added.'}
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Details</h2>
            <dl className="space-y-3">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Order</dt>
                  <dd className="text-sm">
                    <Link
                      href={`/orders/${jobCard.orderId}`}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {jobCard.orderNumber}
                    </Link>
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Warehouse</dt>
                  <dd className="text-sm text-slate-900">Johannesburg (JHB)</dd>
                </div>
              </div>

              {jobCard.assignedToName && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Assigned To</dt>
                    <dd className="text-sm text-slate-900">{jobCard.assignedToName}</dd>
                  </div>
                </div>
              )}

              {jobCard.startedAt && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Started</dt>
                    <dd className="text-sm text-slate-900">{formatDate(jobCard.startedAt)}</dd>
                  </div>
                </div>
              )}

              {jobCard.completedAt && (
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Completed</dt>
                    <dd className="text-sm text-slate-900">{formatDate(jobCard.completedAt)}</dd>
                  </div>
                </div>
              )}
            </dl>
          </div>

          {/* Status Timeline */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Status</h2>
            <div className="space-y-3">
              <StatusStep
                label="Created"
                date={jobCard.createdAt}
                isComplete={true}
                isCurrent={jobCard.status === 'PENDING'}
              />
              <StatusStep
                label="In Progress"
                date={jobCard.startedAt}
                isComplete={!!jobCard.startedAt}
                isCurrent={jobCard.status === 'IN_PROGRESS'}
              />
              {jobCard.status === 'ON_HOLD' && (
                <StatusStep
                  label="On Hold"
                  date={null}
                  isComplete={false}
                  isCurrent={true}
                  isWarning={true}
                />
              )}
              <StatusStep
                label="Complete"
                date={jobCard.completedAt}
                isComplete={!!jobCard.completedAt}
                isCurrent={jobCard.status === 'COMPLETE'}
              />
            </div>
          </div>

          {/* Issues */}
          {issues && issues.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-slate-900">Issues</h2>
              </div>
              <div className="space-y-3">
                {issues.map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/issues/${issue.id}`}
                    className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-900">{issue.issueNumber}</span>
                      <IssueFlagStatusBadge status={issue.status} />
                    </div>
                    <p className="text-sm text-slate-600 truncate">{issue.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <IssueFlagSeverityBadge severity={issue.severity} showIcon={false} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hold Modal */}
      {showHoldModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowHoldModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Put Job on Hold</h3>
              <textarea
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                placeholder="Enter reason for hold..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowHoldModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePutOnHold}
                  disabled={!holdReason.trim() || putOnHold.isPending}
                  className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-700 disabled:opacity-50"
                >
                  {putOnHold.isPending ? 'Holding...' : 'Put on Hold'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flag Issue Modal */}
      <CreateIssueFlagModal
        isOpen={showFlagIssueModal}
        onClose={() => setShowFlagIssueModal(false)}
        onSubmit={async (data) => {
          await createIssue.mutateAsync(data);
        }}
        jobCardId={jobCardId}
        targetLabel={jobCard.jobCardNumber}
      />
    </div>
  );
}

function BomStatusBadge({ status }: { status: BomStatus }) {
  const config = {
    READY: { label: 'Ready', className: 'bg-green-100 text-green-700' },
    PARTIAL: { label: 'Partial', className: 'bg-amber-100 text-amber-700' },
    SHORTAGE: { label: 'Shortage', className: 'bg-red-100 text-red-700' },
  }[status];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

function BomComponentsSection({
  bomComponents,
  bomStatus,
}: {
  bomComponents: BomComponent[];
  bomStatus: BomStatus;
}) {
  if (bomComponents.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Bill of Materials</h2>
        <p className="text-sm text-slate-500">No bill of materials defined for this product.</p>
      </div>
    );
  }

  const requiredComponents = bomComponents.filter((c) => !c.isOptional);
  const readyCount = requiredComponents.filter((c) => c.canFulfill).length;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Bill of Materials</h2>
          <BomStatusBadge status={bomStatus} />
        </div>
        <span className="text-sm text-slate-500">
          {readyCount} of {requiredComponents.length} required components ready
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 pr-3 text-xs font-medium text-slate-500 uppercase">Component</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-slate-500 uppercase">Qty/Unit</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-slate-500 uppercase">Required</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-slate-500 uppercase">Available</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-slate-500 uppercase">Shortfall</th>
              <th className="text-center py-2 pl-3 text-xs font-medium text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bomComponents.map((component) => (
              <tr key={component.productId} className={component.isOptional ? 'text-slate-400' : ''}>
                <td className="py-2.5 pr-3">
                  <Link
                    href={`/inventory/items/${component.productId}`}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {component.sku}
                  </Link>
                  <div className={`text-xs ${component.isOptional ? 'text-slate-400' : 'text-slate-500'}`}>
                    {component.name}
                    {component.isOptional && (
                      <span className="ml-1.5 text-xs text-slate-400 italic">(optional)</span>
                    )}
                  </div>
                </td>
                <td className="text-right py-2.5 px-3 tabular-nums">
                  {component.quantityPerUnit}
                </td>
                <td className="text-right py-2.5 px-3 tabular-nums font-medium">
                  {component.requiredQuantity}
                </td>
                <td className="text-right py-2.5 px-3 tabular-nums">
                  {component.availableStock}
                </td>
                <td className={`text-right py-2.5 px-3 tabular-nums font-medium ${
                  component.shortfall > 0 && !component.isOptional ? 'text-red-600' : ''
                }`}>
                  {component.shortfall > 0 ? component.shortfall : '—'}
                </td>
                <td className="text-center py-2.5 pl-3">
                  {component.isOptional ? (
                    <span className="text-slate-300">—</span>
                  ) : component.canFulfill ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 inline-block" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 inline-block" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusStep({
  label,
  date,
  isComplete,
  isCurrent,
  isWarning = false,
}: {
  label: string;
  date: string | null;
  isComplete: boolean;
  isCurrent: boolean;
  isWarning?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-3 h-3 rounded-full flex-shrink-0 ${
          isWarning
            ? 'bg-amber-500'
            : isComplete
            ? 'bg-green-500'
            : isCurrent
            ? 'bg-primary-500'
            : 'bg-slate-200'
        }`}
      />
      <div className="flex-1">
        <div className={`text-sm font-medium ${isCurrent ? 'text-slate-900' : 'text-slate-600'}`}>
          {label}
        </div>
        {date && (
          <div className="text-xs text-slate-500">
            {new Intl.DateTimeFormat('en-ZA', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date(date))}
          </div>
        )}
      </div>
    </div>
  );
}
