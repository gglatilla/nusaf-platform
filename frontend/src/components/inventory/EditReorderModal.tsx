'use client';

import { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { useUpdateReorderSettings } from '@/hooks/useInventory';
import type { StockLevelItem } from '@/lib/api';
import { cn } from '@/lib/utils';

interface EditReorderModalProps {
  stockLevel: StockLevelItem;
  onClose: () => void;
}

export function EditReorderModal({ stockLevel, onClose }: EditReorderModalProps) {
  const [reorderPoint, setReorderPoint] = useState<string>(
    stockLevel.reorderPoint?.toString() ?? ''
  );
  const [reorderQuantity, setReorderQuantity] = useState<string>(
    stockLevel.reorderQuantity?.toString() ?? ''
  );
  const [minimumStock, setMinimumStock] = useState<string>(
    stockLevel.minimumStock?.toString() ?? ''
  );
  const [maximumStock, setMaximumStock] = useState<string>(
    stockLevel.maximumStock?.toString() ?? ''
  );
  const [error, setError] = useState<string | null>(null);

  const mutation = useUpdateReorderSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await mutation.mutateAsync({
        productId: stockLevel.productId,
        location: stockLevel.location,
        data: {
          reorderPoint: reorderPoint ? parseInt(reorderPoint, 10) : null,
          reorderQuantity: reorderQuantity ? parseInt(reorderQuantity, 10) : null,
          minimumStock: minimumStock ? parseInt(minimumStock, 10) : null,
          maximumStock: maximumStock ? parseInt(maximumStock, 10) : null,
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              Edit Reorder Settings
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 space-y-4">
              {/* Product Info */}
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm font-mono text-slate-900">{stockLevel.product.nusafSku}</p>
                <p className="text-xs text-slate-500 truncate">{stockLevel.product.description}</p>
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 mt-2 rounded text-xs font-medium',
                    stockLevel.location === 'JHB'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  )}
                >
                  {stockLevel.location === 'JHB' ? 'Johannesburg' : 'Cape Town'}
                </span>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Reorder Point
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={reorderPoint}
                    onChange={(e) => setReorderPoint(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Alert when stock falls below this
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Reorder Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={reorderQuantity}
                    onChange={(e) => setReorderQuantity(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Suggested order quantity
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Minimum Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minimumStock}
                    onChange={(e) => setMinimumStock(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Safety stock level
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Maximum Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={maximumStock}
                    onChange={(e) => setMaximumStock(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Overstock threshold
                  </p>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={onClose}
                disabled={mutation.isPending}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {mutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
