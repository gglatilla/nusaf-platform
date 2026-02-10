'use client';

import Link from 'next/link';
import { PackageCheck, MapPin, Calendar, User } from 'lucide-react';
import type { GrvListItem, Warehouse } from '@/lib/api';
import { formatDate } from '@/lib/formatting';

interface GRVListTableProps {
  goodsReceipts: GrvListItem[];
  isLoading?: boolean;
}

function getLocationLabel(location: Warehouse): string {
  return location === 'JHB' ? 'Johannesburg' : 'Cape Town';
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-slate-100 rounded-lg">
          <div className="h-8 w-24 bg-slate-200 rounded" />
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-4 w-20 bg-slate-200 rounded" />
          <div className="flex-1" />
          <div className="h-4 w-24 bg-slate-200 rounded" />
        </div>
      ))}
    </div>
  );
}

export function GRVListTable({ goodsReceipts, isLoading }: GRVListTableProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (goodsReceipts.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-lg">
        <PackageCheck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-600 mb-1">No goods receipts found</h3>
        <p className="text-sm text-slate-500">
          Goods receipts will appear here when you receive stock against purchase orders.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              GRV #
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              PO #
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Supplier
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Location
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Lines
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Received
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Rejected
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Received By
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Date
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {goodsReceipts.map((grv) => (
            <tr key={grv.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 whitespace-nowrap">
                <Link
                  href={`/goods-receipts/${grv.id}`}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  {grv.grvNumber}
                </Link>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <Link
                  href={`/purchase-orders/${grv.id}`}
                  className="text-sm text-slate-600 hover:text-slate-900"
                >
                  {grv.poNumber}
                </Link>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-sm text-slate-700">{grv.supplierName}</span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                  <MapPin className="h-3 w-3 text-slate-400" />
                  {getLocationLabel(grv.location)}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-center">
                <span className="text-sm text-slate-600">{grv.lineCount}</span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right">
                <span className="text-sm font-medium text-green-600">{grv.totalReceived}</span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right">
                {grv.totalRejected > 0 ? (
                  <span className="text-sm font-medium text-red-600">{grv.totalRejected}</span>
                ) : (
                  <span className="text-sm text-slate-400">—</span>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                  <User className="h-3 w-3 text-slate-400" />
                  {grv.receivedByName}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  {formatDate(grv.receivedAt)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
