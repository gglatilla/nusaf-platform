'use client';

interface OrderTotalsProps {
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  currency?: string;
}

function formatCurrency(amount: number, currency: string = 'ZAR'): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function OrderTotals({ subtotal, vatRate, vatAmount, total, currency = 'ZAR' }: OrderTotalsProps) {
  return (
    <div className="bg-slate-50 rounded-lg p-4 space-y-2">
      <div className="flex justify-between text-sm text-slate-600">
        <span>Subtotal</span>
        <span>{formatCurrency(subtotal, currency)}</span>
      </div>
      <div className="flex justify-between text-sm text-slate-600">
        <span>VAT ({vatRate}%)</span>
        <span>{formatCurrency(vatAmount, currency)}</span>
      </div>
      <div className="border-t border-slate-200 pt-2 flex justify-between text-lg font-semibold text-slate-900">
        <span>Total</span>
        <span>{formatCurrency(total, currency)}</span>
      </div>
    </div>
  );
}
