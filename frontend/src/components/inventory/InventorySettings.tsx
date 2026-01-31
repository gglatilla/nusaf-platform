'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';

interface InventorySettingsProps {
  productDefaults: {
    defaultReorderPoint: number | null;
    defaultReorderQty: number | null;
    defaultMinStock: number | null;
    defaultMaxStock: number | null;
    leadTimeDays: number | null;
  };
  locationOverrides?: Array<{
    warehouseId: string;
    warehouseName: string;
    reorderPoint: number | null;
    minimumStock: number | null;
    maximumStock: number | null;
  }>;
  onSave?: (data: {
    defaultReorderPoint: number | null;
    defaultReorderQty: number | null;
    defaultMinStock: number | null;
    defaultMaxStock: number | null;
    leadTimeDays: number | null;
  }) => Promise<void>;
  canEdit: boolean;
}

/**
 * Inventory Settings component for reorder point defaults
 * Only visible to ADMIN and MANAGER roles
 */
export function InventorySettings({
  productDefaults,
  locationOverrides = [],
  onSave,
  canEdit,
}: InventorySettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editValues, setEditValues] = useState({
    defaultReorderPoint: productDefaults.defaultReorderPoint?.toString() ?? '',
    defaultReorderQty: productDefaults.defaultReorderQty?.toString() ?? '',
    defaultMinStock: productDefaults.defaultMinStock?.toString() ?? '',
    defaultMaxStock: productDefaults.defaultMaxStock?.toString() ?? '',
    leadTimeDays: productDefaults.leadTimeDays?.toString() ?? '',
  });

  const handleSave = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave({
        defaultReorderPoint: editValues.defaultReorderPoint ? parseInt(editValues.defaultReorderPoint, 10) : null,
        defaultReorderQty: editValues.defaultReorderQty ? parseInt(editValues.defaultReorderQty, 10) : null,
        defaultMinStock: editValues.defaultMinStock ? parseInt(editValues.defaultMinStock, 10) : null,
        defaultMaxStock: editValues.defaultMaxStock ? parseInt(editValues.defaultMaxStock, 10) : null,
        leadTimeDays: editValues.leadTimeDays ? parseInt(editValues.leadTimeDays, 10) : null,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValues({
      defaultReorderPoint: productDefaults.defaultReorderPoint?.toString() ?? '',
      defaultReorderQty: productDefaults.defaultReorderQty?.toString() ?? '',
      defaultMinStock: productDefaults.defaultMinStock?.toString() ?? '',
      defaultMaxStock: productDefaults.defaultMaxStock?.toString() ?? '',
      leadTimeDays: productDefaults.leadTimeDays?.toString() ?? '',
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-900">Inventory Settings</h2>
        </div>
        {canEdit && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Edit
          </button>
        )}
      </div>

      {/* Product Defaults */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-700 mb-3">Product Defaults</h3>
        {isEditing ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Reorder Point</label>
              <input
                type="number"
                value={editValues.defaultReorderPoint}
                onChange={(e) => setEditValues((v) => ({ ...v, defaultReorderPoint: e.target.value }))}
                className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="—"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Reorder Qty</label>
              <input
                type="number"
                value={editValues.defaultReorderQty}
                onChange={(e) => setEditValues((v) => ({ ...v, defaultReorderQty: e.target.value }))}
                className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="—"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Min Stock</label>
              <input
                type="number"
                value={editValues.defaultMinStock}
                onChange={(e) => setEditValues((v) => ({ ...v, defaultMinStock: e.target.value }))}
                className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="—"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Max Stock</label>
              <input
                type="number"
                value={editValues.defaultMaxStock}
                onChange={(e) => setEditValues((v) => ({ ...v, defaultMaxStock: e.target.value }))}
                className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="—"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Lead Time (days)</label>
              <input
                type="number"
                value={editValues.leadTimeDays}
                onChange={(e) => setEditValues((v) => ({ ...v, leadTimeDays: e.target.value }))}
                className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="—"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-slate-500">Reorder Point:</span>{' '}
              <span className="font-medium text-slate-900">
                {productDefaults.defaultReorderPoint ?? '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Reorder Qty:</span>{' '}
              <span className="font-medium text-slate-900">
                {productDefaults.defaultReorderQty ?? '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Min Stock:</span>{' '}
              <span className="font-medium text-slate-900">
                {productDefaults.defaultMinStock ?? '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Max Stock:</span>{' '}
              <span className="font-medium text-slate-900">
                {productDefaults.defaultMaxStock ?? '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Lead Time:</span>{' '}
              <span className="font-medium text-slate-900">
                {productDefaults.leadTimeDays ? `${productDefaults.leadTimeDays}d` : '—'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Location Overrides */}
      {locationOverrides.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-slate-700 mb-3">Location Overrides</h3>
          <div className="space-y-2 text-sm">
            {locationOverrides.map((loc) => (
              <div key={loc.warehouseId} className="text-slate-600">
                <span className="font-medium text-slate-900">{loc.warehouseName}:</span>{' '}
                Reorder at {loc.reorderPoint ?? 'default'}, min {loc.minimumStock ?? 'default'}
                {loc.maximumStock && `, max ${loc.maximumStock}`}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Actions */}
      {isEditing && (
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}
