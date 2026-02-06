'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProductWithInventory } from '@/hooks/useProductInventory';
import { useAuthStore } from '@/stores/auth-store';
import {
  ProductDetailHeader,
  QuickStatsBar,
  OverviewTab,
  InventoryTab,
  PricingTab,
  PurchasingTab,
  BomTab,
  SalesHistoryTab,
  DocumentsTab,
  AuditLogTab,
} from '@/components/inventory/product-detail';
import { cn } from '@/lib/utils';

type TabId = 'overview' | 'inventory' | 'pricing' | 'purchasing' | 'bom' | 'sales' | 'documents' | 'audit';

function LoadingSkeleton() {
  return (
    <div className="p-4 sm:p-6 xl:p-8">
      <div className="animate-pulse space-y-6">
        <div className="h-6 bg-slate-200 rounded w-32" />
        <div className="flex items-center gap-3">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="h-6 bg-slate-200 rounded w-20" />
        </div>
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 rounded-lg" />
          ))}
        </div>
        <div className="h-10 bg-slate-200 rounded w-full" />
        <div className="h-96 bg-slate-200 rounded" />
      </div>
    </div>
  );
}

export default function InventoryItemDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sku = params.sku as string;

  const { user, isLoading: authLoading } = useAuthStore();
  const { data: product, isLoading: productLoading, error: productError } = useProductWithInventory(sku);

  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // Check access
  const isInternal = user && ['ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'PURCHASER'].includes(user.role);
  const canEdit = user && ['ADMIN', 'MANAGER'].includes(user.role);
  const canViewCosts = user && ['ADMIN', 'MANAGER'].includes(user.role);
  const canViewPurchasing = user && ['ADMIN', 'MANAGER', 'PURCHASER'].includes(user.role);
  const canViewSales = user && ['ADMIN', 'MANAGER', 'SALES'].includes(user.role);

  // Redirect non-internal users
  useEffect(() => {
    if (!authLoading && user && !isInternal) {
      router.push('/dashboard');
    }
  }, [user, authLoading, isInternal, router]);

  if (authLoading || productLoading) {
    return <LoadingSkeleton />;
  }

  if (!isInternal) {
    return null;
  }

  if (productError || !product) {
    return (
      <div className="p-4 sm:p-6 xl:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Item not found or failed to load.
        </div>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; show: boolean }[] = [
    { id: 'overview', label: 'Overview', show: true },
    { id: 'inventory', label: 'Inventory', show: !!isInternal },
    { id: 'pricing', label: 'Pricing', show: !!canViewCosts },
    { id: 'purchasing', label: 'Purchasing', show: !!canViewPurchasing },
    { id: 'bom', label: 'BOM', show: !!isInternal },
    { id: 'sales', label: 'Sales History', show: !!canViewSales },
    { id: 'documents', label: 'Documents', show: true },
    { id: 'audit', label: 'Audit Log', show: !!canViewCosts },
  ];

  return (
    <div className="p-4 sm:p-6 xl:p-8 space-y-6">
      {/* Header */}
      <ProductDetailHeader product={product} canEdit={!!canEdit} />

      {/* Quick Stats */}
      <QuickStatsBar product={product} canViewCosts={!!canViewCosts} />

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-0" aria-label="Product detail tabs">
          {tabs.filter(t => t.show).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <OverviewTab product={product} canEdit={!!canEdit} />
        )}

        {activeTab === 'inventory' && (
          <InventoryTab
            product={product}
            userRole={user?.role || 'SALES'}
            userPrimaryWarehouse={user?.primaryWarehouse ?? null}
            canAdjustStock={!!canEdit}
          />
        )}

        {activeTab === 'pricing' && (
          <PricingTab product={product} />
        )}

        {activeTab === 'purchasing' && (
          <PurchasingTab product={product} />
        )}

        {activeTab === 'bom' && (
          <BomTab
            productId={product.id}
            productSku={product.nusafSku}
            canEdit={user?.role === 'ADMIN'}
          />
        )}

        {activeTab === 'sales' && (
          <SalesHistoryTab productId={product.id} />
        )}

        {activeTab === 'documents' && (
          <DocumentsTab productId={product.id} canEdit={!!canEdit} />
        )}

        {activeTab === 'audit' && (
          <AuditLogTab movements={product.movements || []} />
        )}
      </div>
    </div>
  );
}
