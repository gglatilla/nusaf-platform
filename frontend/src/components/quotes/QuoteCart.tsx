'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, ChevronDown, FileText, Trash2, X } from 'lucide-react';
import { useActiveQuote, useRemoveQuoteItem } from '@/hooks/useQuotes';
import { useAuthStore } from '@/stores/auth-store';
import { useQuoteCompanyStore } from '@/stores/quote-company-store';
import { formatCurrency } from '@/lib/formatting';

const TIER_LABELS: Record<string, string> = {
  END_USER: 'End User',
  OEM_RESELLER: 'OEM/Reseller',
  DISTRIBUTOR: 'Distributor',
};

export function QuoteCart() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: activeQuote, isLoading } = useActiveQuote();
  const removeItem = useRemoveQuoteItem();
  const { user } = useAuthStore();
  const { selectedCompany } = useQuoteCompanyStore();
  const isCustomer = user?.role === 'CUSTOMER';
  const isStaff = user && ['ADMIN', 'MANAGER', 'SALES'].includes(user.role);
  const catalogHref = isCustomer ? '/my/products' : '/catalog';
  const quoteHref = (id: string) => isCustomer ? `/my/quotes/${id}` : `/quotes/${id}`;

  const itemCount = activeQuote?.itemCount || 0;

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

  const handleRemoveItem = (itemId: string) => {
    if (!activeQuote) return;
    removeItem.mutate({ quoteId: activeQuote.id, itemId });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
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
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : !activeQuote || activeQuote.items.length === 0 ? (
            <div className="p-6 text-center">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              {isStaff && !selectedCompany ? (
                <p className="text-sm text-amber-600 mb-4">Select a customer company first to start a quote</p>
              ) : (
                <p className="text-sm text-slate-600 mb-4">Your quote is empty</p>
              )}
              <Link
                href={catalogHref}
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900">
                  {activeQuote.quoteNumber}
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Staff: customer company banner */}
              {isStaff && selectedCompany && (
                <div className="px-4 py-2 bg-primary-50 border-b border-primary-100">
                  <p className="text-xs font-medium text-primary-700">
                    Creating quote for: {selectedCompany.name} ({TIER_LABELS[selectedCompany.tier] || selectedCompany.tier})
                  </p>
                </div>
              )}

              {/* Items */}
              <div className="max-h-64 overflow-y-auto">
                {activeQuote.items.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-3 border-b border-slate-100 last:border-0 flex items-start gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {item.productSku}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {item.productDescription}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {item.quantity} x {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {formatCurrency(item.lineTotal)}
                      </span>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {activeQuote.items.length > 5 && (
                  <div className="px-4 py-2 text-xs text-slate-500 text-center">
                    +{activeQuote.items.length - 5} more items
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="text-slate-900">{formatCurrency(activeQuote.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600">VAT</span>
                  <span className="text-slate-900">{formatCurrency(activeQuote.vatAmount)}</span>
                </div>
                <div className="flex items-center justify-between font-semibold mt-2 pt-2 border-t border-slate-200">
                  <span className="text-slate-900">Total</span>
                  <span className="text-slate-900">{formatCurrency(activeQuote.total)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-slate-200">
                <Link
                  href={quoteHref(activeQuote.id)}
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
                >
                  View Quote
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
