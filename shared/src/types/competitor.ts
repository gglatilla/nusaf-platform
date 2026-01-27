// Competitor cross-reference types

import type { Product } from './product';

export interface CompetitorCrossReference {
  id: string;
  competitorBrand: string;
  competitorSku: string;
  notes?: string;
  isVerified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  productId: string;
  createdAt: Date;
  createdBy?: string;
  updatedAt: Date;
  updatedBy?: string;
}

export interface CompetitorCrossReferenceWithProduct extends CompetitorCrossReference {
  product: Product;
}

export interface CreateCompetitorCrossReferenceInput {
  competitorBrand: string;
  competitorSku: string;
  notes?: string;
  productId: string;
}

export interface UpdateCompetitorCrossReferenceInput {
  competitorBrand?: string;
  competitorSku?: string;
  notes?: string;
  isVerified?: boolean;
}

// Common competitor brands
export const COMPETITOR_BRANDS = [
  'Rexnord',
  'Intralox',
  'Habasit',
  'Flexco',
  'Martin Sprocket',
  'Gates',
  'SKF',
  'Timken',
  'Bosch Rexroth',
] as const;
