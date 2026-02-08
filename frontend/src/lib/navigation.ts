import {
  LayoutDashboard,
  Activity,
  Package,
  FileText,
  ShoppingCart,
  Receipt,
  Settings,
  Upload,
  Euro,
  ClipboardList,
  ClipboardCheck,
  Wrench,
  Truck,
  AlertTriangle,
  Archive,
  RotateCcw,
  Building2,

  Factory,
  PackageCheck,
  ArrowRightLeft,
  FileOutput,
  FileInput,
  Boxes,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';

export type UserRole = 'ADMIN' | 'MANAGER' | 'SALES' | 'CUSTOMER' | 'PURCHASER' | 'WAREHOUSE';

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
  { name: 'Fulfillment', href: '/fulfillment', icon: Activity, roles: ['ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'PURCHASER'] },
  { name: 'Products', href: '/catalog', icon: Package },
  { name: 'Quotes', href: '/quotes', icon: FileText },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Picking Slips', href: '/picking-slips', icon: ClipboardList },
  { name: 'Job Cards', href: '/job-cards', icon: Wrench },
  { name: 'Delivery Notes', href: '/delivery-notes', icon: FileOutput },
  { name: 'Packing Lists', href: '/packing-lists', icon: Boxes, roles: ['ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE'] },
  { name: 'Returns', href: '/return-authorizations', icon: RotateCcw, roles: ['ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE'] },
  { name: 'Transfers', href: '/transfer-requests', icon: Truck },
  { name: 'Issues', href: '/issues', icon: AlertTriangle },
  { name: 'Documents', href: '/documents', icon: Archive },
  { name: 'Tax Invoices', href: '/tax-invoices', icon: Receipt, roles: ['ADMIN', 'MANAGER', 'SALES'] },
];

/**
 * Procurement navigation items
 */
export const procurementNavigation: NavItem[] = [
  { name: 'Requisitions', href: '/purchase-requisitions', icon: FileInput, roles: ['ADMIN', 'MANAGER', 'SALES', 'PURCHASER', 'WAREHOUSE'] },
  { name: 'Purchase Orders', href: '/purchase-orders', icon: ShoppingCart, roles: ['ADMIN', 'MANAGER', 'PURCHASER'] },
  { name: 'Goods Receipts', href: '/goods-receipts', icon: PackageCheck, roles: ['ADMIN', 'MANAGER', 'PURCHASER', 'WAREHOUSE'] },
];

/**
 * Inventory navigation items (internal users only)
 * This is the Item Master section - operational data for all items
 */
export const inventoryNavigation: NavItem[] = [
  { name: 'Items', href: '/inventory/items', icon: Package, roles: ['ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'PURCHASER'] },
  { name: 'Dashboard', href: '/inventory', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'PURCHASER'] },
  { name: 'Adjustments', href: '/inventory/adjustments', icon: ClipboardList, roles: ['ADMIN', 'MANAGER', 'WAREHOUSE'] },
  { name: 'Cycle Counts', href: '/inventory/cycle-counts', icon: ClipboardCheck, roles: ['ADMIN', 'MANAGER', 'WAREHOUSE'] },
  { name: 'Movements', href: '/inventory/movements', icon: ArrowRightLeft, roles: ['ADMIN', 'MANAGER', 'WAREHOUSE'] },
  { name: 'Reorder Report', href: '/inventory/reorder', icon: AlertTriangle, roles: ['ADMIN', 'MANAGER', 'PURCHASER'] },
];

/**
 * Admin navigation items (only visible to ADMIN, MANAGER, SALES)
 */
export const adminNavigation: NavItem[] = [
  { name: 'Imports', href: '/imports', icon: Upload, roles: ['ADMIN', 'MANAGER', 'SALES'] },
  { name: 'Companies', href: '/admin/companies', icon: Building2, roles: ['ADMIN', 'MANAGER'] },
  { name: 'Suppliers', href: '/admin/suppliers', icon: Factory, roles: ['ADMIN', 'MANAGER', 'SALES'] },
  { name: 'Pricing', href: '/admin/settings', icon: Euro, roles: ['ADMIN', 'MANAGER'] },
];

/**
 * Reports navigation items
 */
export const reportsNavigation: NavItem[] = [
  { name: 'Sales', href: '/reports/sales', icon: BarChart3, roles: ['ADMIN', 'MANAGER', 'SALES'] },
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
