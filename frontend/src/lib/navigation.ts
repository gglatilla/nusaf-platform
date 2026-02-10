import {
  LayoutDashboard,
  Activity,
  Package,
  FileText,
  ShoppingCart,
  Receipt,
  Upload,
  Euro,
  ClipboardList,
  ClipboardCheck,
  Wrench,
  Truck,
  AlertTriangle,
  Building2,
  Factory,
  PackageCheck,
  ArrowRightLeft,
  FileOutput,
  FileInput,
  Boxes,
  BarChart3,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';

export type UserRole = 'ADMIN' | 'MANAGER' | 'SALES' | 'CUSTOMER' | 'PURCHASER' | 'WAREHOUSE';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles?: UserRole[]; // If specified, only visible to these roles
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/**
 * Dashboard (standalone, no section header)
 */
export const dashboardNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
];

/**
 * Sales — Quotes, Orders, Invoices, Credit Notes
 */
export const salesNavigation: NavItem[] = [
  { name: 'Quotes', href: '/quotes', icon: FileText },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Tax Invoices', href: '/tax-invoices', icon: Receipt, roles: ['ADMIN', 'MANAGER', 'SALES'] },
  { name: 'Credit Notes', href: '/credit-notes', icon: CreditCard, roles: ['ADMIN', 'MANAGER', 'SALES'] },
];

/**
 * Fulfillment — Operations dashboard, picking, jobs, packing, delivery, transfers, issues
 */
export const fulfillmentNavigation: NavItem[] = [
  { name: 'Overview', href: '/fulfillment', icon: Activity, roles: ['ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'PURCHASER'] },
  { name: 'Picking Slips', href: '/picking-slips', icon: ClipboardList, roles: ['ADMIN', 'MANAGER', 'WAREHOUSE'] },
  { name: 'Job Cards', href: '/job-cards', icon: Wrench, roles: ['ADMIN', 'MANAGER', 'WAREHOUSE'] },
  { name: 'Packing Lists', href: '/packing-lists', icon: Boxes, roles: ['ADMIN', 'MANAGER', 'WAREHOUSE'] },
  { name: 'Delivery Notes', href: '/delivery-notes', icon: FileOutput, roles: ['ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE'] },
  { name: 'Transfers', href: '/transfer-requests', icon: Truck, roles: ['ADMIN', 'MANAGER', 'WAREHOUSE'] },
  { name: 'Issues', href: '/issues', icon: AlertTriangle, roles: ['ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE'] },
];

/**
 * Inventory — Dashboard, items, adjustments, cycle counts, movements, reorder
 */
export const inventoryNavigation: NavItem[] = [
  { name: 'Overview', href: '/inventory', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'PURCHASER'] },
  { name: 'Items', href: '/inventory/items', icon: Package, roles: ['ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'PURCHASER'] },
  { name: 'Adjustments', href: '/inventory/adjustments', icon: ClipboardList, roles: ['ADMIN', 'MANAGER', 'WAREHOUSE'] },
  { name: 'Cycle Counts', href: '/inventory/cycle-counts', icon: ClipboardCheck, roles: ['ADMIN', 'MANAGER', 'WAREHOUSE'] },
  { name: 'Movements', href: '/inventory/movements', icon: ArrowRightLeft, roles: ['ADMIN', 'MANAGER', 'WAREHOUSE'] },
  { name: 'Reorder Report', href: '/inventory/reorder', icon: AlertTriangle, roles: ['ADMIN', 'MANAGER', 'PURCHASER'] },
];

/**
 * Procurement — Requisitions, POs, Goods Receipts
 */
export const procurementNavigation: NavItem[] = [
  { name: 'Requisitions', href: '/purchase-requisitions', icon: FileInput, roles: ['ADMIN', 'MANAGER', 'SALES', 'PURCHASER', 'WAREHOUSE'] },
  { name: 'Purchase Orders', href: '/purchase-orders', icon: ShoppingCart, roles: ['ADMIN', 'MANAGER', 'PURCHASER'] },
  { name: 'Goods Receipts', href: '/goods-receipts', icon: PackageCheck, roles: ['ADMIN', 'MANAGER', 'PURCHASER', 'WAREHOUSE'] },
];

/**
 * Catalog — Product management and data imports
 */
export const catalogNavigation: NavItem[] = [
  { name: 'Products', href: '/catalog', icon: Package, roles: ['ADMIN', 'MANAGER', 'SALES'] },
  { name: 'Imports', href: '/imports', icon: Upload, roles: ['ADMIN', 'MANAGER'] },
];

/**
 * Admin — Companies, Suppliers, Pricing
 */
export const adminNavigation: NavItem[] = [
  { name: 'Companies', href: '/admin/companies', icon: Building2, roles: ['ADMIN', 'MANAGER'] },
  { name: 'Suppliers', href: '/admin/suppliers', icon: Factory, roles: ['ADMIN', 'MANAGER', 'SALES'] },
  { name: 'Pricing', href: '/admin/settings', icon: Euro, roles: ['ADMIN', 'MANAGER'] },
];

/**
 * Reports
 */
export const reportsNavigation: NavItem[] = [
  { name: 'Sales', href: '/reports/sales', icon: BarChart3, roles: ['ADMIN', 'MANAGER', 'SALES'] },
];

/**
 * All navigation sections in display order (used by Sidebar)
 */
export const navigationSections: NavSection[] = [
  { label: 'Sales', items: salesNavigation },
  { label: 'Fulfillment', items: fulfillmentNavigation },
  { label: 'Inventory', items: inventoryNavigation },
  { label: 'Procurement', items: procurementNavigation },
  { label: 'Catalog', items: catalogNavigation },
  { label: 'Admin', items: adminNavigation },
  { label: 'Reports', items: reportsNavigation },
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
