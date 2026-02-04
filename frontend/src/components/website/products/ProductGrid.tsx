import { PublicProduct } from '@/lib/api';
import { ProductCard } from './ProductCard';
import { Package } from 'lucide-react';

interface ProductGridProps {
  products: PublicProduct[];
  /** Map of productId to matched competitor SKU (for cross-ref search results) */
  matchedViaMap?: Record<string, string>;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Custom empty state message */
  emptyMessage?: string;
}

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
      <div className="aspect-square bg-slate-100" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-slate-100 rounded w-1/3" />
        <div className="space-y-2">
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-2/3" />
        </div>
        <div className="h-9 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

export function ProductGrid({
  products,
  matchedViaMap,
  isLoading = false,
  emptyMessage = 'No products found',
}: ProductGridProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
          <Package className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">No products found</h3>
        <p className="text-slate-500 max-w-md mx-auto">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          matchedVia={matchedViaMap?.[product.id]}
        />
      ))}
    </div>
  );
}
