'use client';

import { type StockStatus } from '@/lib/api';

interface StockStatusFilterProps {
  selected: StockStatus[];
  onChange: (selected: StockStatus[]) => void;
}

const stockStatusOptions: { value: StockStatus; label: string; className: string }[] = [
  { value: 'IN_STOCK', label: 'In Stock', className: 'text-green-700' },
  { value: 'LOW_STOCK', label: 'Low Stock', className: 'text-amber-700' },
  { value: 'OUT_OF_STOCK', label: 'Out of Stock', className: 'text-red-700' },
  { value: 'ON_ORDER', label: 'On Order', className: 'text-blue-700' },
  { value: 'OVERSTOCK', label: 'Overstock', className: 'text-orange-700' },
];

export function StockStatusFilter({ selected, onChange }: StockStatusFilterProps) {
  const handleToggle = (status: StockStatus) => {
    if (selected.includes(status)) {
      onChange(selected.filter((s) => s !== status));
    } else {
      onChange([...selected, status]);
    }
  };

  return (
    <div className="space-y-2">
      {stockStatusOptions.map((option) => (
        <label
          key={option.value}
          className="flex items-center gap-2 cursor-pointer text-sm"
        >
          <input
            type="checkbox"
            checked={selected.includes(option.value)}
            onChange={() => handleToggle(option.value)}
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <span className={option.className}>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
