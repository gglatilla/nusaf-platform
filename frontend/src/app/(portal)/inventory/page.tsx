'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  RefreshCw,
  Package,
  DollarSign,
  AlertTriangle,
  XCircle,
  ClipboardList,
  ClipboardCheck,
  ArrowRightLeft,
  ArrowRight,
  Warehouse as WarehouseIcon,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/layout/PageHeader';
import { useInventoryDashboard } from '@/hooks/useInventory';
import { cn } from '@/lib/utils';
import { WAREHOUSE_NAMES, REFERENCE_TYPE_ROUTES } from '@/lib/constants/reference-routes';
import type {
  InventoryDashboardData,
  WarehouseStockSummary,
  LowStockAlertItem,
  PendingAdjustmentItem,
  ActiveCycleCountItem,
  RecentMovementItem,
} from '@/lib/api';

// ============================================
// HELPERS
// ============================================

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-ZA').format(value);
}

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  RECEIPT: 'Receipt',
  ISSUE: 'Issue',
  TRANSFER_OUT: 'Transfer Out',
  TRANSFER_IN: 'Transfer In',
  MANUFACTURE_IN: 'Manufacture In',
  MANUFACTURE_OUT: 'Manufacture Out',
  ADJUSTMENT_IN: 'Adjustment In',
  ADJUSTMENT_OUT: 'Adjustment Out',
  SCRAP: 'Scrap',
};

const REASON_LABELS: Record<string, string> = {
  INITIAL_COUNT: 'Initial Count',
  CYCLE_COUNT: 'Cycle Count',
  DAMAGED: 'Damaged',
  EXPIRED: 'Expired',
  FOUND: 'Found',
  LOST: 'Lost',
  DATA_CORRECTION: 'Data Correction',
  OTHER: 'Other',
};

// ============================================
// ROLE-BASED SECTION ORDERING
// ============================================

type SectionKey = 'lowStock' | 'adjustments' | 'cycleCounts' | 'movements';

function getSectionOrder(role: string | undefined): SectionKey[] {
  switch (role) {
    case 'WAREHOUSE':
      return ['movements', 'cycleCounts', 'adjustments', 'lowStock'];
    case 'PURCHASER':
      return ['lowStock', 'movements', 'adjustments', 'cycleCounts'];
    case 'SALES':
      return ['lowStock', 'movements', 'cycleCounts', 'adjustments'];
    default: // ADMIN, MANAGER
      return ['lowStock', 'adjustments', 'cycleCounts', 'movements'];
  }
}

// ============================================
// SUMMARY BAR
// ============================================

interface SummaryCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  alert?: boolean;
}

