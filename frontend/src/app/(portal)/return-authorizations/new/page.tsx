'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, Trash2, Search, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useOrder } from '@/hooks/useOrders';
import { useDeliveryNote } from '@/hooks/useDeliveryNotes';
import { useCreateReturnAuthorization } from '@/hooks/useReturnAuthorizations';
import { WAREHOUSE_NAMES } from '@/lib/constants/reference-routes';
import type {
  ReturnReason,
  CreateReturnAuthorizationData,
  CreateReturnAuthorizationLineInput,
  Warehouse,
  SalesOrderLine,
  DeliveryNoteLine,
} from '@/lib/api';

const RETURN_REASON_LABELS: Record<ReturnReason, string> = {
  DEFECTIVE: 'Defective',
  DAMAGED_IN_TRANSIT: 'Damaged in Transit',
  WRONG_ITEM: 'Wrong Item',
  NOT_AS_DESCRIBED: 'Not as Described',
  NO_LONGER_NEEDED: 'No Longer Needed',
  OTHER: 'Other',
};

interface DraftLine {
  key: string; // unique key for React
  orderLineId?: string;
  deliveryNoteLineId?: string;
  productId: string;
  productSku: string;
  productDescription: string;
  unitOfMeasure: string;
  maxQuantity: number;
  quantityReturned: number;
  returnReason: ReturnReason;
  reasonNotes: string;
  selected: boolean;
}

