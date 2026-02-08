'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, AlertCircle, CheckCircle, XCircle, Package } from 'lucide-react';
import { useReturnAuthorization, useCancelReturnAuthorization } from '@/hooks/useReturnAuthorizations';
import ReturnAuthorizationStatusBadge from '@/components/return-authorizations/ReturnAuthorizationStatusBadge';
import type { ReturnAuthorizationStatus } from '@/lib/api';

function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
}

const STATUS_MESSAGES: Record<ReturnAuthorizationStatus, { icon: React.ReactNode; message: string; className: string }> = {
  REQUESTED: {
    icon: <Clock className="h-5 w-5" />,
    message: 'Your return request is being reviewed by our team.',
    className: 'bg-amber-50 border-amber-200 text-amber-700',
  },
  APPROVED: {
    icon: <CheckCircle className="h-5 w-5" />,
    message: 'Your return has been approved. Please ship the items back to us.',
    className: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  ITEMS_RECEIVED: {
    icon: <Package className="h-5 w-5" />,
    message: 'We have received your returned items and are processing them.',
    className: 'bg-purple-50 border-purple-200 text-purple-700',
  },
  COMPLETED: {
    icon: <CheckCircle className="h-5 w-5" />,
    message: 'Your return has been completed.',
    className: 'bg-green-50 border-green-200 text-green-700',
  },
  REJECTED: {
    icon: <XCircle className="h-5 w-5" />,
    message: 'Your return request was not approved.',
    className: 'bg-red-50 border-red-200 text-red-700',
  },
  CANCELLED: {
    icon: <XCircle className="h-5 w-5" />,
    message: 'This return has been cancelled.',
    className: 'bg-slate-50 border-slate-200 text-slate-600',
  },
};

const REASON_LABELS: Record<string, string> = {
  DEFECTIVE: 'Defective',
  DAMAGED_IN_TRANSIT: 'Damaged in Transit',
  WRONG_ITEM: 'Wrong Item',
  NOT_AS_DESCRIBED: 'Not as Described',
  NO_LONGER_NEEDED: 'No Longer Needed',
  OTHER: 'Other',
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-6 w-6 bg-slate-200 rounded" />
        <div className="h-8 bg-slate-200 rounded w-48" />
      </div>
      <div className="h-16 bg-slate-200 rounded-lg" />
      <div className="h-48 bg-slate-200 rounded-lg" />
    </div>
  );
}

export default function CustomerReturnDetailPage() {
  const params = useParams();
  const raId = params.id as string;

  const { data: ra, isLoading, error } = useReturnAuthorization(raId);
  const cancelRA = useCancelReturnAuthorization();

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this return request?')) {
      await cancelRA.mutateAsync(raId);
    }
  };

  if (isLoading) return <LoadingSkeleton />;

  if (error || !ra) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-red-600 mb-4">Return not found</p>
        <Link href="/my/returns" className="text-primary-600 hover:text-primary-700">
          Back to My Returns
        </Link>
      </div>
    );
  }

  const statusInfo = STATUS_MESSAGES[ra.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/my/returns" className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">{ra.raNumber}</h1>
              <ReturnAuthorizationStatusBadge status={ra.status} />
            </div>
            <p className="text-sm text-slate-600">
              Submitted on {formatDate(ra.createdAt)}
            </p>
          </div>
        </div>

        {ra.status === 'REQUESTED' && (
          <button
            onClick={handleCancel}
            disabled={cancelRA.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-md hover:bg-red-50 disabled:opacity-50"
          >
            {cancelRA.isPending ? 'Cancelling...' : 'Cancel Return'}
          </button>
        )}
      </div>

      {/* Status Message */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${statusInfo.className}`}>
        {statusInfo.icon}
        <p className="text-sm font-medium">{statusInfo.message}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lines */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Returned Items</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Product</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ra.lines.map((line) => (
                    <tr key={line.id}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-900">{line.productDescription}</p>
                        <p className="text-xs text-slate-500 font-mono">{line.productSku}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-700">
                        {line.quantityReturned}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-700">{REASON_LABELS[line.returnReason] || line.returnReason}</p>
                        {line.reasonNotes && (
                          <p className="text-xs text-slate-500 mt-0.5">{line.reasonNotes}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Details</h2>
            <dl className="space-y-3">
              {ra.orderNumber && (
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Order</dt>
                  <dd className="text-sm">
                    <Link href={`/my/orders/${ra.orderId}`} className="text-primary-600 hover:text-primary-700">
                      {ra.orderNumber}
                    </Link>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-slate-500 uppercase">Total Items</dt>
                <dd className="text-sm text-slate-900">
                  {ra.lines.length} line{ra.lines.length !== 1 ? 's' : ''} &middot;{' '}
                  {ra.lines.reduce((sum, l) => sum + l.quantityReturned, 0)} qty
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 uppercase">Submitted</dt>
                <dd className="text-sm text-slate-900">{formatDate(ra.createdAt)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
