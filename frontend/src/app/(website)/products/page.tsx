import { Metadata } from 'next';
import { Suspense } from 'react';
import { WebsiteHeader } from '@/components/website/WebsiteHeader';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';
import { QuoteModalWrapper } from '@/components/website/QuoteModalWrapper';
import { Container } from '@/components/website/Container';
import {
  Breadcrumbs,
  ProductGrid,
  Pagination,
  ProductSearchBar,
  CategoryFilter,
  categories,
} from '@/components/website/products';
import { api, PublicProduct } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Products',
  description:
    'Browse our comprehensive range of industrial components including levelling feet, conveyor components, power transmission, gearboxes, bearings, and V-belts.',
  openGraph: {
    title: 'Products | Nusaf Dynamic Technologies',
    description: 'Premium industrial components with local stock and fast delivery.',
  },
};

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    page?: string;
  }>;
}

async function ProductsContent({
  searchParams,
}: {
  searchParams: { category?: string; search?: string; page?: string };
}) {
  const { category, search, page } = searchParams;
  const currentPage = parseInt(page || '1', 10) || 1;
  const pageSize = 20;

  // Find category ID from code (hardcoded categories match by code)
  // For now, we'll pass the category code and let the backend handle the mapping
  // The backend's public products endpoint accepts categoryId, but we have codes
  // We'll need to search instead if searching, or filter by category code

  let products: PublicProduct[] = [];
  let totalItems = 0;
  let totalPages = 1;

  try {
    if (search) {
      // Use search endpoint for search queries
      const response = await api.searchPublicProducts({
        q: search,
        page: currentPage,
        pageSize,
      });

      if (response.success && response.data) {
        products = response.data.products;
        // Search endpoint doesn't return total, estimate from hasMore
        totalItems = response.data.pagination.hasMore
          ? currentPage * pageSize + 1
          : products.length + (currentPage - 1) * pageSize;
        totalPages = response.data.pagination.hasMore ? currentPage + 1 : currentPage;
      }
    } else {
      // Use list endpoint for browsing/filtering
      const response = await api.getPublicProducts({
        page: currentPage,
        pageSize,
        // Note: The backend expects categoryId but we have category codes
        // For now, search will be the main way to filter
        // TODO: Add category code mapping to backend or fetch categories
        search: category ? undefined : undefined, // Placeholder for category filtering
      });

      if (response.success && response.data) {
        products = response.data.products;
        totalItems = response.data.pagination.totalItems;
        totalPages = response.data.pagination.totalPages;
      }
    }
  } catch (error) {
    console.error('Failed to fetch products:', error);
  }

  // Build cross-reference match map for search results
  // When a product is found via cross-reference, show which competitor SKU matched
  const matchedViaMap: Record<string, string> = {};
  if (search) {
    const searchLower = search.toLowerCase();
    products.forEach((product) => {
      if (product.crossReferences) {
        // Check if the search term matches any cross-reference
        const matchingRef = product.crossReferences.find(
          (ref) =>
            ref.competitorSku.toLowerCase().includes(searchLower) ||
            ref.competitorBrand.toLowerCase().includes(searchLower)
        );
        if (matchingRef) {
          // Check if the product's own SKU or title doesn't contain the search term
          // (meaning the match was via cross-reference, not direct match)
          const directMatch =
            product.sku.toLowerCase().includes(searchLower) ||
            product.title.toLowerCase().includes(searchLower);
          if (!directMatch) {
            matchedViaMap[product.id] = `${matchingRef.competitorBrand} ${matchingRef.competitorSku}`;
          }
        }
      }
    });
  }

  // Build breadcrumb items
  const breadcrumbItems: { label: string; href?: string }[] = [{ label: 'Products', href: '/products' }];

  if (category) {
    const categoryInfo = categories.find((c) => c.code === category);
    if (categoryInfo) {
      breadcrumbItems.push({ label: categoryInfo.name });
    }
  } else if (search) {
    breadcrumbItems.push({ label: `Search: "${search}"` });
  }

  // Build searchParams object for pagination
  const searchParamsObj: Record<string, string | undefined> = {};
  if (category) searchParamsObj.category = category;
  if (search) searchParamsObj.search = search;

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {search
            ? `Search Results for "${search}"`
            : category
              ? categories.find((c) => c.code === category)?.name || 'Products'
              : 'All Products'}
        </h1>
        <p className="text-slate-600">
          {search
            ? `Found ${products.length} product${products.length === 1 ? '' : 's'}`
            : 'Browse our comprehensive range of industrial components'}
        </p>
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Suspense fallback={<div className="h-11 w-full max-w-md bg-slate-100 rounded-lg animate-pulse" />}>
          <ProductSearchBar />
        </Suspense>
        <Suspense fallback={<div className="h-11 w-40 bg-slate-100 rounded-lg animate-pulse" />}>
          <CategoryFilter />
        </Suspense>
      </div>

      {/* Product grid */}
      <ProductGrid
        products={products}
        matchedViaMap={search ? matchedViaMap : undefined}
        emptyMessage={
          search
            ? `No products found matching "${search}". Try a different search term or browse all products.`
            : 'No products available in this category.'
        }
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        basePath="/products"
        searchParams={searchParamsObj}
      />
    </>
  );
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  return (
    <div className="min-h-screen flex flex-col">
      <WebsiteHeader />
      <main className="flex-1 py-8 bg-slate-50">
        <Container>
          <Suspense
            fallback={
              <div className="space-y-8">
                <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
                <div className="h-10 w-64 bg-slate-200 rounded animate-pulse" />
                <div className="flex gap-4">
                  <div className="h-11 w-full max-w-md bg-slate-200 rounded-lg animate-pulse" />
                  <div className="h-11 w-40 bg-slate-200 rounded-lg animate-pulse" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
                      <div className="aspect-square bg-slate-100" />
                      <div className="p-4 space-y-3">
                        <div className="h-3 bg-slate-100 rounded w-1/3" />
                        <div className="h-4 bg-slate-100 rounded w-full" />
                        <div className="h-9 bg-slate-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            }
          >
            <ProductsContent searchParams={params} />
          </Suspense>
        </Container>
      </main>
      <WebsiteFooter />
      <QuoteModalWrapper />
    </div>
  );
}
