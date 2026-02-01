'use client';

import { useState, useEffect } from 'react';
import { Search, X, Plus, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useProducts } from '@/hooks/useProducts';
import { useAddBomComponent } from '@/hooks/useBom';
import type { CatalogProduct } from '@/lib/api';

interface AddComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productSku: string; // To prevent self-reference
  existingComponentIds: string[]; // To show which are already in BOM
}

export function AddComponentModal({
  isOpen,
  onClose,
  productId,
  productSku,
  existingComponentIds,
}: AddComponentModalProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [unitOverride, setUnitOverride] = useState('');
  const [notes, setNotes] = useState('');
  const [isOptional, setIsOptional] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMutation = useAddBomComponent();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch products based on search
  const { data: productsData, isLoading: isSearching } = useProducts({
    search: debouncedSearch,
    pageSize: 10,
  });

  const searchResults = productsData?.products ?? [];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setDebouncedSearch('');
      setSelectedProduct(null);
      setQuantity('1');
      setUnitOverride('');
      setNotes('');
      setIsOptional(false);
      setError(null);
    }
  }, [isOpen]);

  const handleSelectProduct = (product: CatalogProduct) => {
    if (product.id === productId) {
      setError('Cannot add a product as its own component');
      return;
    }
    setSelectedProduct(product);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be a positive number');
      return;
    }

    try {
      await addMutation.mutateAsync({
        productId,
        data: {
          componentProductId: selectedProduct.id,
          quantity: qty,
          unitOverride: unitOverride || null,
          notes: notes || null,
          isOptional,
        },
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add component';
      setError(message);
    }
  };

  const isInBom = (id: string) => existingComponentIds.includes(id);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Component to BOM</DialogTitle>
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
                  No products found
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {searchResults.map((product) => {
                    const isSelf = product.id === productId;
                    const alreadyInBom = isInBom(product.id);
                    const isSelected = selectedProduct?.id === product.id;

                    return (
                      <li
                        key={product.id}
                        className={`px-4 py-2 flex items-center justify-between ${
                          isSelf || alreadyInBom
                            ? 'bg-slate-50 text-slate-400'
                            : isSelected
                            ? 'bg-primary-50'
                            : 'hover:bg-slate-50 cursor-pointer'
                        }`}
                        onClick={() =>
                          !isSelf && !alreadyInBom && handleSelectProduct(product)
                        }
                      >
                        <div>
                          <span className="font-mono text-sm">
                            {product.nusafSku}
                          </span>
                          <span className="text-slate-500 text-sm ml-2">
                            {product.description.length > 40
                              ? product.description.slice(0, 40) + '...'
                              : product.description}
                          </span>
                        </div>
                        {isSelf ? (
                          <span className="text-xs text-slate-400">Current</span>
                        ) : alreadyInBom ? (
                          <span className="text-xs text-slate-400">In BOM</span>
                        ) : isSelected ? (
                          <span className="text-xs text-primary-600 font-medium">
                            Selected
                          </span>
                        ) : (
                          <Plus className="w-4 h-4 text-slate-400" />
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
                    {selectedProduct.nusafSku}
                  </span>
                  <p className="text-sm text-primary-700">
                    {selectedProduct.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="p-1 text-primary-400 hover:text-primary-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Quantity and Unit Override */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Unit Override
              </label>
              <input
                type="text"
                value={unitOverride}
                onChange={(e) => setUnitOverride(e.target.value)}
                placeholder={selectedProduct?.unitOfMeasure ?? 'EA'}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this component..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Optional checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isOptional"
              checked={isOptional}
              onChange={(e) => setIsOptional(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="isOptional" className="text-sm text-slate-700">
              Optional component (not required for stock fulfillment)
            </label>
          </div>

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
              disabled={!selectedProduct || addMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addMutation.isPending ? 'Adding...' : 'Add to BOM'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
