'use client';

import type { StockStatus } from '@/lib/api';

interface StockIndicatorProps {
  available: number;
  status: StockStatus;
  showQuantity?: boolean;
}

const statusConfig: Record<StockStatus, { label: string; dotClass: string; textClass: string }> = {
  IN_STOCK: {
    label: 'available',
    dotClass: 'bg-green-500',
    textClass: 'text-green-700',
  },
  LOW_STOCK: {
    label: 'Low stock',
    dotClass: 'bg-amber-500',
    textClass: 'text-amber-700',
  },
  OUT_OF_STOCK: {
    label: 'Out of stock',
    dotClass: 'bg-slate-400',
    textClass: 'text-slate-500',
  },
  ON_ORDER: {
    label: 'On order',
    dotClass: 'bg-blue-500',
    textClass: 'text-blue-700',
  },
  OVERSTOCK: {
    label: 'available',
    dotClass: 'bg-green-500',
    textClass: 'text-green-700',
  },
};

export function StockIndicator({ available, status, showQuantity = true }: StockIndicatorProps) {
  const config = statusConfig[status] || statusConfig.OUT_OF_STOCK;

  // Determine display text
  let displayText: string;
  if (status === 'OUT_OF_STOCK') {
    displayText = config.label;
  } else if (status === 'LOW_STOCK' && !showQuantity) {
    displayText = config.label;
  } else if (status === 'ON_ORDER' && available === 0) {
    displayText = config.label;
  } else if (showQuantity && available > 0) {
    displayText = `${available} ${config.label}`;
  } else {
    displayText = config.label;
  }

  return (
    <div className={`flex items-center gap-1.5 text-sm ${config.textClass}`}>
      <span className={`w-2 h-2 rounded-full ${config.dotClass}`} />
      <span>{displayText}</span>
    </div>
  );
}
