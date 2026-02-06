'use client';

import type { ProductWithInventory } from '@/lib/api/types/products';

interface QuickStatsBarProps {
  product: ProductWithInventory;
  canViewCosts: boolean;
}

const formatPrice = (price: number | null | undefined) => {
  if (!price) return '—';
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(price);
};

export function QuickStatsBar({ product, canViewCosts }: QuickStatsBarProps) {
  const inventory = product.inventory;

  const stats = [
    {
      label: 'On Hand',
      value: inventory?.onHand ?? product.stockSummary?.totalOnHand ?? 0,
      color: 'text-slate-900',
    },
    {
      label: 'Available',
      value: inventory?.available ?? product.stockSummary?.totalAvailable ?? 0,
      color: 'text-green-700',
    },
    {
      label: 'Reserved',
      value: inventory?.reserved ?? 0,
      color: 'text-amber-700',
    },
    {
      label: 'On Order',
      value: inventory?.onOrder ?? 0,
      color: 'text-blue-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
          <p className={`text-lg font-semibold ${stat.color}`}>{stat.value}</p>
        </div>
      ))}
      {canViewCosts && (
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">List Price</p>
          <p className="text-lg font-semibold text-slate-900">{formatPrice(product.listPrice)}</p>
        </div>
      )}
    </div>
  );
}
