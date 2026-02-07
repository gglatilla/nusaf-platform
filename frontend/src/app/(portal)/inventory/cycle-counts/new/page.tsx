'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/layout/PageHeader';
import { useCreateCycleCount } from '@/hooks/useInventory';
import { useProducts } from '@/hooks/useProducts';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  AlertCircle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductLine {
  key: string;
  productId: string;
  productSku: string;
  productDescription: string;
}

function generateKey(): string {
  return Math.random().toString(36).slice(2, 9);
}

export default function CreateCycleCountPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const createMutation = useCreateCycleCount();

  // Form state
  const [location, setLocation] = useState<'JHB' | 'CT'>('JHB');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<ProductLine[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Product search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: searchResults, isLoading: isSearching } = useProducts(
    { search: searchQuery, pageSize: 10 },
    { enabled: searchQuery.length >= 2 }
  );

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'ADMIN' && user.role !== 'MANAGER' && user.role !== 'WAREHOUSE') {
        router.push('/inventory/cycle-counts');
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
      if (lines.some((l) => l.productId === product.id)) {
        setError(`${product.nusafSku} is already in the count`);
        return;
      }
      setLines((prev) => [
        ...prev,
        {
          key: generateKey(),
          productId: product.id,
          productSku: product.nusafSku,
          productDescription: product.description,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (lines.length === 0) {
      setError('At least one product is required');
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        location,
        productIds: lines.map((l) => l.productId),
        notes: notes.trim() || undefined,
      });
      if (result?.id) {
        router.push(`/inventory/cycle-counts/${result.id}`);
      } else {
        router.push('/inventory/cycle-counts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create cycle count');
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

  if (user.role !== 'ADMIN' && user.role !== 'MANAGER' && user.role !== 'WAREHOUSE') return null;

  const filteredSearchResults = searchResults?.products.filter(
    (p) => !lines.some((l) => l.productId === p.id)
  );

  return (
    <>
      <PageHeader
        title="New Cycle Count"
        description="Create a cycle count session to verify physical stock quantities"
      />
      <div className="p-4 sm:p-6 xl:p-8">
        <Link
          href="/inventory/cycle-counts"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cycle Counts
        </Link>

        <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
          {/* Session details */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Count Session Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes (e.g. zone, reason for count)..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Product selection */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">
                Products to Count ({lines.length})
              </h3>
            </div>

            {/* Product search */}
            <div className="px-6 py-4 border-b border-slate-200" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
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

            {/* Products table */}
            {lines.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-10">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {lines.map((line, idx) => (
                      <tr key={line.key} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm font-mono text-slate-900">
                          {line.productSku}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 truncate max-w-[300px]">
                          {line.productDescription}
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
                  Search for products above to add them to this count session
                </p>
              </div>
            )}
          </div>

          {/* Info callout */}
          <div className="flex gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Blind counting mode</p>
              <p>
                System quantities will be recorded at the moment this session is created.
                During counting, workers will <strong>not</strong> see system quantities to
                ensure an unbiased count. Variances are revealed after counting is complete.
              </p>
            </div>
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
              href="/inventory/cycle-counts"
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
              {createMutation.isPending ? 'Creating...' : 'Create Count Session'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
