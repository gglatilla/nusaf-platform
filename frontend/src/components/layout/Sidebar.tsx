'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { X, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  mainNavigation,
  inventoryNavigation,
  procurementNavigation,
  adminNavigation,
  reportsNavigation,
  secondaryNavigation,
  filterNavByRole,
  type NavItem,
  type UserRole,
} from '@/lib/navigation';
import { useAuthStore } from '@/stores/auth-store';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

function NavLink({ item, isCollapsed }: { item: NavItem; isCollapsed: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-md mx-2 transition-colors duration-150',
        'text-slate-400 hover:text-white hover:bg-slate-800',
        isActive && 'bg-primary-600 text-white hover:bg-primary-600',
        isCollapsed && 'justify-center px-2'
      )}
      title={isCollapsed ? item.name : undefined}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
    </Link>
  );
}

export function Sidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }: SidebarProps) {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-slate-900 flex flex-col transition-all duration-300',
          // Mobile: slide in from left
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Width: 224px on lg, 240px on xl+, 64px collapsed
          isCollapsed ? 'lg:w-16' : 'lg:w-56 xl:w-60',
          'w-60' // Mobile always full width
        )}
      >
        {/* Header with logo */}
        <div
          className={cn(
            'flex items-center h-16 px-4 border-b border-slate-800',
            isCollapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {!isCollapsed && (
            <Link href="/dashboard" className="text-white font-bold text-xl">
              Nusaf
            </Link>
          )}

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-md"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className={cn(
              'hidden lg:flex items-center justify-center p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors',
              isCollapsed && 'mx-auto'
            )}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Main navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="space-y-1">
            {mainNavigation.map((item) => (
              <NavLink key={item.href} item={item} isCollapsed={isCollapsed} />
            ))}
          </div>

          {/* Inventory navigation (role-based - internal users only) */}
          {user?.role && filterNavByRole(inventoryNavigation, user.role as UserRole).length > 0 && (
            <>
              <div className="my-4 mx-4 border-t border-slate-800" />
              {!isCollapsed && (
                <p className="px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Inventory
                </p>
              )}
              <div className="space-y-1">
                {filterNavByRole(inventoryNavigation, user.role as UserRole).map((item) => (
                  <NavLink key={item.href} item={item} isCollapsed={isCollapsed} />
                ))}
              </div>
            </>
          )}

          {/* Procurement navigation (role-based) */}
          {user?.role && filterNavByRole(procurementNavigation, user.role as UserRole).length > 0 && (
            <>
              <div className="my-4 mx-4 border-t border-slate-800" />
              {!isCollapsed && (
                <p className="px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Procurement
                </p>
              )}
              <div className="space-y-1">
                {filterNavByRole(procurementNavigation, user.role as UserRole).map((item) => (
                  <NavLink key={item.href} item={item} isCollapsed={isCollapsed} />
                ))}
              </div>
            </>
          )}

          {/* Admin navigation (role-based) */}
          {user?.role && filterNavByRole(adminNavigation, user.role as UserRole).length > 0 && (
            <>
              <div className="my-4 mx-4 border-t border-slate-800" />
              {!isCollapsed && (
                <p className="px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Admin
                </p>
              )}
              <div className="space-y-1">
                {filterNavByRole(adminNavigation, user.role as UserRole).map((item) => (
                  <NavLink key={item.href} item={item} isCollapsed={isCollapsed} />
                ))}
              </div>
            </>
          )}

          {/* Reports navigation (role-based) */}
          {user?.role && filterNavByRole(reportsNavigation, user.role as UserRole).length > 0 && (
            <>
              <div className="my-4 mx-4 border-t border-slate-800" />
              {!isCollapsed && (
                <p className="px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Reports
                </p>
              )}
              <div className="space-y-1">
                {filterNavByRole(reportsNavigation, user.role as UserRole).map((item) => (
                  <NavLink key={item.href} item={item} isCollapsed={isCollapsed} />
                ))}
              </div>
            </>
          )}

          {/* Divider */}
          <div className="my-4 mx-4 border-t border-slate-800" />

          {/* Secondary navigation */}
          <div className="space-y-1">
            {secondaryNavigation.map((item) => (
              <NavLink key={item.href} item={item} isCollapsed={isCollapsed} />
            ))}
          </div>
        </nav>

        {/* User section */}
        <div className="border-t border-slate-800 p-4">
          <div
            className={cn(
              'flex items-center gap-3',
              isCollapsed && 'flex-col'
            )}
          >
            {/* Avatar */}
            <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </span>
            </div>

            {/* User info */}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user?.company.name}
                </p>
              </div>
            )}

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className={cn(
                'p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors',
                isCollapsed && 'mt-2'
              )}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
