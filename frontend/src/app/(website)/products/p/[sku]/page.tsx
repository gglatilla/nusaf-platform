import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { WebsiteHeader } from '@/components/website/WebsiteHeader';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';
import { QuoteModalWrapper } from '@/components/website/QuoteModalWrapper';
import { Container } from '@/components/website/Container';
import { Breadcrumbs } from '@/components/website/products';
import { AddToQuoteButton } from '@/components/website/products';
import { ProductMediaViewer, ProductTabs, RelatedProducts } from '@/components/website/product-detail';
import { ProductJsonLd, BreadcrumbJsonLd, buildProductSchema } from '@/components/seo';
import { api, PublicProductDetail, PublicProduct } from '@/lib/api';
import { productUrls } from '@/lib/urls';
import { getUomLabel } from '@/lib/constants/unit-of-measure';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nusaf.co.za';

interface ProductPageProps {
  params: Promise<{ sku: string }>;
}

async function getProduct(sku: string): Promise<PublicProductDetail | null> {
  try {
    const response = await api.getPublicProduct(sku);
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return null;
  }
}

async function getRelatedProducts(sku: string): Promise<PublicProduct[]> {
  try {
    const response = await api.getRelatedProducts(sku, 8);
    if (response.success && response.data) {
      return response.data.products;
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch related products:', error);
    return [];
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { sku } = await params;
  const product = await getProduct(sku);

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  return {
    title: product.metaTitle || product.title,
    description: product.metaDescription || product.description || `${product.title} - ${product.sku}`,
    openGraph: {
      title: product.metaTitle || product.title,
      description: product.metaDescription || product.description || undefined,
      type: 'website',
      images: product.images.length > 0 ? [{ url: product.images[0].url }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { sku } = await params;

  // Fetch product and related products in parallel
  const [product, relatedProducts] = await Promise.all([
    getProduct(sku),
    getRelatedProducts(sku),
  ]);

  if (!product) {
    notFound();
  }

  // Build breadcrumb items
  const breadcrumbItems: { label: string; href?: string }[] = [
    { label: 'Products', href: productUrls.index() },
  ];

  if (product.category) {
    breadcrumbItems.push({
      label: product.category.name,
      href: productUrls.category(product.category.code),
    });
  }

  breadcrumbItems.push({ label: product.sku });

  // Build JSON-LD structured data
  // Note: buildProductSchema still uses old URL format, but redirects handle it
  const productSchema = buildProductSchema(product, BASE_URL);

  const breadcrumbSchema = [
    { name: 'Home', url: BASE_URL },
    { name: 'Products', url: `${BASE_URL}${productUrls.index()}` },
    ...(product.category
      ? [{ name: product.category.name, url: `${BASE_URL}${productUrls.category(product.category.code)}` }]
      : []),
    { name: product.title, url: `${BASE_URL}${productUrls.detail(product.sku)}` },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* SEO: JSON-LD Structured Data */}
      <ProductJsonLd data={productSchema} />
      <BreadcrumbJsonLd items={breadcrumbSchema} />

      <WebsiteHeader />
      <main className="flex-1 py-8 bg-slate-50">
        <Container>
          <Breadcrumbs items={breadcrumbItems} />

          {/* Product header - two column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
            {/* Left column - Media viewer (photos & drawings) */}
            <div>
              <ProductMediaViewer
                images={product.images}
                documents={product.documents}
                productTitle={product.title}
              />
            </div>

            {/* Right column - Product info */}
            <div>
              {/* Category badge */}
              {product.category && (
                <Link
                  href={productUrls.category(product.category.code)}
                  className="inline-block px-3 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full mb-4 hover:bg-slate-200 transition-colors"
                >
                  {product.category.name}
                  {product.subCategory && ` / ${product.subCategory.name}`}
                </Link>
              )}

              {/* SKU */}
              <p className="text-sm text-slate-500 mb-2">SKU: {product.sku}</p>

              {/* Title */}
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-4">{product.title}</h1>

              {/* Short description */}
              {product.description && (
                <p className="text-slate-600 mb-6 line-clamp-4">{product.description}</p>
              )}

              {/* Unit of measure */}
              <div className="flex items-center gap-2 mb-6">
                <span className="text-sm text-slate-500">Unit:</span>
                <span className="text-sm font-medium text-slate-700">{getUomLabel(product.unitOfMeasure)}</span>
              </div>

              {/* Pricing message */}
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-primary-800">
                  <strong>Request a Quote</strong> for pricing. We offer competitive rates with
                  volume discounts available for bulk orders.
                </p>
              </div>

              {/* Add to quote button */}
              <AddToQuoteButton
                productId={product.id}
                sku={product.sku}
                description={product.title}
              />

              {/* Cross-reference highlight (if any) */}
              {product.crossReferences.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <p className="text-sm text-slate-500 mb-2">
                    Replaces / Compatible with:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.crossReferences.slice(0, 5).map((ref, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded"
                      >
                        {ref.competitorBrand}: {ref.competitorSku}
                      </span>
                    ))}
                    {product.crossReferences.length > 5 && (
                      <span className="px-2 py-1 text-xs text-slate-500">
                        +{product.crossReferences.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product tabs */}
          <ProductTabs product={product} />

          {/* Related products */}
          <RelatedProducts
            currentSku={product.sku}
            products={relatedProducts}
            title="You May Also Like"
          />
        </Container>
      </main>
      <WebsiteFooter />
      <QuoteModalWrapper />
    </div>
  );
}
