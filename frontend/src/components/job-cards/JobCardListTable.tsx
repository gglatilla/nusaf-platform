'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { JobCardListItem } from '@/lib/api';
import { JobCardStatusBadge } from './JobCardStatusBadge';
import { JobTypeBadge } from './JobTypeBadge';

interface JobCardListTableProps {
  jobCards: JobCardListItem[];
  isLoading?: boolean;
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
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
        <div className="h-5 bg-slate-200 rounded w-20" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-24" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-48" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-8" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-24" />
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

export function JobCardListTable({ jobCards, isLoading }: JobCardListTableProps) {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Job Card #
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Order #
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Qty
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Assigned To
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

  if (jobCards.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
        <div className="text-slate-400 text-5xl mb-4">🔧</div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No job cards yet</h3>
        <p className="text-sm text-slate-600 mb-4">
          Job cards are created from confirmed orders for items that need manufacturing.
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
              Job Card #
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Order #
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Product
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Qty
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Assigned To
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
          {jobCards.map((jobCard) => (
            <tr key={jobCard.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/job-cards/${jobCard.id}`}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  {jobCard.jobCardNumber}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <JobCardStatusBadge status={jobCard.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <JobTypeBadge jobType={jobCard.jobType} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/orders/${jobCard.orderId}`}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  {jobCard.orderNumber}
                </Link>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-slate-900 font-medium">{jobCard.productSku}</div>
                <div className="text-xs text-slate-500 truncate max-w-xs">
                  {jobCard.productDescription}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                {jobCard.quantity}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                {jobCard.assignedToName || '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                {formatDate(jobCard.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <Link
                  href={`/job-cards/${jobCard.id}`}
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
