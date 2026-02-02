'use client';

import { useState, useEffect } from 'react';
import { PackageCheck, AlertCircle, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useReceivingSummary } from '@/hooks/useGoodsReceipts';
import { useCreateGoodsReceipt } from '@/hooks/useGoodsReceipts';
import type { Warehouse, ReceivingSummaryLine, CreateGrvLineInput } from '@/lib/api';

interface ReceiveGoodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrderId: string;
  poNumber: string;
  deliveryLocation: Warehouse;
}

interface LineInput {
  poLineId: string;
  productSku: string;
  productDescription: string;
  outstanding: number;
  quantityReceived: string;
  quantityRejected: string;
  rejectionReason: string;
}

export function ReceiveGoodsModal({
  isOpen,
  onClose,
  purchaseOrderId,
  poNumber,
  deliveryLocation,
}: ReceiveGoodsModalProps) {
  const [lineInputs, setLineInputs] = useState<LineInput[]>([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: summary, isLoading: isLoadingSummary } = useReceivingSummary(
    isOpen ? purchaseOrderId : null
  );
  const createGrv = useCreateGoodsReceipt();

  // Initialize line inputs when summary loads
  useEffect(() => {
    if (summary?.lines) {
      setLineInputs(
        summary.lines
          .filter((line) => line.outstanding > 0)
          .map((line) => ({
            poLineId: line.poLineId,
            productSku: line.productSku,
            productDescription: line.productDescription,
            outstanding: line.outstanding,
            quantityReceived: '',
            quantityRejected: '',
            rejectionReason: '',
          }))
      );
    }
  }, [summary]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setLineInputs([]);
      setNotes('');
      setError(null);
    }
  }, [isOpen]);

  const handleLineChange = (
    index: number,
    field: 'quantityReceived' | 'quantityRejected' | 'rejectionReason',
    value: string
  ) => {
    setLineInputs((prev) =>
      prev.map((line, i) =>
        i === index ? { ...line, [field]: value } : line
      )
    );
    setError(null);
  };

  const handleReceiveAll = () => {
    setLineInputs((prev) =>
      prev.map((line) => ({
        ...line,
        quantityReceived: line.outstanding.toString(),
        quantityRejected: '',
        rejectionReason: '',
      }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Build lines array
    const linesToSubmit: CreateGrvLineInput[] = [];

    for (const line of lineInputs) {
      const received = parseInt(line.quantityReceived) || 0;
      const rejected = parseInt(line.quantityRejected) || 0;

      // Skip lines with no activity
      if (received === 0 && rejected === 0) continue;

      // Validate total doesn't exceed outstanding
      if (received + rejected > line.outstanding) {
        setError(
          `${line.productSku}: Received + Rejected (${received + rejected}) exceeds outstanding (${line.outstanding})`
        );
        return;
      }

      // Validate rejection reason if rejecting
      if (rejected > 0 && !line.rejectionReason.trim()) {
        setError(`${line.productSku}: Please provide a rejection reason`);
        return;
      }

      linesToSubmit.push({
        poLineId: line.poLineId,
        quantityReceived: received,
        quantityRejected: rejected > 0 ? rejected : undefined,
        rejectionReason: rejected > 0 ? line.rejectionReason.trim() : undefined,
      });
    }

    if (linesToSubmit.length === 0) {
      setError('Please enter at least one quantity to receive');
      return;
    }

    try {
      await createGrv.mutateAsync({
        purchaseOrderId,
        location: deliveryLocation,
        notes: notes.trim() || undefined,
        lines: linesToSubmit,
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create goods receipt';
      setError(message);
    }
  };

  const totalReceiving = lineInputs.reduce(
    (sum, line) => sum + (parseInt(line.quantityReceived) || 0),
    0
  );
  const totalRejecting = lineInputs.reduce(
    (sum, line) => sum + (parseInt(line.quantityRejected) || 0),
    0
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-green-600" />
            Receive Goods for {poNumber}
          </DialogTitle>
        </DialogHeader>

        {isLoadingSummary ? (
          <div className="py-8 text-center text-slate-500">Loading receiving summary...</div>
        ) : lineInputs.length === 0 ? (
          <div className="py-8 text-center">
            <Info className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-600">All items on this PO have been received.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            {/* Quick Actions */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-600">
                {lineInputs.length} line{lineInputs.length !== 1 ? 's' : ''} with outstanding quantities
              </span>
              <button
                type="button"
                onClick={handleReceiveAll}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Receive All
              </button>
            </div>

            {/* Lines Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg mb-4">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">
                      Product
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 uppercase w-20">
                      Outstanding
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase w-24">
                      Received
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase w-24">
                      Rejected
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineInputs.map((line, index) => (
                    <tr key={line.poLineId} className="hover:bg-slate-50">
                      <td className="px-3 py-2">
                        <div>
                          <span className="font-mono text-sm text-slate-900">
                            {line.productSku}
                          </span>
                          <p className="text-xs text-slate-500 truncate max-w-[200px]">
                            {line.productDescription}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className="text-sm font-medium text-slate-700">
                          {line.outstanding}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          max={line.outstanding}
                          value={line.quantityReceived}
                          onChange={(e) =>
                            handleLineChange(index, 'quantityReceived', e.target.value)
                          }
                          placeholder="0"
                          className="w-full px-2 py-1 text-sm text-center border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          max={line.outstanding}
                          value={line.quantityRejected}
                          onChange={(e) =>
                            handleLineChange(index, 'quantityRejected', e.target.value)
                          }
                          placeholder="0"
                          className="w-full px-2 py-1 text-sm text-center border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={line.rejectionReason}
                          onChange={(e) =>
                            handleLineChange(index, 'rejectionReason', e.target.value)
                          }
                          placeholder={
                            parseInt(line.quantityRejected) > 0
                              ? 'Required...'
                              : 'If rejected...'
                          }
                          disabled={!line.quantityRejected || parseInt(line.quantityRejected) === 0}
                          className="w-full px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-400"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes about this delivery..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Summary */}
            <div className="flex items-center gap-6 p-3 bg-slate-50 rounded-lg mb-4">
              <div>
                <span className="text-xs text-slate-500">Receiving</span>
                <p className="text-lg font-semibold text-green-600">{totalReceiving}</p>
              </div>
              {totalRejecting > 0 && (
                <div>
                  <span className="text-xs text-slate-500">Rejecting</span>
                  <p className="text-lg font-semibold text-red-600">{totalRejecting}</p>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={totalReceiving === 0 && totalRejecting === 0 || createGrv.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createGrv.isPending ? 'Creating GRV...' : 'Create Goods Receipt'}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
