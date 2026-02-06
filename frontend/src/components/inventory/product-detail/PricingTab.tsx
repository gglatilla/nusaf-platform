'use client';

import { ArrowRight } from 'lucide-react';
import type { ProductWithInventory } from '@/lib/api/types/products';

interface PricingTabProps {
  product: ProductWithInventory;
}

const formatCurrency = (amount: number | null | undefined, currency = 'ZAR') => {
  if (amount == null) return '—';
  if (currency === 'EUR') {
    return `EUR ${amount.toFixed(4)}`;
  }
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
};

const TIER_DISCOUNTS = [
  { tier: 'End User', discount: 0.30, description: '30% off list' },
  { tier: 'OEM / Reseller', discount: 0.40, description: '40% off list' },
  { tier: 'Distributor', discount: 0.50, description: '50% off list' },
];

export function PricingTab({ product }: PricingTabProps) {
  const listPrice = product.listPrice;
  const costPrice = product.costPrice;
  const landedCost = product.landedCost;

  const margin = costPrice && listPrice && listPrice > 0
    ? ((listPrice - costPrice) / listPrice * 100)
    : null;

  return (
    <div className="space-y-6">
      {/* Pricing Waterfall */}
      <section className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Pricing Breakdown</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Supplier Cost */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-500 uppercase mb-2">Supplier Cost</h3>
            <p className="text-2xl font-bold text-slate-900">
              {costPrice != null ? formatCurrency(costPrice, 'EUR') : (
                <span className="text-slate-400 text-lg font-normal">Not set</span>
              )}
            </p>
            <p className="text-xs text-slate-500 mt-1">Raw cost from supplier</p>
          </div>

          {/* Landed Cost */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <h3 className="text-sm font-medium text-blue-700 uppercase mb-2">Landed Cost</h3>
            <p className="text-2xl font-bold text-blue-900">
              {landedCost != null ? formatCurrency(landedCost) : (
                <span className="text-slate-400 text-lg font-normal">Not set</span>
              )}
            </p>
            <p className="text-xs text-blue-600 mt-1">EUR x Rate x (1 + Freight%)</p>
          </div>

          {/* List Price */}
          <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
            <h3 className="text-sm font-medium text-emerald-700 uppercase mb-2">List Price</h3>
            <p className="text-2xl font-bold text-emerald-900">
              {listPrice != null ? formatCurrency(listPrice) : (
                <span className="text-slate-400 text-lg font-normal">Not set</span>
              )}
            </p>
            <p className="text-xs text-emerald-600 mt-1">Base price before tier discounts</p>
          </div>
        </div>

        {/* Formula */}
        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <p className="text-sm text-slate-600 font-medium mb-2">Pricing Formula</p>
          <div className="flex items-center gap-2 flex-wrap text-sm text-slate-700">
            <span className="bg-white px-2 py-1 rounded border border-slate-200">Supplier Cost (EUR)</span>
            <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="bg-white px-2 py-1 rounded border border-slate-200">x EUR/ZAR Rate</span>
            <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="bg-white px-2 py-1 rounded border border-slate-200">x (1 + Freight%)</span>
            <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="bg-blue-50 px-2 py-1 rounded border border-blue-200">Landed Cost</span>
            <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="bg-white px-2 py-1 rounded border border-slate-200">/ Margin Divisor</span>
            <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="bg-white px-2 py-1 rounded border border-slate-200">x 1.40</span>
            <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="bg-emerald-50 px-2 py-1 rounded border border-emerald-200 font-medium">List Price</span>
          </div>
        </div>

        {/* Margin */}
        {margin !== null && (
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Gross Margin:</span>
              <span className={`text-sm font-semibold ${margin >= 30 ? 'text-green-700' : margin >= 15 ? 'text-amber-700' : 'text-red-700'}`}>
                {margin.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {product.priceUpdatedAt && (
          <p className="text-xs text-slate-500 mt-4">
            Price last updated: {new Date(product.priceUpdatedAt).toLocaleDateString('en-ZA')}
          </p>
        )}
      </section>

      {/* Tier Pricing Table */}
      <section className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Customer Tier Prices</h2>
        {listPrice != null ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Tier</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Discount</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Unit Price</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <td className="py-3 px-4 font-medium text-slate-900">List Price</td>
                  <td className="py-3 px-4 text-slate-500">—</td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                    {formatCurrency(listPrice)}
                  </td>
                </tr>
                {TIER_DISCOUNTS.map(({ tier, discount, description }) => (
                  <tr key={tier} className="border-b border-slate-100">
                    <td className="py-3 px-4 text-slate-900">{tier}</td>
                    <td className="py-3 px-4 text-slate-500">{description}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-900">
                      {formatCurrency(listPrice * (1 - discount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No list price set. Tier prices cannot be calculated.</p>
        )}
      </section>
    </div>
  );
}
