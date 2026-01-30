/**
 * Category and Subcategory Definitions
 * Single source of truth for all category/subcategory codes and names.
 *
 * Used by:
 * - Seed endpoint (initial database population)
 * - Reseed endpoint (category refresh)
 * - Migration endpoint (code correction)
 * - Excel imports (code validation)
 */

export interface SubCategoryDefinition {
  code: string;
  name: string;
  sortOrder: number;
}

export interface CategoryDefinition {
  code: string;
  name: string;
  sortOrder: number;
  subCategories: SubCategoryDefinition[];
}

/**
 * All category and subcategory definitions with correct codes.
 * Category codes are single letters (C, L, B, etc.)
 * Subcategory codes are {categoryCode}-{3-digit number} (C-001, L-001, etc.)
 */
export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    code: 'C',
    name: 'Conveyor Components',
    sortOrder: 1,
    subCategories: [
      { code: 'C-001', name: 'Bases', sortOrder: 1 },
      { code: 'C-002', name: 'Bearing heads', sortOrder: 2 },
      { code: 'C-003', name: 'Connecting joints', sortOrder: 3 },
      { code: 'C-004', name: 'Guide rail brackets', sortOrder: 4 },
      { code: 'C-005', name: 'Tightening eyebolts', sortOrder: 5 },
      { code: 'C-006', name: 'Heads for brackets', sortOrder: 6 },
      { code: 'C-007', name: 'Knobs and handles', sortOrder: 7 },
      { code: 'C-008', name: 'Clamps', sortOrder: 8 },
      { code: 'C-009', name: 'Return rollers', sortOrder: 9 },
      { code: 'C-010', name: 'Nose over', sortOrder: 10 },
      { code: 'C-011', name: 'Split shaft collars', sortOrder: 11 },
      { code: 'C-012', name: 'Shoes', sortOrder: 12 },
      { code: 'C-013', name: 'Side guide accessories', sortOrder: 13 },
      { code: 'C-014', name: 'Chain tensioners', sortOrder: 14 },
      { code: 'C-015', name: 'Bearing supports', sortOrder: 15 },
      { code: 'C-016', name: 'Bushings', sortOrder: 16 },
      { code: 'C-017', name: 'Hinges', sortOrder: 17 },
      { code: 'C-018', name: 'Process control', sortOrder: 18 },
      { code: 'C-019', name: 'Modular transfer plates', sortOrder: 19 },
      { code: 'C-020', name: 'Product guides and accessories', sortOrder: 20 },
      { code: 'C-021', name: 'Guide rail clamps', sortOrder: 21 },
      { code: 'C-022', name: 'Product / chain guides and accessories', sortOrder: 22 },
      { code: 'C-023', name: 'Chain guides and accessories', sortOrder: 23 },
    ],
  },
  {
    code: 'L',
    name: 'Levelling Feet',
    sortOrder: 2,
    subCategories: [
      { code: 'L-001', name: 'Fixed feet', sortOrder: 1 },
      { code: 'L-002', name: 'Articulated feet', sortOrder: 2 },
      { code: 'L-003', name: 'Adjustable feet', sortOrder: 3 },
      { code: 'L-004', name: 'Articulated feet, sanitizable', sortOrder: 4 },
      { code: 'L-005', name: 'Adjustable feet, sanitizable', sortOrder: 5 },
      { code: 'L-006', name: 'Support accessories', sortOrder: 6 },
      { code: 'L-007', name: 'Bushings', sortOrder: 7 },
    ],
  },
  {
    code: 'B',
    name: 'Bearings',
    sortOrder: 3,
    subCategories: [
      { code: 'B-001', name: 'UCF', sortOrder: 1 },
      { code: 'B-002', name: 'UCFL', sortOrder: 2 },
      { code: 'B-003', name: 'UCFB', sortOrder: 3 },
      { code: 'B-004', name: 'UCP', sortOrder: 4 },
      { code: 'B-005', name: 'UCPA', sortOrder: 5 },
      { code: 'B-006', name: 'UCT', sortOrder: 6 },
      { code: 'B-007', name: 'UCFC', sortOrder: 7 },
      { code: 'B-008', name: 'F series', sortOrder: 8 },
    ],
  },
  {
    code: 'T',
    name: 'Table Top Chain',
    sortOrder: 4,
    subCategories: [
      { code: 'T-001', name: 'Straight running steel chains', sortOrder: 1 },
      { code: 'T-002', name: 'Sideflexing steel chains', sortOrder: 2 },
      { code: 'T-003', name: 'Rubberized surface steel chains', sortOrder: 3 },
      { code: 'T-004', name: 'Straight running plastic chains', sortOrder: 4 },
      { code: 'T-005', name: 'Sideflexing plastic chains', sortOrder: 5 },
      { code: 'T-006', name: 'Rubberized surface plastic chains', sortOrder: 6 },
      { code: 'T-007', name: 'Two-piece chains', sortOrder: 7 },
      { code: 'T-008', name: 'Gripper chains', sortOrder: 8 },
      { code: 'T-009', name: 'LBP chains', sortOrder: 9 },
    ],
  },
  {
    code: 'M',
    name: 'Modular Chain',
    sortOrder: 5,
    subCategories: [
      { code: 'M-001', name: '8mm Nanopitch belt', sortOrder: 1 },
      { code: 'M-002', name: '½" pitch belts and chains', sortOrder: 2 },
      { code: 'M-003', name: '1" pitch light duty', sortOrder: 3 },
      { code: 'M-004', name: '¾" pitch medium duty', sortOrder: 4 },
      { code: 'M-005', name: '1" pitch heavy duty', sortOrder: 5 },
      { code: 'M-006', name: '1" pitch sideflexing', sortOrder: 6 },
      { code: 'M-007', name: '1¼" pitch heavy duty sideflexing', sortOrder: 7 },
      { code: 'M-008', name: 'Heavy duty fixed radius', sortOrder: 8 },
      { code: 'M-009', name: '2" pitch heavy duty raised rib', sortOrder: 9 },
      { code: 'M-010', name: '1½" pitch heavy duty UCC', sortOrder: 10 },
    ],
  },
  {
    code: 'P',
    name: 'Power Transmission',
    sortOrder: 6,
    subCategories: [
      { code: 'P-001', name: 'Sprockets', sortOrder: 1 },
      { code: 'P-002', name: 'Platewheels/Wheels/Hubs/Adaptors', sortOrder: 2 },
      { code: 'P-003', name: 'Chains and Chain riders', sortOrder: 3 },
      { code: 'P-004', name: 'Straight spur gears and racks', sortOrder: 4 },
      { code: 'P-005', name: 'Bevel gears', sortOrder: 5 },
      { code: 'P-006', name: 'Timing pulleys', sortOrder: 6 },
      { code: 'P-007', name: 'V-belt pulleys', sortOrder: 7 },
      { code: 'P-008', name: 'Timing bars/Flanges/Clamping plates', sortOrder: 8 },
      { code: 'P-009', name: 'Taper bushes', sortOrder: 9 },
      { code: 'P-010', name: 'Clamping elements', sortOrder: 10 },
      { code: 'P-011', name: 'Flexible couplings/Torque limiters', sortOrder: 11 },
      { code: 'P-012', name: 'Collars and washers', sortOrder: 12 },
      { code: 'P-013', name: 'Pillow blocks', sortOrder: 13 },
    ],
  },
  {
    code: 'S',
    name: 'Sprockets & Idlers',
    sortOrder: 7,
    subCategories: [
      { code: 'S-001', name: 'Moulded sprockets and idlers', sortOrder: 1 },
      { code: 'S-002', name: 'Machined sprockets and idlers', sortOrder: 2 },
    ],
  },
  {
    code: 'D',
    name: 'Bends',
    sortOrder: 8,
    subCategories: [
      { code: 'D-001', name: 'Magnetic bends', sortOrder: 1 },
      { code: 'D-002', name: 'TAB bends', sortOrder: 2 },
    ],
  },
  {
    code: 'W',
    name: 'Wear Strips',
    sortOrder: 9,
    subCategories: [
      { code: 'W-001', name: 'Machined', sortOrder: 1 },
      { code: 'W-002', name: 'Extruded', sortOrder: 2 },
    ],
  },
  {
    code: 'V',
    name: 'V-belts',
    sortOrder: 10,
    subCategories: [
      { code: 'V-001', name: 'Wrapped classical section', sortOrder: 1 },
      { code: 'V-002', name: 'Wrapped narrow section', sortOrder: 2 },
      { code: 'V-003', name: 'Classical raw edge cogged', sortOrder: 3 },
      { code: 'V-004', name: 'Narrow raw edge cogged', sortOrder: 4 },
    ],
  },
  {
    code: 'G',
    name: 'Gearbox & Motors',
    sortOrder: 11,
    subCategories: [
      { code: 'G-001', name: 'CHM Worm geared motors', sortOrder: 1 },
      { code: 'G-002', name: 'CHML Worm gearboxes with torque limiter', sortOrder: 2 },
      { code: 'G-003', name: 'CH Worm geared motors', sortOrder: 3 },
      { code: 'G-004', name: 'CHC Helical gear units', sortOrder: 4 },
      { code: 'G-005', name: 'Bevel helical gear units', sortOrder: 5 },
      { code: 'G-006', name: 'Electric motors', sortOrder: 6 },
      { code: 'G-007', name: 'Electric motors "Hygienic"', sortOrder: 7 },
    ],
  },
];

