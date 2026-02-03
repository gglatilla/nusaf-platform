import { SkeletonTable } from '@/components/ui/skeleton';

export default function ProductsLoading() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
      {/* Search/filter bar */}
      <div className="flex gap-4 mb-6">
        <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      <SkeletonTable rows={10} cols={6} />
    </div>
  );
}
