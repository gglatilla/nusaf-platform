'use client';

import Link from 'next/link';
import { ChevronRight, ArrowRight } from 'lucide-react';
import type { TransferRequestListItem } from '@/lib/api';
import { TransferRequestStatusBadge } from './TransferRequestStatusBadge';
import { formatDate } from '@/lib/formatting';

interface TransferRequestListTableProps {
  transferRequests: TransferRequestListItem[];
  isLoading?: boolean;
}

function getLocationLabel(location: string): string {
  return location === 'JHB' ? 'Johannesburg' : 'Cape Town';
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-24" />
      </td>
      <td className="px-6 py-4">
        <div className="h-5 bg-slate-200 rounded w-20" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-40" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-24" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-8" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-20" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-4" />
      </td>
    </tr>
  );
}

export function TransferRequestListTable({ transferRequests, isLoading }: TransferRequestListTableProps) {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Transfer #
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Route
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Order #
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Lines
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[...Array(5)].map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (transferRequests.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
        <div className="text-slate-400 text-5xl mb-4">🚚</div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No transfer requests yet</h3>
        <p className="text-sm text-slate-600">
          Transfer requests are created to move stock between warehouses.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Transfer #
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Route
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Order #
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Lines
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {transferRequests.map((transfer) => (
            <tr key={transfer.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/transfer-requests/${transfer.id}`}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  {transfer.transferNumber}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <TransferRequestStatusBadge status={transfer.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span>{getLocationLabel(transfer.fromLocation)}</span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                  <span>{getLocationLabel(transfer.toLocation)}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {transfer.orderId ? (
                  <Link
                    href={`/orders/${transfer.orderId}`}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    {transfer.orderNumber}
                  </Link>
                ) : (
                  <span className="text-sm text-slate-400">Stock Replenishment</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                {transfer.lineCount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                {formatDate(transfer.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <Link
                  href={`/transfer-requests/${transfer.id}`}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
