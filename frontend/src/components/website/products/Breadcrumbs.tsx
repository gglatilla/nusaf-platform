'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Home, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export type BreadcrumbItemInput = BreadcrumbItem;

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  /** Number of items to show before collapsing on mobile. Default: 2 (first + last) */
  mobileVisibleCount?: number;
}

// Threshold for when to start collapsing on mobile
const COLLAPSE_THRESHOLD = 3;

export function Breadcrumbs({ items, mobileVisibleCount = 2 }: BreadcrumbsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }
    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded]);

  // Determine if we should collapse on mobile
  // Always show: Home, first item, last item
  // Collapse: middle items
  const shouldCollapse = items.length > COLLAPSE_THRESHOLD;
  const middleItems = shouldCollapse ? items.slice(1, -1) : [];

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      {/* Desktop: show all items */}
      <ol className="hidden sm:flex items-center flex-wrap gap-1 text-sm">
        <BreadcrumbHome />
        {items.map((item, index) => (
          <BreadcrumbListItem
            key={index}
            item={item}
            isLast={index === items.length - 1}
          />
        ))}
      </ol>

      {/* Mobile: collapsible for deep hierarchies */}
      <ol className="flex sm:hidden items-center gap-1 text-sm">
        <BreadcrumbHome />

        {shouldCollapse ? (
          <>
            {/* First item (e.g., "Products") */}
            <BreadcrumbListItem item={items[0]} isLast={false} truncateWidth="max-w-[100px]" />

            {/* Collapsed middle items */}
            <li className="relative flex items-center" ref={dropdownRef}>
              <ChevronRight className="h-4 w-4 text-slate-400 mx-1 flex-shrink-0" />
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded transition-colors"
                aria-label={`Show ${middleItems.length} more navigation levels`}
                aria-expanded={isExpanded}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              {/* Dropdown menu */}
              {isExpanded && (
                <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[200px]">
                  {middleItems.map((item, index) => (
                    <div key={index}>
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-600"
                          onClick={() => setIsExpanded(false)}
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <span className="block px-4 py-2 text-sm text-slate-500">
                          {item.label}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </li>

            {/* Last item (current page) */}
            <BreadcrumbListItem
              item={items[items.length - 1]}
              isLast={true}
              truncateWidth="max-w-[150px]"
            />
          </>
        ) : (
          // Not enough items to collapse - show all
          items.map((item, index) => (
            <BreadcrumbListItem
              key={index}
              item={item}
              isLast={index === items.length - 1}
              truncateWidth="max-w-[120px]"
            />
          ))
        )}
      </ol>
    </nav>
  );
}

function BreadcrumbHome() {
  return (
    <li className="flex items-center">
      <Link
        href="/"
        className="text-slate-500 hover:text-primary-600 transition-colors"
        aria-label="Home"
      >
        <Home className="h-4 w-4" />
      </Link>
    </li>
  );
}

interface BreadcrumbListItemProps {
  item: BreadcrumbItem;
  isLast: boolean;
  truncateWidth?: string;
}

function BreadcrumbListItem({ item, isLast, truncateWidth }: BreadcrumbListItemProps) {
  return (
    <li className="flex items-center min-w-0">
      <ChevronRight className="h-4 w-4 text-slate-400 mx-1 flex-shrink-0" />
      {isLast || !item.href ? (
        <span
          className={cn(
            'truncate',
            truncateWidth,
            isLast ? 'text-slate-900 font-medium' : 'text-slate-500'
          )}
          aria-current={isLast ? 'page' : undefined}
          title={item.label}
        >
          {item.label}
        </span>
      ) : (
        <Link
          href={item.href}
          className={cn(
            'text-slate-500 hover:text-primary-600 transition-colors truncate',
            truncateWidth
          )}
          title={item.label}
        >
          {item.label}
        </Link>
      )}
    </li>
  );
}
