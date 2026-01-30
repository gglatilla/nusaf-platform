'use client';

import { Wrench, Layers } from 'lucide-react';
import type { JobType } from '@/lib/api';

interface JobTypeBadgeProps {
  jobType: JobType;
}

const typeConfig: Record<JobType, { label: string; className: string; Icon: typeof Wrench }> = {
  MACHINING: {
    label: 'Machining',
    className: 'bg-purple-100 text-purple-700',
    Icon: Wrench,
  },
  ASSEMBLY: {
    label: 'Assembly',
    className: 'bg-indigo-100 text-indigo-700',
    Icon: Layers,
  },
};

export function JobTypeBadge({ jobType }: JobTypeBadgeProps) {
  const config = typeConfig[jobType] || typeConfig.MACHINING;
  const { Icon } = config;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium ${config.className}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
