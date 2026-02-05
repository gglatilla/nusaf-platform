'use client';

import { useState } from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Common specification keys for industrial products
const SUGGESTED_KEYS = [
  { group: 'Dimensions', keys: ['Pitch', 'Width', 'Height', 'Length', 'Diameter', 'Bore Size'] },
  { group: 'Physical', keys: ['Weight', 'Material', 'Finish', 'Color'] },
  { group: 'Performance', keys: ['Load Rating', 'Speed Rating', 'Temperature Range', 'Pressure Rating'] },
  { group: 'Mechanical', keys: ['Teeth Count', 'Module', 'Pressure Angle', 'Ratio'] },
  { group: 'Electrical', keys: ['Voltage', 'Power', 'Current', 'Frequency'] },
];

interface SpecificationRow {
  id: string;
  key: string;
  value: string;
}

interface SpecificationsEditorProps {
  value: Record<string, string>;
  onChange: (specs: Record<string, string>) => void;
  disabled?: boolean;
}

export function SpecificationsEditor({ value, onChange, disabled }: SpecificationsEditorProps) {
  // Convert object to array of rows for editing
  const [rows, setRows] = useState<SpecificationRow[]>(() => {
    const entries = Object.entries(value || {});
    if (entries.length === 0) {
      return [];
    }
    return entries.map(([key, val], index) => ({
      id: `spec-${index}-${Date.now()}`,
      key,
      value: val,
    }));
  });

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);

  // Update parent when rows change
  const updateParent = (newRows: SpecificationRow[]) => {
    const specs: Record<string, string> = {};
    newRows.forEach((row) => {
      if (row.key.trim()) {
        specs[row.key.trim()] = row.value;
      }
    });
    onChange(specs);
  };

  const addRow = (key = '', val = '') => {
    const newRow: SpecificationRow = {
      id: `spec-${Date.now()}`,
      key,
      value: val,
    };
    const newRows = [...rows, newRow];
    setRows(newRows);
    updateParent(newRows);
    setShowSuggestions(false);
  };

  const removeRow = (id: string) => {
    const newRows = rows.filter((r) => r.id !== id);
    setRows(newRows);
    updateParent(newRows);
  };

  const updateRow = (id: string, field: 'key' | 'value', newValue: string) => {
    const newRows = rows.map((r) => (r.id === id ? { ...r, [field]: newValue } : r));
    setRows(newRows);
    updateParent(newRows);
  };

  // Get keys already in use
  const usedKeys = new Set(rows.map((r) => r.key.toLowerCase()));

  // Filter suggestions to exclude already used keys
  const getFilteredSuggestions = () => {
    return SUGGESTED_KEYS.map((group) => ({
      ...group,
      keys: group.keys.filter((key) => !usedKeys.has(key.toLowerCase())),
    })).filter((group) => group.keys.length > 0);
  };

  return (
    <div className="space-y-3">
      {/* Existing specifications */}
      {rows.map((row) => (
        <div key={row.id} className="flex items-start gap-2">
          <div className="flex-1 grid grid-cols-2 gap-2">
            <input
              type="text"
              value={row.key}
              onChange={(e) => updateRow(row.id, 'key', e.target.value)}
              onFocus={() => setActiveRowId(row.id)}
              onBlur={() => setActiveRowId(null)}
              placeholder="Property name"
              disabled={disabled}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100"
            />
            <input
              type="text"
              value={row.value}
              onChange={(e) => updateRow(row.id, 'value', e.target.value)}
              placeholder="Value"
              disabled={disabled}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100"
            />
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="Remove specification"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}

      {/* Add new specification */}
      {!disabled && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Specification
            <ChevronDown className={cn('h-4 w-4 transition-transform', showSuggestions && 'rotate-180')} />
          </button>

          {/* Suggestions dropdown */}
          {showSuggestions && (
            <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
              {/* Custom entry */}
              <button
                type="button"
                onClick={() => addRow()}
                className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100"
              >
                <span className="font-medium">Custom specification...</span>
              </button>

              {/* Grouped suggestions */}
              {getFilteredSuggestions().map((group) => (
                <div key={group.group}>
                  <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase bg-slate-50">
                    {group.group}
                  </div>
                  {group.keys.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => addRow(key)}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700"
                    >
                      {key}
                    </button>
                  ))}
                </div>
              ))}

              {getFilteredSuggestions().length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-slate-500">
                  All suggested specifications have been added
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {rows.length === 0 && disabled && (
        <div className="py-4 text-center text-sm text-slate-500">
          No specifications added
        </div>
      )}
    </div>
  );
}
