'use client';

import { Package, AlertTriangle, Settings, Clock, FileText } from 'lucide-react';
import type { IssueFlagCategory } from '@/lib/api';

interface IssueFlagCategoryBadgeProps {
  category: IssueFlagCategory;
  showIcon?: boolean;
}

const categoryConfig: Record<IssueFlagCategory, { label: string; className: string }> = {
  STOCK: {
    label: 'Stock',
    className: 'bg-purple-100 text-purple-700',
  },
  QUALITY: {
    label: 'Quality',
    className: 'bg-red-100 text-red-700',
  },
  PRODUCTION: {
    label: 'Production',
    className: 'bg-blue-100 text-blue-700',
  },
  TIMING: {
    label: 'Timing',
    className: 'bg-amber-100 text-amber-700',
  },
  DOCUMENTATION: {
    label: 'Documentation',
    className: 'bg-slate-100 text-slate-700',
  },
};

const IconMap: Record<IssueFlagCategory, React.ComponentType<{ className?: string }>> = {
  STOCK: Package,
  QUALITY: AlertTriangle,
  PRODUCTION: Settings,
  TIMING: Clock,
  DOCUMENTATION: FileText,
};

export function IssueFlagCategoryBadge({ category, showIcon = true }: IssueFlagCategoryBadgeProps) {
  const config = categoryConfig[category] || categoryConfig.STOCK;
  const Icon = IconMap[category];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium ${config.className}`}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </span>
  );
}
