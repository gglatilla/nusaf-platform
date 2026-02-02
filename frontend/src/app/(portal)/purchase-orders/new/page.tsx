'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useSuppliers } from '@/hooks/useSuppliers';
import {
  useCreatePurchaseOrder,
  useAddPurchaseOrderLine,
  useRemovePurchaseOrderLine,
} from '@/hooks/usePurchaseOrders';
import { AddPOLineModal } from '@/components/purchase-orders/AddPOLineModal';
import type { Supplier, SupplierCurrency, Warehouse, PurchaseOrderLine } from '@/lib/api';

function formatCurrency(amount: number, currency: SupplierCurrency = 'EUR'): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

interface DraftLine extends PurchaseOrderLine {
  isNew?: boolean;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();

  // Form state
  const [supplierId, setSupplierId] = useState<string>('');
  const [deliveryLocation, setDeliveryLocation] = useState<Warehouse>('JHB');
  const [expectedDate, setExpectedDate] = useState<string>('');
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [supplierNotes, setSupplierNotes] = useState<string>('');

  // PO state (after creation)
  const [createdPoId, setCreatedPoId] = useState<string | null>(null);
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [currency, setCurrency] = useState<SupplierCurrency>('EUR');

  // UI state
  const [showAddLineModal, setShowAddLineModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Queries and mutations
  const { data: suppliersData, isLoading: isLoadingSuppliers } = useSuppliers({ isActive: true, pageSize: 100 });
  const createPO = useCreatePurchaseOrder();
  const addLine = useAddPurchaseOrderLine();
  const removeLine = useRemovePurchaseOrderLine();

  const suppliers = suppliersData?.suppliers ?? [];
  const selectedSupplier = suppliers.find((s) => s.id === supplierId);

  // Handle supplier selection
  const handleSupplierChange = (newSupplierId: string) => {
    if (createdPoId) {
      // Can't change supplier after PO is created
      return;
    }
    setSupplierId(newSupplierId);
    const supplier = suppliers.find((s) => s.id === newSupplierId);
    if (supplier) {
      setCurrency(supplier.currency);
    }
  };

  // Create the PO (needed before adding lines)
  const handleCreatePO = async () => {
    if (!supplierId) {
      setError('Please select a supplier');
      return;
    }

    try {
      const result = await createPO.mutateAsync({
        supplierId,
        deliveryLocation,
        expectedDate: expectedDate || undefined,
        internalNotes: internalNotes || undefined,
        supplierNotes: supplierNotes || undefined,
      });
      setCreatedPoId(result.id);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create purchase order';
      setError(message);
    }
  };

  // Add a line to the PO
  const handleAddLine = async (data: { productId: string; quantityOrdered: number; unitCost: number }) => {
    if (!createdPoId) {
      setError('Please create the PO first');
      return;
    }

    const result = await addLine.mutateAsync({
      poId: createdPoId,
      data,
    });

    // Add to local lines state
    setLines((prev) => [...prev, { ...result, isNew: true }]);
  };

  // Remove a line from the PO
  const handleRemoveLine = async (lineId: string) => {
    if (!createdPoId) return;

    await removeLine.mutateAsync({
      poId: createdPoId,
      lineId,
    });

    setLines((prev) => prev.filter((l) => l.id !== lineId));
  };

  // Calculate totals
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const total = subtotal; // No tax on POs to suppliers

  // Navigate to the created PO
  const handleViewPO = () => {
    if (createdPoId) {
      router.push(`/purchase-orders/${createdPoId}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/purchase-orders" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">New Purchase Order</h1>
          <p className="text-sm text-slate-600">
            Create a new order to a supplier
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <span className="sr-only">Dismiss</span>
            &times;
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* PO Details Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Details</h2>

            <div className="space-y-4">
              {/* Supplier Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Supplier <span className="text-red-500">*</span>
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                  disabled={!!createdPoId || isLoadingSuppliers}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100"
                >
                  <option value="">Select a supplier...</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name} ({supplier.code}) - {supplier.currency}
                    </option>
                  ))}
                </select>
                {createdPoId && (
                  <p className="text-xs text-slate-500 mt-1">
                    Supplier cannot be changed after PO is created
                  </p>
                )}
              </div>

              {/* Delivery Location */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Delivery Location
                </label>
                <select
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value as Warehouse)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="JHB">Johannesburg</option>
                  <option value="CT">Cape Town</option>
                </select>
              </div>

              {/* Expected Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Supplier Notes
                  </label>
                  <textarea
                    value={supplierNotes}
                    onChange={(e) => setSupplierNotes(e.target.value)}
                    placeholder="Notes to include on the PO..."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Internal Notes
                  </label>
                  <textarea
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Internal notes (not shown to supplier)..."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Create PO Button */}
              {!createdPoId && (
                <div className="pt-4">
                  <button
                    onClick={handleCreatePO}
                    disabled={!supplierId || createPO.isPending}
                    className="w-full px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createPO.isPending ? 'Creating...' : 'Create Purchase Order'}
                  </button>
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    You must create the PO before adding lines
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Lines Card */}
          {createdPoId && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Order Lines</h2>
                <button
                  onClick={() => setShowAddLineModal(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Line
                </button>
              </div>

              {lines.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p>No lines added yet.</p>
                  <p className="text-sm mt-1">Click &ldquo;Add Line&rdquo; to add products to this order.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                          #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                          SKU
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                          Description
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                          Qty
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                          Unit Cost
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                          Total
                        </th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lines.map((line) => (
                        <tr key={line.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm text-slate-500">
                            {line.lineNumber}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm">{line.productSku}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {line.productDescription}
                          </td>
                          <td className="px-4 py-3 text-right text-sm">
                            {line.quantityOrdered}
                          </td>
                          <td className="px-4 py-3 text-right text-sm">
                            {formatCurrency(line.unitCost, currency)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium">
                            {formatCurrency(line.lineTotal, currency)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleRemoveLine(line.id)}
                              className="text-red-400 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          {createdPoId && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Summary</h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-slate-600">Subtotal</dt>
                  <dd className="text-sm font-medium text-slate-900">
                    {formatCurrency(subtotal, currency)}
                  </dd>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <dt className="text-sm font-medium text-slate-900">Total</dt>
                  <dd className="text-lg font-bold text-slate-900">
                    {formatCurrency(total, currency)}
                  </dd>
                </div>
                <div className="text-xs text-slate-500">
                  {lines.length} line{lines.length !== 1 ? 's' : ''}
                </div>
              </dl>

              <div className="mt-6 pt-4 border-t">
                <button
                  onClick={handleViewPO}
                  className="w-full px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
                >
                  View Purchase Order
                </button>
              </div>
            </div>
          )}

          {/* Help */}
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">How it works</h3>
            <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
              <li>Select a supplier and set delivery details</li>
              <li>Click &ldquo;Create Purchase Order&rdquo;</li>
              <li>Add product lines to the order</li>
              <li>Submit for approval or send directly to supplier</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Add Line Modal */}
      {createdPoId && selectedSupplier && (
        <AddPOLineModal
          isOpen={showAddLineModal}
          onClose={() => setShowAddLineModal(false)}
          supplierId={supplierId}
          currency={currency}
          existingProductIds={lines.map((l) => l.productId)}
          onAddLine={handleAddLine}
          isAdding={addLine.isPending}
        />
      )}
    </div>
  );
}