export default function NewReturnAuthorizationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuthStore();

  // Parent document selection
  const [orderSearch, setOrderSearch] = useState(searchParams.get('orderId') || '');
  const [dnSearch, setDnSearch] = useState(searchParams.get('deliveryNoteId') || '');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(searchParams.get('orderId') || null);
  const [selectedDnId, setSelectedDnId] = useState<string | null>(searchParams.get('deliveryNoteId') || null);

  // Form state
  const [warehouse, setWarehouse] = useState<Warehouse>('JHB');
  const [notes, setNotes] = useState('');
  const [draftLines, setDraftLines] = useState<DraftLine[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch selected parent documents
  const { data: orderData, isLoading: orderLoading } = useOrder(selectedOrderId);
  const { data: dnData, isLoading: dnLoading } = useDeliveryNote(selectedDnId);

  const createRA = useCreateReturnAuthorization();

  // Redirect customers
  useEffect(() => {
    if (!authLoading && user?.role === 'CUSTOMER') {
      router.push('/my/returns/new');
    }
  }, [user, authLoading, router]);

  // Auto-populate lines from selected order
  useEffect(() => {
    if (orderData && !selectedDnId) {
      const lines: DraftLine[] = orderData.lines.map((line: SalesOrderLine, idx: number) => ({
        key: `order-${line.id}-${idx}`,
        orderLineId: line.id,
        productId: line.productId,
        productSku: line.productSku,
        productDescription: line.productDescription,
        unitOfMeasure: 'EA',
        maxQuantity: line.quantityShipped || line.quantityOrdered,
        quantityReturned: 0,
        returnReason: 'DEFECTIVE' as ReturnReason,
        reasonNotes: '',
        selected: false,
      }));
      setDraftLines(lines);
      setWarehouse(orderData.warehouse);
    }
  }, [orderData, selectedDnId]);

  // Auto-populate lines from selected delivery note
  useEffect(() => {
    if (dnData) {
      const lines: DraftLine[] = dnData.lines.map((line: DeliveryNoteLine, idx: number) => ({
        key: `dn-${line.id}-${idx}`,
        orderLineId: line.orderLineId || undefined,
        deliveryNoteLineId: line.id,
        productId: line.productId,
        productSku: line.productSku,
        productDescription: line.productDescription,
        unitOfMeasure: line.unitOfMeasure || 'EA',
        maxQuantity: line.quantityReceived || line.quantityDispatched,
        quantityReturned: 0,
        returnReason: 'DEFECTIVE' as ReturnReason,
        reasonNotes: '',
        selected: false,
      }));
      setDraftLines(lines);
      setWarehouse(dnData.location);
      // If DN has an associated order, link it too
      if (dnData.orderId && !selectedOrderId) {
        setSelectedOrderId(dnData.orderId);
        setOrderSearch(dnData.orderId);
      }
    }
  }, [dnData, selectedOrderId]);

  const handleSelectOrder = () => {
    if (!orderSearch.trim()) return;
    setSelectedOrderId(orderSearch.trim());
    setSelectedDnId(null);
    setDnSearch('');
    setDraftLines([]);
  };

  const handleSelectDn = () => {
    if (!dnSearch.trim()) return;
    setSelectedDnId(dnSearch.trim());
    setDraftLines([]);
  };

  const handleClearOrder = () => {
    setSelectedOrderId(null);
    setOrderSearch('');
    setDraftLines([]);
  };

  const handleClearDn = () => {
    setSelectedDnId(null);
    setDnSearch('');
    if (selectedOrderId && orderData) {
      // Repopulate from order if still selected
      const lines: DraftLine[] = orderData.lines.map((line: SalesOrderLine, idx: number) => ({
        key: `order-${line.id}-${idx}`,
        orderLineId: line.id,
        productId: line.productId,
        productSku: line.productSku,
        productDescription: line.productDescription,
        unitOfMeasure: 'EA',
        maxQuantity: line.quantityShipped || line.quantityOrdered,
        quantityReturned: 0,
        returnReason: 'DEFECTIVE' as ReturnReason,
        reasonNotes: '',
        selected: false,
      }));
      setDraftLines(lines);
    } else {
      setDraftLines([]);
    }
  };

  const handleToggleLine = (key: string) => {
    setDraftLines((prev) =>
      prev.map((l) =>
        l.key === key
          ? { ...l, selected: !l.selected, quantityReturned: !l.selected ? (l.quantityReturned || 1) : 0 }
          : l
      )
    );
  };

  const handleLineChange = (key: string, field: keyof DraftLine, value: string | number) => {
    setDraftLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, [field]: value } : l))
    );
  };

  const selectedLines = draftLines.filter((l) => l.selected && l.quantityReturned > 0);

  const handleSubmit = async () => {
    setError(null);

    if (!selectedOrderId && !selectedDnId) {
      setError('Please select at least one parent document (order or delivery note)');
      return;
    }

    if (selectedLines.length === 0) {
      setError('Please select at least one line item to return');
      return;
    }

    // Validate quantities
    for (const line of selectedLines) {
      if (line.quantityReturned > line.maxQuantity) {
        setError(`Quantity for ${line.productSku} exceeds maximum of ${line.maxQuantity}`);
        return;
      }
      if (line.returnReason === 'OTHER' && !line.reasonNotes.trim()) {
        setError(`Reason notes required for ${line.productSku} when reason is "Other"`);
        return;
      }
    }

    const data: CreateReturnAuthorizationData = {
      orderId: selectedOrderId || undefined,
      deliveryNoteId: selectedDnId || undefined,
      orderNumber: orderData?.orderNumber,
      deliveryNoteNumber: dnData?.deliveryNoteNumber,
      customerName: orderData?.company?.name || dnData?.customerName,
      warehouse,
      notes: notes || undefined,
      lines: selectedLines.map((l): CreateReturnAuthorizationLineInput => ({
        orderLineId: l.orderLineId,
        deliveryNoteLineId: l.deliveryNoteLineId,
        productId: l.productId,
        productSku: l.productSku,
        productDescription: l.productDescription,
        unitOfMeasure: l.unitOfMeasure,
        quantityReturned: l.quantityReturned,
        returnReason: l.returnReason,
        reasonNotes: l.reasonNotes || undefined,
      })),
    };

    try {
      const result = await createRA.mutateAsync(data);
      if (result) {
        router.push(`/return-authorizations/${result.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create return authorization');
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/return-authorizations" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">New Return Authorization</h1>
          <p className="text-sm text-slate-600">Create a return authorization for customer goods</p>
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
          {/* Parent Document Selection */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Parent Document</h2>
            <p className="text-sm text-slate-600 mb-4">
              Select the order and/or delivery note this return relates to. At least one is required.
            </p>

            <div className="space-y-4">
              {/* Order Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sales Order</label>
                {selectedOrderId && orderData ? (
                  <div className="flex items-center gap-3 p-3 bg-primary-50 border border-primary-200 rounded-md">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-primary-700">{orderData.orderNumber}</p>
                      <p className="text-xs text-primary-600">{orderData.company?.name} &mdash; {orderData.status}</p>
                    </div>
                    <button
                      onClick={handleClearOrder}
                      className="text-primary-500 hover:text-primary-700"
                    >
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

              {/* Delivery Note Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Note</label>
                {selectedDnId && dnData ? (
                  <div className="flex items-center gap-3 p-3 bg-primary-50 border border-primary-200 rounded-md">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-primary-700">{dnData.deliveryNoteNumber}</p>
                      <p className="text-xs text-primary-600">{dnData.customerName} &mdash; {dnData.status}</p>
                    </div>
                    <button
                      onClick={handleClearDn}
                      className="text-primary-500 hover:text-primary-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={dnSearch}
                      onChange={(e) => setDnSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSelectDn()}
                      placeholder="Enter delivery note ID..."
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      onClick={handleSelectDn}
                      disabled={!dnSearch.trim() || dnLoading}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-md disabled:opacity-50"
                    >
                      {dnLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Return Details */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Return Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Receiving Warehouse <span className="text-red-500">*</span>
                </label>
                <select
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value as Warehouse)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(WAREHOUSE_NAMES).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Internal notes about this return..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Lines Selection */}
          {draftLines.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Line Items</h2>
              <p className="text-sm text-slate-600 mb-4">Select items to include in this return and set quantities and reasons.</p>

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
                              prev.map((l) => ({
                                ...l,
                                selected: checked,
                                quantityReturned: checked ? (l.quantityReturned || 1) : 0,
                              }))
                            );
                          }}
                          className="rounded border-slate-300"
                        />
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">SKU</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Max</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Qty to Return</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Reason</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Notes</th>
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
                            min={0}
                            max={line.maxQuantity}
                            value={line.quantityReturned}
                            onChange={(e) => handleLineChange(line.key, 'quantityReturned', Math.min(parseInt(e.target.value) || 0, line.maxQuantity))}
                            disabled={!line.selected}
                            className="w-20 px-2 py-1 text-sm text-right border border-slate-200 rounded disabled:bg-slate-50 disabled:text-slate-400"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={line.returnReason}
                            onChange={(e) => handleLineChange(line.key, 'returnReason', e.target.value)}
                            disabled={!line.selected}
                            className="text-sm border border-slate-200 rounded px-2 py-1 disabled:bg-slate-50 disabled:text-slate-400"
                          >
                            {Object.entries(RETURN_REASON_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={line.reasonNotes}
                            onChange={(e) => handleLineChange(line.key, 'reasonNotes', e.target.value)}
                            disabled={!line.selected}
                            placeholder={line.returnReason === 'OTHER' ? 'Required...' : 'Optional'}
                            className={`w-32 px-2 py-1 text-sm border rounded disabled:bg-slate-50 disabled:text-slate-400 ${
                              line.selected && line.returnReason === 'OTHER' && !line.reasonNotes.trim()
                                ? 'border-red-300'
                                : 'border-slate-200'
                            }`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {draftLines.length === 0 && (selectedOrderId || selectedDnId) && !orderLoading && !dnLoading && (
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
              <p className="text-sm text-slate-500">No line items found on the selected document.</p>
            </div>
          )}

          {/* Loading State */}
          {(orderLoading || dnLoading) && (
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
              <Loader2 className="h-6 w-6 text-slate-400 animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-500">Loading document lines...</p>
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
                <dt className="text-slate-600">Selected Lines</dt>
                <dd className="font-medium text-slate-900">{selectedLines.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Total Qty to Return</dt>
                <dd className="font-medium text-slate-900">
                  {selectedLines.reduce((sum, l) => sum + l.quantityReturned, 0)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Warehouse</dt>
                <dd className="font-medium text-slate-900">{WAREHOUSE_NAMES[warehouse] || warehouse}</dd>
              </div>
              {orderData && (
                <div className="flex justify-between">
                  <dt className="text-slate-600">Order</dt>
                  <dd className="font-medium text-primary-600">{orderData.orderNumber}</dd>
                </div>
              )}
              {dnData && (
                <div className="flex justify-between">
                  <dt className="text-slate-600">Delivery Note</dt>
                  <dd className="font-medium text-primary-600">{dnData.deliveryNoteNumber}</dd>
                </div>
              )}
            </dl>

            <div className="mt-6 pt-4 border-t">
              <button
                onClick={handleSubmit}
                disabled={selectedLines.length === 0 || createRA.isPending || (!selectedOrderId && !selectedDnId)}
                className="w-full px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createRA.isPending ? 'Creating...' : 'Create Return Authorization'}
              </button>
            </div>
          </div>

          {/* Help */}
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">How it works</h3>
            <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
              <li>Select the order or delivery note</li>
              <li>Check the items being returned</li>
              <li>Set quantity and reason per line</li>
              <li>Submit &mdash; the RA will be auto-approved</li>
            </ol>
            <p className="text-xs text-slate-500 mt-3">
              Staff-created returns are auto-approved. Customer-initiated returns require staff approval.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
