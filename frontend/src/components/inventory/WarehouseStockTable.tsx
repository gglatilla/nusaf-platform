'use client';

import { StockStatusBadge } from './StockStatusBadge';
import type { StockLocationData } from '@/lib/api';
import { cn } from '@/lib/utils';

interface WarehouseStockTableProps {
  locations: StockLocationData[];
  userPrimaryWarehouse: string | null;
}

/**
 * Per-warehouse stock breakdown table
 * - Available column is FIRST (before On Hand), bold styling
 * - On Hand column is muted (text-gray-500)
 * - User's primary warehouse row is highlighted and sorted to top
 */
export function WarehouseStockTable({
  locations,
  userPrimaryWarehouse,
}: WarehouseStockTableProps) {
  if (locations.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
        <p className="text-slate-500">
          No stock records yet. Stock will appear here once inventory is received.
        </p>
      </div>
    );
  }

  // Sort: user's primary warehouse to top, then alphabetical
  const sortedLocations = [...locations].sort((a, b) => {
    if (userPrimaryWarehouse) {
      if (a.warehouseId === userPrimaryWarehouse) return -1;
      if (b.warehouseId === userPrimaryWarehouse) return 1;
    }
    return a.warehouseName.localeCompare(b.warehouseName);
  });

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Stock by Warehouse</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 font-medium text-slate-500 uppercase text-xs">
                Warehouse
              </th>
              <th className="text-right py-3 px-4 font-medium text-slate-600 uppercase text-xs">
                Available
              </th>
              <th className="text-right py-3 px-4 font-medium text-slate-400 uppercase text-xs">
                On Hand
              </th>
              <th className="text-right py-3 px-4 font-medium text-slate-500 uppercase text-xs">
                Reserved
              </th>
              <th className="text-right py-3 px-4 font-medium text-slate-500 uppercase text-xs">
                On Order
              </th>
              <th className="text-right py-3 px-4 font-medium text-slate-500 uppercase text-xs">
                Reorder Pt
              </th>
              <th className="text-right py-3 px-4 font-medium text-slate-500 uppercase text-xs">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedLocations.map((loc) => {
              const isPrimary = loc.warehouseId === userPrimaryWarehouse;
              const totalReserved = loc.softReserved + loc.hardReserved;

              return (
                <tr
                  key={loc.warehouseId}
                  className={cn(
                    'border-b border-slate-100 last:border-0',
                    isPrimary && 'bg-blue-50'
                  )}
                >
                  {/* Warehouse */}
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-900">
                      {isPrimary && (
                        <span className="text-amber-500 mr-1" title="Your primary warehouse">
                          ★
                        </span>
                      )}
                      {loc.warehouseName}
                    </span>
                  </td>

                  {/* Available - FIRST data column, bold */}
                  <td className="py-3 px-4 text-right">
                    <span className="font-bold text-slate-900">
                      {loc.available}
                    </span>
                  </td>

                  {/* On Hand - muted */}
                  <td className="py-3 px-4 text-right text-slate-500">
                    {loc.onHand}
                  </td>

                  {/* Reserved - with tooltip breakdown */}
                  <td className="py-3 px-4 text-right text-slate-700">
                    <span
                      title={`Soft: ${loc.softReserved}, Hard: ${loc.hardReserved}`}
                      className="cursor-help border-b border-dotted border-slate-400"
                    >
                      {totalReserved}
                    </span>
                  </td>

                  {/* On Order */}
                  <td className="py-3 px-4 text-right text-slate-700">
                    {loc.onOrder}
                  </td>

                  {/* Reorder Point */}
                  <td className="py-3 px-4 text-right text-slate-500">
                    {loc.reorderPoint ?? '—'}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 text-right">
                    <StockStatusBadge status={loc.stockStatus} size="sm" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
