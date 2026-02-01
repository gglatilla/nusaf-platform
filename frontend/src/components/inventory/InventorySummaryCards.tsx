'use client';

import { Package, AlertTriangle, ClipboardCheck, ArrowRightLeft } from 'lucide-react';
import { useInventorySummary } from '@/hooks/useInventory';

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  isLoading?: boolean;
}

function StatCard({ label, value, subtitle, icon: Icon, iconColor, bgColor, isLoading }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {label}
          </p>
          {isLoading ? (
            <div className="mt-1 h-7 w-16 bg-slate-200 rounded animate-pulse" />
          ) : (
            <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          )}
          {subtitle && !isLoading && (
            <p className="text-xs text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function InventorySummaryCards() {
  const { data: summary, isLoading, error } = useInventorySummary();

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
        Failed to load inventory summary
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Products with Stock"
        value={summary?.totalProducts.toString() ?? '0'}
        subtitle="across all warehouses"
        icon={Package}
        iconColor="text-primary-600"
        bgColor="bg-primary-50"
        isLoading={isLoading}
      />
      <StatCard
        label="Below Reorder Point"
        value={summary?.belowReorderPoint.toString() ?? '0'}
        subtitle={summary?.belowReorderPoint ? 'need attention' : 'all stocked'}
        icon={AlertTriangle}
        iconColor={summary?.belowReorderPoint ? 'text-amber-600' : 'text-green-600'}
        bgColor={summary?.belowReorderPoint ? 'bg-amber-50' : 'bg-green-50'}
        isLoading={isLoading}
      />
      <StatCard
        label="Pending Adjustments"
        value={summary?.pendingAdjustments.toString() ?? '0'}
        subtitle={summary?.pendingAdjustments ? 'awaiting approval' : 'none pending'}
        icon={ClipboardCheck}
        iconColor={summary?.pendingAdjustments ? 'text-blue-600' : 'text-slate-400'}
        bgColor={summary?.pendingAdjustments ? 'bg-blue-50' : 'bg-slate-50'}
        isLoading={isLoading}
      />
      <StatCard
        label="Movements Today"
        value={summary?.movementsToday.toString() ?? '0'}
        subtitle="stock changes"
        icon={ArrowRightLeft}
        iconColor="text-slate-600"
        bgColor="bg-slate-50"
        isLoading={isLoading}
      />
    </div>
  );
}
