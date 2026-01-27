// Prisma Seed Script
// Run with: npm run db:seed

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

async function main() {
  console.log('Starting seed...');

  // ============================================
  // SUPPLIERS
  // ============================================
  console.log('Seeding suppliers...');

  const suppliers = await Promise.all([
    prisma.supplier.upsert({
      where: { code: 'TECOM' },
      update: {},
      create: {
        code: 'TECOM',
        name: 'Tecom',
        country: 'Italy',
        currency: 'EUR',
        skuHandling: 'TECOM_CONVERSION',
        isLocal: false,
      },
    }),
    prisma.supplier.upsert({
      where: { code: 'CHIARAVALLI' },
      update: {},
      create: {
        code: 'CHIARAVALLI',
        name: 'Chiaravalli',
        country: 'Italy',
        currency: 'EUR',
        skuHandling: 'DIRECT',
        isLocal: false,
      },
    }),
    prisma.supplier.upsert({
      where: { code: 'REGINA' },
      update: {},
      create: {
        code: 'REGINA',
        name: 'Regina',
        country: 'Italy',
        currency: 'EUR',
        skuHandling: 'DIRECT',
        isLocal: false,
      },
    }),
    prisma.supplier.upsert({
      where: { code: 'NUSAF' },
      update: {},
      create: {
        code: 'NUSAF',
        name: 'Nusaf',
        country: 'South Africa',
        currency: 'ZAR',
        skuHandling: 'NUSAF_INTERNAL',
        isLocal: true,
      },
    }),
  ]);

  console.log(`Seeded ${suppliers.length} suppliers`);

  // ============================================
  // CATEGORIES AND SUBCATEGORIES
  // ============================================
  console.log('Seeding categories and subcategories...');

  const categoryData = [
    {
      code: 'CONV',
      name: 'Conveyor Components',
      sortOrder: 1,
      subCategories: [
        { code: 'BASES', name: 'Bases', sortOrder: 1 },
        { code: 'BEARING_HEADS', name: 'Bearing heads', sortOrder: 2 },
        { code: 'CONNECTING_JOINTS', name: 'Connecting joints', sortOrder: 3 },
        { code: 'GUIDE_RAIL_BRACKETS', name: 'Guide rail brackets', sortOrder: 4 },
        { code: 'TIGHTENING_EYEBOLTS', name: 'Tightening eyebolts', sortOrder: 5 },
        { code: 'HEADS_FOR_BRACKETS', name: 'Heads for brackets', sortOrder: 6 },
        { code: 'KNOBS_HANDLES', name: 'Knobs and handles', sortOrder: 7 },
        { code: 'CLAMPS', name: 'Clamps', sortOrder: 8 },
        { code: 'RETURN_ROLLERS', name: 'Return rollers', sortOrder: 9 },
        { code: 'NOSE_OVER', name: 'Nose over', sortOrder: 10 },
        { code: 'SPLIT_SHAFT_COLLARS', name: 'Split shaft collars', sortOrder: 11 },
        { code: 'SHOES', name: 'Shoes', sortOrder: 12 },
        { code: 'SIDE_GUIDE_ACCESSORIES', name: 'Accessories for cross adjustment of side guides', sortOrder: 13 },
        { code: 'CHAIN_TENSIONERS', name: 'Chain tensioners', sortOrder: 14 },
        { code: 'BEARING_SUPPORTS', name: 'Bearing supports', sortOrder: 15 },
        { code: 'BUSHINGS', name: 'Bushings', sortOrder: 16 },
        { code: 'HINGES', name: 'Hinges', sortOrder: 17 },
        { code: 'PROCESS_CONTROL', name: 'Process control', sortOrder: 18 },
        { code: 'MODULAR_TRANSFER_PLATES', name: 'Modular transfer plates', sortOrder: 19 },
        { code: 'PRODUCT_GUIDES', name: 'Product guides and accessories', sortOrder: 20 },
        { code: 'GUIDE_RAIL_CLAMPS', name: 'Guide rail clamps', sortOrder: 21 },
        { code: 'CHAIN_GUIDES', name: 'Chain guides and accessories', sortOrder: 22 },
      ],
    },
    {
      code: 'LVL',
      name: 'Levelling Feet',
      sortOrder: 2,
      subCategories: [
        { code: 'FIXED_FEET', name: 'Fixed feet', sortOrder: 1 },
        { code: 'ARTICULATED_FEET', name: 'Articulated feet', sortOrder: 2 },
        { code: 'ADJUSTABLE_FEET', name: 'Adjustable feet', sortOrder: 3 },
        { code: 'ARTICULATED_SANITIZABLE', name: 'Articulated feet, sanitizable', sortOrder: 4 },
        { code: 'ADJUSTABLE_SANITIZABLE', name: 'Adjustable feet, sanitizable', sortOrder: 5 },
        { code: 'SUPPORT_ACCESSORIES', name: 'Accessories for supporting and levelling components', sortOrder: 6 },
        { code: 'LVL_BUSHINGS', name: 'Bushings', sortOrder: 7 },
      ],
    },
    {
      code: 'BRG',
      name: 'Bearings',
      sortOrder: 3,
      subCategories: [
        { code: 'UCF', name: 'UCF', sortOrder: 1 },
        { code: 'UCFL', name: 'UCFL', sortOrder: 2 },
        { code: 'UCFB', name: 'UCFB', sortOrder: 3 },
        { code: 'UCP', name: 'UCP', sortOrder: 4 },
        { code: 'UCPA', name: 'UCPA', sortOrder: 5 },
        { code: 'UCT', name: 'UCT', sortOrder: 6 },
        { code: 'UCFC', name: 'UCFC', sortOrder: 7 },
        { code: 'F_SERIES', name: 'F series', sortOrder: 8 },
      ],
    },
    {
      code: 'TTC',
      name: 'Table Top Chain',
      sortOrder: 4,
      subCategories: [
        { code: 'STRAIGHT_STEEL', name: 'Straight running steel chains', sortOrder: 1 },
        { code: 'SIDEFLEX_STEEL', name: 'Sideflexing steel chains', sortOrder: 2 },
        { code: 'RUBBER_STEEL', name: 'Rubberized surface steel chains', sortOrder: 3 },
        { code: 'STRAIGHT_PLASTIC', name: 'Straight running plastic chains', sortOrder: 4 },
        { code: 'SIDEFLEX_PLASTIC', name: 'Sideflexing plastic chains', sortOrder: 5 },
        { code: 'RUBBER_PLASTIC', name: 'Rubberized surface plastic chains', sortOrder: 6 },
        { code: 'TWO_PIECE', name: 'Two-piece chains', sortOrder: 7 },
        { code: 'GRIPPER', name: 'Gripper chains', sortOrder: 8 },
        { code: 'LBP', name: 'LBP chains (Low back-line pressure)', sortOrder: 9 },
      ],
    },
    {
      code: 'MOD',
      name: 'Modular Chain',
      sortOrder: 5,
      subCategories: [
        { code: 'NANO_8MM', name: '8mm Nanopitch belt', sortOrder: 1 },
        { code: 'HALF_INCH', name: '½" pitch belts and chains', sortOrder: 2 },
        { code: '1IN_LIGHT', name: '1" pitch light duty belts and chains', sortOrder: 3 },
        { code: '3QTR_MEDIUM', name: '¾" pitch medium duty belts and chains', sortOrder: 4 },
        { code: '1IN_HEAVY', name: '1" pitch heavy duty belts and chains', sortOrder: 5 },
        { code: '1IN_SIDEFLEX', name: '1" pitch sideflexing chains', sortOrder: 6 },
        { code: '1QTR_SIDEFLEX', name: '1¼" pitch heavy duty sideflexing belts', sortOrder: 7 },
        { code: 'FIXED_RADIUS', name: 'Heavy duty fixed radius belts', sortOrder: 8 },
        { code: '2IN_RIB', name: '2" pitch heavy duty raised rib belts', sortOrder: 9 },
        { code: '1HALF_UCC', name: '1½" pitch heavy duty UCC chains', sortOrder: 10 },
      ],
    },
    {
      code: 'PWR',
      name: 'Mechanical Power Transmission',
      sortOrder: 6,
      subCategories: [
        { code: 'PWR_SPROCKETS', name: 'Sprockets (power transmission)', sortOrder: 1 },
        { code: 'PLATEWHEELS', name: 'Platewheels, Wheels for table top chains, Hubs and adaptors', sortOrder: 2 },
        { code: 'CHAINS_RIDERS', name: 'Chains and Chain riders', sortOrder: 3 },
        { code: 'SPUR_GEARS', name: 'Straight spur gears and racks', sortOrder: 4 },
        { code: 'BEVEL_GEARS', name: 'Bevel gears', sortOrder: 5 },
        { code: 'TIMING_PULLEYS', name: 'Timing pulleys', sortOrder: 6 },
        { code: 'VBELT_PULLEYS', name: 'V-belt pulleys', sortOrder: 7 },
        { code: 'TIMING_ACCESSORIES', name: 'Timing bars, Flanges for pulleys, Clamping belts plates', sortOrder: 8 },
        { code: 'TAPER_BUSHES', name: 'Taper bushes (BrandRCB)', sortOrder: 9 },
        { code: 'CLAMPING_ELEMENTS', name: 'Clamping elements (RCK Brand)', sortOrder: 10 },
        { code: 'COUPLINGS_LIMITERS', name: 'Flexible couplings (GIFLEX Brand), Torque limiters', sortOrder: 11 },
        { code: 'COLLARS_WASHERS', name: 'Collars and washers', sortOrder: 12 },
        { code: 'PILLOW_BLOCKS', name: 'Pillow blocks (FSB Brand), Monoblock pillow blocks (RCM Brand)', sortOrder: 13 },
      ],
    },
    {
      code: 'SPR',
      name: 'Sprockets and Idlers',
      sortOrder: 7,
      subCategories: [
        { code: 'MOULDED', name: 'Moulded sprockets and idlers', sortOrder: 1 },
        { code: 'MACHINED', name: 'Machined sprockets and idlers', sortOrder: 2 },
      ],
    },
    {
      code: 'BND',
      name: 'Bends',
      sortOrder: 8,
      subCategories: [
        { code: 'MAGNETIC', name: 'Magnetic bends', sortOrder: 1 },
        { code: 'TAB', name: 'TAB bends', sortOrder: 2 },
      ],
    },
    {
      code: 'WRS',
      name: 'Wear Strips',
      sortOrder: 9,
      subCategories: [
        { code: 'WRS_MACHINED', name: 'Machined', sortOrder: 1 },
        { code: 'WRS_EXTRUDED', name: 'Extruded', sortOrder: 2 },
      ],
    },
    {
      code: 'VBT',
      name: 'V-belts',
      sortOrder: 10,
      subCategories: [
        { code: 'WRAPPED_CLASSICAL', name: 'Wrapped classical section v-belt', sortOrder: 1 },
        { code: 'WRAPPED_NARROW', name: 'Wrapped narrow section v-belt', sortOrder: 2 },
        { code: 'COGGED_CLASSICAL', name: 'Classical raw edge cogged v-belt', sortOrder: 3 },
        { code: 'COGGED_NARROW', name: 'Narrow raw edge cogged v-belt', sortOrder: 4 },
      ],
    },
    {
      code: 'GBX',
      name: 'Gearbox and Electric Motors',
      sortOrder: 11,
      subCategories: [
        { code: 'CHM_WORM', name: 'CHM Worm geared motors and worm gear units', sortOrder: 1 },
        { code: 'CHML_TORQUE', name: 'CHML Worm gearboxes with torque limiter', sortOrder: 2 },
        { code: 'CH_WORM', name: 'CH Worm geared motors and worm gear units', sortOrder: 3 },
        { code: 'CHC_HELICAL', name: 'CHC Helical gear units', sortOrder: 4 },
        { code: 'BEVEL_HELICAL', name: 'Bevel helical gear units', sortOrder: 5 },
        { code: 'ELECTRIC_MOTORS', name: 'Electric motors', sortOrder: 6 },
        { code: 'HYGIENIC_MOTORS', name: 'Electric motors "Hygienic" stainless steel & aluminium', sortOrder: 7 },
      ],
    },
  ];

  let totalSubCategories = 0;

  for (const cat of categoryData) {
    // Upsert category
    const category = await prisma.category.upsert({
      where: { code: cat.code },
      update: {
        name: cat.name,
        sortOrder: cat.sortOrder,
      },
      create: {
        code: cat.code,
        name: cat.name,
        sortOrder: cat.sortOrder,
      },
    });

    // Upsert subcategories
    for (const sub of cat.subCategories) {
      await prisma.subCategory.upsert({
        where: {
          categoryId_code: {
            categoryId: category.id,
            code: sub.code,
          },
        },
        update: {
          name: sub.name,
          sortOrder: sub.sortOrder,
        },
        create: {
          code: sub.code,
          name: sub.name,
          sortOrder: sub.sortOrder,
          categoryId: category.id,
        },
      });
      totalSubCategories++;
    }
  }

  console.log(`Seeded ${categoryData.length} categories`);
  console.log(`Seeded ${totalSubCategories} subcategories`);

  // ============================================
  // TEST COMPANY AND USER
  // ============================================
  console.log('Seeding test company and user...');

  // Create test company
  const testCompany = await prisma.company.upsert({
    where: { id: 'test-company-1' },
    update: {},
    create: {
      id: 'test-company-1',
      name: 'Test Company',
      tradingName: 'Test Co',
      tier: 'END_USER',
      isActive: true,
    },
  });

  // Create test user with hashed password
  const testPassword = await bcrypt.hash('password123', BCRYPT_ROUNDS);

  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: testPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'CUSTOMER',
      companyId: testCompany.id,
      isActive: true,
    },
  });

  // Create admin company
  const adminCompany = await prisma.company.upsert({
    where: { id: 'nusaf-internal' },
    update: {},
    create: {
      id: 'nusaf-internal',
      name: 'Nusaf Dynamic Technologies',
      tradingName: 'Nusaf',
      tier: 'DISTRIBUTOR',
      isActive: true,
    },
  });

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', BCRYPT_ROUNDS);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@nusaf.co.za' },
    update: {},
    create: {
      email: 'admin@nusaf.co.za',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      companyId: adminCompany.id,
      isActive: true,
    },
  });

  console.log(`Created test user: ${testUser.email} (password: password123)`);
  console.log(`Created admin user: ${adminUser.email} (password: admin123)`);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
