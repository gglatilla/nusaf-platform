'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Truck, Check, ArrowRight, Calendar, FileText, User, Package } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import {
  useTransferRequest,
  useShipTransferRequest,
  useUpdateTransferRequestLine,
  useReceiveTransferRequest,
  useUpdateTransferRequestNotes,
} from '@/hooks/useTransferRequests';
import { TransferRequestStatusBadge } from '@/components/transfer-requests/TransferRequestStatusBadge';
import { TransferRequestLineTable } from '@/components/transfer-requests/TransferRequestLineTable';

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

export default function TransferRequestDetailPage() {
  const params = useParams();
  const transferRequestId = params.id as string;
  const user = useAuthStore((state) => state.user);

  const { data: transfer, isLoading, error } = useTransferRequest(transferRequestId);
  const shipTransfer = useShipTransferRequest();
  const updateLine = useUpdateTransferRequestLine();
  const receiveTransfer = useReceiveTransferRequest();
  const updateNotes = useUpdateTransferRequestNotes();

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !transfer) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-red-600 mb-4">Transfer request not found</p>
        <Link href="/transfer-requests" className="text-primary-600 hover:text-primary-700">
          Back to Transfer Requests
        </Link>
      </div>
    );
  }

  const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
  const canShip = transfer.status === 'PENDING';
  const canReceive = transfer.status === 'IN_TRANSIT';

  // Check if all lines have been received
  const allLinesReceived = transfer.lines.every((line) => line.receivedQuantity > 0);

  const handleShip = async () => {
    if (window.confirm('Mark this transfer as shipped? This will update the status to In Transit.')) {
      await shipTransfer.mutateAsync({ transferRequestId, shippedByName: userName });
    }
  };

  const handleReceive = async () => {
    if (!allLinesReceived) {
      alert('Please enter received quantities for all lines before marking as received.');
      return;
    }
    if (window.confirm('Mark this transfer as received? This will complete the transfer.')) {
      await receiveTransfer.mutateAsync({ transferRequestId, receivedByName: userName });
    }
  };

  const handleUpdateLine = async (lineId: string, receivedQuantity: number) => {
    await updateLine.mutateAsync({ transferRequestId, lineId, receivedQuantity });
  };

  const handleEditNotes = () => {
    setEditedNotes(transfer.notes || '');
    setIsEditingNotes(true);
  };

  const handleSaveNotes = async () => {
    await updateNotes.mutateAsync({ transferRequestId, notes: editedNotes });
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
          <Link href="/transfer-requests" className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">
                {transfer.transferNumber}
              </h1>
              <TransferRequestStatusBadge status={transfer.status} />
            </div>
            <p className="text-sm text-slate-600">
              Created on {formatDateShort(transfer.createdAt)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {canShip && (
            <button
              onClick={handleShip}
              disabled={shipTransfer.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              <Truck className="h-4 w-4" />
              {shipTransfer.isPending ? 'Shipping...' : 'Mark Shipped'}
            </button>
          )}

          {canReceive && (
            <button
              onClick={handleReceive}
              disabled={receiveTransfer.isPending || !allLinesReceived}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {receiveTransfer.isPending ? 'Receiving...' : 'Mark Received'}
            </button>
          )}
        </div>
      </div>

      {/* Route Banner */}
      <div className="flex items-center gap-4 px-4 py-3 rounded-lg border bg-slate-50 border-slate-200">
        <Truck className="h-5 w-5 text-slate-400" />
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <span className="font-medium">{getLocationLabel(transfer.fromLocation)}</span>
          <ArrowRight className="h-4 w-4 text-slate-400" />
          <span className="font-medium">{getLocationLabel(transfer.toLocation)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transfer Lines */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Transfer Lines</h2>
            <TransferRequestLineTable
              lines={transfer.lines}
              status={transfer.status}
              onUpdateLineReceived={handleUpdateLine}
              isUpdating={updateLine.isPending}
            />
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Notes</h2>
              {!isEditingNotes && transfer.status !== 'RECEIVED' && (
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
                {transfer.notes || 'No notes added.'}
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
              {transfer.orderId && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Order</dt>
                    <dd className="text-sm">
                      <Link
                        href={`/orders/${transfer.orderId}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {transfer.orderNumber}
                      </Link>
                    </dd>
                  </div>
                </div>
              )}

              {!transfer.orderId && (
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Type</dt>
                    <dd className="text-sm text-slate-900">Stock Replenishment</dd>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Lines</dt>
                  <dd className="text-sm text-slate-900">{transfer.lines.length}</dd>
                </div>
              </div>

              {transfer.shippedByName && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Shipped By</dt>
                    <dd className="text-sm text-slate-900">{transfer.shippedByName}</dd>
                  </div>
                </div>
              )}

              {transfer.shippedAt && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Shipped</dt>
                    <dd className="text-sm text-slate-900">{formatDate(transfer.shippedAt)}</dd>
                  </div>
                </div>
              )}

              {transfer.receivedByName && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Received By</dt>
                    <dd className="text-sm text-slate-900">{transfer.receivedByName}</dd>
                  </div>
                </div>
              )}

              {transfer.receivedAt && (
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Received</dt>
                    <dd className="text-sm text-slate-900">{formatDate(transfer.receivedAt)}</dd>
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
                date={transfer.createdAt}
                isComplete={true}
                isCurrent={transfer.status === 'PENDING'}
              />
              <StatusStep
                label="Shipped"
                date={transfer.shippedAt}
                isComplete={!!transfer.shippedAt}
                isCurrent={transfer.status === 'IN_TRANSIT'}
              />
              <StatusStep
                label="Received"
                date={transfer.receivedAt}
                isComplete={!!transfer.receivedAt}
                isCurrent={transfer.status === 'RECEIVED'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusStep({
  label,
  date,
  isComplete,
  isCurrent,
}: {
  label: string;
  date: string | null;
  isComplete: boolean;
  isCurrent: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-3 h-3 rounded-full flex-shrink-0 ${
          isComplete
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
