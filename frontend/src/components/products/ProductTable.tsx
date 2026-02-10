'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronUp, ChevronDown, ImageIcon, MoreHorizontal, Edit, Eye, Globe, EyeOff } from 'lucide-react';
import type { CatalogProduct, StockStatus } from '@/lib/api';
import { PublishStatusBadge } from './PublishStatusBadge';
import { usePublishProduct, useUnpublishProduct } from '@/hooks/useProducts';
import { websiteUrls } from '@/lib/urls';

interface ProductTableProps {
  products: CatalogProduct[];
  isLoading: boolean;
  onRowClick: (product: CatalogProduct) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  isAdmin?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

const statusDotColors: Record<StockStatus, string> = {
  IN_STOCK: 'bg-green-500',
  LOW_STOCK: 'bg-amber-500',
  OUT_OF_STOCK: 'bg-slate-400',
  ON_ORDER: 'bg-blue-500',
  OVERSTOCK: 'bg-green-500',
};

interface SortableHeaderProps {
  label: string;
  field: string;
  currentSort: string;
  onSort: (sort: string) => void;
  align?: 'left' | 'right';
}

function SortableHeader({ label, field, currentSort, onSort, align = 'left' }: SortableHeaderProps) {
  const [currentField, currentDir] = currentSort.split(':');
  const isActive = currentField === field;
  const isAsc = currentDir === 'asc';

  const handleClick = () => {
    if (isActive) {
      // Toggle direction
      onSort(`${field}:${isAsc ? 'desc' : 'asc'}`);
    } else {
      // Default to asc for new sort
      onSort(`${field}:asc`);
    }
  };

  return (
    <th
      className={`
        px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 cursor-pointer
        hover:bg-slate-100 select-none
        ${align === 'right' ? 'text-right' : 'text-left'}
      `}
      onClick={handleClick}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        <span>{label}</span>
        <div className="flex flex-col">
          <ChevronUp
            className={`w-3 h-3 -mb-1 ${isActive && isAsc ? 'text-primary-600' : 'text-slate-300'}`}
          />
          <ChevronDown
            className={`w-3 h-3 ${isActive && !isAsc ? 'text-primary-600' : 'text-slate-300'}`}
          />
        </div>
      </div>
    </th>
  );
}

export function ProductTable({
  products,
  isLoading,
  onRowClick,
  sortBy,
  onSortChange,
  isAdmin = false,
  selectedIds = [],
  onSelectionChange,
}: ProductTableProps) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const publishProduct = usePublishProduct();
  const unpublishProduct = useUnpublishProduct();

  const hasSelection = onSelectionChange !== undefined;
  const allSelected = hasSelection && products.length > 0 && products.every(p => selectedIds.includes(p.id));
  const someSelected = hasSelection && selectedIds.length > 0 && !allSelected;

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(products.map(p => p.id));
    }
  };

  const handleSelectOne = (productId: string) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(productId)) {
      onSelectionChange(selectedIds.filter(id => id !== productId));
    } else {
      onSelectionChange([...selectedIds, productId]);
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'Price on Request';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(price);
  };

  const handlePublish = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(null);
    try {
      await publishProduct.mutateAsync(productId);
    } catch (error) {
      console.error('Failed to publish product:', error);
    }
  };

  const handleUnpublish = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(null);
    try {
      await unpublishProduct.mutateAsync(productId);
    } catch (error) {
      console.error('Failed to unpublish product:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {hasSelection && <th className="px-4 py-3 w-10"></th>}
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 w-14"></th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Description</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-600">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-600">Price</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-600">Available</th>
              {isAdmin && <th className="px-4 py-3 w-12"></th>}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-slate-100">
                {hasSelection && <td className="px-4 py-4"><div className="h-4 w-4 bg-slate-200 rounded animate-pulse" /></td>}
                <td className="px-4 py-4"><div className="h-10 w-10 bg-slate-200 rounded animate-pulse" /></td>
                <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded animate-pulse w-24" /></td>
                <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded animate-pulse w-48" /></td>
                <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded animate-pulse w-16 mx-auto" /></td>
                <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded animate-pulse w-20 ml-auto" /></td>
                <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded animate-pulse w-16 ml-auto" /></td>
                {isAdmin && <td className="px-4 py-4"><div className="h-4 w-4 bg-slate-200 rounded animate-pulse ml-auto" /></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <p className="text-slate-500">No products found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {hasSelection && (
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
              </th>
            )}
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 w-14"></th>
            <SortableHeader label="SKU" field="nusafSku" currentSort={sortBy} onSort={onSortChange} />
            <SortableHeader label="Description" field="description" currentSort={sortBy} onSort={onSortChange} />
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">Status</th>
            <SortableHeader label="Price" field="price" currentSort={sortBy} onSort={onSortChange} align="right" />
            <SortableHeader label="Available" field="available" currentSort={sortBy} onSort={onSortChange} align="right" />
            {isAdmin && <th className="px-4 py-3 w-12"></th>}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const stockSummary = product.stockSummary;
            const status = stockSummary?.status || 'OUT_OF_STOCK';
            const available = stockSummary?.totalAvailable ?? 0;

            const thumbnailUrl = product.primaryImage?.thumbnailUrl || product.primaryImage?.url;

            const isSelected = selectedIds.includes(product.id);

            return (
              <tr
                key={product.id}
                onClick={() => onRowClick(product)}
                className={`border-b border-slate-100 last:border-b-0 hover:bg-slate-50 cursor-pointer transition-colors ${
                  isSelected ? 'bg-primary-50' : ''
                }`}
              >
                {hasSelection && (
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectOne(product.id)}
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                )}
                <td className="px-4 py-3">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={product.nusafSku}
                      className="w-10 h-10 object-cover rounded border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded border border-slate-200 bg-slate-50 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-slate-300" />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-sm text-slate-900">{product.nusafSku}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-700 line-clamp-1">{product.description}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <PublishStatusBadge
                    isPublished={product.isPublished ?? false}
                    publishedAt={product.publishedAt}
                    size="sm"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-sm ${product.hasPrice ? 'font-medium text-slate-900' : 'text-slate-500 italic'}`}>
                    {formatPrice(product.price)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className={`w-2 h-2 rounded-full ${statusDotColors[status]}`} />
                    <span className="text-sm text-slate-700">
                      {status === 'OUT_OF_STOCK' ? 'Out' : available}
                    </span>
                  </div>
                </td>
                {isAdmin && (
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="relative inline-block">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(menuOpen === product.id ? null : product.id);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>

                      {menuOpen === product.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setMenuOpen(null)}
                          />
                          <div className="absolute right-0 z-20 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpen(null);
                                onRowClick(product);
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </button>
                            <Link
                              href={`/catalog/${product.nusafSku}/edit`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpen(null);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </Link>
                            {product.isPublished ? (
                              <button
                                onClick={(e) => handleUnpublish(product.id, e)}
                                disabled={unpublishProduct.isPending}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                              >
                                <EyeOff className="h-4 w-4" />
                                Unpublish
                              </button>
                            ) : (
                              <button
                                onClick={(e) => handlePublish(product.id, e)}
                                disabled={publishProduct.isPending}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                              >
                                <Globe className="h-4 w-4" />
                                Publish
                              </button>
                            )}
                            {product.isPublished && (
                              <a
                                href={websiteUrls.productDetail(product.nusafSku)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuOpen(null);
                                }}
                              >
                                <Globe className="h-4 w-4" />
                                View on Website
                              </a>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
