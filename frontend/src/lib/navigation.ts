import {
  LayoutDashboard,
  Package,
  FileText,
  ShoppingCart,
  Receipt,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
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
 * Secondary navigation items (bottom of sidebar)
 */
export const secondaryNavigation: NavItem[] = [
  { name: 'Settings', href: '/settings', icon: Settings },
];
