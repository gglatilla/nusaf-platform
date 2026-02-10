import {
  LayoutDashboard,
  Package,
  FileText,
  ShoppingCart,
  Receipt,
  Truck,
  RotateCcw,
  User,
  type LucideIcon,
} from 'lucide-react';

export interface CustomerNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

/**
 * Navigation items for the customer portal header
 */
export const customerNavigation: CustomerNavItem[] = [
  { name: 'Dashboard', href: '/my/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/my/products', icon: Package },
  { name: 'Quotes', href: '/my/quotes', icon: FileText },
  { name: 'Orders', href: '/my/orders', icon: ShoppingCart },
  { name: 'Invoices', href: '/my/invoices', icon: Receipt },
  { name: 'Deliveries', href: '/my/deliveries', icon: Truck },
  { name: 'Returns', href: '/my/returns', icon: RotateCcw },
  { name: 'Account', href: '/my/account', icon: User },
];
