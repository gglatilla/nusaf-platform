'use client';

import { ProductCard } from './ProductCard';
import type { CatalogProduct } from '@/lib/api';

interface ProductGridProps {
  products: CatalogProduct[];
  isLoading?: boolean;
  onViewDetails?: (product: CatalogProduct) => void;
}

export function ProductGrid({ products, isLoading, onViewDetails }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No products found</p>
        <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or search</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onViewDetails={onViewDetails} />
      ))}
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 animate-pulse">
      {/* Supplier badge */}
      <div className="h-6 w-16 bg-slate-200 rounded mb-3" />

      {/* SKU */}
      <div className="h-3 w-24 bg-slate-200 rounded mb-1" />

      {/* Description */}
      <div className="space-y-2 mb-3">
        <div className="h-4 w-full bg-slate-200 rounded" />
        <div className="h-4 w-3/4 bg-slate-200 rounded" />
      </div>

      {/* Price */}
      <div className="mb-4">
        <div className="h-6 w-20 bg-slate-200 rounded mb-1" />
        <div className="h-3 w-16 bg-slate-200 rounded" />
      </div>

      {/* Button */}
      <div className="h-9 w-full bg-slate-200 rounded" />
    </div>
  );
}
