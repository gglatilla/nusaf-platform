'use client';

import Link from 'next/link';
import { ChevronRight, MapPin } from 'lucide-react';
import type { PickingSlipListItem } from '@/lib/api';
import { PickingSlipStatusBadge } from './PickingSlipStatusBadge';
import { formatDate } from '@/lib/formatting';

interface PickingSlipListTableProps {
  pickingSlips: PickingSlipListItem[];
  isLoading?: boolean;
}

function getLocationLabel(location: string): string {
  return location === 'JHB' ? 'Johannesburg' : 'Cape Town';
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-28" />
      </td>
      <td className="px-6 py-4">
        <div className="h-5 bg-slate-200 rounded w-20" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-28" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-24" />
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

export function PickingSlipListTable({ pickingSlips, isLoading }: PickingSlipListTableProps) {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Slip #
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Order #
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Assigned To
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

  if (pickingSlips.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
        <div className="text-slate-400 text-5xl mb-4">📋</div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No picking slips yet</h3>
        <p className="text-sm text-slate-600 mb-4">
          Picking slips are generated from confirmed orders.
        </p>
        <Link
          href="/orders"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
        >
          View Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Slip #
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Order #
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Location
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Assigned To
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
          {pickingSlips.map((slip) => (
            <tr key={slip.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/picking-slips/${slip.id}`}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  {slip.pickingSlipNumber}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <PickingSlipStatusBadge status={slip.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/orders/${slip.orderId}`}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  {slip.orderNumber}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {getLocationLabel(slip.location)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                {slip.assignedToName || '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                {slip.lineCount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                {formatDate(slip.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <Link
                  href={`/picking-slips/${slip.id}`}
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
