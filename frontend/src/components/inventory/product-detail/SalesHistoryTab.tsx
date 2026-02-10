'use client';

import Link from 'next/link';
import { useProductSalesHistory } from '@/hooks/useProductInventory';
import { formatCurrency, formatDate } from '@/lib/formatting';

interface SalesHistoryTabProps {
  productId: string;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-amber-100 text-amber-700',
  READY_TO_SHIP: 'bg-cyan-100 text-cyan-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export function SalesHistoryTab({ productId }: SalesHistoryTabProps) {
  const { data, isLoading } = useProductSalesHistory(productId);

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">Total Orders</p>
            <p className="text-lg font-semibold text-slate-900">{summary.totalOrders}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">Units Ordered</p>
            <p className="text-lg font-semibold text-slate-900">{summary.totalUnitsOrdered}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">Unique Customers</p>
            <p className="text-lg font-semibold text-slate-900">{summary.uniqueCustomers}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">Total Revenue</p>
            <p className="text-lg font-semibold text-green-700">{formatCurrency(summary.totalRevenue)}</p>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <section className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Sales Orders</h2>

        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-200 rounded" />
            ))}
          </div>
        ) : !data?.data?.length ? (
          <p className="text-sm text-slate-500">No sales orders found for this product.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Order</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Qty</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Shipped</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Unit Price</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Line Total</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((line) => (
                  <tr key={line.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <Link
                        href={`/orders/${line.orderId}`}
                        className="text-primary-600 hover:text-primary-700 font-mono"
                      >
                        {line.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-900">{line.companyName}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${STATUS_COLORS[line.status] || 'bg-slate-100 text-slate-700'}`}>
                        {line.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">{line.quantityOrdered}</td>
                    <td className="py-3 px-4 text-right">{line.quantityShipped}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatCurrency(line.unitPrice)}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatCurrency(line.lineTotal)}</td>
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
