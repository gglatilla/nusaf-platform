'use client';

import { useState } from 'react';
import { Trash2, Edit2, Check, X, Layers } from 'lucide-react';
import { useGetBom, useUpdateBomComponent, useRemoveBomComponent } from '@/hooks/useBom';
import type { BomItemData } from '@/lib/api';
import { getUomLabel } from '@/lib/constants/unit-of-measure';

interface BomTableProps {
  productId: string;
  canEdit: boolean;
}

interface EditingState {
  componentId: string;
  field: 'quantity' | 'notes';
  value: string;
}

export function BomTable({ productId, canEdit }: BomTableProps) {
  const { data, isLoading, error } = useGetBom(productId);
  const updateMutation = useUpdateBomComponent();
  const removeMutation = useRemoveBomComponent();

  const [editing, setEditing] = useState<EditingState | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const components = data?.components ?? [];

  const handleStartEdit = (item: BomItemData, field: 'quantity' | 'notes') => {
    setEditing({
      componentId: item.componentProductId,
      field,
      value: field === 'quantity' ? item.quantity.toString() : (item.notes ?? ''),
    });
  };

  const handleCancelEdit = () => {
    setEditing(null);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;

    const updateData =
      editing.field === 'quantity'
        ? { quantity: parseFloat(editing.value) || 0 }
        : { notes: editing.value || null };

    await updateMutation.mutateAsync({
      productId,
      componentId: editing.componentId,
      data: updateData,
    });

    setEditing(null);
  };

  const handleDelete = async (componentId: string) => {
    await removeMutation.mutateAsync({ productId, componentId });
    setDeleteConfirm(null);
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="inline-block w-6 h-6 border-2 border-slate-300 border-t-primary-600 rounded-full animate-spin" />
        <p className="mt-2">Loading BOM...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        Failed to load Bill of Materials
      </div>
    );
  }

  if (components.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        <Layers className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="font-medium">No components defined</p>
        <p className="text-sm mt-1">
          {canEdit
            ? 'Click "Add Component" to build the Bill of Materials.'
            : 'This product has no Bill of Materials.'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              SKU
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Description
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Quantity
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Unit
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Optional
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Notes
            </th>
            {canEdit && (
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {components.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50">
              {/* SKU with nested indicator */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-slate-900">
                    {item.componentProduct.nusafSku}
                  </span>
                  {item.hasOwnBom && (
                    <span
                      className="text-primary-600"
                      title="This component has its own BOM"
                    >
                      <Layers className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </td>

              {/* Description */}
              <td className="px-4 py-3 text-sm text-slate-700">
                {item.componentProduct.description}
              </td>

              {/* Quantity - editable */}
              <td className="px-4 py-3 text-right">
                {editing?.componentId === item.componentProductId &&
                editing?.field === 'quantity' ? (
                  <div className="flex items-center justify-end gap-1">
                    <input
                      type="number"
                      step="0.0001"
                      value={editing.value}
                      onChange={(e) =>
                        setEditing({ ...editing, value: e.target.value })
                      }
                      className="w-24 px-2 py-1 text-sm text-right border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                      disabled={updateMutation.isPending}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span
                    className={`text-sm font-medium ${
                      canEdit ? 'cursor-pointer hover:text-primary-600' : ''
                    }`}
                    onClick={() => canEdit && handleStartEdit(item, 'quantity')}
                  >
                    {item.quantity}
                  </span>
                )}
              </td>

              {/* Unit */}
              <td className="px-4 py-3 text-center text-sm text-slate-600">
                {getUomLabel(item.unitOverride ?? item.componentProduct.unitOfMeasure)}
              </td>

              {/* Optional */}
              <td className="px-4 py-3 text-center">
                {item.isOptional ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                    Optional
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>

              {/* Notes - editable */}
              <td className="px-4 py-3">
                {editing?.componentId === item.componentProductId &&
                editing?.field === 'notes' ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editing.value}
                      onChange={(e) =>
                        setEditing({ ...editing, value: e.target.value })
                      }
                      className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Add notes..."
                      autoFocus
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                      disabled={updateMutation.isPending}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span
                    className={`text-sm text-slate-500 ${
                      canEdit ? 'cursor-pointer hover:text-primary-600' : ''
                    }`}
                    onClick={() => canEdit && handleStartEdit(item, 'notes')}
                  >
                    {item.notes || (canEdit ? 'Click to add notes' : '—')}
                  </span>
                )}
              </td>

              {/* Actions */}
              {canEdit && (
                <td className="px-4 py-3 text-center">
                  {deleteConfirm === item.componentProductId ? (
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleDelete(item.componentProductId)}
                        className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
                        disabled={removeMutation.isPending}
                      >
                        {removeMutation.isPending ? '...' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded hover:bg-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(item.componentProductId)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Remove component"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
