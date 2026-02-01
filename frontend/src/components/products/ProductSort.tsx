'use client';

interface ProductSortProps {
  value: string;
  onChange: (sort: string) => void;
}

const sortOptions = [
  { value: '', label: 'Default' },
  { value: 'nusafSku:asc', label: 'SKU A-Z' },
  { value: 'nusafSku:desc', label: 'SKU Z-A' },
  { value: 'description:asc', label: 'Name A-Z' },
  { value: 'description:desc', label: 'Name Z-A' },
  { value: 'price:asc', label: 'Price: Low to High' },
  { value: 'price:desc', label: 'Price: High to Low' },
  { value: 'available:desc', label: 'Availability: High to Low' },
  { value: 'available:asc', label: 'Availability: Low to High' },
];

export function ProductSort({ value, onChange }: ProductSortProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="product-sort" className="text-sm text-slate-600">
        Sort by:
      </label>
      <select
        id="product-sort"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm border border-slate-300 rounded-md px-3 py-1.5 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
