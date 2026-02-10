'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  FileText,
  MapPin,
  PackageCheck,
  User,
} from 'lucide-react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { useGoodsReceipt } from '@/hooks/useGoodsReceipts';
import { GRVLineTable } from '@/components/goods-receipts/GRVLineTable';

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

export default function GoodsReceiptDetailPage() {
  const params = useParams();
  const grvId = params.id as string;

  const { data: grv, isLoading, error } = useGoodsReceipt(grvId);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !grv) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-red-600 mb-4">Goods Receipt not found</p>
        <Link href="/goods-receipts" className="text-primary-600 hover:text-primary-700">
          Back to Goods Receipts
        </Link>
      </div>
    );
  }

  // Calculate totals
  const totalReceived = grv.lines.reduce((sum, line) => sum + line.quantityReceived, 0);
  const totalRejected = grv.lines.reduce((sum, line) => sum + line.quantityRejected, 0);
  const totalExpected = grv.lines.reduce((sum, line) => sum + line.quantityExpected, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Breadcrumb items={[{ label: 'Goods Receipts', href: '/goods-receipts' }, { label: grv.grvNumber }]} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <PackageCheck className="h-6 w-6 text-green-600" />
              <h1 className="text-2xl font-semibold text-slate-900">{grv.grvNumber}</h1>
            </div>
            <p className="text-sm text-slate-600">
              Received on {formatDate(grv.receivedAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Received Items</h2>
            <GRVLineTable lines={grv.lines} />
          </div>

          {/* Notes */}
          {grv.notes && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Notes</h2>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{grv.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Summary</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-slate-600">Expected</dt>
                <dd className="text-sm font-medium text-slate-900">{totalExpected}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-slate-600">Received</dt>
                <dd className="text-sm font-medium text-green-600">{totalReceived}</dd>
              </div>
              {totalRejected > 0 && (
                <div className="flex justify-between">
                  <dt className="text-sm text-slate-600">Rejected</dt>
                  <dd className="text-sm font-medium text-red-600">{totalRejected}</dd>
                </div>
              )}
              <div className="flex justify-between border-t pt-3">
                <dt className="text-sm font-medium text-slate-900">Lines</dt>
                <dd className="text-sm font-bold text-slate-900">{grv.lines.length}</dd>
              </div>
            </dl>
          </div>

          {/* Details */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Details</h2>
            <dl className="space-y-3">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Purchase Order</dt>
                  <dd className="text-sm text-primary-600">
                    <Link href={`/purchase-orders/${grv.purchaseOrder.id}`}>
                      {grv.purchaseOrder.poNumber}
                    </Link>
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Supplier</dt>
                  <dd className="text-sm text-slate-900">{grv.purchaseOrder.supplier.name}</dd>
                  <dd className="text-xs text-slate-500">{grv.purchaseOrder.supplier.code}</dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Location</dt>
                  <dd className="text-sm text-slate-900">{getLocationLabel(grv.location)}</dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Received By</dt>
                  <dd className="text-sm text-slate-900">{grv.receivedByName}</dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Received At</dt>
                  <dd className="text-sm text-slate-900">{formatDate(grv.receivedAt)}</dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
