import {
  LayoutDashboard,
  Package,
  FileText,
  ShoppingCart,
  Receipt,
  Settings,
  Upload,
  type LucideIcon,
} from 'lucide-react';

export type UserRole = 'ADMIN' | 'MANAGER' | 'SALES' | 'CUSTOMER';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles?: UserRole[]; // If specified, only visible to these roles
}

export interface NavGroup {
  items: NavItem[];
}

/**
 * Main navigation items for the customer portal
 */
export const mainNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Quotes', href: '/quotes', icon: FileText },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Invoices', href: '/invoices', icon: Receipt },
];

/**
 * Admin navigation items (only visible to ADMIN, MANAGER, SALES)
 */
export const adminNavigation: NavItem[] = [
  { name: 'Imports', href: '/imports', icon: Upload, roles: ['ADMIN', 'MANAGER', 'SALES'] },
  { name: 'Settings', href: '/admin/settings', icon: Settings, roles: ['ADMIN', 'MANAGER'] },
];

/**
 * Secondary navigation items (bottom of sidebar)
 */
export const secondaryNavigation: NavItem[] = [
  { name: 'Settings', href: '/settings', icon: Settings },
];

/**
 * Filter navigation items by user role
 */
export function filterNavByRole(items: NavItem[], userRole: UserRole): NavItem[] {
  return items.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });
}
