import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200',
        className
      )}
    />
  );
}

export function SkeletonText({ className }: SkeletonProps) {
  return <Skeleton className={cn('h-4 w-full', className)} />;
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-lg border border-gray-200 p-4', className)}>
      <Skeleton className="h-32 w-full mb-4" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-gray-200">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4 border-b border-gray-100">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonProductCard() {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <Skeleton className="h-40 w-full mb-4" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-full mb-1" />
      <Skeleton className="h-3 w-2/3 mb-4" />
      <Skeleton className="h-6 w-1/3" />
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 p-4">
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-8 w-3/4" />
          </div>
        ))}
      </div>
      {/* Table */}
      <SkeletonTable rows={5} cols={5} />
    </div>
  );
}
