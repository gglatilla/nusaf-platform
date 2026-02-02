'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, ChevronDown, Package } from 'lucide-react';
import { api, PublicCategory } from '@/lib/api';

interface NavigationItem {
  name: string;
  href: string;
}

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  navigation: NavigationItem[];
}

export function MobileNavDrawer({ isOpen, onClose, navigation }: MobileNavDrawerProps) {
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Fetch categories when drawer opens
  useEffect(() => {
    if (isOpen && categories.length === 0) {
      const fetchCategories = async () => {
        try {
          const response = await api.getPublicCategories();
          if (response.success && response.data) {
            setCategories(response.data.categories);
          }
        } catch (error) {
          console.error('Failed to fetch categories:', error);
        }
      };
      fetchCategories();
    }
  }, [isOpen, categories.length]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Reset state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setIsProductsOpen(false);
      setExpandedCategory(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-slate-200">
            <span className="text-xl font-bold text-slate-900">Nusaf</span>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <ul className="space-y-1">
              {/* Products with expandable categories */}
              <li>
                <button
                  onClick={() => setIsProductsOpen(!isProductsOpen)}
                  className="flex items-center justify-between w-full px-4 py-3 text-base font-medium text-slate-700 hover:text-primary-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Products
                  <ChevronDown
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isProductsOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Categories accordion */}
                {isProductsOpen && (
                  <div className="mt-1 ml-4 space-y-1">
                    {/* View All Products link */}
                    <Link
                      href="/products"
                      onClick={onClose}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-slate-50 rounded-lg"
                    >
                      <Package className="w-4 h-4" />
                      Browse All Categories
                    </Link>

                    {/* Category list */}
                    {categories.map((category) => (
                      <div key={category.id}>
                        {category.subCategories.length > 0 ? (
                          <>
                            <button
                              onClick={() =>
                                setExpandedCategory(
                                  expandedCategory === category.id ? null : category.id
                                )
                              }
                              className="flex items-center justify-between w-full px-4 py-2 text-sm text-slate-600 hover:text-primary-600 hover:bg-slate-50 rounded-lg"
                            >
                              {category.name}
                              <ChevronDown
                                className={`w-4 h-4 transition-transform duration-200 ${
                                  expandedCategory === category.id ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                            {expandedCategory === category.id && (
                              <div className="ml-4 mt-1 space-y-1">
                                <Link
                                  href={`/products/${category.slug}`}
                                  onClick={onClose}
                                  className="block px-4 py-1.5 text-xs text-primary-600 hover:bg-slate-50 rounded"
                                >
                                  View all {category.name}
                                </Link>
                                {category.subCategories.map((sub) => (
                                  <Link
                                    key={sub.id}
                                    href={`/products/${category.slug}/${sub.slug}`}
                                    onClick={onClose}
                                    className="block px-4 py-1.5 text-xs text-slate-500 hover:text-primary-600 hover:bg-slate-50 rounded"
                                  >
                                    {sub.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <Link
                            href={`/products/${category.slug}`}
                            onClick={onClose}
                            className="block px-4 py-2 text-sm text-slate-600 hover:text-primary-600 hover:bg-slate-50 rounded-lg"
                          >
                            {category.name}
                          </Link>
                        )}
                      </div>
                    ))}

                    {/* Search link */}
                    <Link
                      href="/catalog"
                      onClick={onClose}
                      className="block px-4 py-2 text-sm text-slate-500 hover:text-primary-600 hover:bg-slate-50 rounded-lg"
                    >
                      Search by SKU
                    </Link>
                  </div>
                )}
              </li>

              {/* Other navigation items */}
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="block px-4 py-3 text-base font-medium text-slate-700 hover:text-primary-600 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="px-4 py-6 border-t border-slate-200 space-y-4">
            <Link
              href="https://app.nusaf.net/login"
              onClick={onClose}
              className="block w-full px-4 py-3 bg-primary-600 text-white text-center font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Customer Portal
            </Link>
            <div className="text-center">
              <p className="text-sm text-slate-500">Need help?</p>
              <a
                href="tel:+27000000000"
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                +27 (0) 00 000 0000
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
