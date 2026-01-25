// Company types

export type CustomerTier = 'end_user' | 'oem_reseller' | 'distributor';

export interface Company {
  id: string;
  name: string;
  tradingName?: string;
  registrationNumber?: string;
  vatNumber?: string;
  tier: CustomerTier;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyAddress {
  id: string;
  companyId: string;
  type: 'billing' | 'shipping';
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface CompanyContact {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  isPrimary: boolean;
}

// Discount percentages per tier (off list price)
export const TIER_DISCOUNTS: Record<CustomerTier, number> = {
  end_user: 0.30,      // 30% off list
  oem_reseller: 0.40,  // 40% off list
  distributor: 0.50,   // 50% off list
};
