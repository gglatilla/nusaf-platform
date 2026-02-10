'use client';

import { useState, useEffect } from 'react';
import { Search, X, Plus, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useProducts } from '@/hooks/useProducts';
import type { CatalogProduct, SupplierCurrency } from '@/lib/api';
import { formatCurrency } from '@/lib/formatting';

interface AddPOLineModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId: string;
  currency: SupplierCurrency;
  existingProductIds: string[];
  onAddLine: (data: { productId: string; quantityOrdered: number; unitCost: number }) => Promise<void>;
  isAdding: boolean;
}

export function AddPOLineModal({
  isOpen,
  onClose,
  supplierId,
  currency,
  existingProductIds,
  onAddLine,
  isAdding,
}: AddPOLineModalProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [unitCost, setUnitCost] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch products based on search - filter by supplier
  // Only fetch if supplierId is valid to prevent showing wrong products
  const { data: productsData, isLoading: isSearching } = useProducts(
    {
      search: debouncedSearch,
      supplierId: supplierId,
      pageSize: 10,
    },
    { enabled: !!supplierId && isOpen }
  );

  const searchResults = productsData?.products ?? [];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setDebouncedSearch('');
      setSelectedProduct(null);
      setQuantity('1');
      setUnitCost('');
      setError(null);
    }
  }, [isOpen]);

  const handleSelectProduct = (product: CatalogProduct) => {
    setSelectedProduct(product);
    // Pre-fill unit cost from product's cost price if available
    if (product.price) {
      setUnitCost(product.price.toString());
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be a positive integer');
      return;
    }

    const cost = parseFloat(unitCost);
    if (isNaN(cost) || cost < 0) {
      setError('Unit cost must be a positive number');
      return;
    }

    try {
      await onAddLine({
        productId: selectedProduct.id,
        quantityOrdered: qty,
        unitCost: cost,
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add line';
      setError(message);
    }
  };

  const isAlreadyOnPO = (id: string) => existingProductIds.includes(id);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Line to Purchase Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Search Products
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by SKU or description..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Showing products from selected supplier only
            </p>
          </div>

          {/* Search Results */}
          {debouncedSearch && (
            <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-slate-500 text-sm">
                  Searching...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">
                  No products found for this supplier
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {searchResults.map((product) => {
                    const alreadyOnPO = isAlreadyOnPO(product.id);
                    const isSelected = selectedProduct?.id === product.id;

                    return (
                      <li
                        key={product.id}
                        className={`px-4 py-2 flex items-center justify-between ${
                          alreadyOnPO
                            ? 'bg-slate-50 text-slate-400'
                            : isSelected
                            ? 'bg-primary-50'
                            : 'hover:bg-slate-50 cursor-pointer'
                        }`}
                        onClick={() => !alreadyOnPO && handleSelectProduct(product)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">
                              {product.supplierSku}
                            </span>
                            {product.price && (
                              <span className="text-xs text-slate-500">
                                {formatCurrency(product.price, currency)}
                              </span>
                            )}
                          </div>
                          <span className="text-slate-500 text-sm truncate block">
                            {product.description}
                          </span>
                        </div>
                        {alreadyOnPO ? (
                          <span className="text-xs text-slate-400 ml-2">On PO</span>
                        ) : isSelected ? (
                          <span className="text-xs text-primary-600 font-medium ml-2">
                            Selected
                          </span>
                        ) : (
                          <Plus className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {/* Selected Product */}
          {selectedProduct && (
            <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-sm font-medium text-primary-900">
                    {selectedProduct.supplierSku}
                  </span>
                  <p className="text-sm text-primary-700">
                    {selectedProduct.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProduct(null);
                    setUnitCost('');
                  }}
                  className="p-1 text-primary-400 hover:text-primary-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Quantity and Unit Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Unit Cost ({currency}) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          {/* Line Total Preview */}
          {selectedProduct && unitCost && quantity && (
            <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">Line Total:</span>
              <span className="text-sm font-semibold text-slate-900">
                {formatCurrency(parseFloat(unitCost || '0') * parseInt(quantity || '0'), currency)}
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedProduct || !unitCost || isAdding}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? 'Adding...' : 'Add Line'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
