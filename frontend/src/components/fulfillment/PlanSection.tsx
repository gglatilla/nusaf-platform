'use client';

import { ChevronDown, ChevronRight, type LucideIcon } from 'lucide-react';

interface PlanSectionProps {
  title: string;
  count: number;
  icon: LucideIcon;
  iconColor?: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  emptyMessage?: string;
}

export function PlanSection({
  title,
  count,
  icon: Icon,
  iconColor = 'text-slate-500',
  expanded,
  onToggle,
  children,
  emptyMessage = 'None',
}: PlanSectionProps) {
  const isEmpty = count === 0;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className={`
          w-full flex items-center justify-between px-4 py-3
          text-left transition-colors
          ${isEmpty ? 'bg-slate-50 text-slate-400' : 'bg-white hover:bg-slate-50'}
        `}
        disabled={isEmpty}
      >
        <div className="flex items-center gap-3">
          <Icon className={`h-5 w-5 ${isEmpty ? 'text-slate-300' : iconColor}`} />
          <span className={`font-medium ${isEmpty ? 'text-slate-400' : 'text-slate-900'}`}>
            {title}
          </span>
          <span className={`
            inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium
            ${isEmpty
              ? 'bg-slate-200 text-slate-500'
              : 'bg-primary-100 text-primary-700'
            }
          `}>
            {count}
          </span>
        </div>
        {!isEmpty && (
          expanded
            ? <ChevronDown className="h-5 w-5 text-slate-400" />
            : <ChevronRight className="h-5 w-5 text-slate-400" />
        )}
      </button>

      {isEmpty && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
          <p className="text-sm text-slate-400 italic">{emptyMessage}</p>
        </div>
      )}

      {!isEmpty && expanded && (
        <div className="border-t border-slate-200 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}
