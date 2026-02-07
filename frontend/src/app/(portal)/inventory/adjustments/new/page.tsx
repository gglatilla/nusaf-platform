'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/layout/PageHeader';
import { useCreateInventoryAdjustment } from '@/hooks/useInventory';
import { useProducts } from '@/hooks/useProducts';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StockAdjustmentReason } from '@/lib/api';

const REASON_OPTIONS: { value: StockAdjustmentReason; label: string }[] = [
  { value: 'CYCLE_COUNT', label: 'Cycle Count' },
  { value: 'INITIAL_COUNT', label: 'Initial Count' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'FOUND', label: 'Found' },
  { value: 'LOST', label: 'Lost' },
  { value: 'DATA_CORRECTION', label: 'Data Correction' },
  { value: 'OTHER', label: 'Other' },
];

interface AdjustmentLine {
  key: string; // Local unique key for React rendering
  productId: string;
  productSku: string;
  productDescription: string;
  adjustedQuantity: string;
  notes: string;
}

function generateKey(): string {
  return Math.random().toString(36).slice(2, 9);
}

export default function CreateAdjustmentPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const createMutation = useCreateInventoryAdjustment();

  // Form state
  const [location, setLocation] = useState<'JHB' | 'CT'>('JHB');
  const [reason, setReason] = useState<StockAdjustmentReason>('CYCLE_COUNT');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<AdjustmentLine[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Product search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: searchResults, isLoading: isSearching } = useProducts(
    { search: searchQuery, pageSize: 10 },
    { enabled: searchQuery.length >= 2 }
  );

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
        router.push('/inventory/adjustments');
      }
    }
  }, [user, authLoading, router]);

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addProduct = useCallback(
    (product: { id: string; nusafSku: string; description: string }) => {
      // Prevent duplicates
      if (lines.some((l) => l.productId === product.id)) {
        setError(`${product.nusafSku} is already in the adjustment`);
        return;
      }
      setLines((prev) => [
        ...prev,
        {
          key: generateKey(),
          productId: product.id,
          productSku: product.nusafSku,
          productDescription: product.description,
          adjustedQuantity: '',
          notes: '',
        },
      ]);
      setSearchQuery('');
      setShowSearch(false);
      setError(null);
    },
    [lines]
  );

  const removeLine = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }, []);

  const updateLine = useCallback(
    (key: string, field: 'adjustedQuantity' | 'notes', value: string) => {
      setLines((prev) =>
        prev.map((l) => (l.key === key ? { ...l, [field]: value } : l))
      );
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (lines.length === 0) {
      setError('At least one product line is required');
      return;
    }

    // Validate all lines have quantities
    const invalidLines = lines.filter((l) => {
      const qty = parseInt(l.adjustedQuantity, 10);
      return isNaN(qty) || qty < 0;
    });
    if (invalidLines.length > 0) {
      setError('All lines must have a valid adjusted quantity (0 or greater)');
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        location,
        reason,
        notes: notes.trim() || undefined,
        lines: lines.map((l) => ({
          productId: l.productId,
          adjustedQuantity: parseInt(l.adjustedQuantity, 10),
          notes: l.notes.trim() || undefined,
        })),
      });
      if (result?.id) {
        router.push(`/inventory/adjustments/${result.id}`);
      } else {
        router.push('/inventory/adjustments');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create adjustment');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="p-4 sm:p-6 xl:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="h-64 bg-slate-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (user.role !== 'ADMIN' && user.role !== 'MANAGER') return null;

  const filteredSearchResults = searchResults?.products.filter(
    (p) => !lines.some((l) => l.productId === p.id)
  );

  return (
    <>
      <PageHeader
        title="New Stock Adjustment"
        description="Create a stock quantity adjustment for review and approval"
      />
      <div className="p-4 sm:p-6 xl:p-8">
        {/* Back link */}
        <Link
          href="/inventory/adjustments"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Adjustments
        </Link>

        <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
          {/* Header fields */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Adjustment Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Warehouse <span className="text-red-500">*</span>
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value as 'JHB' | 'CT')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="JHB">Johannesburg</option>
                  <option value="CT">Cape Town</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as StockAdjustmentReason)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {REASON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Product lines */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">
                Products ({lines.length})
              </h3>
            </div>

            {/* Product search */}
            <div className="px-6 py-4 border-b border-slate-200" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearch(true);
                  }}
                  onFocus={() => searchQuery.length >= 2 && setShowSearch(true)}
                  placeholder="Search products by SKU or description..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />

                {/* Search dropdown */}
                {showSearch && searchQuery.length >= 2 && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {isSearching ? (
                      <div className="px-4 py-3 text-sm text-slate-500">Searching...</div>
                    ) : filteredSearchResults && filteredSearchResults.length > 0 ? (
                      filteredSearchResults.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => addProduct(product)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0"
                        >
                          <Plus className="h-4 w-4 text-primary-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-mono text-slate-900 truncate">
                              {product.nusafSku}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {product.description}
                            </p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-slate-500">
                        No products found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Lines table */}
            {lines.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-32">
                        Adjusted Qty
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-48">
                        Line Notes
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">

                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {lines.map((line) => (
                      <tr key={line.key} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="text-sm font-mono text-slate-900">{line.productSku}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[300px]">
                            {line.productDescription}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            value={line.adjustedQuantity}
                            onChange={(e) => updateLine(line.key, 'adjustedQuantity', e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm text-right font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={line.notes}
                            onChange={(e) => updateLine(line.key, 'notes', e.target.value)}
                            placeholder="Optional..."
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => removeLine(line.key)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <Search className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-900 mb-1">No products added</p>
                <p className="text-sm text-slate-500">
                  Search for products above to add them to this adjustment
                </p>
              </div>
            )}
          </div>

          {/* Info note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-700">
              This creates a <strong>PENDING</strong> adjustment that requires approval before
              stock levels are updated. The system will capture current quantities at the time
              of submission.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href="/inventory/adjustments"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending || lines.length === 0}
              className={cn(
                'inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white rounded-md transition-colors',
                'bg-primary-600 hover:bg-primary-700',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {createMutation.isPending ? 'Submitting...' : 'Submit Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
