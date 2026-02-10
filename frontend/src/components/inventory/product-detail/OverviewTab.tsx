'use client';

import Link from 'next/link';
import { Package, ExternalLink } from 'lucide-react';
import { getUomLabel } from '@/lib/constants/unit-of-measure';
import { websiteUrls } from '@/lib/urls';
import type { ProductWithInventory } from '@/lib/api/types/products';

interface OverviewTabProps {
  product: ProductWithInventory;
  canEdit: boolean;
}

export function OverviewTab({ product, canEdit }: OverviewTabProps) {
  const typeLabel = product.productType === 'ASSEMBLY_REQUIRED' ? 'Assembly Required'
    : product.productType === 'MADE_TO_ORDER' ? 'Made to Order'
    : product.productType === 'KIT' ? 'Kit'
    : 'Stock Only';

  const dimensions = product.dimensionsJson;
  const hasDimensions = dimensions && (dimensions.length || dimensions.width || dimensions.height);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Product Information */}
        <section className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Product Information</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-xs text-slate-500">Nusaf SKU</dt>
              <dd className="text-sm font-mono text-slate-900">{product.nusafSku}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Supplier SKU</dt>
              <dd className="text-sm font-mono text-slate-900">{product.supplierSku || '—'}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-xs text-slate-500">Description</dt>
              <dd className="text-sm text-slate-900">{product.description || '—'}</dd>
            </div>
            {product.longDescription && (
              <div className="md:col-span-2">
                <dt className="text-xs text-slate-500">Long Description</dt>
                <dd className="text-sm text-slate-700 whitespace-pre-wrap">{product.longDescription}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-slate-500">Unit of Measure</dt>
              <dd className="text-sm text-slate-900">{getUomLabel(product.unitOfMeasure)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Item Type</dt>
              <dd className="text-sm text-slate-900">
                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                  product.productType === 'STOCK_ONLY' ? 'bg-green-100 text-green-800' :
                  product.productType === 'ASSEMBLY_REQUIRED' ? 'bg-amber-100 text-amber-800' :
                  product.productType === 'MADE_TO_ORDER' ? 'bg-blue-100 text-blue-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {typeLabel}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Weight</dt>
              <dd className="text-sm text-slate-900">{product.weight ? `${product.weight} kg` : '—'}</dd>
            </div>
            {hasDimensions && (
              <div>
                <dt className="text-xs text-slate-500">Dimensions</dt>
                <dd className="text-sm text-slate-900">
                  {[dimensions.length, dimensions.width, dimensions.height].filter(Boolean).join(' x ')}
                  {dimensions.unit && ` ${dimensions.unit}`}
                </dd>
              </div>
            )}
            {product.isConfigurable && (
              <div>
                <dt className="text-xs text-slate-500">Configurable</dt>
                <dd className="text-sm text-slate-900">Yes</dd>
              </div>
            )}
            {product.assemblyLeadDays && (
              <div>
                <dt className="text-xs text-slate-500">Assembly Lead Time</dt>
                <dd className="text-sm text-slate-900">{product.assemblyLeadDays} days</dd>
              </div>
            )}
          </dl>
        </section>

        {/* Supplier */}
        <section className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Supplier</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-xs text-slate-500">Supplier</dt>
              <dd className="text-sm text-slate-900">{product.supplier?.name || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Lead Time</dt>
              <dd className="text-sm text-slate-900">{product.leadTimeDays ? `${product.leadTimeDays} days` : '—'}</dd>
            </div>
          </dl>
        </section>

        {/* Category */}
        <section className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Classification</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-xs text-slate-500">Category</dt>
              <dd className="text-sm text-slate-900">
                {product.category?.name ? (
                  <Link
                    href={`/catalog?categoryId=${product.category.id}`}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    {product.category.name}
                  </Link>
                ) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Subcategory</dt>
              <dd className="text-sm text-slate-900">
                {product.subCategory?.name ? (
                  <Link
                    href={`/catalog?categoryId=${product.category.id}&subCategoryId=${product.subCategory.id}`}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    {product.subCategory.name}
                  </Link>
                ) : '—'}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Product Image */}
        <section className="bg-white rounded-lg border border-slate-200 p-6">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.description}
              className="w-full rounded-lg object-contain bg-slate-50"
            />
          ) : (
            <div className="w-full aspect-square rounded-lg bg-slate-50 flex items-center justify-center">
              <Package className="h-16 w-16 text-slate-300" />
            </div>
          )}
        </section>

        {/* Stock Settings */}
        <section className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Stock Settings</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Reorder Point</span>
              <span className="text-sm font-medium text-slate-900">{product.defaultReorderPoint ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Reorder Qty</span>
              <span className="text-sm font-medium text-slate-900">{product.defaultReorderQty ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Min Stock</span>
              <span className="text-sm font-medium text-slate-900">{product.defaultMinStock ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Max Stock</span>
              <span className="text-sm font-medium text-slate-900">{product.defaultMaxStock ?? '—'}</span>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Links</h3>
          <div className="space-y-2">
            {canEdit && (
              <Link
                href={`/inventory/items/${product.nusafSku}/edit`}
                className="block text-sm text-primary-600 hover:text-primary-700"
              >
                Edit Item Details
              </Link>
            )}
            {product.productType === 'STOCK_ONLY' && (
              <Link
                href={`/catalog/${product.nusafSku}/edit`}
                className="block text-sm text-primary-600 hover:text-primary-700"
              >
                Edit Marketing Content
              </Link>
            )}
            {product.isActive && (
              <a
                href={websiteUrls.productDetail(product.nusafSku)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
              >
                View on Website
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
