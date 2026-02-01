'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import { useStockLevels } from '@/hooks/useInventory';
import { StockStatusBadge, type StockStatus } from './StockStatusBadge';
import { StockFilterChips } from '@/components/products/StockFilterChips';
import { Pagination } from '@/components/products/Pagination';
import { cn } from '@/lib/utils';
import type { StockLevelItem } from '@/lib/api';

type SortField = 'sku' | 'description' | 'category' | 'status' | 'jhb' | 'ct' | 'total';
type SortDirection = 'asc' | 'desc';

interface ProductStockRow {
  productId: string;
  sku: string;
  description: string;
  category: string;
  status: StockStatus;
  jhb: number;
  ct: number;
  total: number;
}

function groupByProduct(stockLevels: StockLevelItem[]): ProductStockRow[] {
  const productMap = new Map<string, ProductStockRow>();

  for (const sl of stockLevels) {
    const existing = productMap.get(sl.productId);
    if (existing) {
      // Add to existing product
      if (sl.location === 'JHB') {
        existing.jhb = sl.available;
      } else if (sl.location === 'CT') {
        existing.ct = sl.available;
      }
      existing.total = existing.jhb + existing.ct;
      // Update status to worst case
      existing.status = getWorstStatus(existing.status, sl.status as StockStatus);
    } else {
      // New product
      productMap.set(sl.productId, {
        productId: sl.productId,
        sku: sl.product.nusafSku,
        description: sl.product.description,
        category: sl.product.category?.name ?? 'Uncategorized',
        status: sl.status as StockStatus,
        jhb: sl.location === 'JHB' ? sl.available : 0,
        ct: sl.location === 'CT' ? sl.available : 0,
        total: sl.available,
      });
    }
  }

  return Array.from(productMap.values());
}

function getWorstStatus(a: StockStatus, b: StockStatus): StockStatus {
  const priority: Record<StockStatus, number> = {
    OUT_OF_STOCK: 0,
    LOW_STOCK: 1,
    ON_ORDER: 2,
    IN_STOCK: 3,
    OVERSTOCK: 4,
  };
  return priority[a] <= priority[b] ? a : b;
}

interface SortableHeaderProps {
  label: string;
  field: SortField;
  currentSort: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
  className?: string;
}

function SortableHeader({ label, field, currentSort, direction, onSort, className }: SortableHeaderProps) {
  const isActive = currentSort === field;
  return (
    <th
      scope="col"
      className={cn(
        'px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-100',
        className
      )}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive ? (
          direction === 'asc' ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )
        ) : (
          <ChevronUp className="h-4 w-4 text-slate-300" />
        )}
      </div>
    </th>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 px-4 py-3">
          <div className="h-5 bg-slate-200 rounded w-24 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded flex-1 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded w-24 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded w-16 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded w-16 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded w-16 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded w-16 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function InventoryStockTable() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState<SortField>('sku');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Fetch more data than we need for pagination since we're grouping
  const { data, isLoading, error } = useStockLevels({
    search: search || undefined,
    lowStockOnly: statusFilter === 'LOW_STOCK' || statusFilter === 'OUT_OF_STOCK' ? true : undefined,
    page: 1,
    pageSize: 500, // Fetch many to allow grouping and client-side filtering
  });

  // Group and filter data
  const rows = useMemo(() => {
    if (!data?.stockLevels) return [];

    let grouped = groupByProduct(data.stockLevels);

    // Filter by status
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'IN_STOCK') {
        grouped = grouped.filter((r) => r.status === 'IN_STOCK');
      } else if (statusFilter === 'LOW_STOCK') {
        grouped = grouped.filter((r) => r.status === 'LOW_STOCK');
      } else if (statusFilter === 'OUT_OF_STOCK') {
        grouped = grouped.filter((r) => r.status === 'OUT_OF_STOCK');
      } else if (statusFilter === 'ON_ORDER') {
        grouped = grouped.filter((r) => r.status === 'ON_ORDER');
      }
    }

    // Sort
    grouped.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'sku':
          comparison = a.sku.localeCompare(b.sku);
          break;
        case 'description':
          comparison = a.description.localeCompare(b.description);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'status': {
          const priority: Record<StockStatus, number> = {
            OUT_OF_STOCK: 0,
            LOW_STOCK: 1,
            ON_ORDER: 2,
            IN_STOCK: 3,
            OVERSTOCK: 4,
          };
          comparison = priority[a.status] - priority[b.status];
          break;
        }
        case 'jhb':
          comparison = a.jhb - b.jhb;
          break;
        case 'ct':
          comparison = a.ct - b.ct;
          break;
        case 'total':
          comparison = a.total - b.total;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return grouped;
  }, [data?.stockLevels, statusFilter, sortField, sortDirection]);

  // Paginate
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
        Failed to load stock levels: {error.message}
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
            placeholder="Search by SKU or description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <StockFilterChips
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <SortableHeader label="SKU" field="sku" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                <SortableHeader label="Description" field="description" currentSort={sortField} direction={sortDirection} onSort={handleSort} className="min-w-[200px]" />
                <SortableHeader label="Category" field="category" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                <SortableHeader label="Status" field="status" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                <SortableHeader label="JHB" field="jhb" currentSort={sortField} direction={sortDirection} onSort={handleSort} className="text-right" />
                <SortableHeader label="CT" field="ct" currentSort={sortField} direction={sortDirection} onSort={handleSort} className="text-right" />
                <SortableHeader label="Total" field="total" currentSort={sortField} direction={sortDirection} onSort={handleSort} className="text-right" />
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8}>
                    <TableSkeleton />
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <p className="text-lg font-medium text-slate-900 mb-1">No products found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.productId} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-mono text-slate-900">
                      {row.sku}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 max-w-xs truncate">
                      {row.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {row.category}
                    </td>
                    <td className="px-4 py-3">
                      <StockStatusBadge status={row.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono">
                      {row.jhb}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono">
                      {row.ct}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono font-semibold">
                      {row.total}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/products/${row.productId}`}
                        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                      >
                        View
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && rows.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          totalItems={rows.length}
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
