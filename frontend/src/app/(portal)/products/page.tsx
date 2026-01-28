'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  ProductGrid,
  CategoryFilter,
  ProductSearch,
  Pagination,
} from '@/components/products';
import { api, type CatalogCategory, type CatalogProduct, type ProductsResponse } from '@/lib/api';

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL params
  const urlCategoryId = searchParams.get('categoryId');
  const urlSubCategoryId = searchParams.get('subCategoryId');
  const urlSearch = searchParams.get('search') || '';
  const urlPage = parseInt(searchParams.get('page') || '1', 10);

  // State
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local state for filters (synced from URL)
  const [categoryId, setCategoryId] = useState<string | null>(urlCategoryId);
  const [subCategoryId, setSubCategoryId] = useState<string | null>(urlSubCategoryId);
  const [search, setSearch] = useState(urlSearch);
  const [page, setPage] = useState(urlPage);

  // Update URL when filters change
  const updateUrl = useCallback(
    (params: {
      categoryId?: string | null;
      subCategoryId?: string | null;
      search?: string;
      page?: number;
    }) => {
      const newParams = new URLSearchParams();

      const newCategoryId = params.categoryId ?? categoryId;
      const newSubCategoryId = params.subCategoryId ?? subCategoryId;
      const newSearch = params.search ?? search;
      const newPage = params.page ?? page;

      if (newCategoryId) newParams.set('categoryId', newCategoryId);
      if (newSubCategoryId) newParams.set('subCategoryId', newSubCategoryId);
      if (newSearch) newParams.set('search', newSearch);
      if (newPage > 1) newParams.set('page', newPage.toString());

      const queryString = newParams.toString();
      router.push(queryString ? `/products?${queryString}` : '/products', { scroll: false });
    },
    [categoryId, subCategoryId, search, page, router]
  );

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await api.getCategories();
        if (response.success && response.data) {
          setCategories(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setIsLoadingCategories(false);
      }
    }

    fetchCategories();
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    async function fetchProducts() {
      setIsLoadingProducts(true);
      setError(null);

      try {
        const response = await api.getProducts({
          categoryId: categoryId || undefined,
          subCategoryId: subCategoryId || undefined,
          search: search || undefined,
          page,
          limit: 20,
        });

        if (response.success && response.data) {
          setProducts(response.data.products);
          setPagination(response.data.pagination);
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setIsLoadingProducts(false);
      }
    }

    fetchProducts();
  }, [categoryId, subCategoryId, search, page]);

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

  // Handle view details (placeholder for now)
  const handleViewDetails = (product: CatalogProduct) => {
    // TODO: Open product detail modal or navigate to detail page
    console.log('View details:', product);
  };

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
          {/* Category filter sidebar */}
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
                <ProductGrid
                  products={products}
                  isLoading={isLoadingProducts}
                  onViewDetails={handleViewDetails}
                />

                {/* Pagination */}
                {!isLoadingProducts && pagination.totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination
                      page={pagination.page}
                      totalPages={pagination.totalPages}
                      total={pagination.total}
                      limit={pagination.limit}
                      onPageChange={handlePageChange}
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
