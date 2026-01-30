'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, Loader2 } from 'lucide-react';
import type { SalesOrderLine, Warehouse } from '@/lib/api';

interface GeneratePickingSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderLines: SalesOrderLine[];
  onGenerate: (lines: Array<{
    orderLineId: string;
    lineNumber: number;
    productId: string;
    productSku: string;
    productDescription: string;
    quantityToPick: number;
    location: Warehouse;
  }>) => Promise<void>;
  isGenerating?: boolean;
}

interface LineSelection {
  orderLineId: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  quantityAvailable: number;
  quantityToPick: number;
  location: Warehouse;
}

export function GeneratePickingSlipModal({
  isOpen,
  onClose,
  orderLines,
  onGenerate,
  isGenerating,
}: GeneratePickingSlipModalProps) {
  const [lineSelections, setLineSelections] = useState<LineSelection[]>([]);

  // Initialize selections when order lines change
  useEffect(() => {
    if (orderLines.length > 0) {
      setLineSelections(
        orderLines.map((line) => ({
          orderLineId: line.id,
          lineNumber: line.lineNumber,
          productId: line.productId,
          productSku: line.productSku,
          productDescription: line.productDescription,
          quantityAvailable: line.quantityOrdered - line.quantityPicked,
          quantityToPick: line.quantityOrdered - line.quantityPicked,
          location: 'JHB' as Warehouse,
        }))
      );
    }
  }, [orderLines]);

  const handleLocationChange = (lineId: string, location: Warehouse) => {
    setLineSelections((prev) =>
      prev.map((sel) =>
        sel.orderLineId === lineId ? { ...sel, location } : sel
      )
    );
  };

  const handleQuantityChange = (lineId: string, quantity: number) => {
    setLineSelections((prev) =>
      prev.map((sel) =>
        sel.orderLineId === lineId
          ? { ...sel, quantityToPick: Math.min(Math.max(0, quantity), sel.quantityAvailable) }
          : sel
      )
    );
  };

  const handleSetAllLocation = (location: Warehouse) => {
    setLineSelections((prev) => prev.map((sel) => ({ ...sel, location })));
  };

  const handleGenerate = async () => {
    const linesToGenerate = lineSelections
      .filter((sel) => sel.quantityToPick > 0)
      .map((sel) => ({
        orderLineId: sel.orderLineId,
        lineNumber: sel.lineNumber,
        productId: sel.productId,
        productSku: sel.productSku,
        productDescription: sel.productDescription,
        quantityToPick: sel.quantityToPick,
        location: sel.location,
      }));

    if (linesToGenerate.length === 0) {
      return;
    }

    await onGenerate(linesToGenerate);
  };

  // Count slips that will be created
  const slipsToCreate = new Set(lineSelections.filter((l) => l.quantityToPick > 0).map((l) => l.location)).size;
  const jhbLineCount = lineSelections.filter((l) => l.location === 'JHB' && l.quantityToPick > 0).length;
  const ctLineCount = lineSelections.filter((l) => l.location === 'CT' && l.quantityToPick > 0).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Generate Picking Slips</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-4">
            <span className="text-sm text-slate-600">Set all lines to:</span>
            <button
              onClick={() => handleSetAllLocation('JHB')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-slate-300 bg-white hover:bg-slate-50"
            >
              <MapPin className="h-4 w-4" />
              Johannesburg
            </button>
            <button
              onClick={() => handleSetAllLocation('CT')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-slate-300 bg-white hover:bg-slate-50"
            >
              <MapPin className="h-4 w-4" />
              Cape Town
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto px-6 py-4">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Available
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Qty to Pick
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Warehouse
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {lineSelections.map((sel) => (
                  <tr key={sel.orderLineId}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-600">
                      {sel.lineNumber}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-mono text-slate-900">
                      {sel.productSku}
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-600 max-w-xs truncate">
                      {sel.productDescription}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-center text-slate-600">
                      {sel.quantityAvailable}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      <input
                        type="number"
                        value={sel.quantityToPick}
                        onChange={(e) =>
                          handleQuantityChange(sel.orderLineId, parseInt(e.target.value, 10) || 0)
                        }
                        min={0}
                        max={sel.quantityAvailable}
                        className="w-20 px-2 py-1 text-sm text-center border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      <select
                        value={sel.location}
                        onChange={(e) =>
                          handleLocationChange(sel.orderLineId, e.target.value as Warehouse)
                        }
                        className="px-2 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="JHB">Johannesburg</option>
                        <option value="CT">Cape Town</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">
                {slipsToCreate === 0 ? (
                  <span className="text-amber-600">No items selected</span>
                ) : (
                  <>
                    Will create <strong>{slipsToCreate}</strong> picking slip{slipsToCreate > 1 ? 's' : ''}
                    {jhbLineCount > 0 && ctLineCount > 0 && (
                      <span className="text-slate-500">
                        {' '}(JHB: {jhbLineCount} lines, CT: {ctLineCount} lines)
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={slipsToCreate === 0 || isGenerating}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isGenerating ? 'Generating...' : 'Generate Picking Slips'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
