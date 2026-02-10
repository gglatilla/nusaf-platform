import type {
  PaymentTermsType,
  CreditStatusType,
  AccountStatusType,
  ShippingMethodType,
  ContactRoleType,
} from '@/lib/api';

// --- Label maps ---

export const TIER_LABELS: Record<string, string> = {
  END_USER: 'End User',
  OEM_RESELLER: 'OEM/Reseller',
  DISTRIBUTOR: 'Distributor',
};

export const TIER_OPTIONS = [
  { value: 'END_USER', label: 'End User (30% off list)' },
  { value: 'OEM_RESELLER', label: 'OEM/Reseller (40% off list)' },
  { value: 'DISTRIBUTOR', label: 'Distributor (50% off list)' },
] as const;

export const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  PROSPECT: 'Prospect',
  ACTIVE: 'Active',
  DORMANT: 'Dormant',
  CHURNED: 'Churned',
};

export const ACCOUNT_STATUS_COLORS: Record<string, string> = {
  PROSPECT: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  DORMANT: 'bg-amber-100 text-amber-800',
  CHURNED: 'bg-red-100 text-red-800',
};

export const CREDIT_STATUS_LABELS: Record<CreditStatusType, string> = {
  GOOD_STANDING: 'Good Standing',
  ON_HOLD: 'On Hold',
  SUSPENDED: 'Suspended',
  COD_ONLY: 'COD Only',
};

export const CREDIT_STATUS_COLORS: Record<CreditStatusType, string> = {
  GOOD_STANDING: 'bg-emerald-100 text-emerald-800',
  ON_HOLD: 'bg-amber-100 text-amber-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  COD_ONLY: 'bg-orange-100 text-orange-800',
};

export const PAYMENT_TERMS_LABELS: Record<PaymentTermsType, string> = {
  PREPAY: 'Prepay',
  COD: 'COD',
  NET_30: 'Net 30',
  NET_60: 'Net 60',
  NET_90: 'Net 90',
};

export const PAYMENT_TERMS_OPTIONS: PaymentTermsType[] = ['PREPAY', 'COD', 'NET_30', 'NET_60', 'NET_90'];

export const FULFILLMENT_POLICY_LABELS: Record<string, string> = {
  SHIP_PARTIAL: 'Ship Partial',
  SHIP_COMPLETE: 'Ship Complete',
  SALES_DECISION: 'Sales Decision',
};

export const SHIPPING_METHOD_LABELS: Record<ShippingMethodType, string> = {
  COLLECTION: 'Collection',
  NUSAF_DELIVERY: 'Nusaf Delivery',
  COURIER: 'Courier',
  FREIGHT: 'Freight',
};

export const CONTACT_ROLE_LABELS: Record<ContactRoleType, string> = {
  BUYER: 'Buyer',
  FINANCE: 'Finance',
  TECHNICAL: 'Technical',
  RECEIVING: 'Receiving',
  DECISION_MAKER: 'Decision Maker',
};

export const CONTACT_ROLE_COLORS: Record<ContactRoleType, string> = {
  BUYER: 'bg-blue-100 text-blue-800',
  FINANCE: 'bg-green-100 text-green-800',
  TECHNICAL: 'bg-purple-100 text-purple-800',
  RECEIVING: 'bg-amber-100 text-amber-800',
  DECISION_MAKER: 'bg-red-100 text-red-800',
};

export const SA_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
  'Western Cape',
] as const;

export const WAREHOUSE_LABELS: Record<string, string> = {
  JHB: 'Johannesburg',
  CT: 'Cape Town',
};
