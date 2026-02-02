'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronDown, Package } from 'lucide-react';
import { api, PublicCategory } from '@/lib/api';

export function MegaMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await api.getPublicCategories();
        if (response.success && response.data) {
          setCategories(response.data.categories);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCategories();
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={menuRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger */}
      <button
        className="flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-primary-600 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        Products
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 top-full pt-2 transition-all duration-200 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        style={{ width: 'max(80vw, 900px)', maxWidth: '1200px' }}
      >
        <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Browse Products</h3>
              <p className="text-sm text-slate-500">
                Explore our complete range of industrial components
              </p>
            </div>
            <Link
              href="/browse"
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
              onClick={() => setIsOpen(false)}
            >
              View All Categories
            </Link>
          </div>

          {/* Categories Grid */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No categories available
              </div>
            ) : (
              <div className="grid grid-cols-3 lg:grid-cols-4 gap-6">
                {categories.slice(0, 8).map((category) => (
                  <div key={category.id}>
                    <Link
                      href={`/browse/${category.slug}`}
                      className="flex items-center gap-2 font-medium text-slate-900 hover:text-primary-600 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <Package className="w-4 h-4 text-slate-400" />
                      {category.name}
                    </Link>
                    {category.subCategories.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {category.subCategories.slice(0, 5).map((sub) => (
                          <li key={sub.id}>
                            <Link
                              href={`/browse/${category.slug}/${sub.slug}`}
                              className="text-sm text-slate-500 hover:text-primary-600 transition-colors"
                              onClick={() => setIsOpen(false)}
                            >
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                        {category.subCategories.length > 5 && (
                          <li>
                            <Link
                              href={`/browse/${category.slug}`}
                              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                              onClick={() => setIsOpen(false)}
                            >
                              +{category.subCategories.length - 5} more
                            </Link>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Show more link if more than 8 categories */}
            {categories.length > 8 && (
              <div className="mt-6 pt-4 border-t border-slate-200 text-center">
                <Link
                  href="/browse"
                  className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
                  onClick={() => setIsOpen(false)}
                >
                  View all {categories.length} categories
                </Link>
              </div>
            )}
          </div>

          {/* Footer with quick links */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <Link
              href="/catalog"
              className="text-sm text-slate-600 hover:text-primary-600"
              onClick={() => setIsOpen(false)}
            >
              Search by SKU or Part Number
            </Link>
            <span className="text-sm text-slate-400">
              {categories.reduce((sum, cat) => sum + cat.productCount, 0).toLocaleString()} products
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
