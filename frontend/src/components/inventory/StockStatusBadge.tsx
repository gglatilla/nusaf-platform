'use client';

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'ON_ORDER' | 'OVERSTOCK';

interface StockStatusBadgeProps {
  status: StockStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<StockStatus, { label: string; className: string }> = {
  IN_STOCK: {
    label: 'In Stock',
    className: 'bg-green-100 text-green-700',
  },
  LOW_STOCK: {
    label: 'Low Stock',
    className: 'bg-amber-100 text-amber-700',
  },
  OUT_OF_STOCK: {
    label: 'Out of Stock',
    className: 'bg-red-100 text-red-700',
  },
  ON_ORDER: {
    label: 'On Order',
    className: 'bg-blue-100 text-blue-700',
  },
  OVERSTOCK: {
    label: 'Overstock',
    className: 'bg-orange-100 text-orange-700',
  },
};

export function StockStatusBadge({ status, size = 'md' }: StockStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.OUT_OF_STOCK;

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center rounded font-medium ${sizeClasses} ${config.className}`}
    >
      {config.label}
    </span>
  );
}
