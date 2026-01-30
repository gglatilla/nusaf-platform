'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Play, Pause, Check, Calendar, FileText, User, Package, AlertCircle } from 'lucide-react';
import {
  useJobCard,
  useStartJobCard,
  usePutJobCardOnHold,
  useResumeJobCard,
  useCompleteJobCard,
  useUpdateJobCardNotes,
} from '@/hooks/useJobCards';
import { JobCardStatusBadge } from '@/components/job-cards/JobCardStatusBadge';
import { JobTypeBadge } from '@/components/job-cards/JobTypeBadge';

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
  const startJob = useStartJobCard();
  const putOnHold = usePutJobCardOnHold();
  const resumeJob = useResumeJobCard();
  const completeJob = useCompleteJobCard();
  const updateNotes = useUpdateJobCardNotes();

  const [showHoldModal, setShowHoldModal] = useState(false);
  const [holdReason, setHoldReason] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');

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
    if (window.confirm('Start work on this job card?')) {
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
