// Product types

import type { Supplier } from './supplier';
import type { Category, SubCategory } from './category';

export type UnitOfMeasure = 'EA' | 'M' | 'KG' | 'BOX' | 'SET' | 'PAIR' | 'ROLL';

export interface Product {
  id: string;
  supplierSku: string;
  nusafSku: string;
  description: string;
  unitOfMeasure: UnitOfMeasure;
  isActive: boolean;
  supplierId: string;
  categoryId: string;
  subCategoryId?: string;
  createdAt: Date;
  createdBy?: string;
  updatedAt: Date;
  updatedBy?: string;
  deletedAt?: Date;
  deletedBy?: string;
}

export interface ProductWithRelations extends Product {
  supplier: Supplier;
  category: Category;
  subCategory?: SubCategory;
}

export interface CreateProductInput {
  supplierSku: string;
  nusafSku: string;
  description: string;
  unitOfMeasure?: UnitOfMeasure;
  supplierId: string;
  categoryId: string;
  subCategoryId?: string;
}

export interface UpdateProductInput {
  supplierSku?: string;
  nusafSku?: string;
  description?: string;
  unitOfMeasure?: UnitOfMeasure;
  categoryId?: string;
  subCategoryId?: string;
  isActive?: boolean;
}

// Unit of measure display names
export const UNIT_OF_MEASURE_LABELS: Record<UnitOfMeasure, string> = {
  EA: 'Each',
  M: 'Meter',
  KG: 'Kilogram',
  BOX: 'Box',
  SET: 'Set',
  PAIR: 'Pair',
  ROLL: 'Roll',
};
