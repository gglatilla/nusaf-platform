'use client';

import { ChevronUp, ChevronDown } from 'lucide-react';
import type { CatalogProduct, StockStatus } from '@/lib/api';

interface ProductTableProps {
  products: CatalogProduct[];
  isLoading: boolean;
  onRowClick: (product: CatalogProduct) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
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

export function ProductTable({ products, isLoading, onRowClick, sortBy, onSortChange }: ProductTableProps) {
  const formatPrice = (price: number | null) => {
    if (!price) return 'Price on Request';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Description</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-600">Price</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-600">Available</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded animate-pulse w-24" /></td>
                <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded animate-pulse w-48" /></td>
                <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded animate-pulse w-20 ml-auto" /></td>
                <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded animate-pulse w-16 ml-auto" /></td>
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
            <SortableHeader label="SKU" field="nusafSku" currentSort={sortBy} onSort={onSortChange} />
            <SortableHeader label="Description" field="description" currentSort={sortBy} onSort={onSortChange} />
            <SortableHeader label="Price" field="price" currentSort={sortBy} onSort={onSortChange} align="right" />
            <SortableHeader label="Available" field="available" currentSort={sortBy} onSort={onSortChange} align="right" />
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const stockSummary = product.stockSummary;
            const status = stockSummary?.status || 'OUT_OF_STOCK';
            const available = stockSummary?.totalAvailable ?? 0;

            return (
              <tr
                key={product.id}
                onClick={() => onRowClick(product)}
                className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <span className="font-mono text-sm text-slate-900">{product.nusafSku}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-700 line-clamp-1">{product.description}</span>
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
