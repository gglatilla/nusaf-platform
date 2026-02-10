'use client';

import Link from 'next/link';
import { ArrowLeft, Edit, ExternalLink } from 'lucide-react';
import { StockStatusBadge } from '@/components/inventory/StockStatusBadge';
import { cn } from '@/lib/utils';
import { websiteUrls } from '@/lib/urls';
import type { ProductWithInventory } from '@/lib/api/types/products';

interface ProductDetailHeaderProps {
  product: ProductWithInventory;
  canEdit: boolean;
}

export function ProductDetailHeader({ product, canEdit }: ProductDetailHeaderProps) {
  const typeLabel = product.productType === 'ASSEMBLY_REQUIRED' ? 'Assembly Required'
    : product.productType === 'MADE_TO_ORDER' ? 'Made to Order'
    : product.productType === 'KIT' ? 'Kit'
    : 'Stock Only';

  const typeBadgeClass = cn(
    'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full',
    product.productType === 'STOCK_ONLY' && 'bg-green-100 text-green-800',
    product.productType === 'ASSEMBLY_REQUIRED' && 'bg-amber-100 text-amber-800',
    product.productType === 'MADE_TO_ORDER' && 'bg-blue-100 text-blue-800',
    product.productType === 'KIT' && 'bg-purple-100 text-purple-800',
  );

  const supplierBadgeClass = product.supplier ? cn(
    'inline-flex px-2 py-0.5 text-xs font-medium rounded',
    product.supplier.code === 'TECOM' && 'bg-blue-100 text-blue-700',
    product.supplier.code === 'CHIARAVALLI' && 'bg-green-100 text-green-700',
    product.supplier.code === 'REGINA' && 'bg-purple-100 text-purple-700',
    product.supplier.code === 'NUSAF' && 'bg-orange-100 text-orange-700',
    !['TECOM', 'CHIARAVALLI', 'REGINA', 'NUSAF'].includes(product.supplier.code) &&
      'bg-slate-100 text-slate-700'
  ) : '';

  return (
    <div className="space-y-4">
      {/* Back link */}
      <Link
        href="/inventory/items"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Items
      </Link>

      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-slate-900 font-mono">{product.nusafSku}</h1>
            {product.inventory?.stockStatus && (
              <StockStatusBadge status={product.inventory.stockStatus} />
            )}
            <span className={typeBadgeClass}>{typeLabel}</span>
            {product.supplier && (
              <span className={supplierBadgeClass}>{product.supplier.name}</span>
            )}
          </div>
          <p className="text-sm text-slate-600 max-w-2xl">{product.description}</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {product.isActive && (
            <a
              href={websiteUrls.productDetail(product.nusafSku)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              <ExternalLink className="h-4 w-4" />
              Website
            </a>
          )}
          {product.productType === 'STOCK_ONLY' && (
            <Link
              href={`/catalog/${product.nusafSku}/edit`}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Marketing
            </Link>
          )}
          {canEdit && (
            <Link
              href={`/inventory/items/${product.nusafSku}/edit`}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
            >
              <Edit className="h-4 w-4" />
              Edit Item
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
