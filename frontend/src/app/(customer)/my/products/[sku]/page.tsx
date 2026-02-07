'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Package,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Minus,
  Plus,
  FileText,
  Download,
  ArrowRightLeft,
  Check,
  Info,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { PublicProductDetail, PublicProductImage } from '@/lib/api';
import { useProducts } from '@/hooks/useProducts';
import { useCreateQuote, useAddQuoteItem } from '@/hooks/useQuotes';
import { StockStatusBadge } from '@/components/inventory';
import { getUomLabel } from '@/lib/constants/unit-of-measure';

export default function CustomerProductDetailPage() {
  const params = useParams();
  const sku = params.sku as string;

  // Fetch rich marketing content (images, specs, docs, cross-refs) — public API
  const {
    data: publicProduct,
    isLoading: isLoadingPublic,
    error: publicError,
  } = useQuery({
    queryKey: ['publicProduct', sku],
    queryFn: async () => {
      const response = await api.getPublicProduct(sku);
      return response.success ? response.data : null;
    },
    enabled: !!sku,
    staleTime: 5 * 60 * 1000, // 5 min — marketing content doesn't change often
  });

  // Fetch tier pricing + stock badge — authenticated catalog API
  const { data: productsData, isLoading: isLoadingCatalog } = useProducts(
    { search: sku, pageSize: 5 },
    { enabled: !!sku }
  );
  // Find exact SKU match from search results
  const catalogProduct = productsData?.products?.find(
    (p) => p.nusafSku === sku
  );

  const isLoading = isLoadingPublic || isLoadingCatalog;

  if (isLoading) {
    return <CustomerProductDetailSkeleton />;
  }

  if (publicError || !publicProduct) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          Product not found
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          The product you&apos;re looking for doesn&apos;t exist or is no longer available.
        </p>
        <Link
          href="/my/products"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Back link + breadcrumb */}
      <div className="mb-6">
        <Link
          href="/my/products"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>
        <nav className="mt-2 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/my/products" className="hover:text-primary-600">
            Products
          </Link>
          <span>/</span>
          <Link
            href={`/my/products?categoryId=${publicProduct.category.id}`}
            className="hover:text-primary-600"
          >
            {publicProduct.category.name}
          </Link>
          {publicProduct.subCategory && (
            <>
              <span>/</span>
              <Link
                href={`/my/products?categoryId=${publicProduct.category.id}&subCategoryId=${publicProduct.subCategory.id}`}
                className="hover:text-primary-600"
              >
                {publicProduct.subCategory.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-slate-900 font-medium">{publicProduct.sku}</span>
        </nav>
      </div>

      {/* Main product section — two column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Left: Image gallery */}
        <ProductImageGallery
          images={publicProduct.images}
          productTitle={publicProduct.title}
        />

        {/* Right: Product info */}
        <div className="space-y-5">
          {/* Category badge */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-primary-50 text-primary-700">
              {publicProduct.category.name}
            </span>
            {publicProduct.subCategory && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
                {publicProduct.subCategory.name}
              </span>
            )}
          </div>

          {/* SKU */}
          <p className="text-sm text-slate-500 font-mono">
            SKU: {publicProduct.sku}
          </p>

          {/* Product title */}
          <h1 className="text-xl font-bold text-slate-900">
            {publicProduct.title}
          </h1>

          {/* Description */}
          {publicProduct.description && (
            <p className="text-sm text-slate-600 leading-relaxed">
              {publicProduct.description}
            </p>
          )}

          {/* Unit of measure */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Sold per:</span>
            <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-700">
              {getUomLabel(publicProduct.unitOfMeasure)}
            </span>
          </div>

          {/* Pricing — tier-appropriate from catalog API */}
          <div className="pt-4 border-t border-slate-200">
            {catalogProduct?.hasPrice ? (
              <div>
                <span className="text-2xl font-bold text-slate-900">
                  {new Intl.NumberFormat('en-ZA', {
                    style: 'currency',
                    currency: 'ZAR',
                  }).format(catalogProduct.price!)}
                </span>
                <span className="ml-2 text-sm text-slate-500">
                  {catalogProduct.priceLabel}
                </span>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">
                Price on request — contact sales for a quote
              </p>
            )}
          </div>

          {/* Availability badge — no quantities shown (Golden Rule 4) */}
          {catalogProduct?.stockSummary && (
            <div className="flex items-center gap-2">
              <StockStatusBadge status={catalogProduct.stockSummary.status} />
            </div>
          )}

          {/* Add to Quote */}
          {catalogProduct && (
            <AddToQuoteSection product={catalogProduct} />
          )}

          {/* No pricing fallback — still allow quote request */}
          {!catalogProduct && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    Pricing unavailable
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    Please contact our sales team for pricing and availability.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs: Specifications, Documents, Cross-References */}
      <ProductDetailTabs product={publicProduct} />
    </>
  );
}

// ---------- Image Gallery ----------

function ProductImageGallery({
  images,
  productTitle,
}: {
  images: PublicProductImage[];
  productTitle: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="bg-slate-50 rounded-xl border border-slate-200 aspect-square flex items-center justify-center">
        <div className="text-center">
          <Package className="h-20 w-20 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No images available</p>
        </div>
      </div>
    );
  }

  const selectedImage = images[selectedIndex];

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="relative aspect-square">
          <Image
            src={selectedImage.url}
            alt={selectedImage.altText || productTitle}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-4"
            priority
          />
        </div>
        {images.length > 1 && (
          <>
            <button
              onClick={() =>
                setSelectedIndex((prev) =>
                  prev === 0 ? images.length - 1 : prev - 1
                )
              }
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5 text-slate-700" />
            </button>
            <button
              onClick={() =>
                setSelectedIndex((prev) =>
                  prev === images.length - 1 ? 0 : prev + 1
                )
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5 text-slate-700" />
            </button>
          </>
        )}
      </div>
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                index === selectedIndex
                  ? 'border-primary-600'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              aria-label={`View image ${index + 1}`}
            >
              <Image
                src={image.thumbnailUrl || image.url}
                alt={image.altText || `${productTitle} - Image ${index + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Add to Quote Section ----------

function AddToQuoteSection({
  product,
}: {
  product: import('@/lib/api').CatalogProduct;
}) {
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createQuote = useCreateQuote();
  const addItem = useAddQuoteItem();
  const isLoading = createQuote.isPending || addItem.isPending;

  const lineTotal =
    product.price && quantity > 0 ? product.price * quantity : 0;

  const handleAdd = async () => {
    try {
      setError(null);
      const quoteResult = await createQuote.mutateAsync();
      if (!quoteResult) {
        setError('Failed to create quote');
        return;
      }
      await addItem.mutateAsync({
        quoteId: quoteResult.id,
        data: { productId: product.id, quantity },
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setQuantity(1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to add item to quote'
      );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4">
      {/* Quantity selector */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Quantity
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1 || isLoading}
            className="p-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) =>
              setQuantity(Math.max(1, parseInt(e.target.value) || 1))
            }
            min={1}
            disabled={isLoading}
            className="w-20 text-center px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={() => setQuantity(quantity + 1)}
            disabled={isLoading}
            className="p-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Line total */}
      {product.hasPrice && lineTotal > 0 && (
        <div className="flex items-center justify-between py-2 border-t border-slate-100">
          <span className="text-sm text-slate-600">Line Total</span>
          <span className="text-lg font-semibold text-slate-900">
            {new Intl.NumberFormat('en-ZA', {
              style: 'currency',
              currency: 'ZAR',
            }).format(lineTotal)}
          </span>
        </div>
      )}

      {/* Add button */}
      <button
        onClick={handleAdd}
        disabled={isLoading || !product.hasPrice}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
          success
            ? 'bg-green-600 text-white'
            : 'bg-primary-600 text-white hover:bg-primary-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {success ? (
          <>
            <Check className="h-5 w-5" />
            Added to Quote
          </>
        ) : isLoading ? (
          'Adding...'
        ) : (
          <>
            <ShoppingCart className="h-5 w-5" />
            Add to Quote
          </>
        )}
      </button>

      {!product.hasPrice && (
        <p className="text-xs text-center text-amber-600">
          No price available. Contact sales for pricing.
        </p>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}

// ---------- Detail Tabs ----------

function ProductDetailTabs({
  product,
}: {
  product: PublicProductDetail;
}) {
  const [activeTab, setActiveTab] = useState<
    'specs' | 'documents' | 'crossref'
  >('specs');

  const hasSpecs =
    product.specifications && Object.keys(product.specifications).length > 0;
  const hasDocs = product.documents && product.documents.length > 0;
  const hasCrossRefs =
    product.crossReferences && product.crossReferences.length > 0;

  // No tabs to show
  if (!hasSpecs && !hasDocs && !hasCrossRefs) return null;

  const tabs = [
    ...(hasSpecs ? [{ key: 'specs' as const, label: 'Specifications' }] : []),
    ...(hasDocs ? [{ key: 'documents' as const, label: 'Documents' }] : []),
    ...(hasCrossRefs
      ? [{ key: 'crossref' as const, label: 'Cross-Reference' }]
      : []),
  ];

  // Default to first available tab
  const currentTab = tabs.find((t) => t.key === activeTab)
    ? activeTab
    : tabs[0]?.key;

  return (
    <div className="bg-white rounded-lg border border-slate-200">
      {/* Tab headers */}
      <div className="border-b border-slate-200">
        <div className="flex -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                currentTab === tab.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-6">
        {currentTab === 'specs' && hasSpecs && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            {Object.entries(product.specifications!).map(([key, value]) => (
              <div
                key={key}
                className="flex items-baseline justify-between py-2 border-b border-slate-100"
              >
                <span className="text-sm text-slate-500">{key}</span>
                <span className="text-sm font-medium text-slate-900 ml-4">
                  {String(value)}
                </span>
              </div>
            ))}
          </div>
        )}

        {currentTab === 'documents' && hasDocs && (
          <div className="space-y-3">
            {product.documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <FileText className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {doc.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {doc.type.replace(/_/g, ' ')}
                    {doc.fileSize
                      ? ` — ${(doc.fileSize / 1024).toFixed(0)} KB`
                      : ''}
                  </p>
                </div>
                <Download className="h-4 w-4 text-slate-400" />
              </a>
            ))}
          </div>
        )}

        {currentTab === 'crossref' && hasCrossRefs && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 pr-4 text-slate-500 font-medium">
                    Brand
                  </th>
                  <th className="text-left py-2 pr-4 text-slate-500 font-medium">
                    Part Number
                  </th>
                  <th className="text-left py-2 text-slate-500 font-medium">
                    Match
                  </th>
                </tr>
              </thead>
              <tbody>
                {product.crossReferences.map((ref) => (
                  <tr
                    key={ref.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="py-2 pr-4 text-slate-900">
                      {ref.competitorBrand}
                    </td>
                    <td className="py-2 pr-4 font-mono text-slate-700">
                      {ref.competitorSku}
                    </td>
                    <td className="py-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                          ref.isExact
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        <ArrowRightLeft className="h-3 w-3" />
                        {ref.isExact ? 'Exact' : 'Compatible'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Loading Skeleton ----------

function CustomerProductDetailSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="mb-6">
        <div className="h-4 w-32 bg-slate-200 rounded mb-2" />
        <div className="h-4 w-64 bg-slate-200 rounded" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image skeleton */}
        <div className="bg-slate-100 rounded-xl aspect-square" />

        {/* Info skeleton */}
        <div className="space-y-4">
          <div className="h-6 w-32 bg-slate-200 rounded-full" />
          <div className="h-4 w-24 bg-slate-200 rounded" />
          <div className="h-8 w-3/4 bg-slate-200 rounded" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-200 rounded" />
            <div className="h-4 w-5/6 bg-slate-200 rounded" />
          </div>
          <div className="h-10 w-40 bg-slate-200 rounded" />
          <div className="h-6 w-24 bg-slate-200 rounded" />
          <div className="h-32 w-full bg-slate-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
