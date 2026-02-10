'use client';

import { useState } from 'react';
import { Banknote, XCircle } from 'lucide-react';
import { useVoidPayment } from '@/hooks/usePayments';
import type { Payment, OrderPaymentStatus, PaymentMethod } from '@/lib/api';
import { formatCurrency } from '@/lib/formatting';

interface PaymentsSectionProps {
  payments: Payment[];
  orderTotal: number;
  paymentTerms?: string;
  paymentStatus: OrderPaymentStatus;
  canRecordPayment?: boolean;
  canVoid?: boolean;
  onRecordPayment: () => void;
}

function formatShortDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

function paymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    EFT: 'EFT',
    CREDIT_CARD: 'Credit Card',
    CASH: 'Cash',
    CHEQUE: 'Cheque',
    OTHER: 'Other',
  };
  return labels[method] || method;
}

function PaymentStatusBadge({ status }: { status: OrderPaymentStatus }) {
  const config: Record<OrderPaymentStatus, { bg: string; text: string; label: string }> = {
    UNPAID: { bg: 'bg-red-100', text: 'text-red-700', label: 'Unpaid' },
    PARTIALLY_PAID: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Partially Paid' },
    PAID: { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid' },
    NOT_REQUIRED: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'On Account' },
  };
  const c = config[status] || config.UNPAID;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

const PAYMENT_TERMS_LABELS: Record<string, string> = {
  PREPAY: 'Prepay',
  COD: 'Cash on Delivery',
  NET_30: 'Net 30 days',
  NET_60: 'Net 60 days',
  NET_90: 'Net 90 days',
};

export function PaymentsSection({
  payments,
  orderTotal,
  paymentTerms,
  paymentStatus,
  canRecordPayment = false,
  canVoid = false,
  onRecordPayment,
}: PaymentsSectionProps) {
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const voidPayment = useVoidPayment();

  const confirmedPayments = payments.filter((p) => p.status === 'CONFIRMED');
  const totalPaid = confirmedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const balanceRemaining = Math.max(0, orderTotal - totalPaid);

  const handleVoid = async (paymentId: string) => {
    if (!voidReason.trim()) return;
    await voidPayment.mutateAsync({ paymentId, reason: voidReason });
    setVoidingId(null);
    setVoidReason('');
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Banknote className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-900">Payments</h2>
          <PaymentStatusBadge status={paymentStatus} />
        </div>
        {canRecordPayment && paymentStatus !== 'PAID' && (
          <button
            onClick={onRecordPayment}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            Record Payment
          </button>
        )}
      </div>

      {/* Payment Terms Context Banner */}
      {paymentTerms && (paymentTerms === 'PREPAY' || paymentTerms === 'COD') && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
          This is a prepay order. Payment must be recorded before fulfillment can begin.
        </div>
      )}
      {paymentTerms && paymentTerms !== 'PREPAY' && paymentTerms !== 'COD' && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
          This customer is on <span className="font-medium">{PAYMENT_TERMS_LABELS[paymentTerms] || paymentTerms}</span> terms. Payment is tracked for reconciliation.
        </div>
      )}

      {/* Payment Summary */}
      <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-slate-50 rounded-lg">
        <div>
          <p className="text-xs text-slate-500">Order Total</p>
          <p className="text-sm font-semibold text-slate-900">{formatCurrency(orderTotal)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Total Paid</p>
          <p className="text-sm font-semibold text-green-700">{formatCurrency(totalPaid)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Balance</p>
          <p className={`text-sm font-semibold ${balanceRemaining > 0 ? 'text-red-700' : 'text-green-700'}`}>
            {formatCurrency(balanceRemaining)}
          </p>
        </div>
      </div>

      {/* Payment List */}
      {payments.length > 0 ? (
        <div className="space-y-3">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className={`flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 ${
                payment.status === 'VOIDED' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-slate-900">
                  {payment.paymentNumber}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    payment.status === 'CONFIRMED'
                      ? 'bg-green-100 text-green-700'
                      : payment.status === 'VOIDED'
                        ? 'bg-slate-100 text-slate-500 line-through'
                        : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {payment.status === 'CONFIRMED' ? 'Confirmed' : payment.status === 'VOIDED' ? 'Voided' : 'Pending'}
                </span>
                <span className="text-xs text-slate-500">
                  {formatShortDate(payment.paymentDate)}
                </span>
                <span className="text-xs text-slate-500">
                  {paymentMethodLabel(payment.paymentMethod)}
                </span>
                {payment.paymentReference && (
                  <span className="text-xs text-slate-400">
                    Ref: {payment.paymentReference}
                  </span>
                )}
                <span className="text-sm font-medium text-slate-700">
                  {formatCurrency(Number(payment.amount))}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">
                  {payment.receivedByName}
                </span>
                {canVoid && payment.status === 'CONFIRMED' && (
                  <button
                    onClick={() => setVoidingId(payment.id)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
                    title="Void payment"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Void
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 text-center py-4">
          No payments recorded yet.
        </p>
      )}

      {/* Void confirmation modal */}
      {voidingId && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setVoidingId(null)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Void Payment
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                This will void the payment and recalculate the order&apos;s payment status. This cannot be undone.
              </p>
              <textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Enter reason for voiding..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    setVoidingId(null);
                    setVoidReason('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleVoid(voidingId)}
                  disabled={!voidReason.trim() || voidPayment.isPending}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {voidPayment.isPending ? 'Voiding...' : 'Void Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
