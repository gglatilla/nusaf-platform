'use client';

export type WarehouseValue = 'JHB' | 'CT' | 'ALL';

interface WarehouseSelectorProps {
  value: WarehouseValue;
  onChange: (value: WarehouseValue) => void;
}

const warehouseOptions: { value: WarehouseValue; label: string }[] = [
  { value: 'JHB', label: 'Johannesburg' },
  { value: 'CT', label: 'Cape Town' },
  { value: 'ALL', label: 'All Locations' },
];

export function WarehouseSelector({ value, onChange }: WarehouseSelectorProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-600">Showing stock for:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as WarehouseValue)}
        className="border border-slate-300 rounded-md px-3 py-1.5 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        {warehouseOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
