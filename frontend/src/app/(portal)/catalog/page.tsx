'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Globe, EyeOff, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  ProductGrid,
  CategoryFilter,
  ProductSearch,
  Pagination,
  ProductDetailModal,
  ProductSort,
  StockFilterChips,
  WarehouseSelector,
  ViewToggle,
  ProductTable,
  PublishFilterChips,
} from '@/components/products';
import { useProducts, useCategories, useBulkPublishProducts } from '@/hooks/useProducts';
import { useAuthStore } from '@/stores/auth-store';
import type { CatalogProduct } from '@/lib/api';
import type { StockFilterValue } from '@/components/products/StockFilterChips';
import type { WarehouseValue } from '@/components/products/WarehouseSelector';
import type { ViewMode } from '@/components/products/ViewToggle';
import type { PublishFilterValue } from '@/components/products/PublishFilterChips';

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  // Role-based feature flags
  const isInternal = user && ['ADMIN', 'MANAGER', 'SALES'].includes(user.role);
  const isAdmin = user?.role === 'ADMIN';
  const showQuantity = !!isInternal; // Internal users see numbers, customers see text

  // Read URL params
  const urlCategoryId = searchParams.get('categoryId');
  const urlSubCategoryId = searchParams.get('subCategoryId');
  const urlSearch = searchParams.get('search') || '';
  const urlPage = parseInt(searchParams.get('page') || '1', 10);
  const urlPageSize = parseInt(searchParams.get('pageSize') || '20', 10);
  const urlStockStatus = (searchParams.get('stockStatus') || 'ALL') as StockFilterValue;
  const urlSort = searchParams.get('sort') || '';
  const urlWarehouse = (searchParams.get('warehouse') || user?.primaryWarehouse || 'ALL') as WarehouseValue;
  const urlView = (searchParams.get('view') || 'grid') as ViewMode;
  const urlPublishStatus = (searchParams.get('publishStatus') || 'ALL') as PublishFilterValue;

  // Validate stockStatus from URL
  const validStockStatuses: StockFilterValue[] = ['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'ON_ORDER'];
  const initialStockStatus = validStockStatuses.includes(urlStockStatus) ? urlStockStatus : 'ALL';

  // Local state for filters (synced from URL)
  const [categoryId, setCategoryId] = useState<string | null>(urlCategoryId);
  const [subCategoryId, setSubCategoryId] = useState<string | null>(urlSubCategoryId);
  const [search, setSearch] = useState(urlSearch);
  const [page, setPage] = useState(urlPage);
  const [pageSize, setPageSize] = useState(urlPageSize);
  const [stockFilter, setStockFilter] = useState<StockFilterValue>(initialStockStatus);
  const [sortBy, setSortBy] = useState(urlSort);
  const [warehouse, setWarehouse] = useState<WarehouseValue>(urlWarehouse);
  const [viewMode, setViewMode] = useState<ViewMode>(urlView);
  const [publishFilter, setPublishFilter] = useState<PublishFilterValue>(urlPublishStatus);

  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);

  // Selection state for bulk actions (admin only, table view only)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // React Query hooks
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories();
  const bulkPublish = useBulkPublishProducts();
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
    isPublished: publishFilter === 'PUBLISHED' ? 'true' : publishFilter === 'DRAFT' ? 'false' : undefined,
  });

  const products = productsData?.products ?? [];
  const pagination = productsData?.pagination ?? {
    page: 1,
    pageSize: 20,
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
      view?: ViewMode;
      publishStatus?: PublishFilterValue;
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
      const newView = params.view ?? viewMode;
      const newPublishStatus = params.publishStatus ?? publishFilter;

      if (newCategoryId) newParams.set('categoryId', newCategoryId);
      if (newSubCategoryId) newParams.set('subCategoryId', newSubCategoryId);
      if (newSearch) newParams.set('search', newSearch);
      if (newPage > 1) newParams.set('page', newPage.toString());
      if (newPageSize !== 20) newParams.set('pageSize', newPageSize.toString());
      if (newStockStatus !== 'ALL') newParams.set('stockStatus', newStockStatus);
      if (newSort) newParams.set('sort', newSort);
      if (newWarehouse !== 'ALL') newParams.set('warehouse', newWarehouse);
      if (newView !== 'grid') newParams.set('view', newView);
      if (newPublishStatus !== 'ALL') newParams.set('publishStatus', newPublishStatus);

      const queryString = newParams.toString();
      router.push(queryString ? `/catalog?${queryString}` : '/catalog', { scroll: false });
    },
    [categoryId, subCategoryId, search, page, pageSize, stockFilter, sortBy, warehouse, viewMode, publishFilter, router]
  );

  // Handle category change
  const handleCategoryChange = (newCategoryId: string | null, newSubCategoryId: string | null) => {
    setCategoryId(newCategoryId);
    setSubCategoryId(newSubCategoryId);
    setPage(1);
    updateUrl({ categoryId: newCategoryId, subCategoryId: newSubCategoryId, page: 1 });
  };

  // Handle search change
  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
    updateUrl({ search: newSearch, page: 1 });
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrl({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
    updateUrl({ pageSize: newPageSize, page: 1 });
  };

  // Handle stock filter change
  const handleStockFilterChange = (newFilter: StockFilterValue) => {
    setStockFilter(newFilter);
    setPage(1);
    updateUrl({ stockStatus: newFilter, page: 1 });
  };

  // Handle sort change
  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setPage(1);
    updateUrl({ sort: newSort, page: 1 });
  };

  // Handle warehouse change
  const handleWarehouseChange = (newWarehouse: WarehouseValue) => {
    setWarehouse(newWarehouse);
    setPage(1);
    updateUrl({ warehouse: newWarehouse, page: 1 });
  };

  // Handle view mode change
  const handleViewChange = (newView: ViewMode) => {
    setViewMode(newView);
    updateUrl({ view: newView });
  };

  // Handle publish filter change
  const handlePublishFilterChange = (newFilter: PublishFilterValue) => {
    setPublishFilter(newFilter);
    setPage(1);
    updateUrl({ publishStatus: newFilter, page: 1 });
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setCategoryId(null);
    setSubCategoryId(null);
    setSearch('');
    setStockFilter('ALL');
    setSortBy('');
    setWarehouse(user?.primaryWarehouse as WarehouseValue || 'ALL');
    setPublishFilter('ALL');
    setPage(1);
    router.push('/catalog', { scroll: false });
  };

  // Handle view details - open modal
  const handleViewDetails = (product: CatalogProduct) => {
    setSelectedProduct(product);
  };

  // Handle bulk publish/unpublish
  const handleBulkPublish = async () => {
    if (selectedIds.length === 0) return;
    try {
      await bulkPublish.mutateAsync({ productIds: selectedIds, action: 'publish' });
      setSelectedIds([]);
    } catch (error) {
      console.error('Bulk publish failed:', error);
    }
  };

  const handleBulkUnpublish = async () => {
    if (selectedIds.length === 0) return;
    try {
      await bulkPublish.mutateAsync({ productIds: selectedIds, action: 'unpublish' });
      setSelectedIds([]);
    } catch (error) {
      console.error('Bulk unpublish failed:', error);
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const error = productsError ? 'Failed to load products. Please try again.' : null;

  return (
    <>
      <PageHeader
        title="Products"
        description="Browse our product catalog"
        actions={
          <div className="flex items-center gap-4">
            {/* Warehouse selector - internal users only */}
            {isInternal && (
              <WarehouseSelector value={warehouse} onChange={handleWarehouseChange} />
            )}
            <div className="w-full sm:w-72">
              <ProductSearch value={search} onChange={handleSearchChange} />
            </div>
            {/* View toggle - internal users only */}
            {isInternal && (
              <ViewToggle view={viewMode} onChange={handleViewChange} />
            )}
            {/* Add Product button - admin only */}
            {isAdmin && (
              <Link
                href="/catalog/new"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </Link>
            )}
          </div>
        }
      />

      <div className="p-4 sm:p-6 xl:p-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter sidebar - Categories only */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Categories</h2>
              <CategoryFilter
                categories={categories}
                selectedCategoryId={categoryId}
                selectedSubCategoryId={subCategoryId}
                onCategoryChange={handleCategoryChange}
                isLoading={isLoadingCategories}
              />
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
                {/* Filter chips and sort */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <StockFilterChips selected={stockFilter} onChange={handleStockFilterChange} />
                    {isAdmin && (
                      <>
                        <div className="h-6 w-px bg-slate-300" />
                        <PublishFilterChips selected={publishFilter} onChange={handlePublishFilterChange} />
                      </>
                    )}
                  </div>
                  {viewMode === 'grid' && (
                    <ProductSort value={sortBy} onChange={handleSortChange} />
                  )}
                </div>

                {/* Product display - grid or table */}
                {viewMode === 'grid' ? (
                  <ProductGrid
                    products={products}
                    isLoading={isLoadingProducts}
                    onViewDetails={handleViewDetails}
                    onClearFilters={handleClearFilters}
                    showQuantity={showQuantity}
                  />
                ) : (
                  <ProductTable
                    products={products}
                    isLoading={isLoadingProducts}
                    onRowClick={handleViewDetails}
                    sortBy={sortBy}
                    onSortChange={handleSortChange}
                    isAdmin={isAdmin}
                    selectedIds={isAdmin ? selectedIds : undefined}
                    onSelectionChange={isAdmin ? setSelectedIds : undefined}
                  />
                )}

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

      {/* Product detail modal */}
      <ProductDetailModal
        product={selectedProduct}
        open={selectedProduct !== null}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      />

      {/* Bulk actions bar - appears when items are selected */}
      {isAdmin && viewMode === 'table' && selectedIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                {selectedIds.length} {selectedIds.length === 1 ? 'product' : 'products'} selected
              </span>
              <button
                onClick={handleClearSelection}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleBulkPublish}
                disabled={bulkPublish.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
              >
                <Globe className="h-4 w-4" />
                Publish Selected
              </button>
              <button
                onClick={handleBulkUnpublish}
                disabled={bulkPublish.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-700 hover:bg-slate-600 rounded-lg disabled:opacity-50"
              >
                <EyeOff className="h-4 w-4" />
                Unpublish Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
