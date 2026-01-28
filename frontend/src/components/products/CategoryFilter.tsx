'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CatalogCategory } from '@/lib/api';

interface CategoryFilterProps {
  categories: CatalogCategory[];
  selectedCategoryId: string | null;
  selectedSubCategoryId: string | null;
  onCategoryChange: (categoryId: string | null, subCategoryId: string | null) => void;
  isLoading?: boolean;
}

export function CategoryFilter({
  categories,
  selectedCategoryId,
  selectedSubCategoryId,
  onCategoryChange,
  isLoading,
}: CategoryFilterProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleCategoryClick = (categoryId: string) => {
    if (selectedCategoryId === categoryId && !selectedSubCategoryId) {
      // Clicking same category again clears it
      onCategoryChange(null, null);
    } else {
      onCategoryChange(categoryId, null);
      // Auto-expand when selecting
      setExpandedCategories((prev) => new Set(prev).add(categoryId));
    }
  };

  const handleSubCategoryClick = (categoryId: string, subCategoryId: string) => {
    if (selectedSubCategoryId === subCategoryId) {
      // Clicking same subcategory clears it, keeps category
      onCategoryChange(categoryId, null);
    } else {
      onCategoryChange(categoryId, subCategoryId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 bg-slate-200 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  const totalProducts = categories.reduce((sum, cat) => sum + cat.productCount, 0);

  return (
    <div className="space-y-1">
      {/* All products option */}
      <button
        onClick={() => onCategoryChange(null, null)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors',
          !selectedCategoryId
            ? 'bg-primary-50 text-primary-700 font-medium'
            : 'text-slate-700 hover:bg-slate-100'
        )}
      >
        <span>All Products</span>
        <span className="text-xs text-slate-500">{totalProducts}</span>
      </button>

      {/* Categories */}
      {categories.map((category) => {
        const isSelected = selectedCategoryId === category.id;
        const isExpanded = expandedCategories.has(category.id) || isSelected;
        const hasSubCategories = category.subCategories.length > 0;

        return (
          <div key={category.id}>
            <div className="flex items-center">
              {/* Expand/collapse button */}
              {hasSubCategories && (
                <button
                  onClick={() => toggleExpanded(category.id)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}

              {/* Category button */}
              <button
                onClick={() => handleCategoryClick(category.id)}
                className={cn(
                  'flex-1 flex items-center justify-between px-2 py-2 rounded-md text-sm transition-colors',
                  !hasSubCategories && 'ml-5',
                  isSelected && !selectedSubCategoryId
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-slate-700 hover:bg-slate-100'
                )}
              >
                <span className="truncate">{category.name}</span>
                <span className="text-xs text-slate-500 ml-2">{category.productCount}</span>
              </button>
            </div>

            {/* Subcategories */}
            {hasSubCategories && isExpanded && (
              <div className="ml-6 mt-1 space-y-1">
                {category.subCategories.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => handleSubCategoryClick(category.id, sub.id)}
                    className={cn(
                      'w-full flex items-center px-3 py-1.5 rounded-md text-sm transition-colors',
                      selectedSubCategoryId === sub.id
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    <span className="truncate">{sub.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
