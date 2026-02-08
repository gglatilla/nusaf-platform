'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  AlertCircle,
  Plus,
  Trash2,
  Loader2,
  Package,
  Boxes,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { usePackingList, useUpdatePackingList } from '@/hooks/usePackingLists';
import { WAREHOUSE_NAMES } from '@/lib/constants/reference-routes';
import type {
  Warehouse,
  PackageType,
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
  quantity: number;
  packageNumber: number;
}

export default function EditPackingListPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuthStore();

  const { data: packingList, isLoading } = usePackingList(id);
  const updatePL = useUpdatePackingList();

  // Form state
  const [location, setLocation] = useState<Warehouse>('JHB');
  const [handlingInstructions, setHandlingInstructions] = useState('');
  const [notes, setNotes] = useState('');
  const [draftPackages, setDraftPackages] = useState<DraftPackage[]>([]);
  const [draftLines, setDraftLines] = useState<DraftLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Redirect customers
  useEffect(() => {
    if (!authLoading && user?.role === 'CUSTOMER') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  // Populate form from existing packing list
  useEffect(() => {
    if (packingList && !initialized) {
      setLocation(packingList.location);
      setHandlingInstructions(packingList.handlingInstructions || '');
      setNotes(packingList.notes || '');

      setDraftPackages(
        packingList.packages.map((pkg) => ({
          key: `pkg-${pkg.id}`,
          packageNumber: pkg.packageNumber,
          packageType: pkg.packageType,
          length: pkg.length != null ? String(pkg.length) : '',
          width: pkg.width != null ? String(pkg.width) : '',
          height: pkg.height != null ? String(pkg.height) : '',
          grossWeight: pkg.grossWeight != null ? String(pkg.grossWeight) : '',
          netWeight: pkg.netWeight != null ? String(pkg.netWeight) : '',
          notes: pkg.notes || '',
        }))
      );

      setDraftLines(
        packingList.lines.map((line) => ({
          key: `line-${line.id}`,
          productId: line.productId,
          productSku: line.productSku,
          productDescription: line.productDescription,
          unitOfMeasure: line.unitOfMeasure,
          quantity: line.quantity,
          packageNumber: line.packageNumber,
        }))
      );

      setInitialized(true);
    }
  }, [packingList, initialized]);

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

  const handleLineChange = (key: string, field: keyof DraftLine, value: string | number) => {
    setDraftLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, [field]: value } : l))
    );
  };

  const handleSubmit = async () => {
    setError(null);

    if (draftPackages.length === 0) {
      setError('Please define at least one package');
      return;
    }

    if (draftLines.length === 0) {
      setError('Please have at least one line item');
      return;
    }

    // Validate all lines reference a valid package
    const packageNumbers = new Set(draftPackages.map((p) => p.packageNumber));
    for (const line of draftLines) {
      if (!packageNumbers.has(line.packageNumber)) {
        setError(`Line ${line.productSku} is assigned to package ${line.packageNumber} which doesn't exist`);
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

    const lines: CreatePackingListLineInput[] = draftLines.map((l) => ({
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
      await updatePL.mutateAsync({ id, data });
      router.push(`/packing-lists/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update packing list');
    }
  };

  if (authLoading || !user || isLoading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (user?.role === 'CUSTOMER') return null;

  if (!packingList) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Packing list not found</p>
        <Link href="/packing-lists" className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block">
          Back to Packing Lists
        </Link>
      </div>
    );
  }

  if (packingList.status !== 'DRAFT') {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600">Only draft packing lists can be edited.</p>
        <Link
          href={`/packing-lists/${id}`}
          className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block"
        >
          Back to Packing List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/packing-lists/${id}`} className="p-2 hover:bg-slate-100 rounded-md">
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Edit {packingList.packingListNumber}
          </h1>
          <p className="text-sm text-slate-600">
            Order {packingList.orderNumber} &mdash; {packingList.customerName}
          </p>
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
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Boxes className="h-5 w-5 text-slate-400" />
                Line Items ({draftLines.length})
              </h2>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">SKU</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">UoM</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Qty</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Package</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {draftLines.map((line) => (
                      <tr key={line.key}>
                        <td className="px-3 py-2">
                          <span className="font-mono text-sm text-slate-700">{line.productSku}</span>
                        </td>
                        <td className="px-3 py-2 text-sm text-slate-700 max-w-48 truncate">
                          {line.productDescription}
                        </td>
                        <td className="px-3 py-2 text-sm text-slate-500">{line.unitOfMeasure}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={1}
                            value={line.quantity}
                            onChange={(e) =>
                              handleLineChange(line.key, 'quantity', parseInt(e.target.value) || 1)
                            }
                            className="w-20 px-2 py-1 text-sm text-right border border-slate-200 rounded"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={line.packageNumber}
                            onChange={(e) =>
                              handleLineChange(line.key, 'packageNumber', parseInt(e.target.value))
                            }
                            className="text-sm border border-slate-200 rounded px-2 py-1"
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Summary</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600">PL Number</dt>
                <dd className="font-medium text-slate-900">{packingList.packingListNumber}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Order</dt>
                <dd className="font-medium text-primary-600">
                  <Link href={`/orders/${packingList.orderId}`}>{packingList.orderNumber}</Link>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Customer</dt>
                <dd className="font-medium text-slate-900">{packingList.customerName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Packages</dt>
                <dd className="font-medium text-slate-900">{draftPackages.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Lines</dt>
                <dd className="font-medium text-slate-900">{draftLines.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Total Qty</dt>
                <dd className="font-medium text-slate-900">
                  {draftLines.reduce((sum, l) => sum + l.quantity, 0)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Warehouse</dt>
                <dd className="font-medium text-slate-900">{WAREHOUSE_NAMES[location] || location}</dd>
              </div>
            </dl>

            <div className="mt-6 pt-4 border-t space-y-2">
              <button
                onClick={handleSubmit}
                disabled={draftLines.length === 0 || draftPackages.length === 0 || updatePL.isPending}
                className="w-full px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatePL.isPending ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                href={`/packing-lists/${id}`}
                className="block w-full px-4 py-2 text-center bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