/**
 * Old category code mappings for migration.
 * Maps incorrect codes to correct single-letter codes.
 */
export const CATEGORY_CODE_MIGRATION: Record<string, string> = {
  CONV: 'C',
  LVL: 'L',
  BRG: 'B',
  TTC: 'T',
  MOD: 'M',
  PWR: 'P',
  SPR: 'S',
  BND: 'D',
  WRS: 'W',
  VBT: 'V',
  GBX: 'G',
};

/**
 * Old subcategory code mappings for migration.
 * Maps incorrect codes to correct X-NNN format codes.
 * Used when name matching fails due to normalization differences.
 */
export const SUBCATEGORY_CODE_MIGRATION: Record<string, string> = {
  // Conveyor Components
  'SIDE_GUIDE_ACCESSORIES': 'C-013',

  // Table Top Chain
  'LBP': 'T-009',

  // Modular Chain
  '1IN_LIGHT': 'M-003',
  '3QTR_MEDIUM': 'M-004',
  '1IN_HEAVY': 'M-005',
  '1IN_SIDEFLEX': 'M-006',
  '1QTR_SIDEFLEX': 'M-007',
  'FIXED_RADIUS': 'M-008',
  '2IN_RIB': 'M-009',
  '1HALF_UCC': 'M-010',

  // Power Transmission
  'CHAINS_RIDERS': 'P-002',
  'TIMING_ACCESSORIES': 'P-008',

  // V-belts
  'WRAPPED_NARROW': 'V-002',
  'COGGED_CLASSICAL': 'V-003',

  // Gearbox & Motors
  'CH_WORM': 'G-003',
  'HYGIENIC_MOTORS': 'G-007',
};

