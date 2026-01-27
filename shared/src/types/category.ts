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

// Category codes (single letter)
export const CATEGORY_CODES = {
  CONVEYOR_COMPONENTS: 'C',
  LEVELLING_FEET: 'L',
  BEARINGS: 'B',
  TABLE_TOP_CHAIN: 'T',
  MODULAR_CHAIN: 'M',
  POWER_TRANSMISSION: 'P',
  SPROCKETS_IDLERS: 'S',
  V_BELTS: 'V',
  BENDS: 'D',
  WEAR_STRIPS: 'W',
  GEARBOX_MOTORS: 'G',
} as const;

export type CategoryCode = (typeof CATEGORY_CODES)[keyof typeof CATEGORY_CODES];

// Subcategory codes (category letter + number)
export const SUBCATEGORY_CODES = {
  // C - Conveyor Components
  BASES: 'C-001',
  BEARING_HEADS: 'C-002',
  CONNECTING_JOINTS: 'C-003',
  GUIDE_RAIL_BRACKETS: 'C-004',
  TIGHTENING_EYEBOLTS: 'C-005',
  HEADS_FOR_BRACKETS: 'C-006',
  KNOBS_HANDLES: 'C-007',
  CLAMPS: 'C-008',
  RETURN_ROLLERS: 'C-009',
  NOSE_OVER: 'C-010',
  SPLIT_SHAFT_COLLARS: 'C-011',
  SHOES: 'C-012',
  SIDE_GUIDE_ACCESSORIES: 'C-013',
  CHAIN_TENSIONERS: 'C-014',
  BEARING_SUPPORTS: 'C-015',
  BUSHINGS: 'C-016',
  HINGES: 'C-017',
  PROCESS_CONTROL: 'C-018',
  MODULAR_TRANSFER_PLATES: 'C-019',
  PRODUCT_GUIDES: 'C-020',
  GUIDE_RAIL_CLAMPS: 'C-021',
  CHAIN_GUIDES: 'C-022',

  // L - Levelling Feet
  FIXED_FEET: 'L-001',
  ARTICULATED_FEET: 'L-002',
  ADJUSTABLE_FEET: 'L-003',
  ARTICULATED_SANITIZABLE: 'L-004',
  ADJUSTABLE_SANITIZABLE: 'L-005',
  SUPPORT_ACCESSORIES: 'L-006',
  LVL_BUSHINGS: 'L-007',

  // B - Bearings
  UCF: 'B-001',
  UCFL: 'B-002',
  UCFB: 'B-003',
  UCP: 'B-004',
  UCPA: 'B-005',
  UCT: 'B-006',
  UCFC: 'B-007',
  F_SERIES: 'B-008',

  // T - Table Top Chain
  STRAIGHT_STEEL: 'T-001',
  SIDEFLEX_STEEL: 'T-002',
  RUBBER_STEEL: 'T-003',
  STRAIGHT_PLASTIC: 'T-004',
  SIDEFLEX_PLASTIC: 'T-005',
  RUBBER_PLASTIC: 'T-006',
  TWO_PIECE: 'T-007',
  GRIPPER: 'T-008',
  LBP: 'T-009',

  // M - Modular Chain
  NANO_8MM: 'M-001',
  HALF_INCH: 'M-002',
  ONE_INCH_LIGHT: 'M-003',
  THREE_QTR_MEDIUM: 'M-004',
  ONE_INCH_HEAVY: 'M-005',
  ONE_INCH_SIDEFLEX: 'M-006',
  ONE_QTR_SIDEFLEX: 'M-007',
  FIXED_RADIUS: 'M-008',
  TWO_INCH_RIB: 'M-009',
  ONE_HALF_UCC: 'M-010',

  // P - Power Transmission
  PWR_SPROCKETS: 'P-001',
  PLATEWHEELS: 'P-002',
  CHAINS_RIDERS: 'P-003',
  SPUR_GEARS: 'P-004',
  BEVEL_GEARS: 'P-005',
  TIMING_PULLEYS: 'P-006',
  VBELT_PULLEYS: 'P-007',
  TIMING_ACCESSORIES: 'P-008',
  TAPER_BUSHES: 'P-009',
  CLAMPING_ELEMENTS: 'P-010',
  COUPLINGS_LIMITERS: 'P-011',
  COLLARS_WASHERS: 'P-012',
  PILLOW_BLOCKS: 'P-013',

  // S - Sprockets & Idlers
  MOULDED: 'S-001',
  MACHINED: 'S-002',

  // V - V-belts
  WRAPPED_CLASSICAL: 'V-001',
  WRAPPED_NARROW: 'V-002',
  COGGED_CLASSICAL: 'V-003',
  COGGED_NARROW: 'V-004',

  // D - Bends
  MAGNETIC: 'D-001',
  TAB: 'D-002',

  // W - Wear Strips
  WRS_MACHINED: 'W-001',
  WRS_EXTRUDED: 'W-002',

  // G - Gearbox & Motors
  CHM_WORM: 'G-001',
  CHML_TORQUE: 'G-002',
  CH_WORM: 'G-003',
  CHC_HELICAL: 'G-004',
  BEVEL_HELICAL: 'G-005',
  ELECTRIC_MOTORS: 'G-006',
  HYGIENIC_MOTORS: 'G-007',
} as const;

export type SubcategoryCode = (typeof SUBCATEGORY_CODES)[keyof typeof SUBCATEGORY_CODES];

// Category display names
export const CATEGORY_NAMES: Record<CategoryCode, string> = {
  C: 'Conveyor Components',
  L: 'Levelling Feet',
  B: 'Bearings',
  T: 'Table Top Chain',
  M: 'Modular Chain',
  P: 'Power Transmission',
  S: 'Sprockets & Idlers',
  V: 'V-belts',
  D: 'Bends',
  W: 'Wear Strips',
  G: 'Gearbox & Motors',
};
