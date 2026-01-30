'use client';

import { useState } from 'react';
import { X, Truck } from 'lucide-react';
import type { SalesOrderLine } from '@/lib/api';

interface CreateTransferRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderLines: SalesOrderLine[];
  onCreateTransfer: (lines: Array<{
    orderLineId: string;
    lineNumber: number;
    productId: string;
    productSku: string;
    productDescription: string;
    quantity: number;
  }>) => Promise<void>;
  isCreating: boolean;
}

interface LineSelection {
  lineId: string;
  selected: boolean;
  quantity: number;
  maxQuantity: number;
}

export function CreateTransferRequestModal({
  isOpen,
  onClose,
  orderLines,
  onCreateTransfer,
  isCreating,
}: CreateTransferRequestModalProps) {
  const [lineSelections, setLineSelections] = useState<LineSelection[]>(() =>
    orderLines.map((line) => ({
      lineId: line.id,
      selected: false,
      quantity: line.quantityOrdered,
      maxQuantity: line.quantityOrdered,
    }))
  );

  if (!isOpen) return null;

  const selectedLines = lineSelections.filter((ls) => ls.selected && ls.quantity > 0);

  const handleToggleLine = (lineId: string) => {
    setLineSelections((prev) =>
      prev.map((ls) =>
        ls.lineId === lineId ? { ...ls, selected: !ls.selected } : ls
      )
    );
  };

  const handleQuantityChange = (lineId: string, quantity: number) => {
    setLineSelections((prev) =>
      prev.map((ls) =>
        ls.lineId === lineId
          ? { ...ls, quantity: Math.max(0, Math.min(ls.maxQuantity, quantity)) }
          : ls
      )
    );
  };

  const handleSelectAll = () => {
    const allSelected = lineSelections.every((ls) => ls.selected);
    setLineSelections((prev) =>
      prev.map((ls) => ({ ...ls, selected: !allSelected }))
    );
  };

  const handleSubmit = async () => {
    if (selectedLines.length === 0) return;

    const transferLines = selectedLines.map((selection, index) => {
      const orderLine = orderLines.find((ol) => ol.id === selection.lineId)!;
      return {
        orderLineId: selection.lineId,
        lineNumber: index + 1,
        productId: orderLine.productId,
        productSku: orderLine.productSku,
        productDescription: orderLine.productDescription,
        quantity: selection.quantity,
      };
    });

    await onCreateTransfer(transferLines);

    // Reset form
    setLineSelections(
      orderLines.map((line) => ({
        lineId: line.id,
        selected: false,
        quantity: line.quantityOrdered,
        maxQuantity: line.quantityOrdered,
      }))
    );
  };

  const handleClose = () => {
    setLineSelections(
      orderLines.map((line) => ({
        lineId: line.id,
        selected: false,
        quantity: line.quantityOrdered,
        maxQuantity: line.quantityOrdered,
      }))
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Create Transfer Request</h3>
                <p className="text-sm text-slate-500">Transfer stock from JHB to Cape Town</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto flex-1">
            {/* Select All */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-600">
                {selectedLines.length} of {orderLines.length} lines selected
              </span>
              <button
                onClick={handleSelectAll}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {lineSelections.every((ls) => ls.selected) ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* Order Lines */}
            <div className="space-y-3">
              {orderLines.map((line) => {
                const selection = lineSelections.find((ls) => ls.lineId === line.id)!;

                return (
                  <div
                    key={line.id}
                    className={`flex items-center gap-4 p-3 rounded-lg border-2 transition-colors ${
                      selection.selected
                        ? 'border-primary-300 bg-primary-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selection.selected}
                      onChange={() => handleToggleLine(line.id)}
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">
                          {line.productSku}
                        </span>
                        <span className="text-xs text-slate-400">Line {line.lineNumber}</span>
                      </div>
                      <p className="text-sm text-slate-600 truncate">{line.productDescription}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Order Qty</div>
                        <div className="text-sm font-medium text-slate-900">{line.quantityOrdered}</div>
                      </div>

                      {selection.selected && (
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-500">Transfer:</label>
                          <input
                            type="number"
                            min={1}
                            max={selection.maxQuantity}
                            value={selection.quantity}
                            onChange={(e) => handleQuantityChange(line.id, parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-slate-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedLines.length === 0 || isCreating}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : `Create Transfer (${selectedLines.length} lines)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
