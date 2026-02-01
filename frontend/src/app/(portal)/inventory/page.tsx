'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/layout/PageHeader';
import { InventorySummaryCards } from '@/components/inventory';
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
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('stock');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Route protection - redirect customers
  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'CUSTOMER') {
      router.push('/dashboard');
    }
  }, [user, isAuthenticated, authLoading, router]);

  // Show loading while checking auth
  if (authLoading || !isAuthenticated) {
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

// Placeholder components for tabs - will be built in subsequent phases
function StockLevelsTab() {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500">
      <p className="text-lg font-medium text-slate-900 mb-2">Stock Levels</p>
      <p>Cross-product stock table coming in Phase 2</p>
    </div>
  );
}

function PendingAdjustmentsTab({ canApprove }: { canApprove: boolean }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500">
      <p className="text-lg font-medium text-slate-900 mb-2">Pending Adjustments</p>
      <p>Approval queue coming in Phase 3</p>
      {canApprove && <p className="text-xs mt-2 text-primary-600">You can approve/reject adjustments</p>}
    </div>
  );
}

function MovementLogTab() {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500">
      <p className="text-lg font-medium text-slate-900 mb-2">Movement Log</p>
      <p>Stock movement history coming in Phase 4</p>
    </div>
  );
}

function ReorderSettingsTab({ canEdit }: { canEdit: boolean }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500">
      <p className="text-lg font-medium text-slate-900 mb-2">Reorder Settings</p>
      <p>Per-warehouse reorder configuration coming in Phase 5</p>
      {canEdit && <p className="text-xs mt-2 text-primary-600">You can edit reorder settings</p>}
    </div>
  );
}
