'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Truck, Search, Plus, Trash2 } from 'lucide-react';
import { useStockLevels } from '@/hooks/useInventory';
import type { Warehouse, CreateStandaloneTransferRequestLineInput } from '@/lib/api';

interface TransferLine {
  productId: string;
  productSku: string;
  productDescription: string;
  quantity: number;
  availableAtSource: number;
}

interface CreateStandaloneTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    fromLocation: Warehouse;
    toLocation: Warehouse;
    lines: CreateStandaloneTransferRequestLineInput[];
    notes?: string | null;
  }) => Promise<void>;
  isSubmitting: boolean;
}

const WAREHOUSES: { value: Warehouse; label: string }[] = [
  { value: 'JHB', label: 'Johannesburg' },
  { value: 'CT', label: 'Cape Town' },
];

export function CreateStandaloneTransferModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: CreateStandaloneTransferModalProps) {
  const [fromLocation, setFromLocation] = useState<Warehouse>('JHB');
  const [toLocation, setToLocation] = useState<Warehouse>('CT');
  const [lines, setLines] = useState<TransferLine[]>([]);
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  // Debounce search input
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
  }, []);

  // Fetch stock levels at the source warehouse, filtered by search
  const { data: stockData, isLoading: stockLoading } = useStockLevels({
    location: fromLocation,
    search: debouncedSearch,
    pageSize: 20,
  });

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFromLocation('JHB');
      setToLocation('CT');
      setLines([]);
      setNotes('');
      setSearchTerm('');
      setDebouncedSearch('');
      setShowResults(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter out already-added products from search results
  const addedProductIds = new Set(lines.map((l) => l.productId));
  const searchResults = (stockData?.stockLevels ?? []).filter(
    (sl) => !addedProductIds.has(sl.productId)
  );

  const handleFromChange = (newFrom: Warehouse) => {
    setFromLocation(newFrom);
    // Auto-set toLocation to the other warehouse
    setToLocation(newFrom === 'JHB' ? 'CT' : 'JHB');
    // Clear lines since stock context changes
    setLines([]);
  };

  const handleToChange = (newTo: Warehouse) => {
    setToLocation(newTo);
    setFromLocation(newTo === 'JHB' ? 'CT' : 'JHB');
    setLines([]);
  };

  const handleAddProduct = (stockLevel: {
    productId: string;
    product: { nusafSku: string; description: string };
    available: number;
    onHand: number;
  }) => {
    setLines((prev) => [
      ...prev,
      {
        productId: stockLevel.productId,
        productSku: stockLevel.product.nusafSku,
        productDescription: stockLevel.product.description,
        quantity: 1,
        availableAtSource: stockLevel.available,
      },
    ]);
    setSearchTerm('');
    setDebouncedSearch('');
    setShowResults(false);
  };

  const handleRemoveLine = (productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  };

  const handleQuantityChange = (productId: string, qty: number) => {
    setLines((prev) =>
      prev.map((l) =>
        l.productId === productId
          ? { ...l, quantity: Math.max(1, Math.min(qty, l.availableAtSource || 9999)) }
          : l
      )
    );
  };

  const handleSubmit = async () => {
    if (lines.length === 0) return;

    const transferLines: CreateStandaloneTransferRequestLineInput[] = lines.map((line, idx) => ({
      lineNumber: idx + 1,
      productId: line.productId,
      productSku: line.productSku,
      productDescription: line.productDescription,
      quantity: line.quantity,
    }));

    await onSubmit({
      fromLocation,
      toLocation,
      lines: transferLines,
      notes: notes.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">New Transfer Request</h3>
                <p className="text-sm text-slate-500">Move stock between warehouses</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto flex-1 space-y-5">
            {/* Direction */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  From Warehouse
                </label>
                <select
                  value={fromLocation}
                  onChange={(e) => handleFromChange(e.target.value as Warehouse)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {WAREHOUSES.map((wh) => (
                    <option key={wh.value} value={wh.value}>
                      {wh.label} ({wh.value})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  To Warehouse
                </label>
                <select
                  value={toLocation}
                  onChange={(e) => handleToChange(e.target.value as Warehouse)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {WAREHOUSES.filter((wh) => wh.value !== fromLocation).map((wh) => (
                    <option key={wh.value} value={wh.value}>
                      {wh.label} ({wh.value})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Search */}
            <div ref={searchRef} className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Add Products
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by SKU or description..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowResults(true)}
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Search Results Dropdown */}
              {showResults && debouncedSearch.length >= 2 && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {stockLoading ? (
                    <div className="p-3 text-sm text-slate-500">Searching...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-3 text-sm text-slate-500">
                      No products found at {fromLocation}
                    </div>
                  ) : (
                    searchResults.map((sl) => (
                      <button
                        key={sl.productId}
                        type="button"
                        onClick={() => handleAddProduct(sl)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-medium text-slate-900">
                              {sl.product.nusafSku}
                            </span>
                            <p className="text-xs text-slate-500 truncate">
                              {sl.product.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-3 shrink-0">
                            <span className="text-xs text-slate-500">
                              Avail: {sl.available}
                            </span>
                            <Plus className="h-4 w-4 text-primary-500" />
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Line Items */}
            {lines.length > 0 && (
              <div>
                <div className="text-sm font-medium text-slate-700 mb-2">
                  Transfer Lines ({lines.length})
                </div>
                <div className="border border-slate-200 rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left">
                        <th className="px-3 py-2 text-xs font-semibold text-slate-600 uppercase">SKU</th>
                        <th className="px-3 py-2 text-xs font-semibold text-slate-600 uppercase">Description</th>
                        <th className="px-3 py-2 text-xs font-semibold text-slate-600 uppercase text-right">Available</th>
                        <th className="px-3 py-2 text-xs font-semibold text-slate-600 uppercase text-right">Qty</th>
                        <th className="px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line) => (
                        <tr key={line.productId} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-mono text-slate-900">{line.productSku}</td>
                          <td className="px-3 py-2 text-slate-600 truncate max-w-[200px]">
                            {line.productDescription}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-500">
                            {line.availableAtSource}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              min={1}
                              max={line.availableAtSource || undefined}
                              value={line.quantity}
                              onChange={(e) =>
                                handleQuantityChange(line.productId, parseInt(e.target.value) || 1)
                              }
                              className="w-20 px-2 py-1 border border-slate-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => handleRemoveLine(line.productId)}
                              className="text-slate-400 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {lines.length === 0 && (
              <div className="text-center py-8 text-sm text-slate-400">
                Search and add products to create a transfer
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Notes <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for transfer, special instructions..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-vertical"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={lines.length === 0 || isSubmitting}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? 'Creating...'
                : `Create Transfer (${lines.length} ${lines.length === 1 ? 'line' : 'lines'})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
