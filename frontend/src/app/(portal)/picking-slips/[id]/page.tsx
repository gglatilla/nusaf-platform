'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Play, Check, MapPin, Calendar, FileText, User, AlertTriangle } from 'lucide-react';
import {
  usePickingSlip,
  useStartPicking,
  useUpdatePickingSlipLine,
  useCompletePicking,
} from '@/hooks/usePickingSlips';
import { useIssuesForPickingSlip, useCreateIssueFlag } from '@/hooks/useIssueFlags';
import { PickingSlipStatusBadge } from '@/components/picking-slips/PickingSlipStatusBadge';
import { PickingSlipLineTable } from '@/components/picking-slips/PickingSlipLineTable';
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

function getLocationLabel(location: string): string {
  return location === 'JHB' ? 'Johannesburg' : 'Cape Town';
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

export default function PickingSlipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pickingSlipId = params.id as string;

  const { data: pickingSlip, isLoading, error } = usePickingSlip(pickingSlipId);
  const { data: issues } = useIssuesForPickingSlip(pickingSlipId);
  const startPicking = useStartPicking();
  const updateLine = useUpdatePickingSlipLine();
  const completePicking = useCompletePicking();
  const createIssue = useCreateIssueFlag();

  const [isUpdatingLine, setIsUpdatingLine] = useState(false);
  const [showFlagIssueModal, setShowFlagIssueModal] = useState(false);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !pickingSlip) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-red-600 mb-4">Picking slip not found</p>
        <Link href="/picking-slips" className="text-primary-600 hover:text-primary-700">
          Back to Picking Slips
        </Link>
      </div>
    );
  }

  const canStart = pickingSlip.status === 'PENDING';
  const canComplete = pickingSlip.status === 'IN_PROGRESS';
  const allLinesPicked = pickingSlip.lines.every(
    (line) => line.quantityPicked >= line.quantityToPick
  );

  const handleStartPicking = async () => {
    if (window.confirm('Start picking on this slip?')) {
      await startPicking.mutateAsync(pickingSlipId);
    }
  };

  const handleCompletePicking = async () => {
    if (!allLinesPicked) {
      alert('All lines must be fully picked before completing.');
      return;
    }
    if (window.confirm('Mark this picking slip as complete?')) {
      await completePicking.mutateAsync(pickingSlipId);
    }
  };

  const handleUpdateLine = async (lineId: string, quantityPicked: number) => {
    setIsUpdatingLine(true);
    try {
      await updateLine.mutateAsync({
        pickingSlipId,
        lineId,
        quantityPicked,
      });
    } finally {
      setIsUpdatingLine(false);
    }
  };

  // Calculate progress
  const totalToPick = pickingSlip.lines.reduce((sum, l) => sum + l.quantityToPick, 0);
  const totalPicked = pickingSlip.lines.reduce((sum, l) => sum + l.quantityPicked, 0);
  const progressPercent = totalToPick > 0 ? Math.round((totalPicked / totalToPick) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/picking-slips" className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">
                {pickingSlip.pickingSlipNumber}
              </h1>
              <PickingSlipStatusBadge status={pickingSlip.status} />
            </div>
            <p className="text-sm text-slate-600">
              Created on {formatDateShort(pickingSlip.createdAt)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {canStart && (
            <button
              onClick={handleStartPicking}
              disabled={startPicking.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              {startPicking.isPending ? 'Starting...' : 'Start Picking'}
            </button>
          )}

          {canComplete && (
            <button
              onClick={handleCompletePicking}
              disabled={completePicking.isPending || !allLinesPicked}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!allLinesPicked ? 'All lines must be picked first' : ''}
            >
              <Check className="h-4 w-4" />
              {completePicking.isPending ? 'Completing...' : 'Complete Picking'}
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

      {/* Progress Bar (when in progress) */}
      {pickingSlip.status === 'IN_PROGRESS' && (
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Picking Progress</span>
            <span className="text-sm text-slate-600">
              {totalPicked} / {totalToPick} items ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Items to Pick</h2>
            <PickingSlipLineTable
              lines={pickingSlip.lines}
              status={pickingSlip.status}
              onUpdateLine={handleUpdateLine}
              isUpdating={isUpdatingLine}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Details</h2>
            <dl className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Warehouse</dt>
                  <dd className="text-sm text-slate-900">{getLocationLabel(pickingSlip.location)}</dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Order</dt>
                  <dd className="text-sm">
                    <Link
                      href={`/orders/${pickingSlip.orderId}`}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {pickingSlip.orderNumber}
                    </Link>
                  </dd>
                </div>
              </div>

              {pickingSlip.assignedToName && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Assigned To</dt>
                    <dd className="text-sm text-slate-900">{pickingSlip.assignedToName}</dd>
                  </div>
                </div>
              )}

              {pickingSlip.startedAt && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Started</dt>
                    <dd className="text-sm text-slate-900">{formatDate(pickingSlip.startedAt)}</dd>
                  </div>
                </div>
              )}

              {pickingSlip.completedAt && (
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Completed</dt>
                    <dd className="text-sm text-slate-900">{formatDate(pickingSlip.completedAt)}</dd>
                  </div>
                </div>
              )}
            </dl>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Summary</h2>
            <dl className="space-y-2">
              <div className="flex justify-between text-sm">
                <dt className="text-slate-600">Total Lines</dt>
                <dd className="font-medium text-slate-900">{pickingSlip.lines.length}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-slate-600">Items to Pick</dt>
                <dd className="font-medium text-slate-900">{totalToPick}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-slate-600">Items Picked</dt>
                <dd className="font-medium text-green-600">{totalPicked}</dd>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-100">
                <dt className="text-slate-600">Remaining</dt>
                <dd className="font-medium text-amber-600">{totalToPick - totalPicked}</dd>
              </div>
            </dl>
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

      {/* Flag Issue Modal */}
      <CreateIssueFlagModal
        isOpen={showFlagIssueModal}
        onClose={() => setShowFlagIssueModal(false)}
        onSubmit={async (data) => {
          await createIssue.mutateAsync(data);
        }}
        pickingSlipId={pickingSlipId}
        targetLabel={pickingSlip.pickingSlipNumber}
      />
    </div>
  );
}
