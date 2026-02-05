'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Package } from 'lucide-react';
import { PublicProduct } from '@/lib/api';
import { AddToQuoteButton } from './AddToQuoteButton';

interface ProductCardProps {
  product: PublicProduct;
  /** Badge to show when matched via cross-reference */
  matchedVia?: string;
}

export function ProductCard({ product, matchedVia }: ProductCardProps) {
  const imageUrl = product.primaryImage?.url;

  return (
    <div className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-primary-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
      {/* Image */}
      <Link href={`/products/p/${product.sku}`} className="block relative aspect-square bg-slate-50">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="h-16 w-16 text-slate-300" />
          </div>
        )}

        {/* Category badge */}
        {product.category && (
          <span className="absolute top-2 left-2 px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded">
            {product.category.name}
          </span>
        )}

        {/* Cross-reference match badge */}
        {matchedVia && (
          <span className="absolute top-2 right-2 px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded">
            Matched: {matchedVia}
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link href={`/products/p/${product.sku}`} className="block">
          <p className="text-xs text-slate-500 mb-1">{product.sku}</p>
          <h3 className="text-sm font-medium text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-2 min-h-[2.5rem]">
            {product.title}
          </h3>
        </Link>

        {/* Add to quote */}
        <div className="mt-3">
          <AddToQuoteButton
            productId={product.id}
            sku={product.sku}
            description={product.title}
            compact
          />
        </div>
      </div>
    </div>
  );
}
