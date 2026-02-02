'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

interface ProductSearchBarProps {
  /** Placeholder text */
  placeholder?: string;
  /** Base path for search results */
  basePath?: string;
}

export function ProductSearchBar({
  placeholder = 'Search by SKU or competitor part number...',
  basePath = '/catalog',
}: ProductSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [value, setValue] = useState(initialSearch);
  const [debouncedValue, setDebouncedValue] = useState(initialSearch);

  // Debounce input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  // Navigate when debounced value changes
  useEffect(() => {
    if (debouncedValue !== initialSearch) {
      const params = new URLSearchParams(searchParams.toString());

      if (debouncedValue) {
        params.set('search', debouncedValue);
      } else {
        params.delete('search');
      }

      // Reset to page 1 when search changes
      params.delete('page');

      const queryString = params.toString();
      router.push(queryString ? `${basePath}?${queryString}` : basePath);
    }
  }, [debouncedValue, initialSearch, basePath, router, searchParams]);

  // Sync with URL when it changes externally
  useEffect(() => {
    setValue(initialSearch);
  }, [initialSearch]);

  const handleClear = useCallback(() => {
    setValue('');
    setDebouncedValue('');
  }, []);

  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-slate-400" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="block w-full pl-10 pr-10 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder:text-slate-400"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
          aria-label="Clear search"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
