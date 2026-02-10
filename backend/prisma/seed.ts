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
        { code: 'P-001', name: 'Sprockets (power transmission)', sortOrder: 1 },
        { code: 'P-002', name: 'Platewheels, Wheels, Hubs, Adaptors', sortOrder: 2 },
        { code: 'P-003', name: 'Chains and Chain riders', sortOrder: 3 },
        { code: 'P-004', name: 'Straight spur gears and racks', sortOrder: 4 },
        { code: 'P-005', name: 'Bevel gears', sortOrder: 5 },
        { code: 'P-006', name: 'Timing pulleys', sortOrder: 6 },
        { code: 'P-007', name: 'V-belt pulleys', sortOrder: 7 },
        { code: 'P-008', name: 'Timing bars, Flanges, Clamping plates', sortOrder: 8 },
        { code: 'P-009', name: 'Taper bushes', sortOrder: 9 },
        { code: 'P-010', name: 'Clamping elements', sortOrder: 10 },
        { code: 'P-011', name: 'Flexible couplings, Torque limiters', sortOrder: 11 },
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
      code: 'V',
      name: 'V-belts',
      sortOrder: 8,
      subCategories: [
        { code: 'V-001', name: 'Wrapped classical section', sortOrder: 1 },
        { code: 'V-002', name: 'Wrapped narrow section', sortOrder: 2 },
        { code: 'V-003', name: 'Classical raw edge cogged', sortOrder: 3 },
        { code: 'V-004', name: 'Narrow raw edge cogged', sortOrder: 4 },
      ],
    },
    {
      code: 'D',
      name: 'Bends',
      sortOrder: 9,
      subCategories: [
        { code: 'D-001', name: 'Magnetic bends', sortOrder: 1 },
        { code: 'D-002', name: 'TAB bends', sortOrder: 2 },
      ],
    },
    {
      code: 'W',
      name: 'Wear Strips',
      sortOrder: 10,
      subCategories: [
        { code: 'W-001', name: 'Machined', sortOrder: 1 },
        { code: 'W-002', name: 'Extruded', sortOrder: 2 },
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
    update: { password: testPassword, isActive: true },
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

  // Create internal Nusaf company (for staff users — hidden from customer lists)
  const adminCompany = await prisma.company.upsert({
    where: { id: 'nusaf-internal' },
    update: { isInternal: true },
    create: {
      id: 'nusaf-internal',
      name: 'Nusaf Dynamic Technologies',
      tradingName: 'Nusaf',
      tier: 'DISTRIBUTOR',
      isActive: true,
      isInternal: true,
    },
  });

  // Create cash sales companies (for walk-in / phone customers)
  await prisma.company.upsert({
    where: { id: 'cash-sales-jhb' },
    update: { isCashAccount: true },
    create: {
      id: 'cash-sales-jhb',
      name: 'Cash Sales - Johannesburg',
      tradingName: 'Cash Sales JHB',
      tier: 'END_USER',
      isActive: true,
      isInternal: false,
      isCashAccount: true,
      primaryWarehouse: 'JHB',
      paymentTerms: 'COD',
    },
  });

  await prisma.company.upsert({
    where: { id: 'cash-sales-ct' },
    update: { isCashAccount: true },
    create: {
      id: 'cash-sales-ct',
      name: 'Cash Sales - Cape Town',
      tradingName: 'Cash Sales CT',
      tier: 'END_USER',
      isActive: true,
      isInternal: false,
      isCashAccount: true,
      primaryWarehouse: 'CT',
      paymentTerms: 'COD',
    },
  });

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', BCRYPT_ROUNDS);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@nusaf.co.za' },
    update: { password: adminPassword, isActive: true },
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

  // Create sales user
  const salesPassword = await bcrypt.hash('sales123', BCRYPT_ROUNDS);

  const salesUser = await prisma.user.upsert({
    where: { email: 'sales@nusaf.co.za' },
    update: { password: salesPassword, isActive: true },
    create: {
      email: 'sales@nusaf.co.za',
      password: salesPassword,
      firstName: 'Sales',
      lastName: 'User',
      role: 'SALES',
      companyId: adminCompany.id,
      primaryWarehouse: 'JHB',
      isActive: true,
    },
  });

  // Create warehouse user (stores/operations — receives job cards, picking slips, transfers, dispatch)
  const warehousePassword = await bcrypt.hash('warehouse123', BCRYPT_ROUNDS);

  const warehouseUser = await prisma.user.upsert({
    where: { email: 'warehouse@nusaf.co.za' },
    update: { password: warehousePassword, isActive: true },
    create: {
      email: 'warehouse@nusaf.co.za',
      password: warehousePassword,
      firstName: 'Stores',
      lastName: 'Operator',
      role: 'WAREHOUSE',
      companyId: adminCompany.id,
      primaryWarehouse: 'JHB',
      isActive: true,
    },
  });

  console.log(`Created test user: ${testUser.email} (password: password123)`);
  console.log(`Created sales user: ${salesUser.email} (password: sales123)`);
  console.log(`Created admin user: ${adminUser.email} (password: admin123)`);
  console.log(`Created warehouse user: ${warehouseUser.email} (password: warehouse123)`);

  // ============================================
  // GLOBAL SETTINGS (EUR/ZAR Rate)
  // ============================================
  console.log('Seeding global settings...');

  const globalSettings = await prisma.globalSettings.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      eurZarRate: 20.5, // Default EUR/ZAR rate
      rateUpdatedAt: new Date(),
      rateUpdatedBy: adminUser.id,
    },
  });

  console.log(`Global settings seeded with EUR/ZAR rate: ${globalSettings.eurZarRate}`);

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
