import { Metadata } from 'next';
import { WebsiteHeader } from '@/components/website/WebsiteHeader';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';
import { QuoteModalWrapper } from '@/components/website/QuoteModalWrapper';
import { Container } from '@/components/website/Container';
import { Breadcrumbs, CategoryCard } from '@/components/website/products';
import { api } from '@/lib/api';

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
    { label: 'Products', href: '/products' },
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
                        href={`/products/${category.slug}`}
                        size="lg"
                      />
                    ))}
                  </div>

                  {/* Quick access to search */}
                  <div className="mt-12 text-center">
                    <p className="text-slate-500 mb-4">
                      Looking for a specific product? Use our search to find by SKU or competitor
                      part number.
                    </p>
                    <a
                      href="/catalog"
                      className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Search All Products
                      <svg
                        className="ml-2 w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </a>
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