/**
 * Normalize a subcategory name for matching.
 * Handles variations like "Fixed feet" vs "FIXED_FEET" or "fixed_feet".
 */
export function normalizeSubCategoryName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Find the correct subcategory code by matching name within a category.
 * Used during migration to map old codes to new codes.
 */
export function findSubCategoryCode(categoryCode: string, name: string): string | null {
  const category = CATEGORY_DEFINITIONS.find((c) => c.code === categoryCode);
  if (!category) return null;

  const normalizedName = normalizeSubCategoryName(name);
  const sub = category.subCategories.find(
    (s) => normalizeSubCategoryName(s.name) === normalizedName
  );

  return sub?.code ?? null;
}

/**
 * Get all subcategory definitions for a given category code.
 */
export function getSubCategoriesForCategory(categoryCode: string): SubCategoryDefinition[] {
  const category = CATEGORY_DEFINITIONS.find((c) => c.code === categoryCode);
  return category?.subCategories ?? [];
}

/**
 * Validate a category code.
 */
export function isValidCategoryCode(code: string): boolean {
  return CATEGORY_DEFINITIONS.some((c) => c.code === code);
}

/**
 * Validate a subcategory code (must be in format X-NNN and exist).
 */
export function isValidSubCategoryCode(code: string): boolean {
  const match = code.match(/^([A-Z])-(\d{3})$/);
  if (!match) return false;

  const categoryCode = match[1];
  const category = CATEGORY_DEFINITIONS.find((c) => c.code === categoryCode);
  return category?.subCategories.some((s) => s.code === code) ?? false;
}
