'use client';

import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogCloseButton,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { StockStatusBadge } from '@/components/inventory';
import { useProductWithInventory } from '@/hooks/useProductInventory';
import type { CatalogProduct } from '@/lib/api';
import { getUomLabel } from '@/lib/constants/unit-of-measure';

interface ProductDetailModalProps {
  product: CatalogProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showStockQuantity?: boolean; // Internal users see numbers, customers see badges only
  hideSupplier?: boolean; // Hide supplier info for customer views (Golden Rule 4)
  detailLinkPrefix?: string; // Override detail link prefix (default: '/catalog')
  onAddToQuote?: (product: CatalogProduct) => void; // Callback to open AddToQuote at parent level
}

export function ProductDetailModal({
  product,
  open,
  onOpenChange,
  showStockQuantity = true,
  hideSupplier = false,
  detailLinkPrefix = '/catalog',
  onAddToQuote,
}: ProductDetailModalProps) {

  // Fetch inventory data when modal is open
  const { data: productWithInventory, isLoading: isLoadingInventory } = useProductWithInventory(
    product?.id ?? null,
    { enabled: open && !!product }
  );

  if (!product) return null;

  const inventory = productWithInventory?.inventory;

  const formattedPrice = product.price
    ? new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
      }).format(product.price)
    : null;

  const supplierBadgeClass = cn(
    'inline-flex px-2 py-1 text-xs font-medium rounded',
    product.supplier.code === 'TECOM' && 'bg-blue-100 text-blue-700',
    product.supplier.code === 'CHIARAVALLI' && 'bg-green-100 text-green-700',
    product.supplier.code === 'REGINA' && 'bg-purple-100 text-purple-700',
    product.supplier.code === 'NUSAF' && 'bg-orange-100 text-orange-700',
    !['TECOM', 'CHIARAVALLI', 'REGINA', 'NUSAF'].includes(product.supplier.code) &&
      'bg-slate-100 text-slate-700'
  );

  const handleAddToQuote = () => {
    if (onAddToQuote && product) {
      onOpenChange(false); // Close detail modal first
      onAddToQuote(product); // Notify parent to open AddToQuote
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Product Details</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>

        <DialogBody>
          <div className="space-y-4">
            {/* SKU Section */}
            <div className="space-y-1">
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Nusaf SKU
              </dt>
              <dd className="font-mono text-sm text-slate-900">
                {product.nusafSku}
              </dd>
            </div>

            {/* Supplier SKU — hidden for customer views (Golden Rule 4) */}
            {!hideSupplier && (
              <div className="space-y-1">
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Supplier SKU
                </dt>
                <dd className="text-sm text-slate-600">{product.supplierSku}</dd>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1">
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Description
              </dt>
              <dd className="text-sm text-slate-900">{product.description}</dd>
            </div>

            {/* Supplier — hidden for customer views (Golden Rule 4) */}
            {!hideSupplier && (
              <div className="space-y-1">
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Supplier
                </dt>
                <dd>
                  <span className={supplierBadgeClass}>{product.supplier.name}</span>
                </dd>
              </div>
            )}

            {/* Category */}
            <div className="space-y-1">
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Category
              </dt>
              <dd className="text-sm text-slate-600">
                {product.category.name}
                {product.subCategory && (
                  <>
                    <span className="mx-1.5 text-slate-400">/</span>
                    {product.subCategory.name}
                  </>
                )}
              </dd>
            </div>

            {/* Unit of Measure */}
            <div className="space-y-1">
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Unit of Measure
              </dt>
              <dd>
                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-700">
                  {getUomLabel(product.unitOfMeasure)}
                </span>
              </dd>
            </div>

            {/* Price */}
            <div className="space-y-1 pt-2 border-t border-slate-200">
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Price
              </dt>
              <dd>
                {product.hasPrice ? (
                  <div>
                    <span className="text-xl font-bold text-slate-900">
                      {formattedPrice}
                    </span>
                    <span className="ml-2 text-sm text-slate-500">
                      {product.priceLabel}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-500 italic">
                    Price on Request
                  </span>
                )}
              </dd>
            </div>

            {/* Stock Summary */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Stock Availability
              </dt>
              <dd>
                {isLoadingInventory ? (
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-16 bg-slate-200 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {inventory ? (
                        <>
                          <StockStatusBadge status={inventory.stockStatus} />
                          {showStockQuantity && (
                            <span className="text-sm text-slate-600">
                              {inventory.available} available
                            </span>
                          )}
                        </>
                      ) : product.stockSummary ? (
                        <>
                          <StockStatusBadge status={product.stockSummary.status} />
                          {showStockQuantity && (
                            <span className="text-sm text-slate-600">
                              {product.stockSummary.totalAvailable} available
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-slate-500 italic">
                          Stock info unavailable
                        </span>
                      )}
                    </div>
                    <Link
                      href={`${detailLinkPrefix}/${product.nusafSku}`}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      onClick={() => onOpenChange(false)}
                    >
                      View Full Details
                    </Link>
                  </div>
                )}
              </dd>
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
          >
            Close
          </button>
          {onAddToQuote && (
            <button
              type="button"
              onClick={handleAddToQuote}
              disabled={!product.hasPrice}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add to Quote
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
