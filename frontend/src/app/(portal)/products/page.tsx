'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  ProductGrid,
  CategoryFilter,
  ProductSearch,
  Pagination,
  ProductDetailModal,
  StockStatusFilter,
  ProductSort,
} from '@/components/products';
import { useProducts, useCategories } from '@/hooks/useProducts';
import type { CatalogProduct, StockStatus } from '@/lib/api';

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL params
  const urlCategoryId = searchParams.get('categoryId');
  const urlSubCategoryId = searchParams.get('subCategoryId');
  const urlSearch = searchParams.get('search') || '';
  const urlPage = parseInt(searchParams.get('page') || '1', 10);
  const urlPageSize = parseInt(searchParams.get('pageSize') || '20', 10);
  const urlStockStatus = searchParams.get('stockStatus') || '';
  const urlSort = searchParams.get('sort') || '';

  // Parse stock status filter from URL (comma-separated)
  const parseStockStatus = (value: string): StockStatus[] => {
    if (!value) return [];
    return value.split(',').filter((s): s is StockStatus =>
      ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'ON_ORDER', 'OVERSTOCK'].includes(s)
    );
  };

  // Local state for filters (synced from URL)
  const [categoryId, setCategoryId] = useState<string | null>(urlCategoryId);
  const [subCategoryId, setSubCategoryId] = useState<string | null>(urlSubCategoryId);
  const [search, setSearch] = useState(urlSearch);
  const [page, setPage] = useState(urlPage);
  const [pageSize, setPageSize] = useState(urlPageSize);
  const [stockStatus, setStockStatus] = useState<StockStatus[]>(parseStockStatus(urlStockStatus));
  const [sortBy, setSortBy] = useState(urlSort);

  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);

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
    stockStatus: stockStatus.length > 0 ? stockStatus.join(',') : undefined,
    sort: sortBy || undefined,
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
      stockStatus?: StockStatus[];
      sort?: string;
    }) => {
      const newParams = new URLSearchParams();

      const newCategoryId = params.categoryId ?? categoryId;
      const newSubCategoryId = params.subCategoryId ?? subCategoryId;
      const newSearch = params.search ?? search;
      const newPage = params.page ?? page;
      const newPageSize = params.pageSize ?? pageSize;
      const newStockStatus = params.stockStatus ?? stockStatus;
      const newSort = params.sort ?? sortBy;

      if (newCategoryId) newParams.set('categoryId', newCategoryId);
      if (newSubCategoryId) newParams.set('subCategoryId', newSubCategoryId);
      if (newSearch) newParams.set('search', newSearch);
      if (newPage > 1) newParams.set('page', newPage.toString());
      if (newPageSize !== 20) newParams.set('pageSize', newPageSize.toString());
      if (newStockStatus.length > 0) newParams.set('stockStatus', newStockStatus.join(','));
      if (newSort) newParams.set('sort', newSort);

      const queryString = newParams.toString();
      router.push(queryString ? `/products?${queryString}` : '/products', { scroll: false });
    },
    [categoryId, subCategoryId, search, page, pageSize, stockStatus, sortBy, router]
  );

  // Handle category change
  const handleCategoryChange = (newCategoryId: string | null, newSubCategoryId: string | null) => {
    setCategoryId(newCategoryId);
    setSubCategoryId(newSubCategoryId);
    setPage(1); // Reset to first page
    updateUrl({ categoryId: newCategoryId, subCategoryId: newSubCategoryId, page: 1 });
  };

  // Handle search change
  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setPage(1); // Reset to first page
    updateUrl({ search: newSearch, page: 1 });
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrl({ page: newPage });
    // Scroll to top of product grid
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
    updateUrl({ pageSize: newPageSize, page: 1 });
  };

  // Handle stock status filter change
  const handleStockStatusChange = (newStockStatus: StockStatus[]) => {
    setStockStatus(newStockStatus);
    setPage(1); // Reset to first page
    updateUrl({ stockStatus: newStockStatus, page: 1 });
  };

  // Handle sort change
  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setPage(1); // Reset to first page
    updateUrl({ sort: newSort, page: 1 });
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setCategoryId(null);
    setSubCategoryId(null);
    setSearch('');
    setStockStatus([]);
    setSortBy('');
    setPage(1);
    router.push('/products', { scroll: false });
  };

  // Handle view details - open modal
  const handleViewDetails = (product: CatalogProduct) => {
    setSelectedProduct(product);
  };

  const error = productsError ? 'Failed to load products. Please try again.' : null;

  return (
    <>
      <PageHeader
        title="Products"
        description="Browse our product catalog"
        actions={
          <div className="w-full sm:w-72">
            <ProductSearch value={search} onChange={handleSearchChange} />
          </div>
        }
      />

      <div className="p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter sidebar */}
          <aside className="lg:w-64 flex-shrink-0 space-y-4">
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
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Stock Status</h2>
              <StockStatusFilter
                selected={stockStatus}
                onChange={handleStockStatusChange}
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
                {/* Sort dropdown */}
                <div className="flex justify-end mb-4">
                  <ProductSort value={sortBy} onChange={handleSortChange} />
                </div>

                <ProductGrid
                  products={products}
                  isLoading={isLoadingProducts}
                  onViewDetails={handleViewDetails}
                  onClearFilters={handleClearFilters}
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

      {/* Product detail modal */}
      <ProductDetailModal
        product={selectedProduct}
        open={selectedProduct !== null}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      />
    </>
  );
}
