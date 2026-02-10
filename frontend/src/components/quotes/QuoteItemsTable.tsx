'use client';

import { useState } from 'react';
import { Minus, Plus, Trash2, AlertTriangle } from 'lucide-react';
import type { QuoteItem } from '@/lib/api';
import { useUpdateQuoteItemQuantity, useRemoveQuoteItem } from '@/hooks/useQuotes';
import { formatCurrency } from '@/lib/formatting';

interface QuoteItemsTableProps {
  quoteId: string;
  items: QuoteItem[];
  isEditable: boolean;
  isCustomer?: boolean;
}

interface ItemRowProps {
  quoteId: string;
  item: QuoteItem;
  isEditable: boolean;
  isCustomer?: boolean;
}

function ItemRow({ quoteId, item, isEditable, isCustomer }: ItemRowProps) {
  const [quantity, setQuantity] = useState(item.quantity);
  const updateQuantity = useUpdateQuoteItemQuantity();
  const removeItem = useRemoveQuoteItem();

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    setQuantity(newQuantity);
    updateQuantity.mutate({
      quoteId,
      itemId: item.id,
      quantity: newQuantity,
    });
  };

  const handleRemove = () => {
    if (confirm('Remove this item from the quote?')) {
      removeItem.mutate({ quoteId, itemId: item.id });
    }
  };

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-slate-900">{item.productSku}</div>
        <div className="text-sm text-slate-500 truncate max-w-xs">{item.productDescription}</div>
        {item.stockWarning && (
          <div className="flex items-center gap-1 mt-1">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
            <span className="text-xs text-amber-600">
              {isCustomer
                ? 'Limited availability'
                : `${item.stockWarning.available} available, ${item.stockWarning.requested} requested`}
            </span>
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
        {formatCurrency(item.unitPrice)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {isEditable ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1 || updateQuantity.isPending}
              className="p-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              min={1}
              disabled={updateQuantity.isPending}
              className="w-16 text-center px-2 py-1 border border-slate-200 rounded-md text-sm"
            />
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={updateQuantity.isPending}
              className="p-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <span className="text-sm text-slate-900">{item.quantity}</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
        {formatCurrency(item.lineTotal)}
      </td>
      {isEditable && (
        <td className="px-6 py-4 whitespace-nowrap text-right">
          <button
            onClick={handleRemove}
            disabled={removeItem.isPending}
            className="text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </td>
      )}
    </tr>
  );
}

export function QuoteItemsTable({ quoteId, items, isEditable, isCustomer }: QuoteItemsTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <p className="text-sm text-slate-600">No items in this quote yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Product
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Unit Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Qty
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Line Total
            </th>
            {isEditable && (
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <ItemRow
              key={item.id}
              quoteId={quoteId}
              item={item}
              isEditable={isEditable}
              isCustomer={isCustomer}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
