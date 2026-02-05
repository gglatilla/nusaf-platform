'use client';

import Link from 'next/link';
import type { ProductWithInventory } from '@/lib/api';

interface StockLevelsDisplayProps {
  product: ProductWithInventory;
  showLink?: boolean;
}

export function StockLevelsDisplay({ product, showLink = true }: StockLevelsDisplayProps) {
  const hasStockData = product.inventory || product.stockSummary;

  return (
    <section className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Current Stock</h3>
      {hasStockData ? (
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-slate-600">Available</span>
            <span className="text-sm font-medium text-slate-900">
              {product.inventory?.available ?? product.stockSummary?.totalAvailable ?? 0}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-600">Reserved</span>
            <span className="text-sm font-medium text-slate-900">
              {product.inventory?.reserved ?? 0}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-600">On Order</span>
            <span className="text-sm font-medium text-slate-900">
              {product.inventory?.onOrder ?? 0}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between">
            <span className="text-sm font-medium text-slate-700">Total On Hand</span>
            <span className="text-sm font-bold text-slate-900">
              {product.inventory?.onHand ?? product.stockSummary?.totalOnHand ?? 0}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">No stock data available</p>
      )}
      {showLink && (
        <Link
          href="/inventory"
          className="mt-4 block text-sm text-primary-600 hover:text-primary-700"
        >
          View Stock Details →
        </Link>
      )}
    </section>
  );
}
