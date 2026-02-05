import { Suspense } from 'react';
import { Metadata } from 'next';
import { WebsiteHeader } from '@/components/website/WebsiteHeader';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';
import { QuoteModalWrapper } from '@/components/website/QuoteModalWrapper';
import { Container } from '@/components/website/Container';
import { Breadcrumbs, CategoryCard, ProductSearchBar } from '@/components/website/products';
import { api } from '@/lib/api';
import { productUrls } from '@/lib/urls';

export const metadata: Metadata = {
  title: 'Products',
  description:
    'Browse our comprehensive range of industrial components including conveyor components, power transmission, bearings, gearboxes, and more.',
  openGraph: {
    title: 'Products | Nusaf Dynamic Technologies',
    description:
      'Premium industrial components from leading European manufacturers. Local stock and fast delivery across South Africa.',
  },
};

export default async function ProductsPage() {
  // Fetch categories from API
  let categories: Array<{
    id: string;
    code: string;
    name: string;
    slug: string;
    description: string | null;
    productCount: number;
    subCategories: Array<{
      id: string;
      code: string;
      name: string;
      slug: string;
      productCount: number;
    }>;
  }> = [];

  try {
    const response = await api.getPublicCategories();
    if (response.success && response.data) {
      categories = response.data.categories;
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error);
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: productUrls.index() },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <WebsiteHeader />

      <main className="flex-grow">
        {/* Hero section */}
        <section className="bg-gradient-to-b from-slate-50 to-white py-12 lg:py-16">
          <Container>
            <Breadcrumbs items={breadcrumbs} />
            <div className="mt-6 max-w-3xl">
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                Browse Our Products
              </h1>
              <p className="text-lg text-slate-600">
                Discover our comprehensive range of premium industrial components from leading
                European manufacturers. Local stock available for fast delivery across South
                Africa.
              </p>

              {/* Search bar */}
              <div className="mt-6 max-w-md">
                <Suspense fallback={<div className="h-11 w-full bg-slate-100 rounded-lg animate-pulse" />}>
                  <ProductSearchBar
                    placeholder="Search by SKU, description, or competitor part..."
                  />
                </Suspense>
              </div>
            </div>
          </Container>
        </section>

        {/* Categories grid */}
        <section className="py-12 lg:py-16">
          <Container>
            {categories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500">No categories available at the moment.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {categories.map((category) => (
                    <CategoryCard
                      key={category.id}
                      name={category.name}
                      slug={category.slug}
                      description={category.description}
                      productCount={category.productCount}
                      subCategoryCount={category.subCategories.length}
                      href={productUrls.category(category.slug)}
                      size="lg"
                    />
                  ))}
                </div>

                {/* Tip text */}
                <div className="mt-12 text-center">
                  <p className="text-sm text-slate-500">
                    Tip: Use the search bar above to find products by SKU, description, or competitor part number.
                  </p>
                </div>
              </>
            )}
          </Container>
        </section>
      </main>

      <WebsiteFooter />
      <QuoteModalWrapper />
    </div>
  );
}
