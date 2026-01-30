'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import type { TransferRequestLine, TransferRequestStatus } from '@/lib/api';

interface TransferRequestLineTableProps {
  lines: TransferRequestLine[];
  status: TransferRequestStatus;
  onUpdateLineReceived?: (lineId: string, receivedQuantity: number) => Promise<void>;
  isUpdating?: boolean;
}

export function TransferRequestLineTable({
  lines,
  status,
  onUpdateLineReceived,
  isUpdating,
}: TransferRequestLineTableProps) {
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<number>(0);

  const canEditReceived = status === 'IN_TRANSIT' && onUpdateLineReceived;

  const handleStartEdit = (line: TransferRequestLine) => {
    setEditingLineId(line.id);
    setEditingQuantity(line.receivedQuantity);
  };

  const handleSave = async (lineId: string) => {
    if (onUpdateLineReceived) {
      await onUpdateLineReceived(lineId, editingQuantity);
    }
    setEditingLineId(null);
  };

  const handleCancel = () => {
    setEditingLineId(null);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Line
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              SKU
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Description
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Transfer Qty
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Received Qty
            </th>
            {canEditReceived && (
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lines.map((line) => {
            const isEditing = editingLineId === line.id;
            const isFullyReceived = line.receivedQuantity >= line.quantity;

            return (
              <tr key={line.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                  {line.lineNumber}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                  {line.productSku}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  <div className="max-w-xs truncate">{line.productDescription}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900 text-right">
                  {line.quantity}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                  {isEditing ? (
                    <input
                      type="number"
                      min={0}
                      max={line.quantity}
                      value={editingQuantity}
                      onChange={(e) => setEditingQuantity(Math.max(0, Math.min(line.quantity, parseInt(e.target.value) || 0)))}
                      className="w-20 px-2 py-1 border border-slate-300 rounded text-right text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      autoFocus
                    />
                  ) : (
                    <span
                      className={`${
                        isFullyReceived
                          ? 'text-green-600 font-medium'
                          : line.receivedQuantity > 0
                          ? 'text-amber-600'
                          : 'text-slate-900'
                      }`}
                    >
                      {line.receivedQuantity}
                      {isFullyReceived && <Check className="inline-block ml-1 h-4 w-4" />}
                    </span>
                  )}
                </td>
                {canEditReceived && (
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={handleCancel}
                          className="text-xs text-slate-600 hover:text-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSave(line.id)}
                          disabled={isUpdating}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
                        >
                          {isUpdating ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(line)}
                        className="text-xs text-primary-600 hover:text-primary-700"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
