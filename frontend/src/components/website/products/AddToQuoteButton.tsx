'use client';

import { useState } from 'react';
import { Plus, Minus, Check, ShoppingCart } from 'lucide-react';
import { useGuestQuoteStore, useGuestQuoteHydrated } from '@/stores/guest-quote-store';

interface AddToQuoteButtonProps {
  productId: string;
  sku: string;
  description: string;
  /** Compact mode for card usage */
  compact?: boolean;
  /** Initial quantity (for detail page) */
  initialQuantity?: number;
}

export function AddToQuoteButton({
  productId,
  sku,
  description,
  compact = false,
  initialQuantity = 1,
}: AddToQuoteButtonProps) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [showSuccess, setShowSuccess] = useState(false);

  const isHydrated = useGuestQuoteHydrated();
  const { addItem, items } = useGuestQuoteStore();

  const existingItem = items.find((item) => item.productId === productId);
  const isInBasket = !!existingItem;

  const handleAddToQuote = () => {
    addItem(
      {
        productId,
        nusafSku: sku,
        description,
      },
      quantity
    );

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const incrementQuantity = () => setQuantity((q) => Math.min(q + 1, 999));
  const decrementQuantity = () => setQuantity((q) => Math.max(q - 1, 1));

  // Compact mode (for cards)
  if (compact) {
    return (
      <button
        onClick={handleAddToQuote}
        disabled={!isHydrated}
        className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
          showSuccess
            ? 'bg-green-600 text-white'
            : isInBasket
              ? 'bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100'
              : 'bg-primary-600 text-white hover:bg-primary-700'
        } disabled:opacity-50`}
      >
        {showSuccess ? (
          <>
            <Check className="h-4 w-4" />
            Added
          </>
        ) : isInBasket ? (
          <>
            <ShoppingCart className="h-4 w-4" />
            In Quote ({existingItem.quantity})
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            Add to Quote
          </>
        )}
      </button>
    );
  }

  // Full mode (for detail page)
  return (
    <div className="space-y-3">
      {/* Quantity selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-700">Quantity:</span>
        <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
          <button
            onClick={decrementQuantity}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 1 && val <= 999) {
                setQuantity(val);
              }
            }}
            className="w-16 text-center text-sm font-medium border-x border-slate-300 py-2 focus:outline-none"
            min={1}
            max={999}
          />
          <button
            onClick={incrementQuantity}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Add button */}
      <button
        onClick={handleAddToQuote}
        disabled={!isHydrated}
        className={`w-full flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-lg shadow-lg transition-all ${
          showSuccess
            ? 'bg-green-600 text-white shadow-green-600/25'
            : 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-600/25'
        } disabled:opacity-50`}
      >
        {showSuccess ? (
          <>
            <Check className="h-5 w-5" />
            Added to Quote
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5" />
            Add to Quote
          </>
        )}
      </button>

      {isInBasket && !showSuccess && (
        <p className="text-sm text-slate-500 text-center">
          Already in quote: {existingItem.quantity} {existingItem.quantity === 1 ? 'unit' : 'units'}
        </p>
      )}
    </div>
  );
}
