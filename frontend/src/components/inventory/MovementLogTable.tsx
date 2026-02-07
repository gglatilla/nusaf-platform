'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRightLeft } from 'lucide-react';
import { useStockMovements } from '@/hooks/useInventory';
import { Pagination } from '@/components/products/Pagination';
import { REFERENCE_TYPE_ROUTES, WAREHOUSE_NAMES } from '@/lib/constants/reference-routes';
import { cn } from '@/lib/utils';

const MOVEMENT_TYPE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  RECEIPT: { icon: '📥', label: 'Receipt', color: 'text-green-600' },
  ISSUE: { icon: '📤', label: 'Issue', color: 'text-red-600' },
  TRANSFER_OUT: { icon: '🚚', label: 'Transfer Out', color: 'text-amber-600' },
  TRANSFER_IN: { icon: '🚛', label: 'Transfer In', color: 'text-blue-600' },
  MANUFACTURE_IN: { icon: '🔧', label: 'Manufactured', color: 'text-green-600' },
  MANUFACTURE_OUT: { icon: '⚙️', label: 'Used in Production', color: 'text-amber-600' },
  ADJUSTMENT_IN: { icon: '✏️', label: 'Adjustment (+)', color: 'text-green-600' },
  ADJUSTMENT_OUT: { icon: '✏️', label: 'Adjustment (-)', color: 'text-red-600' },
  SCRAP: { icon: '🗑️', label: 'Scrap', color: 'text-red-600' },
};

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function getDateRangeParams(range: string): { startDate?: string; endDate?: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (range) {
    case '7d': {
      const start = new Date(today);
      start.setDate(start.getDate() - 7);
      return { startDate: start.toISOString() };
    }
    case '30d': {
      const start = new Date(today);
      start.setDate(start.getDate() - 30);
      return { startDate: start.toISOString() };
    }
    case '90d': {
      const start = new Date(today);
      start.setDate(start.getDate() - 90);
      return { startDate: start.toISOString() };
    }
    default:
      return {};
  }
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 px-4 py-3">
          <div className="h-5 bg-slate-200 rounded w-32 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded w-20 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded w-24 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded w-16 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded w-16 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded flex-1 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

interface MovementLogTableProps {
  initialLocation?: string;
}

export function MovementLogTable({ initialLocation }: MovementLogTableProps) {
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('7d');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [locationFilter, setLocationFilter] = useState<string>(initialLocation || 'ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const dateParams = useMemo(() => getDateRangeParams(dateRange), [dateRange]);

  const { data, isLoading, error } = useStockMovements({
    location: locationFilter !== 'ALL' ? locationFilter : undefined,
    movementType: typeFilter !== 'ALL' ? typeFilter : undefined,
    startDate: dateParams.startDate,
    endDate: dateParams.endDate,
    page,
    pageSize,
  });

  // Filter by search (client-side — searches SKU, description, referenceNumber, notes)
  const filteredMovements = useMemo(() => {
    if (!data?.movements) return [];
    if (!search) return data.movements;

    const searchLower = search.toLowerCase();
    return data.movements.filter(
      (m) =>
        m.product?.nusafSku?.toLowerCase().includes(searchLower) ||
        m.product?.description?.toLowerCase().includes(searchLower) ||
        m.referenceNumber?.toLowerCase().includes(searchLower) ||
        m.notes?.toLowerCase().includes(searchLower)
    );
  }, [data?.movements, search]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
        Failed to load movement history: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by SKU, description, reference, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={locationFilter}
            onChange={(e) => {
              setLocationFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="ALL">All Warehouses</option>
            <option value="JHB">Johannesburg</option>
            <option value="CT">Cape Town</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => {
              setDateRange(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="ALL">All Types</option>
            <option value="RECEIPT">Receipt</option>
            <option value="ISSUE">Issue</option>
            <option value="TRANSFER_OUT">Transfer Out</option>
            <option value="TRANSFER_IN">Transfer In</option>
            <option value="MANUFACTURE_IN">Manufactured</option>
            <option value="MANUFACTURE_OUT">Used in Production</option>
            <option value="ADJUSTMENT_IN">Adjustment (+)</option>
            <option value="ADJUSTMENT_OUT">Adjustment (-)</option>
            <option value="SCRAP">Scrap</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Product
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Warehouse
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Qty
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Reference
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7}>
                    <TableSkeleton />
                  </td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <ArrowRightLeft className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-lg font-medium text-slate-900 mb-1">No movements found</p>
                    <p className="text-sm text-slate-500">Try adjusting your filters or date range</p>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((movement) => {
                  const config = MOVEMENT_TYPE_CONFIG[movement.movementType] || {
                    icon: '📦',
                    label: movement.movementType,
                    color: 'text-slate-600',
                  };
                  const refRoute = movement.referenceType ? REFERENCE_TYPE_ROUTES[movement.referenceType] : null;
                  const refDisplay = movement.referenceNumber
                    || (movement.referenceType ? `${movement.referenceType.replace(/([A-Z])/g, ' $1').trim()}` : null);

                  return (
                    <tr key={movement.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                        {formatDate(movement.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <span>{config.icon}</span>
                          <span className={config.color}>{config.label}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {movement.product ? (
                          <Link
                            href={`/inventory/items/${movement.product.nusafSku}`}
                            className="group"
                          >
                            <span className="text-sm font-mono text-primary-600 group-hover:text-primary-700">
                              {movement.product.nusafSku}
                            </span>
                            <span className="block text-xs text-slate-500 max-w-[180px] truncate group-hover:text-slate-700">
                              {movement.product.description}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-sm font-mono text-slate-400">
                            {movement.productId.slice(0, 8)}...
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                            movement.location === 'JHB'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          )}
                        >
                          {WAREHOUSE_NAMES[movement.location] || movement.location}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={cn(
                            'text-sm font-mono font-semibold',
                            movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                          )}
                        >
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {movement.referenceType && movement.referenceId ? (
                          refRoute ? (
                            <Link
                              href={`${refRoute}/${movement.referenceId}`}
                              className="text-primary-600 hover:text-primary-700 font-mono text-xs"
                            >
                              {refDisplay} →
                            </Link>
                          ) : (
                            <span className="font-mono text-xs text-slate-600">
                              {refDisplay}
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 max-w-[200px] truncate">
                        {movement.notes || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && data?.pagination && data.pagination.totalItems > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          totalItems={data.pagination.totalItems}
          totalPages={data.pagination.totalPages}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}
