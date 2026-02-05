'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, ChevronUp, ChevronDown, ImageIcon, MoreHorizontal, Edit, Eye } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  ProductSearch,
  Pagination,
  CategoryFilter,
  StockFilterChips,
  WarehouseSelector,
} from '@/components/products';
import { useProducts, useCategories } from '@/hooks/useProducts';
import { useAuthStore } from '@/stores/auth-store';
import type { CatalogProduct, StockStatus } from '@/lib/api';
import type { StockFilterValue } from '@/components/products/StockFilterChips';
import type { WarehouseValue } from '@/components/products/WarehouseSelector';

// Item type filter
type ItemTypeValue = 'ALL' | 'FINISHED_GOOD' | 'RAW_MATERIAL' | 'COMPONENT' | 'ASSEMBLY';

const itemTypeOptions: { value: ItemTypeValue; label: string }[] = [
  { value: 'ALL', label: 'All Types' },
  { value: 'FINISHED_GOOD', label: 'Finished Goods' },
  { value: 'RAW_MATERIAL', label: 'Raw Materials' },
  { value: 'COMPONENT', label: 'Components' },
  { value: 'ASSEMBLY', label: 'Assemblies' },
];

const statusDotColors: Record<StockStatus, string> = {
  IN_STOCK: 'bg-green-500',
  LOW_STOCK: 'bg-amber-500',
  OUT_OF_STOCK: 'bg-slate-400',
  ON_ORDER: 'bg-blue-500',
  OVERSTOCK: 'bg-green-500',
};

