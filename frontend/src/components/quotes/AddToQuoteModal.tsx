'use client';

import { useState } from 'react';
import { Minus, Plus, ShoppingCart, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateQuote, useAddQuoteItem } from '@/hooks/useQuotes';
import type { CatalogProduct } from '@/lib/api';

interface AddToQuoteModalProps {
  product: CatalogProduct;
  isOpen: boolean;
  onClose: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
}

export function AddToQuoteModal({ product, isOpen, onClose }: AddToQuoteModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const createQuote = useCreateQuote();
  const addItem = useAddQuoteItem();

  const isLoading = createQuote.isPending || addItem.isPending;
  const lineTotal = product.price ? product.price * quantity : 0;

  const handleQuantityChange = (value: number) => {
    if (value >= 1) {
      setQuantity(value);
    }
  };

  const handleAddToQuote = async () => {
    try {
      setError(null);

      // Create or get existing draft quote
      const quoteResult = await createQuote.mutateAsync();

      if (!quoteResult) {
        setError('Failed to create quote');
        return;
      }

      // Add item to quote
      await addItem.mutateAsync({
        quoteId: quoteResult.id,
        data: {
          productId: product.id,
          quantity,
        },
      });

      // Close modal and reset
      setQuantity(1);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item to quote');
    }
  };

  const handleClose = () => {
    setQuantity(1);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Add to Quote
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Product Info */}
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-900">{product.nusafSku}</p>
            <p className="text-sm text-slate-600 mt-1">{product.description}</p>
            {product.price && (
              <p className="text-sm font-semibold text-primary-600 mt-2">
                {formatCurrency(product.price)} / {product.unitOfMeasure}
              </p>
            )}
          </div>

          {/* Quantity Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1 || isLoading}
                className="p-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                min={1}
                disabled={isLoading}
                className="w-20 text-center px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={isLoading}
                className="p-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Line Total */}
          {product.price && (
            <div className="flex items-center justify-between py-3 border-t border-slate-200">
              <span className="text-sm text-slate-600">Line Total</span>
              <span className="text-lg font-semibold text-slate-900">
                {formatCurrency(lineTotal)}
              </span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddToQuote}
              disabled={isLoading || !product.hasPrice}
              className="flex-1 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Adding...' : 'Add to Quote'}
            </button>
          </div>

          {!product.hasPrice && (
            <p className="text-xs text-center text-amber-600">
              This product has no price set. Contact sales for pricing.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
