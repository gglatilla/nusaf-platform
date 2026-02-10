'use client';

import { StockStatusBadge, type StockStatus } from './StockStatusBadge';
import type { ProductInventory, StockLocationData } from '@/lib/api';
import { cn } from '@/lib/utils';

// Warehouse name display
const WAREHOUSE_NAMES: Record<string, string> = {
  JHB: 'Johannesburg',
  CT: 'Cape Town',
};

interface StockOverviewCardsProps {
  inventory: ProductInventory;
  userRole: 'ADMIN' | 'MANAGER' | 'SALES' | 'CUSTOMER';
  userPrimaryWarehouse: string | null;
}

/**
 * Stock Overview Cards component with 4-view logic:
 * - VIEW A: Admin/Manager without primary warehouse (combined totals)
 * - VIEW B: Admin/Manager with primary warehouse (their warehouse + highlighted)
 * - VIEW C: Sales with primary warehouse (their warehouse, subdued secondary)
 * - VIEW D: Customer with primary warehouse (simplified, friendly language)
 */
export function StockOverviewCards({
  inventory,
  userRole,
  userPrimaryWarehouse,
}: StockOverviewCardsProps) {
  const isCustomer = userRole === 'CUSTOMER';
  const isInternalUser = !isCustomer;
  const hasPrimaryWarehouse = !!userPrimaryWarehouse;

  // Find user's primary warehouse data
  const primaryWarehouseData = hasPrimaryWarehouse
    ? inventory.byLocation.find((loc) => loc.warehouseId === userPrimaryWarehouse)
    : null;

  // Other warehouses (not the user's primary)
  const otherWarehouses = hasPrimaryWarehouse
    ? inventory.byLocation.filter((loc) => loc.warehouseId !== userPrimaryWarehouse)
    : [];

  // Determine which view to render
  const view = isCustomer
    ? 'D'
    : hasPrimaryWarehouse
      ? userRole === 'SALES' ? 'C' : 'B'
      : 'A';

  // Calculate display values based on view
  let heroNumber: number;
  let heroLabel: string;
  let heroSubtitle: string;
  let displayOnHand: number;
  let displayReserved: number;
  let displayOnOrder: number;
  let displayStatus: StockStatus;
  let warehouseLabel: string | null = null;

  if (view === 'A') {
    // Combined totals across all warehouses
    heroNumber = inventory.available;
    heroLabel = 'Available to Sell (all warehouses)';
    heroSubtitle = 'Total across all locations';
    displayOnHand = inventory.onHand;
    displayReserved = inventory.reserved;
    displayOnOrder = inventory.onOrder;
    displayStatus = inventory.stockStatus;
  } else if (primaryWarehouseData) {
    // User has a primary warehouse and it exists in the data
    heroNumber = primaryWarehouseData.available;
    displayOnHand = primaryWarehouseData.onHand;
    displayReserved = primaryWarehouseData.softReserved + primaryWarehouseData.hardReserved;
    displayOnOrder = primaryWarehouseData.onOrder;
    displayStatus = primaryWarehouseData.stockStatus;
    warehouseLabel = WAREHOUSE_NAMES[primaryWarehouseData.warehouseId] || primaryWarehouseData.warehouseName;

    if (view === 'D') {
      // Customer view - friendly language with warehouse name
      heroLabel = warehouseLabel ? `${heroNumber} Available at ${warehouseLabel}` : `${heroNumber} Available`;
      heroSubtitle = 'Ready for immediate dispatch';
    } else {
      // Internal user with primary warehouse (VIEW B or C)
      heroLabel = `Available to Sell at ${warehouseLabel}`;
      heroSubtitle = 'This is what you can promise for immediate fulfillment';
    }
  } else {
    // User has primaryWarehouse set but it's not in byLocation - fallback to totals
    heroNumber = inventory.available;
    heroLabel = 'Available to Sell (all warehouses)';
    heroSubtitle = 'Total across all locations';
    displayOnHand = inventory.onHand;
    displayReserved = inventory.reserved;
    displayOnOrder = inventory.onOrder;
    displayStatus = inventory.stockStatus;
  }

  // Check if ALL warehouses have 0 available (for customer out-of-stock message)
  const allWarehousesEmpty = inventory.byLocation.every((loc) => loc.available <= 0);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Stock Overview</h2>
        <StockStatusBadge status={displayStatus} />
      </div>

      {/* Hero Card - Available to Sell */}
      <div
        className={cn(
          'mb-6 p-6 rounded-lg border',
          displayStatus === 'OUT_OF_STOCK'
            ? 'bg-red-50 border-red-200'
            : displayStatus === 'LOW_STOCK'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-green-50 border-green-200'
        )}
      >
        {view === 'D' ? (
          // Customer view - simplified
          <>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">✅</span>
              <p className="text-xl font-bold text-green-800">{heroLabel}</p>
            </div>
            <p className="text-sm text-green-600">{heroSubtitle}</p>
          </>
        ) : (
          // Internal view
          <>
            <p className="text-sm font-medium text-green-700 mb-1">{heroLabel}</p>
            <p className="text-4xl font-bold text-green-800">{heroNumber}</p>
            <p className="text-sm text-green-600 mt-1">{heroSubtitle}</p>
          </>
        )}
      </div>

      {/* Secondary Cards - On Hand, Reserved, On Order (internal users only) */}
      {isInternalUser && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div
              className={cn(
                'p-4 rounded-lg border',
                view === 'C' ? 'bg-slate-50/50 border-slate-100' : 'bg-slate-50 border-slate-200'
              )}
            >
              <p className="text-xs font-medium text-slate-500 uppercase">
                On Hand{warehouseLabel && ` (${warehouseLabel.substring(0, 3).toUpperCase()})`}
              </p>
              <p className={cn('text-xl font-semibold', view === 'C' ? 'text-slate-500' : 'text-slate-700')}>
                {displayOnHand}
              </p>
              <p className="text-xs text-slate-400 mt-1">total in warehouse</p>
            </div>
            <div
              className={cn(
                'p-4 rounded-lg border',
                view === 'C' ? 'bg-slate-50/50 border-slate-100' : 'bg-slate-50 border-slate-200'
              )}
            >
              <p className="text-xs font-medium text-slate-500 uppercase">
                Reserved{warehouseLabel && ` (${warehouseLabel.substring(0, 3).toUpperCase()})`}
              </p>
              <p className={cn('text-xl font-semibold', view === 'C' ? 'text-slate-500' : 'text-slate-700')}>
                {displayReserved}
              </p>
              <p className="text-xs text-slate-400 mt-1">committed to orders</p>
            </div>
            <div
              className={cn(
                'p-4 rounded-lg border',
                view === 'C' ? 'bg-slate-50/50 border-slate-100' : 'bg-slate-50 border-slate-200'
              )}
            >
              <p className="text-xs font-medium text-slate-500 uppercase">
                On Order{warehouseLabel && ` (${warehouseLabel.substring(0, 3).toUpperCase()})`}
              </p>
              <p className={cn('text-xl font-semibold', view === 'C' ? 'text-slate-500' : 'text-slate-700')}>
                {displayOnOrder}
              </p>
              <p className="text-xs text-slate-400 mt-1">incoming from suppliers</p>
            </div>
          </div>

          {/* Formula bar (VIEW A/B always, VIEW C optional - showing for consistency) */}
          {view !== 'C' && (
            <p className="text-sm text-slate-500 mb-4">
              Available to Sell = On Hand ({displayOnHand}) − Reserved ({displayReserved}) = {heroNumber}
            </p>
          )}
        </>
      )}

      {/* "Also available" bar (when user has primary warehouse) */}
      {hasPrimaryWarehouse && otherWarehouses.length > 0 && (
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-sm font-medium text-blue-700 mb-2">
            {isCustomer ? '📦 Also available:' : '📦 Also available at other warehouses:'}
          </p>
          <div className="space-y-1">
            {otherWarehouses.map((wh) => {
              const whName = WAREHOUSE_NAMES[wh.warehouseId] || wh.warehouseName;
              return (
                <p key={wh.warehouseId} className="text-sm text-blue-600">
                  {isCustomer ? (
                    // Customer-friendly format with delivery estimate
                    <>
                      Also available from {whName}: {wh.available} units · Est. 2–4 working days
                    </>
                  ) : (
                    // Internal format
                    <>
                      {whName}: {wh.available} available
                    </>
                  )}
                </p>
              );
            })}
          </div>
          {isCustomer && (
            <p className="text-xs text-blue-500 mt-2">
              Contact us to arrange delivery from another location
            </p>
          )}
        </div>
      )}

      {/* Customer out-of-stock message */}
      {isCustomer && allWarehousesEmpty && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">
            Currently out of stock — contact us for estimated availability
          </p>
        </div>
      )}
    </div>
  );
}
