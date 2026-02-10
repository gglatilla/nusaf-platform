'use client';

import Link from 'next/link';
import { useProductPurchaseHistory } from '@/hooks/useProductInventory';
import type { ProductWithInventory } from '@/lib/api/types/products';
import { formatCurrency, formatDate } from '@/lib/formatting';

interface PurchasingTabProps {
  product: ProductWithInventory;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  SENT: 'bg-indigo-100 text-indigo-700',
  PARTIALLY_RECEIVED: 'bg-cyan-100 text-cyan-700',
  RECEIVED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export function PurchasingTab({ product }: PurchasingTabProps) {
  const { data, isLoading } = useProductPurchaseHistory(product.id);

  return (
    <div className="space-y-6">
      {/* Supplier Info */}
      <section className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Supplier Information</h2>
        <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <dt className="text-xs text-slate-500">Supplier</dt>
            <dd className="text-sm font-medium text-slate-900">{product.supplier?.name || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Supplier SKU</dt>
            <dd className="text-sm font-mono text-slate-900">{product.supplierSku || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Lead Time</dt>
            <dd className="text-sm text-slate-900">{product.leadTimeDays ? `${product.leadTimeDays} days` : '—'}</dd>
          </div>
        </dl>
      </section>

      {/* Purchase Orders */}
      <section className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Purchase Orders</h2>

        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-200 rounded" />
            ))}
          </div>
        ) : !data?.data?.length ? (
          <p className="text-sm text-slate-500">No purchase orders found for this product.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">PO Number</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Ordered</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Received</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Unit Cost</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Expected</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((line) => (
                  <tr key={line.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <Link
                        href={`/purchase-orders/${line.poId}`}
                        className="text-primary-600 hover:text-primary-700 font-mono"
                      >
                        {line.poNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${STATUS_COLORS[line.status] || 'bg-slate-100 text-slate-700'}`}>
                        {line.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">{line.quantityOrdered}</td>
                    <td className="py-3 px-4 text-right">{line.quantityReceived}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatCurrency(line.unitCost, 'EUR')}</td>
                    <td className="py-3 px-4">{formatDate(line.expectedDate)}</td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(line.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
