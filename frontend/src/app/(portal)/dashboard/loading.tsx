import { SkeletonDashboard } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      </div>
      <SkeletonDashboard />
    </div>
  );
}
