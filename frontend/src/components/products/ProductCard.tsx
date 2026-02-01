'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { CatalogProduct } from '@/lib/api';
import { StockIndicator } from './StockIndicator';

interface ProductCardProps {
  product: CatalogProduct;
  onViewDetails?: (product: CatalogProduct) => void;
  showQuantity?: boolean;
}

export const ProductCard = memo(function ProductCard({ product, onViewDetails, showQuantity = true }: ProductCardProps) {
  const formattedPrice = product.price
    ? new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
      }).format(product.price)
    : null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all">
      {/* Supplier badge */}
      <div className="mb-3">
        <span
          className={cn(
            'px-2 py-1 text-xs font-medium rounded',
            product.supplier.code === 'TECOM' && 'bg-blue-100 text-blue-700',
            product.supplier.code === 'CHIARAVALLI' && 'bg-green-100 text-green-700',
            product.supplier.code === 'REGINA' && 'bg-purple-100 text-purple-700',
            product.supplier.code === 'NUSAF' && 'bg-orange-100 text-orange-700',
            !['TECOM', 'CHIARAVALLI', 'REGINA', 'NUSAF'].includes(product.supplier.code) &&
              'bg-slate-100 text-slate-700'
          )}
        >
          {product.supplier.name}
        </span>
      </div>

      {/* SKU */}
      <p className="text-xs text-slate-500 mb-1">SKU: {product.nusafSku}</p>

      {/* Description */}
      <h3 className="text-sm font-medium text-slate-900 mb-3 line-clamp-2 min-h-[2.5rem]">
        {product.description}
      </h3>

      {/* Price */}
      <div className="mb-2">
        {product.hasPrice ? (
          <>
            <p className="text-lg font-bold text-slate-900">{formattedPrice}</p>
            <p className="text-xs text-slate-500">{product.priceLabel}</p>
          </>
        ) : (
          <p className="text-sm text-slate-500 italic">Price on Request</p>
        )}
      </div>

      {/* Stock indicator */}
      {product.stockSummary && (
        <div className="mb-4">
          <StockIndicator
            available={product.stockSummary.totalAvailable}
            status={product.stockSummary.status}
            showQuantity={showQuantity}
          />
        </div>
      )}

      {/* View details button */}
      <button
        onClick={() => onViewDetails?.(product)}
        className="w-full px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-md transition-colors"
      >
        View Details
      </button>
    </div>
  );
});
