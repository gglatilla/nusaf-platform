'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useRecordPayment } from '@/hooks/usePayments';
import type { PaymentMethod } from '@/lib/api';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  balanceRemaining: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount);
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'EFT', label: 'EFT (Electronic Funds Transfer)' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'CASH', label: 'Cash' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'OTHER', label: 'Other' },
];

export function RecordPaymentModal({
  isOpen,
  onClose,
  orderId,
  balanceRemaining,
}: RecordPaymentModalProps) {
  const [amount, setAmount] = useState(balanceRemaining.toFixed(2));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFT');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const recordPayment = useRecordPayment();

  if (!isOpen) return null;

  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0 && parsedAmount <= balanceRemaining;
  const canSubmit = isValidAmount && paymentReference.trim().length > 0 && paymentMethod && paymentDate;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      await recordPayment.mutateAsync({
        orderId,
        data: {
          amount: parsedAmount,
          paymentMethod,
          paymentReference: paymentReference.trim(),
          paymentDate,
          notes: notes.trim() || undefined,
        },
      });
      handleClose();
    } catch {
      // Error handled by mutation state
    }
  };

  const handleClose = () => {
    setAmount(balanceRemaining.toFixed(2));
    setPaymentMethod('EFT');
    setPaymentReference('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Record Payment</h3>
            <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              Balance remaining: <span className="font-semibold text-slate-900">{formatCurrency(balanceRemaining)}</span>
            </p>
          </div>

          <div className="space-y-4">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Amount (ZAR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={balanceRemaining}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {!isNaN(parsedAmount) && parsedAmount > balanceRemaining && (
                <p className="text-xs text-red-600 mt-1">Amount exceeds balance remaining</p>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Reference */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Payment Reference <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Bank reference, transaction ID..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {recordPayment.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{recordPayment.error.message}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || recordPayment.isPending}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {recordPayment.isPending ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
