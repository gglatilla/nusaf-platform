'use client';

export type StockFilterValue = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'ON_ORDER';

interface StockFilterChipsProps {
  selected: StockFilterValue;
  onChange: (value: StockFilterValue) => void;
}

const filterOptions: { value: StockFilterValue; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'IN_STOCK', label: 'In Stock' },
  { value: 'LOW_STOCK', label: 'Low Stock' },
  { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
  { value: 'ON_ORDER', label: 'On Order' },
];

export function StockFilterChips({ selected, onChange }: StockFilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filterOptions.map((option) => {
        const isSelected = selected === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-full transition-colors
              ${isSelected
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }
            `}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
