// SKU mapping types (primarily for Tecom SKU conversion)

import type { Supplier } from './supplier';

export interface SkuMapping {
  id: string;
  supplierSku: string;
  nusafSku: string;
  isOverride: boolean;
  notes?: string;
  supplierId: string;
  overrideCategoryId?: string;
  createdAt: Date;
  createdBy?: string;
  updatedAt: Date;
  updatedBy?: string;
}

export interface SkuMappingWithSupplier extends SkuMapping {
  supplier: Supplier;
}

export interface CreateSkuMappingInput {
  supplierSku: string;
  nusafSku: string;
  isOverride?: boolean;
  notes?: string;
  supplierId: string;
  overrideCategoryId?: string;
}

export interface UpdateSkuMappingInput {
  nusafSku?: string;
  isOverride?: boolean;
  notes?: string;
  overrideCategoryId?: string;
}

/**
 * Converts a Tecom SKU to Nusaf format.
 *
 * Tecom SKU format: C0200 80271 (prefix + part number + identifying code)
 * - Prefix B: Keep as-is
 * - Prefix C/L: Convert to 1{partNumber}-{identifyingCode}
 *
 * @example
 * convertTecomSku('C020080271') // Returns '1200-80271'
 * convertTecomSku('L008580271') // Returns '185-80271'
 * convertTecomSku('B00123456')  // Returns 'B00123456'
 */
export function convertTecomSku(tecomSku: string): string {
  if (!tecomSku || tecomSku.length < 6) {
    throw new Error(`Invalid Tecom SKU: ${tecomSku}`);
  }

  const prefix = tecomSku[0].toUpperCase();

  // B prefix: keep as-is
  if (prefix === 'B') {
    return tecomSku;
  }

  // C or L prefix: convert to Nusaf format
  if (prefix === 'C' || prefix === 'L') {
    const partNumber = tecomSku.slice(1, 5); // 4 digits after prefix
    const identifyingCode = tecomSku.slice(5); // Rest of string

    // Strip leading zeros from part number
    const partNumberClean = parseInt(partNumber, 10).toString();

    return `1${partNumberClean}-${identifyingCode}`;
  }

  throw new Error(`Unknown Tecom SKU prefix: ${prefix}`);
}
