'use client';

import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { QuoteCart } from '@/components/quotes/QuoteCart';

interface HeaderProps {
  onMenuClick: () => void;
  isCollapsed: boolean;
}

export function Header({ onMenuClick, isCollapsed }: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex items-center h-16 bg-white border-b border-slate-200 px-4',
        // Adjust left padding based on sidebar state
        isCollapsed ? 'lg:pl-20' : 'lg:pl-60 xl:pl-64'
      )}
    >
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile logo */}
      <span className="lg:hidden ml-3 font-bold text-lg text-slate-900">
        Nusaf
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Notifications + Quote Cart */}
      <div className="flex items-center gap-1">
        <NotificationBell />
        <QuoteCart />
      </div>
    </header>
  );
}