export default function InventoryItemsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuthStore();

  // Check access - internal users only
  const isInternal = user && ['ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'PURCHASER'].includes(user.role);
  const canEdit = user && ['ADMIN', 'MANAGER'].includes(user.role);

  // Redirect customers
  useEffect(() => {
    if (!authLoading && user && !isInternal) {
      router.push('/dashboard');
    }
  }, [user, authLoading, isInternal, router]);

  // Read URL params
  const urlCategoryId = searchParams.get('categoryId');
  const urlSubCategoryId = searchParams.get('subCategoryId');
  const urlSearch = searchParams.get('search') || '';
  const urlPage = parseInt(searchParams.get('page') || '1', 10);
  const urlPageSize = parseInt(searchParams.get('pageSize') || '50', 10);
  const urlStockStatus = (searchParams.get('stockStatus') || 'ALL') as StockFilterValue;
  const urlSort = searchParams.get('sort') || 'nusafSku:asc';
  const urlWarehouse = (searchParams.get('warehouse') || user?.primaryWarehouse || 'ALL') as WarehouseValue;
  const urlItemType = (searchParams.get('itemType') || 'ALL') as ItemTypeValue;

  // Local state
  const [categoryId, setCategoryId] = useState<string | null>(urlCategoryId);
  const [subCategoryId, setSubCategoryId] = useState<string | null>(urlSubCategoryId);
  const [search, setSearch] = useState(urlSearch);
  const [page, setPage] = useState(urlPage);
  const [pageSize, setPageSize] = useState(urlPageSize);
  const [stockFilter, setStockFilter] = useState<StockFilterValue>(urlStockStatus);
  const [sortBy, setSortBy] = useState(urlSort);
  const [warehouse, setWarehouse] = useState<WarehouseValue>(urlWarehouse);
  const [itemType, setItemType] = useState<ItemTypeValue>(urlItemType);

  // Menu state
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // React Query hooks
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories();
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useProducts({
    categoryId: categoryId || undefined,
    subCategoryId: subCategoryId || undefined,
    search: search || undefined,
    page,
    pageSize,
    stockStatus: stockFilter !== 'ALL' ? stockFilter : undefined,
    sort: sortBy || undefined,
    warehouseId: warehouse !== 'ALL' ? warehouse : undefined,
    // TODO: Add itemType filter when backend supports it
  }, { enabled: !!isInternal });

  const products = productsData?.products ?? [];
  const pagination = productsData?.pagination ?? {
    page: 1,
    pageSize: 50,
    totalItems: 0,
    totalPages: 0,
    hasMore: false,
  };

  // Update URL when filters change
  const updateUrl = useCallback(
    (params: {
      categoryId?: string | null;
      subCategoryId?: string | null;
      search?: string;
      page?: number;
      pageSize?: number;
      stockStatus?: StockFilterValue;
      sort?: string;
      warehouse?: WarehouseValue;
      itemType?: ItemTypeValue;
    }) => {
      const newParams = new URLSearchParams();

      const newCategoryId = params.categoryId ?? categoryId;
      const newSubCategoryId = params.subCategoryId ?? subCategoryId;
      const newSearch = params.search ?? search;
      const newPage = params.page ?? page;
      const newPageSize = params.pageSize ?? pageSize;
      const newStockStatus = params.stockStatus ?? stockFilter;
      const newSort = params.sort ?? sortBy;
      const newWarehouse = params.warehouse ?? warehouse;
      const newItemType = params.itemType ?? itemType;

      if (newCategoryId) newParams.set('categoryId', newCategoryId);
      if (newSubCategoryId) newParams.set('subCategoryId', newSubCategoryId);
      if (newSearch) newParams.set('search', newSearch);
      if (newPage > 1) newParams.set('page', newPage.toString());
      if (newPageSize !== 50) newParams.set('pageSize', newPageSize.toString());
      if (newStockStatus !== 'ALL') newParams.set('stockStatus', newStockStatus);
      if (newSort && newSort !== 'nusafSku:asc') newParams.set('sort', newSort);
      if (newWarehouse !== 'ALL') newParams.set('warehouse', newWarehouse);
      if (newItemType !== 'ALL') newParams.set('itemType', newItemType);

      const queryString = newParams.toString();
      router.push(queryString ? `/inventory/items?${queryString}` : '/inventory/items', { scroll: false });
    },
    [categoryId, subCategoryId, search, page, pageSize, stockFilter, sortBy, warehouse, itemType, router]
  );

  // Handlers
  const handleCategoryChange = (newCategoryId: string | null, newSubCategoryId: string | null) => {
    setCategoryId(newCategoryId);
    setSubCategoryId(newSubCategoryId);
    setPage(1);
    updateUrl({ categoryId: newCategoryId, subCategoryId: newSubCategoryId, page: 1 });
  };

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
    updateUrl({ search: newSearch, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrl({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
    updateUrl({ pageSize: newPageSize, page: 1 });
  };

  const handleStockFilterChange = (newFilter: StockFilterValue) => {
    setStockFilter(newFilter);
    setPage(1);
    updateUrl({ stockStatus: newFilter, page: 1 });
  };

  const handleWarehouseChange = (newWarehouse: WarehouseValue) => {
    setWarehouse(newWarehouse);
    setPage(1);
    updateUrl({ warehouse: newWarehouse, page: 1 });
  };

  const handleItemTypeChange = (newType: ItemTypeValue) => {
    setItemType(newType);
    setPage(1);
    updateUrl({ itemType: newType, page: 1 });
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setPage(1);
    updateUrl({ sort: newSort, page: 1 });
  };

  // Show loading while checking auth
  if (authLoading || !user) {
    return (
      <div className="p-4 sm:p-6 xl:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="h-12 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  // Block non-internal users
  if (!isInternal) {
    return null;
  }

  const error = productsError ? 'Failed to load items. Please try again.' : null;

  return (
    <>
      <PageHeader
        title="Item Master"
        description="Manage all inventory items — finished goods, raw materials, and components"
        actions={
          <div className="flex items-center gap-4">
            <WarehouseSelector value={warehouse} onChange={handleWarehouseChange} />
            <div className="w-full sm:w-72">
              <ProductSearch value={search} onChange={handleSearchChange} placeholder="Search items..." />
            </div>
            {canEdit && (
              <Link
                href="/inventory/items/new"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </Link>
            )}
          </div>
        }
      />

      <div className="p-4 sm:p-6 xl:p-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-6">
              {/* Item Type Filter */}
              <div>
                <h2 className="text-sm font-semibold text-slate-900 mb-3">Item Type</h2>
                <div className="space-y-2">
                  {itemTypeOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="itemType"
                        value={option.value}
                        checked={itemType === option.value}
                        onChange={() => handleItemTypeChange(option.value)}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-slate-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <h2 className="text-sm font-semibold text-slate-900 mb-3">Categories</h2>
                <CategoryFilter
                  categories={categories}
                  selectedCategoryId={categoryId}
                  selectedSubCategoryId={subCategoryId}
                  onCategoryChange={handleCategoryChange}
                  isLoading={isLoadingCategories}
                />
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
              </div>
            ) : (
              <>
                {/* Stock filter chips */}
                <div className="flex items-center justify-between gap-4 mb-4">
                  <StockFilterChips selected={stockFilter} onChange={handleStockFilterChange} />
                  <div className="text-sm text-slate-500">
                    {pagination.totalItems} items
                  </div>
                </div>

                {/* Items table */}
                <InventoryItemTable
                  items={products}
                  isLoading={isLoadingProducts}
                  sortBy={sortBy}
                  onSortChange={handleSortChange}
                  canEdit={canEdit}
                  menuOpen={menuOpen}
                  onMenuToggle={setMenuOpen}
                />

                {/* Pagination */}
                {!isLoadingProducts && pagination.totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination
                      page={pagination.page}
                      totalPages={pagination.totalPages}
                      totalItems={pagination.totalItems}
                      pageSize={pagination.pageSize}
                      onPageChange={handlePageChange}
                      onPageSizeChange={handlePageSizeChange}
                    />
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

// Sortable header component
interface SortableHeaderProps {
  label: string;
  field: string;
  currentSort: string;
  onSort: (sort: string) => void;
  align?: 'left' | 'right';
}

function SortableHeader({ label, field, currentSort, onSort, align = 'left' }: SortableHeaderProps) {
  const [currentField, currentDir] = currentSort.split(':');
  const isActive = currentField === field;
  const isAsc = currentDir === 'asc';

  const handleClick = () => {
    if (isActive) {
      onSort(`${field}:${isAsc ? 'desc' : 'asc'}`);
    } else {
      onSort(`${field}:asc`);
    }
  };

  return (
    <th
      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 cursor-pointer hover:bg-slate-100 select-none ${align === 'right' ? 'text-right' : 'text-left'}`}
      onClick={handleClick}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        <span>{label}</span>
        <div className="flex flex-col">
          <ChevronUp className={`w-3 h-3 -mb-1 ${isActive && isAsc ? 'text-primary-600' : 'text-slate-300'}`} />
          <ChevronDown className={`w-3 h-3 ${isActive && !isAsc ? 'text-primary-600' : 'text-slate-300'}`} />
        </div>
      </div>
    </th>
  );
}

// Inventory Item Table component
interface InventoryItemTableProps {
  items: CatalogProduct[];
  isLoading: boolean;
  sortBy: string;
  onSortChange: (sort: string) => void;
  canEdit: boolean;
  menuOpen: string | null;
  onMenuToggle: (id: string | null) => void;
}

function InventoryItemTable({
  items,
  isLoading,
  sortBy,
  onSortChange,
  canEdit,
  menuOpen,
  onMenuToggle,
}: InventoryItemTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 w-14"></th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Description</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Supplier</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-600">Stock</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {[...Array(10)].map((_, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="px-4 py-4"><div className="h-10 w-10 bg-slate-200 rounded animate-pulse" /></td>
                <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded animate-pulse w-24" /></td>
                <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded animate-pulse w-48" /></td>
                <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded animate-pulse w-20" /></td>
                <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded animate-pulse w-28" /></td>
                <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded animate-pulse w-16 ml-auto" /></td>
                <td className="px-4 py-4"><div className="h-4 w-4 bg-slate-200 rounded animate-pulse ml-auto" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <p className="text-slate-500">No items found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 w-14"></th>
            <SortableHeader label="SKU" field="nusafSku" currentSort={sortBy} onSort={onSortChange} />
            <SortableHeader label="Description" field="description" currentSort={sortBy} onSort={onSortChange} />
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Type</th>
            <SortableHeader label="Supplier" field="supplier" currentSort={sortBy} onSort={onSortChange} />
            <SortableHeader label="Stock" field="available" currentSort={sortBy} onSort={onSortChange} align="right" />
            <th className="px-4 py-3 w-12"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const stockSummary = item.stockSummary;
            const status = stockSummary?.status || 'OUT_OF_STOCK';
            const available = stockSummary?.totalAvailable ?? 0;
            const thumbnailUrl = item.primaryImage?.thumbnailUrl || item.primaryImage?.url;

            // Determine item type label (assuming productType field exists)
            const typeLabel = item.productType === 'RAW_MATERIAL' ? 'Raw Material'
              : item.productType === 'COMPONENT' ? 'Component'
              : item.productType === 'ASSEMBLY' ? 'Assembly'
              : 'Finished Good';

            return (
              <tr
                key={item.id}
                className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
              >
                <td className="px-4 py-3">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={item.nusafSku}
                      className="w-10 h-10 object-cover rounded border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded border border-slate-200 bg-slate-50 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-slate-300" />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/inventory/items/${item.nusafSku}`}
                    className="font-mono text-sm text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    {item.nusafSku}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-700 line-clamp-1">{item.description}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                    {typeLabel}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-700">{item.supplierName || '—'}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className={`w-2 h-2 rounded-full ${statusDotColors[status]}`} />
                    <span className="text-sm text-slate-700">
                      {status === 'OUT_OF_STOCK' ? 'Out' : available}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="relative inline-block">
                    <button
                      onClick={() => onMenuToggle(menuOpen === item.id ? null : item.id)}
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>

                    {menuOpen === item.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => onMenuToggle(null)}
                        />
                        <div className="absolute right-0 z-20 mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1">
                          <Link
                            href={`/inventory/items/${item.nusafSku}`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            onClick={() => onMenuToggle(null)}
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </Link>
                          {canEdit && (
                            <Link
                              href={`/inventory/items/${item.nusafSku}`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                              onClick={() => onMenuToggle(null)}
                            >
                              <Edit className="h-4 w-4" />
                              Edit Item
                            </Link>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
