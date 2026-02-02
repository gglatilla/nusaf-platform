'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

// Categories matching ProductCategoriesSection
const categories = [
  { code: 'levelling-feet', name: 'Levelling Feet' },
  { code: 'conveyor', name: 'Conveyor Components' },
  { code: 'power-transmission', name: 'Power Transmission' },
  { code: 'gearboxes', name: 'Gearboxes & Motors' },
  { code: 'bearings', name: 'Bearings' },
  { code: 'v-belts', name: 'V-Belts' },
] as const;

interface CategoryFilterProps {
  /** Base path for filtering */
  basePath?: string;
}

export function CategoryFilter({ basePath = '/catalog' }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category') || '';

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set('category', value);
    } else {
      params.delete('category');
    }

    // Reset to page 1 when category changes
    params.delete('page');

    const queryString = params.toString();
    router.push(queryString ? `${basePath}?${queryString}` : basePath);
  };

  const selectedCategory = categories.find((c) => c.code === currentCategory);

  return (
    <div className="relative">
      <select
        value={currentCategory}
        onChange={handleChange}
        className="appearance-none w-full sm:w-auto pl-4 pr-10 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
      >
        <option value="">All Categories</option>
        {categories.map((category) => (
          <option key={category.code} value={category.code}>
            {category.name}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </div>
    </div>
  );
}

// Export categories for use in other components
export { categories };
