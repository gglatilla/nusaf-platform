'use client';

import Link from 'next/link';
import { MapPin, Package, AlertTriangle, User, Calendar } from 'lucide-react';
import type { GoodsReceivedVoucher } from '@/lib/api';
import { formatDate } from '@/lib/formatting';

interface GoodsReceiptsSectionProps {
  grvs: GoodsReceivedVoucher[];
}

function getLocationLabel(location: string): string {
  return location === 'JHB' ? 'Johannesburg' : 'Cape Town';
}

export function GoodsReceiptsSection({ grvs }: GoodsReceiptsSectionProps) {
  if (grvs.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Goods Receipts</h2>
        <div className="text-center py-6 text-slate-500">
          <Package className="h-8 w-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm">No goods received yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Goods Receipts</h2>
        <span className="text-sm text-slate-500">{grvs.length} receipt{grvs.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="space-y-3">
        {grvs.map((grv) => {
          const totalReceived = grv.lines.reduce((sum, l) => sum + l.quantityReceived, 0);
          const totalRejected = grv.lines.reduce((sum, l) => sum + l.quantityRejected, 0);

          return (
            <div
              key={grv.id}
              className="p-4 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <Link
                  href={`/goods-receipts/${grv.id}`}
                  className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                >
                  {grv.grvNumber}
                </Link>
                <span className="text-xs text-slate-500">{grv.lines.length} line{grv.lines.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {getLocationLabel(grv.location)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {formatDate(grv.receivedAt)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  {grv.receivedByName}
                </span>
              </div>

              <div className="flex gap-4 mt-2">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                  <Package className="h-3.5 w-3.5" />
                  {totalReceived} received
                </span>
                {totalRejected > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {totalRejected} rejected
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
