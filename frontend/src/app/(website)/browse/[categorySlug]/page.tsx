import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { WebsiteHeader } from '@/components/website/WebsiteHeader';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';
import { QuoteModalWrapper } from '@/components/website/QuoteModalWrapper';
import { Container } from '@/components/website/Container';
import { Breadcrumbs, CategoryCard, ProductGrid } from '@/components/website/products';
import { api, PublicCategory, PublicProduct } from '@/lib/api';

interface CategoryPageProps {
  params: Promise<{ categorySlug: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { categorySlug } = await params;

  try {
    const response = await api.getPublicCategory(categorySlug);
    if (response.success && response.data) {
      const category = response.data;
      return {
        title: category.name,
        description:
          category.description ||
          `Browse ${category.name} products. ${category.productCount} products available.`,
        openGraph: {
          title: `${category.name} | Nusaf Dynamic Technologies`,
          description:
            category.description ||
            `Premium ${category.name.toLowerCase()} from leading European manufacturers.`,
        },
      };
    }
  } catch (error) {
    console.error('Failed to fetch category metadata:', error);
  }

  return {
    title: 'Category',
    description: 'Browse products by category',
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { categorySlug } = await params;

  // Fetch category details
  let category: PublicCategory | null = null;
  try {
    const response = await api.getPublicCategory(categorySlug);
    if (response.success && response.data) {
      category = response.data;
    }
  } catch (error) {
    console.error('Failed to fetch category:', error);
  }

  if (!category) {
    notFound();
  }

  // If category has subcategories, show them
  // Otherwise, fetch products directly
  let products: PublicProduct[] = [];
  const hasSubCategories = category.subCategories.length > 0;

  if (!hasSubCategories) {
    try {
      const response = await api.getPublicProducts({
        categoryCode: category.code,
        pageSize: 50,
      });
      if (response.success && response.data) {
        products = response.data.products;
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/browse' },
    { label: category.name, href: `/browse/${category.slug}` },
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
                {category.name}
              </h1>
              {category.description && (
                <p className="text-lg text-slate-600">{category.description}</p>
              )}
              <p className="text-sm text-slate-500 mt-4">
                {hasSubCategories
                  ? `${category.subCategories.length} categories · ${category.productCount} total products`
                  : `${category.productCount} products`}
              </p>
            </div>
          </Container>
        </section>

        {/* Content */}
        <section className="py-12 lg:py-16">
          <Container>
            {hasSubCategories ? (
              // Show subcategory cards
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {category.subCategories.map((subCategory) => (
                  <CategoryCard
                    key={subCategory.id}
                    name={subCategory.name}
                    slug={subCategory.slug}
                    description={subCategory.description}
                    productCount={subCategory.productCount}
                    href={`/browse/${category.slug}/${subCategory.slug}`}
                    size="md"
                  />
                ))}
              </div>
            ) : (
              // Show products directly
              <ProductGrid products={products} />
            )}

            {/* Link to search */}
            <div className="mt-12 text-center">
              <a
                href={`/catalog?categoryCode=${category.code}`}
                className="inline-flex items-center text-primary-600 font-medium hover:text-primary-700"
              >
                Search within {category.name}
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
          </Container>
        </section>
      </main>

      <WebsiteFooter />
      <QuoteModalWrapper />
    </div>
  );
}
