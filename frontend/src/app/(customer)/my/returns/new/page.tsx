'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { useOrder } from '@/hooks/useOrders';
import { useCreateReturnAuthorization } from '@/hooks/useReturnAuthorizations';
import type {
  ReturnReason,
  CreateReturnAuthorizationData,
  CreateReturnAuthorizationLineInput,
  SalesOrderLine,
  SalesOrderListItem,
} from '@/lib/api';

const RETURN_REASON_LABELS: Record<ReturnReason, string> = {
  DEFECTIVE: 'Defective',
  DAMAGED_IN_TRANSIT: 'Damaged in Transit',
  WRONG_ITEM: 'Wrong Item Received',
  NOT_AS_DESCRIBED: 'Not as Described',
  NO_LONGER_NEEDED: 'No Longer Needed',
  OTHER: 'Other',
};

interface DraftLine {
  key: string;
  orderLineId: string;
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

export default function CustomerNewReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Step 1: Select an order
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(searchParams.get('orderId'));
  const [draftLines, setDraftLines] = useState<DraftLine[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch recent delivered orders for selection
  const { data: ordersData, isLoading: ordersLoading } = useOrders({
    status: 'DELIVERED',
    pageSize: 50,
  });

  // Fetch selected order details
  const { data: orderData, isLoading: orderLoading } = useOrder(selectedOrderId);
  const createRA = useCreateReturnAuthorization();

  const deliveredOrders = ordersData?.orders ?? [];

  // Populate lines when order is selected
  useEffect(() => {
    if (orderData) {
      const lines: DraftLine[] = orderData.lines.map((line: SalesOrderLine, idx: number) => ({
        key: `line-${line.id}-${idx}`,
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
    }
  }, [orderData]);

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

    if (!selectedOrderId || !orderData) {
      setError('Please select an order');
      return;
    }

    if (selectedLines.length === 0) {
      setError('Please select at least one item to return');
      return;
    }

    for (const line of selectedLines) {
      if (line.quantityReturned > line.maxQuantity) {
        setError(`Quantity for ${line.productSku} exceeds maximum of ${line.maxQuantity}`);
        return;
      }
      if (line.returnReason === 'OTHER' && !line.reasonNotes.trim()) {
        setError(`Please provide a reason for ${line.productSku}`);
        return;
      }
    }

    const data: CreateReturnAuthorizationData = {
      orderId: selectedOrderId,
      orderNumber: orderData.orderNumber,
      customerName: orderData.company?.name,
      warehouse: orderData.warehouse,
      lines: selectedLines.map((l): CreateReturnAuthorizationLineInput => ({
        orderLineId: l.orderLineId,
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
        router.push(`/my/returns/${result.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit return request');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/my/returns" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Request a Return</h1>
          <p className="text-sm text-slate-600">Select an order and the items you want to return</p>
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

      {/* Step 1: Select Order */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Select Order</h2>

        {ordersLoading ? (
          <div className="flex items-center gap-2 text-slate-500 py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading your orders...</span>
          </div>
        ) : deliveredOrders.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">No delivered orders found. Returns can only be requested for delivered orders.</p>
        ) : (
          <div className="space-y-2">
            {deliveredOrders.map((order: SalesOrderListItem) => (
              <button
                key={order.id}
                onClick={() => { setSelectedOrderId(order.id); setDraftLines([]); }}
                className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                  selectedOrderId === order.id
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{order.orderNumber}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(order.createdAt).toLocaleDateString()} &middot; {order.lineCount} item{order.lineCount !== 1 ? 's' : ''}
                  </p>
                </div>
                {selectedOrderId === order.id && (
                  <span className="text-xs font-medium text-primary-600">Selected</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Select Items */}
      {selectedOrderId && (
        <>
          {orderLoading ? (
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
              <Loader2 className="h-6 w-6 text-slate-400 animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-500">Loading order items...</p>
            </div>
          ) : draftLines.length > 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Select Items to Return</h2>
              <p className="text-sm text-slate-600 mb-4">
                Check the items you want to return and set the quantity and reason.
              </p>

              <div className="space-y-3">
                {draftLines.map((line) => (
                  <div
                    key={line.key}
                    className={`p-4 rounded-lg border transition-colors ${
                      line.selected ? 'border-primary-200 bg-primary-50/30' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={line.selected}
                        onChange={() => handleToggleLine(line.key)}
                        className="mt-1 rounded border-slate-300"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{line.productDescription}</p>
                        <p className="text-xs text-slate-500 font-mono">{line.productSku}</p>

                        {line.selected && (
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Quantity (max {line.maxQuantity})
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={line.maxQuantity}
                                value={line.quantityReturned}
                                onChange={(e) => handleLineChange(line.key, 'quantityReturned', Math.min(parseInt(e.target.value) || 0, line.maxQuantity))}
                                className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Reason</label>
                              <select
                                value={line.returnReason}
                                onChange={(e) => handleLineChange(line.key, 'returnReason', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded"
                              >
                                {Object.entries(RETURN_REASON_LABELS).map(([value, label]) => (
                                  <option key={value} value={value}>{label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Notes {line.returnReason === 'OTHER' && <span className="text-red-500">*</span>}
                              </label>
                              <input
                                type="text"
                                value={line.reasonNotes}
                                onChange={(e) => handleLineChange(line.key, 'reasonNotes', e.target.value)}
                                placeholder={line.returnReason === 'OTHER' ? 'Required...' : 'Optional'}
                                className={`w-full px-2 py-1.5 text-sm border rounded ${
                                  line.returnReason === 'OTHER' && !line.reasonNotes.trim()
                                    ? 'border-red-300'
                                    : 'border-slate-200'
                                }`}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit */}
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  {selectedLines.length} item{selectedLines.length !== 1 ? 's' : ''} selected
                </p>
                <button
                  onClick={handleSubmit}
                  disabled={selectedLines.length === 0 || createRA.isPending}
                  className="px-6 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createRA.isPending ? 'Submitting...' : 'Submit Return Request'}
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
