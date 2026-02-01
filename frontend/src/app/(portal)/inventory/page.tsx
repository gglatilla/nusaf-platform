'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  InventorySummaryCards,
  InventoryStockTable,
  PendingAdjustmentsTable,
  MovementLogTable,
  ReorderSettingsTable,
} from '@/components/inventory';
import { cn } from '@/lib/utils';

type TabType = 'stock' | 'adjustments' | 'movements' | 'settings';

const tabs: { id: TabType; label: string }[] = [
  { id: 'stock', label: 'Stock Levels' },
  { id: 'adjustments', label: 'Pending Adjustments' },
  { id: 'movements', label: 'Movement Log' },
  { id: 'settings', label: 'Reorder Settings' },
];

export default function InventoryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('stock');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Route protection - redirect customers
  useEffect(() => {
    if (!authLoading && user && user.role === 'CUSTOMER') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  // Show loading while checking auth
  if (authLoading || !user) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Block customers
  if (user?.role === 'CUSTOMER') {
    return null;
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['inventory'] });
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Check if user can approve/edit (admin/manager only)
  const canApprove = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Manage stock levels, adjustments, and reorder settings"
        actions={
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            Refresh
          </button>
        }
      />

      <div className="p-6 lg:p-8">
        {/* Summary Cards */}
        <InventorySummaryCards />

        {/* Tabs */}
        <div className="mt-8 border-b border-slate-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'stock' && (
            <StockLevelsTab />
          )}
          {activeTab === 'adjustments' && (
            <PendingAdjustmentsTab canApprove={canApprove} />
          )}
          {activeTab === 'movements' && (
            <MovementLogTab />
          )}
          {activeTab === 'settings' && (
            <ReorderSettingsTab canEdit={canApprove} />
          )}
        </div>
      </div>
    </>
  );
}

// Tab components
function StockLevelsTab() {
  return <InventoryStockTable />;
}

function PendingAdjustmentsTab({ canApprove }: { canApprove: boolean }) {
  return <PendingAdjustmentsTable canApprove={canApprove} />;
}

function MovementLogTab() {
  return <MovementLogTable />;
}

function ReorderSettingsTab({ canEdit }: { canEdit: boolean }) {
  return <ReorderSettingsTable canEdit={canEdit} />;
}
