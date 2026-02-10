'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Package, ShoppingCart } from 'lucide-react';
import {
  ProductGrid,
  CategoryFilter,
  ProductSearch,
  Pagination,
  ProductDetailModal,
  ProductSort,
  StockFilterChips,
} from '@/components/products';
import { AddToQuoteModal } from '@/components/quotes/AddToQuoteModal';
import { useProducts, useCategories } from '@/hooks/useProducts';
import type { CatalogProduct } from '@/lib/api';
import type { StockFilterValue } from '@/components/products/StockFilterChips';

export default function CustomerProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL params
  const urlCategoryId = searchParams.get('categoryId');
  const urlSubCategoryId = searchParams.get('subCategoryId');
  const urlSearch = searchParams.get('search') || '';
  const urlPage = parseInt(searchParams.get('page') || '1', 10);
  const urlPageSize = parseInt(searchParams.get('pageSize') || '20', 10);
  const urlStockStatus = (searchParams.get('stockStatus') || 'ALL') as StockFilterValue;
  const urlSort = searchParams.get('sort') || '';

  // Validate stockStatus from URL
  const validStockStatuses: StockFilterValue[] = ['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'ON_ORDER'];
  const initialStockStatus = validStockStatuses.includes(urlStockStatus) ? urlStockStatus : 'ALL';

  // Local state synced from URL
  const [categoryId, setCategoryId] = useState<string | null>(urlCategoryId);
  const [subCategoryId, setSubCategoryId] = useState<string | null>(urlSubCategoryId);
  const [search, setSearch] = useState(urlSearch);
  const [page, setPage] = useState(urlPage);
  const [pageSize, setPageSize] = useState(urlPageSize);
  const [stockFilter, setStockFilter] = useState<StockFilterValue>(initialStockStatus);
  const [sortBy, setSortBy] = useState(urlSort);

  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [addToQuoteProduct, setAddToQuoteProduct] = useState<CatalogProduct | null>(null);

  // Data hooks — always filter to published products only
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
    // Note: isPublished filter is for public marketing website only, not customer portal
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
    }) => {
      const newParams = new URLSearchParams();

      const newCategoryId = params.categoryId ?? categoryId;
      const newSubCategoryId = params.subCategoryId ?? subCategoryId;
      const newSearch = params.search ?? search;
      const newPage = params.page ?? page;
      const newPageSize = params.pageSize ?? pageSize;
      const newStockStatus = params.stockStatus ?? stockFilter;
      const newSort = params.sort ?? sortBy;

      if (newCategoryId) newParams.set('categoryId', newCategoryId);
      if (newSubCategoryId) newParams.set('subCategoryId', newSubCategoryId);
      if (newSearch) newParams.set('search', newSearch);
      if (newPage > 1) newParams.set('page', newPage.toString());
      if (newPageSize !== 20) newParams.set('pageSize', newPageSize.toString());
      if (newStockStatus !== 'ALL') newParams.set('stockStatus', newStockStatus);
      if (newSort) newParams.set('sort', newSort);

      const queryString = newParams.toString();
      router.push(queryString ? `/my/products?${queryString}` : '/my/products', { scroll: false });
    },
    [categoryId, subCategoryId, search, page, pageSize, stockFilter, sortBy, router]
  );

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

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setPage(1);
    updateUrl({ sort: newSort, page: 1 });
  };

  const handleClearFilters = () => {
    setCategoryId(null);
    setSubCategoryId(null);
    setSearch('');
    setStockFilter('ALL');
    setSortBy('');
    setPage(1);
    router.push('/my/products', { scroll: false });
  };

  const handleViewDetails = (product: CatalogProduct) => {
    setSelectedProduct(product);
  };

  const error = productsError ? 'Failed to load products. Please try again.' : null;

  // Active filter count for mobile indicator
  const activeFilterCount = [
    categoryId,
    subCategoryId,
    stockFilter !== 'ALL' ? stockFilter : null,
    search,
  ].filter(Boolean).length;

  return (
    <>
      {/* Page header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Products</h1>
            <p className="mt-1 text-sm text-slate-500">
              Browse our product catalog and add items to your quote
            </p>
          </div>
          <div className="w-full sm:w-80">
            <ProductSearch value={search} onChange={handleSearchChange} />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filter sidebar — Categories */}
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
              {/* Filter chips + sort */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <StockFilterChips selected={stockFilter} onChange={handleStockFilterChange} />
                <ProductSort value={sortBy} onChange={handleSortChange} />
              </div>

              {/* Active filters indicator */}
              {activeFilterCount > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-slate-500">
                    {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
                  </span>
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Clear all
                  </button>
                </div>
              )}

              {/* Product grid — no supplier badges, show stock quantities */}
              <ProductGrid
                products={products}
                isLoading={isLoadingProducts}
                onViewDetails={handleViewDetails}
                onClearFilters={handleClearFilters}
                showQuantity={true}
                hideSupplier={true}
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

      {/* Product detail modal — no supplier info, show stock quantities */}
      <ProductDetailModal
        product={selectedProduct}
        open={selectedProduct !== null}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
        showStockQuantity={true}
        hideSupplier={true}
        detailLinkPrefix="/my/products"
        onAddToQuote={(product) => setAddToQuoteProduct(product)}
      />

      {/* Add to Quote modal — rendered as sibling (not nested) */}
      <AddToQuoteModal
        product={addToQuoteProduct}
        isOpen={addToQuoteProduct !== null}
        onClose={() => setAddToQuoteProduct(null)}
      />
    </>
  );
}
