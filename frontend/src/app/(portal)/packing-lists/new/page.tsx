'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  AlertCircle,
  Plus,
  Trash2,
  Search,
  Loader2,
  Package,
  Boxes,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useOrder } from '@/hooks/useOrders';
import { useCreatePackingList } from '@/hooks/usePackingLists';
import { WAREHOUSE_NAMES } from '@/lib/constants/reference-routes';
import type {
  Warehouse,
  PackageType,
  SalesOrderLine,
  CreatePackingListData,
  CreatePackingListLineInput,
  CreatePackingListPackageInput,
} from '@/lib/api';

const PACKAGE_TYPE_LABELS: Record<PackageType, string> = {
  BOX: 'Box',
  PALLET: 'Pallet',
  CRATE: 'Crate',
  ENVELOPE: 'Envelope',
  TUBE: 'Tube',
  OTHER: 'Other',
};

interface DraftPackage {
  key: string;
  packageNumber: number;
  packageType: PackageType;
  length: string;
  width: string;
  height: string;
  grossWeight: string;
  netWeight: string;
  notes: string;
}

interface DraftLine {
  key: string;
  productId: string;
  productSku: string;
  productDescription: string;
  unitOfMeasure: string;
  maxQuantity: number;
  quantity: number;
  packageNumber: number;
  selected: boolean;
}

