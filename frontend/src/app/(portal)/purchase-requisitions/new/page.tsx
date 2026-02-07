'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useCreatePurchaseRequisition } from '@/hooks/usePurchaseRequisitions';
import { useProducts } from '@/hooks/useProducts';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  AlertCircle,
} from 'lucide-react';
import type { CreatePurchaseRequisitionLineInput, PurchaseRequisitionUrgency } from '@/lib/api';

interface RequisitionLine extends CreatePurchaseRequisitionLineInput {
  key: string;
}

const URGENCY_OPTIONS: { value: PurchaseRequisitionUrgency; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

let lineKeyCounter = 0;
function generateKey() {
  return `line-${++lineKeyCounter}`;
}

export default function NewPurchaseRequisitionPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const createMutation = useCreatePurchaseRequisition();

  // Form state
  const [reason, setReason] = useState('');
  const [urgency, setUrgency] = useState<PurchaseRequisitionUrgency>('NORMAL');
  const [department, setDepartment] = useState('');
  const [requiredByDate, setRequiredByDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<RequisitionLine[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Product search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: searchResults, isLoading: isSearching } = useProducts(
    { search: searchQuery, pageSize: 10 },
    { enabled: searchQuery.length >= 2 }
  );

  // Auth guard
  useEffect(() => {
    if (!authLoading && user?.role === 'CUSTOMER') {
      router.push('/my/dashboard');
    }
  }, [user, authLoading, router]);

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Filter out already-added products from search results
  const filteredSearchResults = searchResults?.products?.filter(
    (product) => !lines.some((l) => l.productId === product.id)
  );

  const addProduct = useCallback(
    (product: { id: string; nusafSku: string; description: string; supplierId?: string | null; supplier?: { id: string; name: string } | null; costPrice?: number | null }) => {
      if (lines.some((l) => l.productId === product.id)) {
        setFormError(`${product.nusafSku} is already in the requisition`);
        return;
      }

      setLines((prev) => [
        ...prev,
        {
          key: generateKey(),
          productId: product.id,
          productSku: product.nusafSku,
          productDescription: product.description,
          supplierId: product.supplier?.id || product.supplierId || undefined,
          supplierName: product.supplier?.name || undefined,
          quantity: 1,
          estimatedUnitCost: product.costPrice != null ? Number(product.costPrice) : undefined,
          deliveryLocation: 'JHB',
        },
      ]);

      setSearchQuery('');
      setShowSearch(false);
      setFormError(null);
    },
    [lines]
  );

  const updateLine = useCallback(
    (key: string, field: keyof RequisitionLine, value: string | number) => {
      setLines((prev) =>
        prev.map((l) => (l.key === key ? { ...l, [field]: value } : l))
      );
    },
    []
  );

  const removeLine = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }, []);

  const estimatedTotal = lines.reduce((sum, line) => {
    const cost = line.estimatedUnitCost || 0;
    return sum + cost * line.quantity;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!reason.trim()) {
      setFormError('Reason is required');
      return;
    }

    if (lines.length === 0) {
      setFormError('At least one product is required');
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        reason: reason.trim(),
        urgency,
        department: department.trim() || undefined,
        requiredByDate: requiredByDate || undefined,
        notes: notes.trim() || undefined,
        lines: lines.map(({ key, ...line }) => line),
      });

      if (result) {
        router.push(`/purchase-requisitions/${result.id}`);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create requisition');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-slate-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back link */}
      <Link
        href="/purchase-requisitions"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Requisitions
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Purchase Requisition</h1>
        <p className="mt-1 text-sm text-slate-600">
          Request procurement of products. Requires manager approval.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        {/* Details section */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Requisition Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this purchase needed?"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Urgency</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as PurchaseRequisitionUrgency)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {URGENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g., Warehouse, Sales"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Required By</label>
              <input
                type="date"
                value={requiredByDate}
                onChange={(e) => setRequiredByDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional additional context"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Product search */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Products</h3>

          <div ref={searchRef} className="mb-4">
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
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />

              {/* Search dropdown */}
              {showSearch && searchQuery.length >= 2 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {isSearching ? (
                    <div className="px-4 py-3 text-sm text-slate-500">Searching...</div>
                  ) : !filteredSearchResults?.length ? (
                    <div className="px-4 py-3 text-sm text-slate-500">No products found</div>
                  ) : (
                    filteredSearchResults.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addProduct(product)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0"
                      >
                        <Plus className="h-4 w-4 text-primary-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-mono text-slate-900">{product.nusafSku}</p>
                          <p className="text-xs text-slate-500 truncate">{product.description}</p>
                        </div>
                        {product.supplier && (
                          <span className="text-xs text-slate-400 flex-shrink-0">
                            {product.supplier.name}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Line items table */}
          {lines.length > 0 ? (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Supplier</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-24">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-32">Est. Unit Cost</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-24">Location</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-32">Line Total</th>
                    <th className="px-4 py-3 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {lines.map((line) => {
                    const lineTotal = (line.estimatedUnitCost || 0) * line.quantity;
                    return (
                      <tr key={line.key}>
                        <td className="px-4 py-2">
                          <p className="text-sm font-mono text-slate-900">{line.productSku}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[200px]">{line.productDescription}</p>
                        </td>
                        <td className="px-4 py-2 text-sm text-slate-600">
                          {line.supplierName || '—'}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min={1}
                            value={line.quantity}
                            onChange={(e) => updateLine(line.key, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-20 px-2 py-1 text-sm text-right border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={line.estimatedUnitCost || ''}
                            onChange={(e) => updateLine(line.key, 'estimatedUnitCost', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="w-28 px-2 py-1 text-sm text-right border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={line.deliveryLocation || 'JHB'}
                            onChange={(e) => updateLine(line.key, 'deliveryLocation', e.target.value)}
                            className="w-20 px-2 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="JHB">JHB</option>
                            <option value="CT">CT</option>
                          </select>
                        </td>
                        <td className="px-4 py-2 text-sm text-slate-900 text-right font-medium">
                          {lineTotal > 0
                            ? `R ${lineTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
                            : '—'}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            type="button"
                            onClick={() => removeLine(line.key)}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Total row */}
                  <tr className="bg-slate-50 font-medium">
                    <td colSpan={5} className="px-4 py-3 text-sm text-slate-700 text-right">
                      Estimated Total
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right">
                      {estimatedTotal > 0
                        ? `R ${estimatedTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
                        : '—'}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-slate-300 rounded-lg">
              <Search className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No products added yet</p>
              <p className="text-xs text-slate-400 mt-1">Search for products above to add them</p>
            </div>
          )}
        </div>

        {/* Info note */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-700">
            This creates a <strong>PENDING</strong> requisition that requires manager approval.
            Once approved, a draft Purchase Order will be automatically created for each supplier.
          </p>
        </div>

        {/* Error */}
        {formError && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {formError}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/purchase-requisitions"
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending || lines.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? 'Submitting...' : 'Submit Requisition'}
          </button>
        </div>
      </form>
    </div>
  );
}
