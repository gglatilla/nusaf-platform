// Category and SubCategory types

export interface Category {
  id: string;
  code: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  createdBy?: string;
  updatedAt: Date;
  updatedBy?: string;
}

export interface CategoryWithSubCategories extends Category {
  subCategories: SubCategory[];
}

export interface SubCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  categoryId: string;
  createdAt: Date;
  createdBy?: string;
  updatedAt: Date;
  updatedBy?: string;
}

export interface SubCategoryWithCategory extends SubCategory {
  category: Category;
}

export interface CreateCategoryInput {
  code: string;
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateCategoryInput {
  code?: string;
  name?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateSubCategoryInput {
  code: string;
  name: string;
  description?: string;
  sortOrder?: number;
  categoryId: string;
}

export interface UpdateSubCategoryInput {
  code?: string;
  name?: string;
  description?: string;
  sortOrder?: number;
  categoryId?: string;
  isActive?: boolean;
}

// Category codes
export const CATEGORY_CODES = {
  CONVEYOR_COMPONENTS: 'CONV',
  LEVELLING_FEET: 'LVL',
  BEARINGS: 'BRG',
  TABLE_TOP_CHAIN: 'TTC',
  MODULAR_CHAIN: 'MOD',
  POWER_TRANSMISSION: 'PWR',
  SPROCKETS_IDLERS: 'SPR',
  BENDS: 'BND',
  WEAR_STRIPS: 'WRS',
  VBELTS: 'VBT',
  GEARBOX_MOTORS: 'GBX',
} as const;
