'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useCreateOrderFromQuote } from '@/hooks/useOrders';

interface CreateOrderModalProps {
  quoteId: string;
  quoteNumber: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CreateOrderModal({ quoteId, quoteNumber, isOpen, onClose }: CreateOrderModalProps) {
  const router = useRouter();
  const createOrder = useCreateOrderFromQuote();
  const [customerPoNumber, setCustomerPoNumber] = useState('');
  const [customerPoDate, setCustomerPoDate] = useState('');
  const [requiredDate, setRequiredDate] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await createOrder.mutateAsync({
        quoteId,
        customerPoNumber: customerPoNumber || undefined,
        customerPoDate: customerPoDate || undefined,
        requiredDate: requiredDate || undefined,
        customerNotes: customerNotes || undefined,
      });

      // Navigate to the new order
      if (result) {
        router.push(`/orders/${result.id}`);
      }
      onClose();
    } catch (error) {
      console.error('Failed to create order:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Create Order</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="p-4 space-y-4">
              <p className="text-sm text-slate-600">
                Create a sales order from quote <span className="font-medium">{quoteNumber}</span>
              </p>

              <div>
                <label htmlFor="customerPoNumber" className="block text-sm font-medium text-slate-700 mb-1">
                  Customer PO Number
                </label>
                <input
                  type="text"
                  id="customerPoNumber"
                  value={customerPoNumber}
                  onChange={(e) => setCustomerPoNumber(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label htmlFor="customerPoDate" className="block text-sm font-medium text-slate-700 mb-1">
                  Customer PO Date
                </label>
                <input
                  type="date"
                  id="customerPoDate"
                  value={customerPoDate}
                  onChange={(e) => setCustomerPoDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label htmlFor="requiredDate" className="block text-sm font-medium text-slate-700 mb-1">
                  Required Date
                </label>
                <input
                  type="date"
                  id="requiredDate"
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label htmlFor="customerNotes" className="block text-sm font-medium text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  id="customerNotes"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Optional delivery instructions or notes"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50 rounded-b-lg">
              <button
                type="button"
                onClick={onClose}
                disabled={createOrder.isPending}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createOrder.isPending}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createOrder.isPending ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
