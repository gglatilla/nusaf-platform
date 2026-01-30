'use client';

import { useState } from 'react';
import { Check, Minus, Plus } from 'lucide-react';
import type { PickingSlipLine, PickingSlipStatus } from '@/lib/api';

interface PickingSlipLineTableProps {
  lines: PickingSlipLine[];
  status: PickingSlipStatus;
  onUpdateLine?: (lineId: string, quantityPicked: number) => Promise<void>;
  isUpdating?: boolean;
}

export function PickingSlipLineTable({
  lines,
  status,
  onUpdateLine,
  isUpdating,
}: PickingSlipLineTableProps) {
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  const canEdit = status === 'IN_PROGRESS' && onUpdateLine;

  const handleStartEdit = (line: PickingSlipLine) => {
    if (!canEdit) return;
    setEditingLineId(line.id);
    setEditValue(line.quantityPicked);
  };

  const handleSaveEdit = async (lineId: string) => {
    if (!onUpdateLine) return;
    await onUpdateLine(lineId, editValue);
    setEditingLineId(null);
  };

  const handleQuickPick = async (line: PickingSlipLine) => {
    if (!onUpdateLine) return;
    // Quick pick: set picked to full quantity
    await onUpdateLine(line.id, line.quantityToPick);
  };

  const handleIncrement = () => {
    const line = lines.find((l) => l.id === editingLineId);
    if (line && editValue < line.quantityToPick) {
      setEditValue(editValue + 1);
    }
  };

  const handleDecrement = () => {
    if (editValue > 0) {
      setEditValue(editValue - 1);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              #
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              SKU
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Description
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
              To Pick
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Picked
            </th>
            {canEdit && (
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {lines.map((line) => {
            const isComplete = line.quantityPicked >= line.quantityToPick;
            const isEditing = editingLineId === line.id;

            return (
              <tr
                key={line.id}
                className={`${isComplete ? 'bg-green-50' : ''} transition-colors`}
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                  {line.lineNumber}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-slate-900">
                  {line.productSku}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {line.productDescription}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-medium text-slate-900">
                  {line.quantityToPick}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  {isEditing ? (
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={handleDecrement}
                        disabled={editValue <= 0 || isUpdating}
                        className="p-1 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val >= 0 && val <= line.quantityToPick) {
                            setEditValue(val);
                          }
                        }}
                        className="w-16 px-2 py-1 text-center text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        min={0}
                        max={line.quantityToPick}
                      />
                      <button
                        onClick={handleIncrement}
                        disabled={editValue >= line.quantityToPick || isUpdating}
                        className="p-1 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleSaveEdit(line.id)}
                        disabled={isUpdating}
                        className="ml-1 p-1 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`text-sm font-medium ${
                        isComplete
                          ? 'text-green-600'
                          : line.quantityPicked > 0
                          ? 'text-amber-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {line.quantityPicked} / {line.quantityToPick}
                    </span>
                  )}
                </td>
                {canEdit && (
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    {!isEditing && !isComplete && (
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => handleStartEdit(line)}
                          disabled={isUpdating}
                          className="text-xs px-2 py-1 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleQuickPick(line)}
                          disabled={isUpdating}
                          className="text-xs px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                          Pick All
                        </button>
                      </div>
                    )}
                    {isComplete && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <Check className="h-4 w-4" />
                        Done
                      </span>
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
