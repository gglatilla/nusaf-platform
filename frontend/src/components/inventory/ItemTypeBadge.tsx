'use client';

import { cn } from '@/lib/utils';

interface ItemTypeBadgeProps {
  productType: string;
  className?: string;
}

const TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  STOCK_ONLY: {
    label: 'Stock Only',
    className: 'bg-green-100 text-green-800',
  },
  ASSEMBLY_REQUIRED: {
    label: 'Assembly Required',
    className: 'bg-amber-100 text-amber-800',
  },
  MADE_TO_ORDER: {
    label: 'Made to Order',
    className: 'bg-blue-100 text-blue-800',
  },
  KIT: {
    label: 'Kit',
    className: 'bg-purple-100 text-purple-800',
  },
};

export function ItemTypeBadge({ productType, className }: ItemTypeBadgeProps) {
  const config = TYPE_CONFIG[productType] || TYPE_CONFIG.STOCK_ONLY;

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
