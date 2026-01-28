'use client';

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
import type { CatalogProduct } from '@/lib/api';

interface ProductDetailModalProps {
  product: CatalogProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetailModal({
  product,
  open,
  onOpenChange,
}: ProductDetailModalProps) {
  if (!product) return null;

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
    // TODO: Implement in TASK-011
    alert('Coming soon: Add to Quote functionality');
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

            {/* Supplier SKU */}
            <div className="space-y-1">
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Supplier SKU
              </dt>
              <dd className="text-sm text-slate-600">{product.supplierSku}</dd>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Description
              </dt>
              <dd className="text-sm text-slate-900">{product.description}</dd>
            </div>

            {/* Supplier */}
            <div className="space-y-1">
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Supplier
              </dt>
              <dd>
                <span className={supplierBadgeClass}>{product.supplier.name}</span>
              </dd>
            </div>

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
                  {product.unitOfMeasure}
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
          <button
            type="button"
            onClick={handleAddToQuote}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
          >
            Add to Quote
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
