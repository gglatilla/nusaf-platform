'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Wrench } from 'lucide-react';
import { useJobCards } from '@/hooks/useJobCards';
import { JobCardListTable } from '@/components/job-cards/JobCardListTable';
import { Pagination } from '@/components/products/Pagination';
import type { JobCardStatus, JobType } from '@/lib/api';

const STATUS_OPTIONS: Array<{ value: JobCardStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETE', label: 'Complete' },
];

const JOB_TYPE_OPTIONS: Array<{ value: JobType | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All Types' },
  { value: 'MACHINING', label: 'Machining' },
  { value: 'ASSEMBLY', label: 'Assembly' },
];

export default function JobCardsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusParam = searchParams.get('status') as JobCardStatus | null;
  const jobTypeParam = searchParams.get('jobType') as JobType | null;
  const pageParam = searchParams.get('page');

  const [status, setStatus] = useState<JobCardStatus | undefined>(statusParam || undefined);
  const [jobType, setJobType] = useState<JobType | undefined>(jobTypeParam || undefined);
  const [page, setPage] = useState(pageParam ? parseInt(pageParam) : 1);

  const { data, isLoading } = useJobCards({ status, jobType, page, pageSize: 20 });

  const updateUrl = (newStatus?: JobCardStatus, newJobType?: JobType, newPage?: number) => {
    const params = new URLSearchParams();
    if (newStatus) params.set('status', newStatus);
    if (newJobType) params.set('jobType', newJobType);
    if (newPage && newPage > 1) params.set('page', newPage.toString());

    const queryString = params.toString();
    router.push(queryString ? `/job-cards?${queryString}` : '/job-cards');
  };

  const handleStatusChange = (newStatus: JobCardStatus | 'ALL') => {
    const statusValue = newStatus === 'ALL' ? undefined : newStatus;
    setStatus(statusValue);
    setPage(1);
    updateUrl(statusValue, jobType, 1);
  };

  const handleJobTypeChange = (newJobType: JobType | 'ALL') => {
    const jobTypeValue = newJobType === 'ALL' ? undefined : newJobType;
    setJobType(jobTypeValue);
    setPage(1);
    updateUrl(status, jobTypeValue, 1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrl(status, jobType, newPage);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wrench className="h-8 w-8 text-slate-400" />
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Job Cards</h1>
            <p className="text-sm text-slate-600">Manufacturing and assembly work orders</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="status" className="text-sm font-medium text-slate-700">
            Status:
          </label>
          <select
            id="status"
            value={status || 'ALL'}
            onChange={(e) => handleStatusChange(e.target.value as JobCardStatus | 'ALL')}
            className="px-3 py-2 border border-slate-200 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="jobType" className="text-sm font-medium text-slate-700">
            Type:
          </label>
          <select
            id="jobType"
            value={jobType || 'ALL'}
            onChange={(e) => handleJobTypeChange(e.target.value as JobType | 'ALL')}
            className="px-3 py-2 border border-slate-200 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {JOB_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {data && (
          <span className="text-sm text-slate-600">
            {data.pagination.totalItems} job card{data.pagination.totalItems !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Job Card List */}
      <JobCardListTable jobCards={data?.jobCards || []} isLoading={isLoading} />

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={data.pagination.totalPages}
          totalItems={data.pagination.totalItems}
          pageSize={data.pagination.pageSize}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
