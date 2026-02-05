'use client';

import { PublicProduct } from '@/lib/api';
import { ProductCard } from '../products/ProductCard';

interface RelatedProductsProps {
  /** The current product SKU (for reference) */
  currentSku: string;
  /** Related products to display */
  products: PublicProduct[];
  /** Optional title override */
  title?: string;
}

/**
 * Displays related products in a horizontal scrollable grid
 * Used on product detail pages to show products from the same category
 */
export function RelatedProducts({
  currentSku,
  products,
  title = 'Related Products',
}: RelatedProductsProps) {
  // Don't render if no related products
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 border-t border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        {products.length > 4 && (
          <span className="text-sm text-slate-500">
            {products.length} products
          </span>
        )}
      </div>

      {/* Desktop: Grid layout */}
      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.slice(0, 8).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Mobile: Horizontal scroll */}
      <div className="md:hidden overflow-x-auto pb-4 -mx-4 px-4">
        <div className="flex gap-4" style={{ width: 'max-content' }}>
          {products.slice(0, 8).map((product) => (
            <div key={product.id} className="w-[200px] flex-shrink-0">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      {/* View more link if there are more than 8 products */}
      {products.length > 8 && (
        <div className="mt-6 text-center">
          <a
            href={`/products/${products[0]?.category?.code || ''}`}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            View all related products
          </a>
        </div>
      )}
    </section>
  );
}
