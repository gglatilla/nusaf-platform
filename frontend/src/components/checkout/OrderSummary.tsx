'use client';

import { formatCurrency } from '@/lib/formatting';

interface OrderSummaryProps {
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  paymentTerms?: string;
  itemCount: number;
}

const PAYMENT_TERMS_LABELS: Record<string, string> = {
  PREPAY: 'Prepay',
  COD: 'Cash on Delivery',
  NET_30: 'Net 30 days',
  NET_60: 'Net 60 days',
  NET_90: 'Net 90 days',
};

export function OrderSummary({ subtotal, vatRate, vatAmount, total, paymentTerms, itemCount }: OrderSummaryProps): JSX.Element {
  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Order Summary</h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>VAT ({vatRate}%)</span>
          <span>{formatCurrency(vatAmount)}</span>
        </div>
        <div className="border-t border-slate-200 pt-2 mt-2">
          <div className="flex justify-between font-semibold text-slate-900">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {paymentTerms && (
        <div className="mt-4 pt-3 border-t border-slate-200">
          <p className="text-xs text-slate-500">Payment Terms</p>
          <p className="text-sm font-medium text-slate-700">
            {PAYMENT_TERMS_LABELS[paymentTerms] || paymentTerms}
          </p>
        </div>
      )}
    </div>
  );
}