export default function NewPackingListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuthStore();

  // Order selection
  const [orderSearch, setOrderSearch] = useState(searchParams.get('orderId') || '');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(searchParams.get('orderId') || null);

  // Form state
  const [location, setLocation] = useState<Warehouse>('JHB');
  const [handlingInstructions, setHandlingInstructions] = useState('');
  const [notes, setNotes] = useState('');
  const [draftPackages, setDraftPackages] = useState<DraftPackage[]>([
    { key: 'pkg-1', packageNumber: 1, packageType: 'BOX', length: '', width: '', height: '', grossWeight: '', netWeight: '', notes: '' },
  ]);
  const [draftLines, setDraftLines] = useState<DraftLine[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch order
  const { data: orderData, isLoading: orderLoading } = useOrder(selectedOrderId);
  const createPL = useCreatePackingList();

  // Redirect customers
  useEffect(() => {
    if (!authLoading && user?.role === 'CUSTOMER') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  // Auto-populate lines from order
  useEffect(() => {
    if (orderData) {
      const lines: DraftLine[] = orderData.lines.map((line: SalesOrderLine, idx: number) => ({
        key: `line-${line.id}-${idx}`,
        productId: line.productId,
        productSku: line.productSku,
        productDescription: line.productDescription,
        unitOfMeasure: 'EA',
        maxQuantity: line.quantityOrdered,
        quantity: line.quantityOrdered,
        packageNumber: 1,
        selected: true,
      }));
      setDraftLines(lines);
      setLocation(orderData.warehouse);
    }
  }, [orderData]);

  const handleSelectOrder = () => {
    if (!orderSearch.trim()) return;
    setSelectedOrderId(orderSearch.trim());
    setDraftLines([]);
  };

  const handleClearOrder = () => {
    setSelectedOrderId(null);
    setOrderSearch('');
    setDraftLines([]);
  };

  // Package management
  const addPackage = () => {
    const nextNum = draftPackages.length > 0
      ? Math.max(...draftPackages.map((p) => p.packageNumber)) + 1
      : 1;
    setDraftPackages((prev) => [
      ...prev,
      {
        key: `pkg-${Date.now()}`,
        packageNumber: nextNum,
        packageType: 'BOX',
        length: '',
        width: '',
        height: '',
        grossWeight: '',
        netWeight: '',
        notes: '',
      },
    ]);
  };

  const removePackage = (key: string) => {
    const pkg = draftPackages.find((p) => p.key === key);
    if (!pkg) return;
    setDraftPackages((prev) => prev.filter((p) => p.key !== key));
    // Reset lines assigned to this package back to first available
    const remaining = draftPackages.filter((p) => p.key !== key);
    const fallbackNum = remaining.length > 0 ? remaining[0].packageNumber : 1;
    setDraftLines((prev) =>
      prev.map((l) =>
        l.packageNumber === pkg.packageNumber ? { ...l, packageNumber: fallbackNum } : l
      )
    );
  };

  const updatePackage = (key: string, field: keyof DraftPackage, value: string) => {
    setDraftPackages((prev) =>
      prev.map((p) => (p.key === key ? { ...p, [field]: value } : p))
    );
  };

  // Line management
  const handleToggleLine = (key: string) => {
    setDraftLines((prev) =>
      prev.map((l) =>
        l.key === key ? { ...l, selected: !l.selected } : l
      )
    );
  };

  const handleLineChange = (key: string, field: keyof DraftLine, value: string | number) => {
    setDraftLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, [field]: value } : l))
    );
  };

  const selectedLines = draftLines.filter((l) => l.selected && l.quantity > 0);

  const handleSubmit = async () => {
    setError(null);

    if (!selectedOrderId) {
      setError('Please select a sales order');
      return;
    }

    if (draftPackages.length === 0) {
      setError('Please define at least one package');
      return;
    }

    if (selectedLines.length === 0) {
      setError('Please select at least one line item');
      return;
    }

    // Validate all selected lines reference a valid package
    const packageNumbers = new Set(draftPackages.map((p) => p.packageNumber));
    for (const line of selectedLines) {
      if (!packageNumbers.has(line.packageNumber)) {
        setError(`Line ${line.productSku} is assigned to package ${line.packageNumber} which doesn't exist`);
        return;
      }
      if (line.quantity > line.maxQuantity) {
        setError(`Quantity for ${line.productSku} exceeds maximum of ${line.maxQuantity}`);
        return;
      }
    }

    const packages: CreatePackingListPackageInput[] = draftPackages.map((p) => ({
      packageNumber: p.packageNumber,
      packageType: p.packageType,
      length: p.length ? parseFloat(p.length) : undefined,
      width: p.width ? parseFloat(p.width) : undefined,
      height: p.height ? parseFloat(p.height) : undefined,
      grossWeight: p.grossWeight ? parseFloat(p.grossWeight) : undefined,
      netWeight: p.netWeight ? parseFloat(p.netWeight) : undefined,
      notes: p.notes || undefined,
    }));

    const lines: CreatePackingListLineInput[] = selectedLines.map((l) => ({
      productId: l.productId,
      productSku: l.productSku,
      productDescription: l.productDescription,
      unitOfMeasure: l.unitOfMeasure,
      quantity: l.quantity,
      packageNumber: l.packageNumber,
    }));

    const data: CreatePackingListData = {
      location,
      handlingInstructions: handlingInstructions || undefined,
      notes: notes || undefined,
      packages,
      lines,
    };

    try {
      const result = await createPL.mutateAsync({ orderId: selectedOrderId, data });
      if (result) {
        router.push(`/packing-lists/${result.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create packing list');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (user?.role === 'CUSTOMER') return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/packing-lists" className="p-2 hover:bg-slate-100 rounded-md">
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">New Packing List</h1>
          <p className="text-sm text-slate-600">Define packages and assign items for shipment</p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            &times;
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Selection */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Sales Order</h2>
            {selectedOrderId && orderData ? (
              <div className="flex items-center gap-3 p-3 bg-primary-50 border border-primary-200 rounded-md">
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary-700">{orderData.orderNumber}</p>
                  <p className="text-xs text-primary-600">
                    {orderData.company?.name} &mdash; {orderData.status} &mdash; {orderData.lines.length} lines
                  </p>
                </div>
                <button onClick={handleClearOrder} className="text-primary-500 hover:text-primary-700">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelectOrder()}
                  placeholder="Enter order ID..."
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={handleSelectOrder}
                  disabled={!orderSearch.trim() || orderLoading}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-md disabled:opacity-50"
                >
                  {orderLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </button>
              </div>
            )}
          </div>

          {/* Shipment Details */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Shipment Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Warehouse <span className="text-red-500">*</span>
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value as Warehouse)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(WAREHOUSE_NAMES).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Handling Instructions
                </label>
                <input
                  type="text"
                  value={handlingInstructions}
                  onChange={(e) => setHandlingInstructions(e.target.value)}
                  placeholder="e.g. Fragile — handle with care"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Internal notes..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Packages */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Package className="h-5 w-5 text-slate-400" />
                Packages ({draftPackages.length})
              </h2>
              <button
                onClick={addPackage}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-50 text-primary-700 rounded-md hover:bg-primary-100"
              >
                <Plus className="h-4 w-4" />
                Add Package
              </button>
            </div>

            <div className="space-y-4">
              {draftPackages.map((pkg) => (
                <div key={pkg.key} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-slate-900">Package {pkg.packageNumber}</span>
                    {draftPackages.length > 1 && (
                      <button
                        onClick={() => removePackage(pkg.key)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Type</label>
                      <select
                        value={pkg.packageType}
                        onChange={(e) => updatePackage(pkg.key, 'packageType', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md"
                      >
                        {Object.entries(PACKAGE_TYPE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">L (cm)</label>
                      <input
                        type="number"
                        value={pkg.length}
                        onChange={(e) => updatePackage(pkg.key, 'length', e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">W (cm)</label>
                      <input
                        type="number"
                        value={pkg.width}
                        onChange={(e) => updatePackage(pkg.key, 'width', e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">H (cm)</label>
                      <input
                        type="number"
                        value={pkg.height}
                        onChange={(e) => updatePackage(pkg.key, 'height', e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Gross (kg)</label>
                      <input
                        type="number"
                        value={pkg.grossWeight}
                        onChange={(e) => updatePackage(pkg.key, 'grossWeight', e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Net (kg)</label>
                      <input
                        type="number"
                        value={pkg.netWeight}
                        onChange={(e) => updatePackage(pkg.key, 'netWeight', e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-slate-500 mb-1">Notes</label>
                      <input
                        type="text"
                        value={pkg.notes}
                        onChange={(e) => updatePackage(pkg.key, 'notes', e.target.value)}
                        placeholder="Package notes..."
                        className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Line Items */}
          {draftLines.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Boxes className="h-5 w-5 text-slate-400" />
                Line Items
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                Select items and assign each to a package.
              </p>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase w-10">
                        <input
                          type="checkbox"
                          checked={draftLines.every((l) => l.selected)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setDraftLines((prev) =>
                              prev.map((l) => ({ ...l, selected: checked }))
                            );
                          }}
                          className="rounded border-slate-300"
                        />
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">SKU</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Max</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Qty</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Package</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {draftLines.map((line) => (
                      <tr key={line.key} className={line.selected ? 'bg-primary-50/30' : ''}>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={line.selected}
                            onChange={() => handleToggleLine(line.key)}
                            className="rounded border-slate-300"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-mono text-sm text-slate-700">{line.productSku}</span>
                        </td>
                        <td className="px-3 py-2 text-sm text-slate-700 max-w-48 truncate">
                          {line.productDescription}
                        </td>
                        <td className="px-3 py-2 text-right text-sm text-slate-500">
                          {line.maxQuantity}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={1}
                            max={line.maxQuantity}
                            value={line.quantity}
                            onChange={(e) =>
                              handleLineChange(
                                line.key,
                                'quantity',
                                Math.min(parseInt(e.target.value) || 0, line.maxQuantity)
                              )
                            }
                            disabled={!line.selected}
                            className="w-20 px-2 py-1 text-sm text-right border border-slate-200 rounded disabled:bg-slate-50 disabled:text-slate-400"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={line.packageNumber}
                            onChange={(e) =>
                              handleLineChange(line.key, 'packageNumber', parseInt(e.target.value))
                            }
                            disabled={!line.selected}
                            className="text-sm border border-slate-200 rounded px-2 py-1 disabled:bg-slate-50 disabled:text-slate-400"
                          >
                            {draftPackages.map((p) => (
                              <option key={p.packageNumber} value={p.packageNumber}>
                                Pkg {p.packageNumber}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Loading / Empty States */}
          {orderLoading && (
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
              <Loader2 className="h-6 w-6 text-slate-400 animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-500">Loading order lines...</p>
            </div>
          )}
          {draftLines.length === 0 && selectedOrderId && !orderLoading && (
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
              <p className="text-sm text-slate-500">No line items found on the selected order.</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Summary</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600">Packages</dt>
                <dd className="font-medium text-slate-900">{draftPackages.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Selected Lines</dt>
                <dd className="font-medium text-slate-900">{selectedLines.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Total Quantity</dt>
                <dd className="font-medium text-slate-900">
                  {selectedLines.reduce((sum, l) => sum + l.quantity, 0)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Warehouse</dt>
                <dd className="font-medium text-slate-900">{WAREHOUSE_NAMES[location] || location}</dd>
              </div>
              {orderData && (
                <div className="flex justify-between">
                  <dt className="text-slate-600">Order</dt>
                  <dd className="font-medium text-primary-600">{orderData.orderNumber}</dd>
                </div>
              )}
            </dl>

            <div className="mt-6 pt-4 border-t">
              <button
                onClick={handleSubmit}
                disabled={!selectedOrderId || selectedLines.length === 0 || draftPackages.length === 0 || createPL.isPending}
                className="w-full px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createPL.isPending ? 'Creating...' : 'Create Packing List'}
              </button>
            </div>
          </div>

          {/* Help */}
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">How it works</h3>
            <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
              <li>Select the sales order</li>
              <li>Define your packages (boxes, pallets, etc.)</li>
              <li>Assign each item to a package</li>
              <li>Submit &mdash; the packing list starts as Draft</li>
              <li>Finalize when ready for shipment</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
