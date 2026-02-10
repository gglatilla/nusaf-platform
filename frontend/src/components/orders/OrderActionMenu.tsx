'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  Check,
  Pause,
  Play,
  X,
  Receipt,
  Banknote,
  Boxes,
  ClipboardList,
  Wrench,
  Truck,
  FileOutput,
  RotateCcw,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  disabledReason?: string;
  variant?: 'default' | 'danger' | 'warning';
}

interface ActionGroup {
  label: string;
  items: ActionItem[];
}

interface OrderActionMenuProps {
  // Primary action (the one big button)
  primaryAction: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    loadingLabel?: string;
  } | null;

  // What's next helper text
  nextStepText?: string;

  // Grouped secondary actions
  groups: ActionGroup[];
}

export function OrderActionMenu({ primaryAction, nextStepText, groups }: OrderActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Filter out empty groups
  const visibleGroups = groups.filter((g) => g.items.length > 0);

  return (
    <div className="flex items-center gap-3">
      {/* Next step hint */}
      {nextStepText && (
        <span className="hidden lg:inline text-xs text-slate-500 mr-1">
          Next: {nextStepText}
        </span>
      )}

      {/* Primary action button */}
      {primaryAction && (
        <button
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled || primaryAction.loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {primaryAction.icon}
          {primaryAction.loading ? primaryAction.loadingLabel : primaryAction.label}
        </button>
      )}

      {/* More actions dropdown */}
      {visibleGroups.length > 0 && (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 shadow-sm"
          >
            More Actions
            <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
          </button>

          {isOpen && (
            <div className="absolute right-0 z-30 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 py-1 max-h-[70vh] overflow-y-auto">
              {visibleGroups.map((group, groupIdx) => (
                <div key={group.label}>
                  {groupIdx > 0 && <div className="my-1 border-t border-slate-100" />}
                  <div className="px-3 py-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {group.label}
                    </span>
                  </div>
                  {group.items.map((item) => {
                    const baseClass = cn(
                      'flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors',
                      item.disabled
                        ? 'text-slate-400 cursor-not-allowed'
                        : item.variant === 'danger'
                          ? 'text-red-600 hover:bg-red-50'
                          : item.variant === 'warning'
                            ? 'text-amber-600 hover:bg-amber-50'
                            : 'text-slate-700 hover:bg-slate-50'
                    );

                    if (item.href && !item.disabled) {
                      return (
                        <Link
                          key={item.key}
                          href={item.href}
                          className={baseClass}
                          onClick={() => setIsOpen(false)}
                        >
                          {item.icon}
                          {item.label}
                        </Link>
                      );
                    }

                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          if (!item.disabled && item.onClick) {
                            item.onClick();
                            setIsOpen(false);
                          }
                        }}
                        disabled={item.disabled}
                        title={item.disabledReason}
                        className={baseClass}
                      >
                        {item.icon}
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.disabled && item.disabledReason && (
                          <Lock className="h-3 w-3 text-slate-300" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
