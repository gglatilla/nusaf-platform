import { SkeletonTable } from '@/components/ui/skeleton';

export default function OrdersLoading() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
      <SkeletonTable rows={8} cols={7} />
    </div>
  );
}
