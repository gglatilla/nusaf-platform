'use client';

import { AlertTriangle, AlertCircle, Info, Clock } from 'lucide-react';
import type { IssueFlagSeverity } from '@/lib/api';

interface IssueFlagSeverityBadgeProps {
  severity: IssueFlagSeverity;
  showIcon?: boolean;
  isOverdue?: boolean;
}

const severityConfig: Record<IssueFlagSeverity, { label: string; className: string; slaLabel: string }> = {
  CRITICAL: {
    label: 'Critical',
    className: 'bg-red-100 text-red-700 border-red-200',
    slaLabel: '4h SLA',
  },
  HIGH: {
    label: 'High',
    className: 'bg-orange-100 text-orange-700 border-orange-200',
    slaLabel: '24h SLA',
  },
  MEDIUM: {
    label: 'Medium',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
    slaLabel: '72h SLA',
  },
  LOW: {
    label: 'Low',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    slaLabel: '1w SLA',
  },
};

const IconMap: Record<IssueFlagSeverity, React.ComponentType<{ className?: string }>> = {
  CRITICAL: AlertTriangle,
  HIGH: AlertCircle,
  MEDIUM: Info,
  LOW: Clock,
};

export function IssueFlagSeverityBadge({ severity, showIcon = true, isOverdue }: IssueFlagSeverityBadgeProps) {
  const config = severityConfig[severity] || severityConfig.MEDIUM;
  const Icon = IconMap[severity];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium border ${config.className} ${isOverdue ? 'ring-2 ring-red-500 ring-offset-1' : ''}`}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
      {isOverdue && <span className="text-red-600 font-semibold ml-1">OVERDUE</span>}
    </span>
  );
}

export function IssueFlagSeveritySLA({ severity }: { severity: IssueFlagSeverity }) {
  const config = severityConfig[severity];
  return (
    <span className="text-xs text-slate-500">
      {config.slaLabel}
    </span>
  );
}
