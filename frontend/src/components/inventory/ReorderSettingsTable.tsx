'use client';

import { useState, useMemo } from 'react';
import { Settings, Pencil } from 'lucide-react';
import { useStockLevels } from '@/hooks/useInventory';
import { EditReorderModal } from './EditReorderModal';
import { Pagination } from '@/components/products/Pagination';
import { cn } from '@/lib/utils';
import type { StockLevelItem } from '@/lib/api';

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 px-4 py-3">
          <div className="h-5 bg-slate-200 rounded w-24 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded flex-1 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded w-16 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded w-20 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded w-20 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded w-20 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded w-20 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

interface ReorderSettingsTableProps {
  canEdit: boolean;
}

export function ReorderSettingsTable({ canEdit }: ReorderSettingsTableProps) {
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<'ALL' | 'JHB' | 'CT'>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedItem, setSelectedItem] = useState<StockLevelItem | null>(null);

  const { data, isLoading, error } = useStockLevels({
    location: warehouseFilter !== 'ALL' ? warehouseFilter : undefined,
    pageSize: 500, // Fetch many for client-side filtering
  });

  // Filter and paginate
  const filteredItems = useMemo(() => {
    if (!data?.stockLevels) return [];

    let items = data.stockLevels;

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter(
        (sl) =>
          sl.product.nusafSku.toLowerCase().includes(searchLower) ||
          sl.product.description.toLowerCase().includes(searchLower)
      );
    }

    return items;
  }, [data?.stockLevels, search]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
        Failed to load reorder settings: {error.message}
      </div>
    );
  }

  return (
    <>
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
          <select
            value={warehouseFilter}
            onChange={(e) => {
              setWarehouseFilter(e.target.value as 'ALL' | 'JHB' | 'CT');
              setPage(1);
            }}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="ALL">All Warehouses</option>
            <option value="JHB">Johannesburg</option>
            <option value="CT">Cape Town</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    SKU
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[200px]">
                    Description
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Reorder Point
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Reorder Qty
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Min Stock
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Max Stock
                  </th>
                  {canEdit && (
                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={canEdit ? 8 : 7}>
                      <TableSkeleton />
                    </td>
                  </tr>
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 8 : 7} className="px-4 py-12 text-center">
                      <Settings className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-lg font-medium text-slate-900 mb-1">No products found</p>
                      <p className="text-sm text-slate-500">
                        {search ? 'Try a different search term' : 'No stock levels configured yet'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-mono text-slate-900">
                        {item.product.nusafSku}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 max-w-xs truncate">
                        {item.product.description}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                            item.location === 'JHB'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          )}
                        >
                          {item.location}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        {item.reorderPoint ?? <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        {item.reorderQuantity ?? <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        {item.minimumStock ?? <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        {item.maximumStock ?? <span className="text-slate-400">-</span>}
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {!isLoading && filteredItems.length > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={filteredItems.length}
            totalPages={Math.ceil(filteredItems.length / pageSize)}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        )}
      </div>

      {/* Edit Modal */}
      {selectedItem && (
        <EditReorderModal
          stockLevel={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </>
  );
}
