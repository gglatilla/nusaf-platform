'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, X, Loader2 } from 'lucide-react';
import { api, SpecificationOption } from '@/lib/api';

interface SpecificationFiltersProps {
  /** Category code/slug to scope specifications */
  categoryCode?: string;
  /** Subcategory code/slug to scope specifications */
  subCategoryCode?: string;
  /** Base path for filtering */
  basePath?: string;
}

export function SpecificationFilters({
  categoryCode,
  subCategoryCode,
  basePath = '/catalog',
}: SpecificationFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [specifications, setSpecifications] = useState<SpecificationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse current spec filters from URL
  const getSpecFiltersFromUrl = useCallback((): Record<string, string> => {
    const specsParam = searchParams.get('specs');
    if (!specsParam) return {};
    try {
      return JSON.parse(specsParam);
    } catch {
      return {};
    }
  }, [searchParams]);

  const currentSpecs = getSpecFiltersFromUrl();

  // Fetch specifications when category/subcategory changes
  useEffect(() => {
    let cancelled = false;

    async function fetchSpecifications() {
      // Don't fetch if no category is selected
      if (!categoryCode && !subCategoryCode) {
        setSpecifications([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await api.getProductSpecifications({
          categoryCode,
          subCategoryCode,
        });

        if (cancelled) return;

        if (response.success && response.data) {
          // Only show specs with more than one value (useful for filtering)
          const filterableSpecs = response.data.specifications.filter(
            (spec) => spec.valueCount > 1
          );
          setSpecifications(filterableSpecs);
        } else {
          setError('Failed to load filters');
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to fetch specifications:', err);
        setError('Failed to load filters');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchSpecifications();

    return () => {
      cancelled = true;
    };
  }, [categoryCode, subCategoryCode]);

  // Handle spec filter change
  const handleSpecChange = (specKey: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const newSpecs = { ...currentSpecs };

    if (value) {
      newSpecs[specKey] = value;
    } else {
      delete newSpecs[specKey];
    }

    if (Object.keys(newSpecs).length > 0) {
      params.set('specs', JSON.stringify(newSpecs));
    } else {
      params.delete('specs');
    }

    // Reset to page 1 when filters change
    params.delete('page');

    const queryString = params.toString();
    router.push(queryString ? `${basePath}?${queryString}` : basePath);
  };

  // Clear all spec filters
  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('specs');
    params.delete('page');

    const queryString = params.toString();
    router.push(queryString ? `${basePath}?${queryString}` : basePath);
  };

  const activeFilterCount = Object.keys(currentSpecs).length;

  // Don't render if no specifications or no category selected
  if (!categoryCode && !subCategoryCode) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading filters...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500">
        {error}
      </div>
    );
  }

  if (specifications.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Specification dropdowns */}
      {specifications.map((spec) => (
        <div key={spec.key} className="relative">
          <select
            value={currentSpecs[spec.key] || ''}
            onChange={(e) => handleSpecChange(spec.key, e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer min-w-[120px]"
          >
            <option value="">{spec.label}</option>
            {spec.values.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
        </div>
      ))}

      {/* Clear all button (shown when filters are active) */}
      {activeFilterCount > 0 && (
        <button
          onClick={clearAllFilters}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="h-4 w-4" />
          <span>Clear filters ({activeFilterCount})</span>
        </button>
      )}
    </div>
  );
}
