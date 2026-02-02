'use client';

import Link from 'next/link';
import { Package, ChevronRight } from 'lucide-react';

interface CategoryCardProps {
  name: string;
  slug: string;
  description?: string | null;
  productCount: number;
  subCategoryCount?: number;
  href: string;
  size?: 'sm' | 'md' | 'lg';
}

export function CategoryCard({
  name,
  slug,
  description,
  productCount,
  subCategoryCount,
  href,
  size = 'md',
}: CategoryCardProps) {
  return (
    <Link
      href={href}
      className="group block bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-primary-500 hover:shadow-lg transition-all"
    >
      {/* Image placeholder */}
      <div
        className={`bg-slate-100 flex items-center justify-center ${
          size === 'lg' ? 'h-48' : size === 'sm' ? 'h-24' : 'h-32'
        }`}
      >
        <Package className="w-12 h-12 text-slate-300 group-hover:text-primary-400 transition-colors" />
      </div>

      {/* Content */}
      <div className={`${size === 'lg' ? 'p-6' : size === 'sm' ? 'p-3' : 'p-4'}`}>
        <h3
          className={`font-semibold text-slate-900 group-hover:text-primary-600 transition-colors ${
            size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-sm' : 'text-base'
          }`}
        >
          {name}
        </h3>

        {description && size !== 'sm' && (
          <p className="text-slate-500 text-sm mt-1 line-clamp-2">{description}</p>
        )}

        <div className="flex items-center justify-between mt-3">
          <div className="text-xs text-slate-400">
            {subCategoryCount !== undefined && subCategoryCount > 0 ? (
              <span>
                {subCategoryCount} {subCategoryCount === 1 ? 'category' : 'categories'}
              </span>
            ) : (
              <span>
                {productCount} {productCount === 1 ? 'product' : 'products'}
              </span>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
}