function SummaryCard({ label, value, icon: Icon, color, bgColor, alert }: SummaryCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-lg', bgColor)}>
          <Icon className={cn('h-5 w-5', alert ? 'text-red-600' : color)} />
        </div>
        <div>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function SummaryBar({ data }: { data: InventoryDashboardData['summary'] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      <SummaryCard
        label="Total SKUs"
        value={formatNumber(data.totalSKUs)}
        icon={Package}
        color="text-blue-600"
        bgColor="bg-blue-50"
      />
      <SummaryCard
        label="Stock Value"
        value={formatCurrency(data.totalStockValue)}
        icon={DollarSign}
        color="text-green-600"
        bgColor="bg-green-50"
      />
      <SummaryCard
        label="Low Stock"
        value={formatNumber(data.lowStockCount)}
        icon={AlertTriangle}
        color="text-amber-600"
        bgColor="bg-amber-50"
        alert={data.lowStockCount > 0}
      />
      <SummaryCard
        label="Out of Stock"
        value={formatNumber(data.outOfStockCount)}
        icon={XCircle}
        color="text-red-600"
        bgColor="bg-red-50"
        alert={data.outOfStockCount > 0}
      />
      <SummaryCard
        label="Pending Adjustments"
        value={formatNumber(data.pendingAdjustments)}
        icon={ClipboardList}
        color="text-purple-600"
        bgColor="bg-purple-50"
      />
      <SummaryCard
        label="Active Cycle Counts"
        value={formatNumber(data.activeCycleCounts)}
        icon={ClipboardCheck}
        color="text-indigo-600"
        bgColor="bg-indigo-50"
      />
    </div>
  );
}

// ============================================
// WAREHOUSE BREAKDOWN
// ============================================

function WarehouseBreakdown({ data }: { data: WarehouseStockSummary[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {data.map((wh) => (
        <div key={wh.location} className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <WarehouseIcon className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              {WAREHOUSE_NAMES[wh.location] || wh.location}
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-slate-500">SKUs</p>
              <p className="text-xl font-semibold text-slate-900">{formatNumber(wh.totalSKUs)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">On Hand</p>
              <p className="text-xl font-semibold text-slate-900">{formatNumber(wh.totalOnHand)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Available</p>
              <p className="text-xl font-semibold text-slate-900">{formatNumber(wh.totalAvailable)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">On Order</p>
              <p className="text-xl font-semibold text-blue-600">{formatNumber(wh.totalOnOrder)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Low Stock</p>
              <p className={cn('text-xl font-semibold', wh.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-900')}>
                {wh.lowStockCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Out of Stock</p>
              <p className={cn('text-xl font-semibold', wh.outOfStockCount > 0 ? 'text-red-600' : 'text-slate-900')}>
                {wh.outOfStockCount}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// SECTION COMPONENTS
// ============================================

function LowStockAlertsSection({ data }: { data: InventoryDashboardData['lowStockAlerts'] }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-slate-900">Low Stock Alerts</h2>
          {data.count > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {data.count}
            </span>
          )}
        </div>
        <Link
          href="/inventory/reorder"
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          View All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {data.items.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">No low stock alerts</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {data.items.map((item: LowStockAlertItem) => (
            <Link
              key={`${item.productId}-${item.location}`}
              href={`/inventory/items/${item.nusafSku}`}
              className="flex items-center justify-between py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">{item.nusafSku}</span>
                  <span className="text-xs text-slate-400">{WAREHOUSE_NAMES[item.location] || item.location}</span>
                </div>
                <p className="text-xs text-slate-500 truncate">{item.description}</p>
              </div>
              <div className="text-right ml-4 shrink-0">
                <p className="text-sm font-medium text-red-600">
                  {item.available} / {item.reorderPoint}
                </p>
                <p className="text-xs text-slate-400">avail / reorder pt</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function PendingAdjustmentsSection({ data }: { data: InventoryDashboardData['pendingAdjustments'] }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-slate-900">Pending Adjustments</h2>
          {data.count > 0 && (
            <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {data.count}
            </span>
          )}
        </div>
        <Link
          href="/inventory/adjustments"
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          View All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {data.items.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">No pending adjustments</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {data.items.map((item: PendingAdjustmentItem) => (
            <Link
              key={item.id}
              href={`/inventory/adjustments/${item.id}`}
              className="flex items-center justify-between py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">{item.adjustmentNumber}</span>
                  <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded">Pending</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500">{REASON_LABELS[item.reason] || item.reason}</span>
                  <span className="text-xs text-slate-400">{WAREHOUSE_NAMES[item.location] || item.location}</span>
                  {item.createdByName && (
                    <span className="text-xs text-slate-400">by {item.createdByName}</span>
                  )}
                </div>
              </div>
              <div className="text-right ml-4 shrink-0">
                <span className="text-xs text-slate-400">{item.lineCount} lines</span>
                <p className="text-xs text-slate-400">{formatDate(item.createdAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ActiveCycleCountsSection({ data }: { data: InventoryDashboardData['activeCycleCounts'] }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">Active Cycle Counts</h2>
          {data.count > 0 && (
            <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {data.count}
            </span>
          )}
        </div>
        <Link
          href="/inventory/cycle-counts"
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          View All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {data.items.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">No active cycle counts</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {data.items.map((item: ActiveCycleCountItem) => {
            const progress = item.totalLines > 0
              ? Math.round((item.countedLines / item.totalLines) * 100)
              : 0;

            return (
              <Link
                key={item.id}
                href={`/inventory/cycle-counts/${item.id}`}
                className="flex items-center justify-between py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">{item.sessionNumber}</span>
                    <span className={cn(
                      'text-xs px-1.5 py-0.5 rounded',
                      item.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-700'
                        : item.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-600'
                    )}>
                      {item.status === 'IN_PROGRESS' ? 'In Progress' : item.status === 'COMPLETED' ? 'Awaiting Reconciliation' : 'Open'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400">{WAREHOUSE_NAMES[item.location] || item.location}</span>
                    <span className="text-xs text-slate-500">{item.countedLines}/{item.totalLines} counted</span>
                  </div>
                </div>
                <div className="text-right ml-4 shrink-0">
                  <div className="w-16 bg-slate-200 rounded-full h-1.5">
                    <div
                      className="bg-indigo-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{progress}%</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RecentMovementsSection({ data }: { data: InventoryDashboardData['recentMovements'] }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Recent Movements</h2>
          {data.todayCount > 0 && (
            <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-full">
              {data.todayCount} today
            </span>
          )}
        </div>
        <Link
          href="/inventory/movements"
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          View All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {data.items.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">No recent movements</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {data.items.map((item: RecentMovementItem) => {
            const refRoute = item.referenceType ? REFERENCE_TYPE_ROUTES[item.referenceType] : null;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/inventory/items/${item.productSku}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      {item.productSku}
                    </Link>
                    <span className={cn(
                      'text-xs px-1.5 py-0.5 rounded',
                      item.quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    )}>
                      {item.quantity > 0 ? '+' : ''}{item.quantity}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">
                      {MOVEMENT_TYPE_LABELS[item.movementType] || item.movementType}
                    </span>
                    <span className="text-xs text-slate-400">{WAREHOUSE_NAMES[item.location] || item.location}</span>
                    {item.referenceNumber && refRoute && (
                      <Link
                        href={`${refRoute}/${item.referenceNumber}`}
                        className="text-xs text-blue-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.referenceNumber}
                      </Link>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4 shrink-0">
                  <p className="text-xs text-slate-400">{formatDate(item.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function InventoryDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuthStore();
  const { data, isLoading, error, refetch } = useInventoryDashboard();

  const sectionOrder = useMemo(() => getSectionOrder(user?.role), [user?.role]);

  // Block customers
  if (!authLoading && user?.role === 'CUSTOMER') {
    router.push('/dashboard');
    return null;
  }

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
  };

  if (isLoading || authLoading) {
    return (
      <>
        <PageHeader
          title="Inventory Dashboard"
          description="Stock overview across all warehouses and operations"
        />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <PageHeader
          title="Inventory Dashboard"
          description="Stock overview across all warehouses and operations"
        />
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            Failed to load inventory dashboard. Please try again.
          </div>
        </div>
      </>
    );
  }

  const sectionComponents: Record<SectionKey, React.ReactNode> = {
    lowStock: <LowStockAlertsSection key="lowStock" data={data.lowStockAlerts} />,
    adjustments: <PendingAdjustmentsSection key="adjustments" data={data.pendingAdjustments} />,
    cycleCounts: <ActiveCycleCountsSection key="cycleCounts" data={data.activeCycleCounts} />,
    movements: <RecentMovementsSection key="movements" data={data.recentMovements} />,
  };

  return (
    <>
      <PageHeader
        title="Inventory Dashboard"
        description="Stock overview across all warehouses and operations"
        actions={
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        }
      />

      <div className="p-4 sm:p-6 xl:p-8 space-y-6">
        {/* Summary cards */}
        <SummaryBar data={data.summary} />

        {/* Warehouse breakdown */}
        <WarehouseBreakdown data={data.warehouseBreakdown} />

        {/* Role-ordered sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sectionOrder.map((key) => sectionComponents[key])}
        </div>
      </div>
    </>
  );
}
