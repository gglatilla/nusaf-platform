'use client';

import { useState, useRef, useEffect } from 'react';
import { ShoppingCart, ChevronDown, FileText, Trash2, X, Plus, Minus } from 'lucide-react';
import { useGuestQuoteStore, useGuestQuoteHydrated } from '@/stores/guest-quote-store';

interface GuestQuoteBasketProps {
  onRequestQuote: () => void;
}

export function GuestQuoteBasket({ onRequestQuote }: GuestQuoteBasketProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isHydrated = useGuestQuoteHydrated();
  const { items, removeItem, updateQuantity, getItemCount } = useGuestQuoteStore();

  const itemCount = isHydrated ? getItemCount() : 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRequestQuote = () => {
    setIsOpen(false);
    onRequestQuote();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-primary-600 rounded-full">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
        <span className="hidden sm:inline">Quote</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
          {!isHydrated ? (
            <div className="p-4 text-center">
              <div className="animate-spin h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-600 mb-4">Your quote basket is empty</p>
              <a
                href="/products"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
              >
                Browse Products
              </a>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900">
                  Quote Basket ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Items */}
              <div className="max-h-64 overflow-y-auto">
                {items.slice(0, 5).map((item) => (
                  <div
                    key={item.productId}
                    className="px-4 py-3 border-b border-slate-100 last:border-0"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {item.nusafSku}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{item.description}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-500">Qty:</span>
                      <div className="flex items-center border border-slate-200 rounded">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2 text-sm font-medium text-slate-900 min-w-[24px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {items.length > 5 && (
                  <div className="px-4 py-2 text-xs text-slate-500 text-center">
                    +{items.length - 5} more items
                  </div>
                )}
              </div>

              {/* Note about pricing */}
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-200">
                <p className="text-xs text-slate-500 text-center">
                  Pricing will be provided in your quote
                </p>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-slate-200">
                <button
                  onClick={handleRequestQuote}
                  className="block w-full text-center px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Request Quote
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
