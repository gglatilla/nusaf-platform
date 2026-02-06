'use client';

import { ProductBomTab } from '@/components/products/ProductBomTab';

interface BomTabProps {
  productId: string;
  productSku: string;
  canEdit: boolean;
}

export function BomTab({ productId, productSku, canEdit }: BomTabProps) {
  return (
    <ProductBomTab
      productId={productId}
      productSku={productSku}
      canEdit={canEdit}
    />
  );
}
