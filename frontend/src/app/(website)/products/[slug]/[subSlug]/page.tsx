import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { WebsiteHeader } from '@/components/website/WebsiteHeader';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';
import { QuoteModalWrapper } from '@/components/website/QuoteModalWrapper';
import { Container } from '@/components/website/Container';
import { Breadcrumbs, ProductGrid } from '@/components/website/products';
import { api, PublicProduct } from '@/lib/api';
import { productUrls } from '@/lib/urls';

interface SubCategoryPageProps {
  params: Promise<{ slug: string; subSlug: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: SubCategoryPageProps): Promise<Metadata> {
  const { slug, subSlug } = await params;

  try {
    const response = await api.getPublicSubCategory(slug, subSlug);
    if (response.success && response.data) {
      const subCategory = response.data;
      const parentCategory = response.data.category;
      return {
        title: `${subCategory.name} | ${parentCategory.name}`,
        description:
          subCategory.description ||
          `Browse ${subCategory.name} products. ${subCategory.productCount} products available.`,
        openGraph: {
          title: `${subCategory.name} | Nusaf Dynamic Technologies`,
          description:
            subCategory.description ||
            `Premium ${subCategory.name.toLowerCase()} from leading European manufacturers.`,
        },
      };
    }
  } catch (error) {
    console.error('Failed to fetch subcategory metadata:', error);
  }

  return {
    title: 'Products',
    description: 'Browse products by category',
  };
}

export default async function SubCategoryPage({ params }: SubCategoryPageProps) {
  const { slug, subSlug } = await params;

  // Fetch subcategory details with parent
  let subCategory: { id: string; code: string; name: string; slug: string; description: string | null; productCount: number } | null = null;
  let parentCategory: { id: string; code: string; name: string; slug: string } | null = null;

  try {
    const response = await api.getPublicSubCategory(slug, subSlug);
    if (response.success && response.data) {
      subCategory = {
        id: response.data.id,
        code: response.data.code,
        name: response.data.name,
        slug: response.data.slug,
        description: response.data.description,
        productCount: response.data.productCount,
      };
      parentCategory = response.data.category;
    }
  } catch (error) {
    console.error('Failed to fetch subcategory:', error);
  }

  if (!subCategory || !parentCategory) {
    notFound();
  }

  // Fetch products for this subcategory
  let products: PublicProduct[] = [];
  try {
    const response = await api.getPublicProducts({
      subCategoryCode: subCategory.code,
      pageSize: 50,
    });
    if (response.success && response.data) {
      products = response.data.products;
    }
  } catch (error) {
    console.error('Failed to fetch products:', error);
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: productUrls.index() },
    { label: parentCategory.name, href: productUrls.category(parentCategory.slug) },
    { label: subCategory.name, href: productUrls.subCategory(parentCategory.slug, subCategory.slug) },
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
                {subCategory.name}
              </h1>
              {subCategory.description && (
                <p className="text-lg text-slate-600">{subCategory.description}</p>
              )}
              <p className="text-sm text-slate-500 mt-4">
                {subCategory.productCount} {subCategory.productCount === 1 ? 'product' : 'products'}
              </p>
            </div>
          </Container>
        </section>

        {/* Products */}
        <section className="py-12 lg:py-16">
          <Container>
            {products.length > 0 ? (
              <ProductGrid products={products} />
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-500">No products available in this category yet.</p>
                <Link
                  href={productUrls.index()}
                  className="inline-flex items-center mt-4 text-primary-600 font-medium hover:text-primary-700"
                >
                  Search all products
                </Link>
              </div>
            )}

            {/* Link to search */}
            {products.length > 0 && (
              <div className="mt-12 text-center">
                <Link
                  href={`${productUrls.index()}?subCategory=${subCategory.code}`}
                  className="inline-flex items-center text-primary-600 font-medium hover:text-primary-700"
                >
                  Search within {subCategory.name}
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
                </Link>
              </div>
            )}
          </Container>
        </section>
      </main>

      <WebsiteFooter />
      <QuoteModalWrapper />
    </div>
  );
}
