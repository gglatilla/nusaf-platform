// Build: 2026-01-28-v2 - Product Catalog
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config';
import { connectDatabase } from './config/database';
import healthRoutes from './api/v1/health/route';
import authRoutes from './api/v1/auth/route';
import importsRoutes from './api/v1/admin/imports/route';
import settingsRoutes from './api/v1/admin/settings/route';
import pricingRulesRoutes from './api/v1/admin/pricing-rules/route';
import productsRoutes from './api/v1/products/route';
import categoriesRoutes from './api/v1/categories/route';
import quotesRoutes from './api/v1/quotes/route';

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));
app.use(express.json());

// API Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin/imports', importsRoutes);
app.use('/api/v1/admin/settings', settingsRoutes);
app.use('/api/v1/admin/pricing-rules', pricingRulesRoutes);
app.use('/api/v1/products', productsRoutes);
app.use('/api/v1/categories', categoriesRoutes);
app.use('/api/v1/quotes', quotesRoutes);

// Debug endpoint - check categories in database (no auth)
app.get('/api/v1/debug/categories', async (_req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        subCategories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    await prisma.$disconnect();

    res.json({
      success: true,
      data: {
        categoryCount: categories.length,
        subCategoryCount: categories.reduce((sum, cat) => sum + cat.subCategories.length, 0),
        categories: categories.map((cat) => ({
          code: cat.code,
          name: cat.name,
          subCategories: cat.subCategories.map((sub) => ({
            code: sub.code,
            name: sub.name,
          })),
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: error instanceof Error ? error.message : 'Failed' },
    });
  }
});

// Force reseed categories endpoint - fixes wrong category codes
app.post('/api/v1/admin/reseed-categories', async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (authHeader !== 'Bearer seed-nusaf-2026') {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Delete existing categories (subcategories cascade)
    await prisma.subCategory.deleteMany({});
    await prisma.category.deleteMany({});

    // Seed categories with correct codes
    const categoryData = [
      { code: 'C', name: 'Conveyor Components', sortOrder: 1, subCategories: [
        { code: 'C-001', name: 'Bases', sortOrder: 1 }, { code: 'C-002', name: 'Bearing heads', sortOrder: 2 },
        { code: 'C-003', name: 'Connecting joints', sortOrder: 3 }, { code: 'C-004', name: 'Guide rail brackets', sortOrder: 4 },
        { code: 'C-005', name: 'Tightening eyebolts', sortOrder: 5 }, { code: 'C-006', name: 'Heads for brackets', sortOrder: 6 },
        { code: 'C-007', name: 'Knobs and handles', sortOrder: 7 }, { code: 'C-008', name: 'Clamps', sortOrder: 8 },
        { code: 'C-009', name: 'Return rollers', sortOrder: 9 }, { code: 'C-010', name: 'Nose over', sortOrder: 10 },
        { code: 'C-011', name: 'Split shaft collars', sortOrder: 11 }, { code: 'C-012', name: 'Shoes', sortOrder: 12 },
        { code: 'C-013', name: 'Side guide accessories', sortOrder: 13 }, { code: 'C-014', name: 'Chain tensioners', sortOrder: 14 },
        { code: 'C-015', name: 'Bearing supports', sortOrder: 15 }, { code: 'C-016', name: 'Bushings', sortOrder: 16 },
        { code: 'C-017', name: 'Hinges', sortOrder: 17 }, { code: 'C-018', name: 'Process control', sortOrder: 18 },
        { code: 'C-019', name: 'Modular transfer plates', sortOrder: 19 }, { code: 'C-020', name: 'Product guides and accessories', sortOrder: 20 },
        { code: 'C-021', name: 'Guide rail clamps', sortOrder: 21 }, { code: 'C-022', name: 'Product / chain guides and accessories', sortOrder: 22 },
        { code: 'C-023', name: 'Chain guides and accessories', sortOrder: 23 },
      ]},
      { code: 'L', name: 'Levelling Feet', sortOrder: 2, subCategories: [
        { code: 'L-001', name: 'Fixed feet', sortOrder: 1 }, { code: 'L-002', name: 'Articulated feet', sortOrder: 2 },
        { code: 'L-003', name: 'Adjustable feet', sortOrder: 3 }, { code: 'L-004', name: 'Articulated feet, sanitizable', sortOrder: 4 },
        { code: 'L-005', name: 'Adjustable feet, sanitizable', sortOrder: 5 }, { code: 'L-006', name: 'Support accessories', sortOrder: 6 },
        { code: 'L-007', name: 'Bushings', sortOrder: 7 },
      ]},
      { code: 'B', name: 'Bearings', sortOrder: 3, subCategories: [
        { code: 'B-001', name: 'UCF', sortOrder: 1 }, { code: 'B-002', name: 'UCFL', sortOrder: 2 },
        { code: 'B-003', name: 'UCFB', sortOrder: 3 }, { code: 'B-004', name: 'UCP', sortOrder: 4 },
        { code: 'B-005', name: 'UCPA', sortOrder: 5 }, { code: 'B-006', name: 'UCT', sortOrder: 6 },
        { code: 'B-007', name: 'UCFC', sortOrder: 7 }, { code: 'B-008', name: 'F series', sortOrder: 8 },
      ]},
      { code: 'T', name: 'Table Top Chain', sortOrder: 4, subCategories: [
        { code: 'T-001', name: 'Straight running steel chains', sortOrder: 1 }, { code: 'T-002', name: 'Sideflexing steel chains', sortOrder: 2 },
        { code: 'T-003', name: 'Rubberized surface steel chains', sortOrder: 3 }, { code: 'T-004', name: 'Straight running plastic chains', sortOrder: 4 },
        { code: 'T-005', name: 'Sideflexing plastic chains', sortOrder: 5 }, { code: 'T-006', name: 'Rubberized surface plastic chains', sortOrder: 6 },
        { code: 'T-007', name: 'Two-piece chains', sortOrder: 7 }, { code: 'T-008', name: 'Gripper chains', sortOrder: 8 },
        { code: 'T-009', name: 'LBP chains', sortOrder: 9 },
      ]},
      { code: 'M', name: 'Modular Chain', sortOrder: 5, subCategories: [
        { code: 'M-001', name: '8mm Nanopitch belt', sortOrder: 1 }, { code: 'M-002', name: '½" pitch belts and chains', sortOrder: 2 },
        { code: 'M-003', name: '1" pitch light duty', sortOrder: 3 }, { code: 'M-004', name: '¾" pitch medium duty', sortOrder: 4 },
        { code: 'M-005', name: '1" pitch heavy duty', sortOrder: 5 }, { code: 'M-006', name: '1" pitch sideflexing', sortOrder: 6 },
        { code: 'M-007', name: '1¼" pitch heavy duty sideflexing', sortOrder: 7 }, { code: 'M-008', name: 'Heavy duty fixed radius', sortOrder: 8 },
        { code: 'M-009', name: '2" pitch heavy duty raised rib', sortOrder: 9 }, { code: 'M-010', name: '1½" pitch heavy duty UCC', sortOrder: 10 },
      ]},
      { code: 'P', name: 'Power Transmission', sortOrder: 6, subCategories: [
        { code: 'P-001', name: 'Sprockets (power transmission)', sortOrder: 1 }, { code: 'P-002', name: 'Platewheels, Wheels, Hubs, Adaptors', sortOrder: 2 },
        { code: 'P-003', name: 'Chains and Chain riders', sortOrder: 3 }, { code: 'P-004', name: 'Straight spur gears and racks', sortOrder: 4 },
        { code: 'P-005', name: 'Bevel gears', sortOrder: 5 }, { code: 'P-006', name: 'Timing pulleys', sortOrder: 6 },
        { code: 'P-007', name: 'V-belt pulleys', sortOrder: 7 }, { code: 'P-008', name: 'Timing bars, Flanges, Clamping plates', sortOrder: 8 },
        { code: 'P-009', name: 'Taper bushes', sortOrder: 9 }, { code: 'P-010', name: 'Clamping elements', sortOrder: 10 },
        { code: 'P-011', name: 'Flexible couplings, Torque limiters', sortOrder: 11 }, { code: 'P-012', name: 'Collars and washers', sortOrder: 12 },
        { code: 'P-013', name: 'Pillow blocks', sortOrder: 13 },
      ]},
      { code: 'S', name: 'Sprockets & Idlers', sortOrder: 7, subCategories: [
        { code: 'S-001', name: 'Moulded sprockets and idlers', sortOrder: 1 }, { code: 'S-002', name: 'Machined sprockets and idlers', sortOrder: 2 },
      ]},
      { code: 'V', name: 'V-belts', sortOrder: 8, subCategories: [
        { code: 'V-001', name: 'Wrapped classical section', sortOrder: 1 }, { code: 'V-002', name: 'Wrapped narrow section', sortOrder: 2 },
        { code: 'V-003', name: 'Classical raw edge cogged', sortOrder: 3 }, { code: 'V-004', name: 'Narrow raw edge cogged', sortOrder: 4 },
      ]},
      { code: 'D', name: 'Bends', sortOrder: 9, subCategories: [
        { code: 'D-001', name: 'Magnetic bends', sortOrder: 1 }, { code: 'D-002', name: 'TAB bends', sortOrder: 2 },
      ]},
      { code: 'W', name: 'Wear Strips', sortOrder: 10, subCategories: [
        { code: 'W-001', name: 'Machined', sortOrder: 1 }, { code: 'W-002', name: 'Extruded', sortOrder: 2 },
      ]},
      { code: 'G', name: 'Gearbox & Motors', sortOrder: 11, subCategories: [
        { code: 'G-001', name: 'CHM Worm geared motors', sortOrder: 1 }, { code: 'G-002', name: 'CHML Worm gearboxes with torque limiter', sortOrder: 2 },
        { code: 'G-003', name: 'CH Worm geared motors', sortOrder: 3 }, { code: 'G-004', name: 'CHC Helical gear units', sortOrder: 4 },
        { code: 'G-005', name: 'Bevel helical gear units', sortOrder: 5 }, { code: 'G-006', name: 'Electric motors', sortOrder: 6 },
        { code: 'G-007', name: 'Electric motors "Hygienic"', sortOrder: 7 },
      ]},
    ];

    for (const cat of categoryData) {
      const category = await prisma.category.create({
        data: { code: cat.code, name: cat.name, sortOrder: cat.sortOrder },
      });
      for (const sub of cat.subCategories) {
        await prisma.subCategory.create({
          data: { code: sub.code, name: sub.name, sortOrder: sub.sortOrder, categoryId: category.id },
        });
      }
    }

    const finalCount = await prisma.category.count();
    const subCount = await prisma.subCategory.count();
    await prisma.$disconnect();

    res.json({ success: true, message: 'Categories reseeded', categories: finalCount, subCategories: subCount });
  } catch (error) {
    console.error('Reseed error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Reseed failed' });
  }
});

// Temporary seed endpoint - remove after first use
app.post('/api/v1/admin/seed', async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  // Simple protection - require a secret
  if (authHeader !== 'Bearer seed-nusaf-2026') {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const { PrismaClient } = await import('@prisma/client');
    const bcrypt = await import('bcrypt');
    const prisma = new PrismaClient();

    // Check if already seeded
    const existingCategories = await prisma.category.count();
    if (existingCategories > 0) {
      await prisma.$disconnect();
      res.json({ success: true, message: 'Already seeded', categories: existingCategories });
      return;
    }

    // Seed suppliers
    const suppliers = await Promise.all([
      prisma.supplier.upsert({ where: { code: 'TECOM' }, update: {}, create: { code: 'TECOM', name: 'Tecom', country: 'Italy', currency: 'EUR', skuHandling: 'TECOM_CONVERSION', isLocal: false } }),
      prisma.supplier.upsert({ where: { code: 'CHIARAVALLI' }, update: {}, create: { code: 'CHIARAVALLI', name: 'Chiaravalli', country: 'Italy', currency: 'EUR', skuHandling: 'DIRECT', isLocal: false } }),
      prisma.supplier.upsert({ where: { code: 'REGINA' }, update: {}, create: { code: 'REGINA', name: 'Regina', country: 'Italy', currency: 'EUR', skuHandling: 'DIRECT', isLocal: false } }),
      prisma.supplier.upsert({ where: { code: 'NUSAF' }, update: {}, create: { code: 'NUSAF', name: 'Nusaf', country: 'South Africa', currency: 'ZAR', skuHandling: 'NUSAF_INTERNAL', isLocal: true } }),
    ]);

    // Seed categories
    const categoryData = [
      { code: 'C', name: 'Conveyor Components', sortOrder: 1, subCategories: [
        { code: 'C-001', name: 'Bases', sortOrder: 1 }, { code: 'C-002', name: 'Bearing heads', sortOrder: 2 },
        { code: 'C-003', name: 'Connecting joints', sortOrder: 3 }, { code: 'C-004', name: 'Guide rail brackets', sortOrder: 4 },
        { code: 'C-005', name: 'Tightening eyebolts', sortOrder: 5 }, { code: 'C-006', name: 'Heads for brackets', sortOrder: 6 },
        { code: 'C-007', name: 'Knobs and handles', sortOrder: 7 }, { code: 'C-008', name: 'Clamps', sortOrder: 8 },
        { code: 'C-009', name: 'Return rollers', sortOrder: 9 }, { code: 'C-010', name: 'Nose over', sortOrder: 10 },
        { code: 'C-011', name: 'Split shaft collars', sortOrder: 11 }, { code: 'C-012', name: 'Shoes', sortOrder: 12 },
        { code: 'C-013', name: 'Side guide accessories', sortOrder: 13 }, { code: 'C-014', name: 'Chain tensioners', sortOrder: 14 },
        { code: 'C-015', name: 'Bearing supports', sortOrder: 15 }, { code: 'C-016', name: 'Bushings', sortOrder: 16 },
        { code: 'C-017', name: 'Hinges', sortOrder: 17 }, { code: 'C-018', name: 'Process control', sortOrder: 18 },
        { code: 'C-019', name: 'Modular transfer plates', sortOrder: 19 }, { code: 'C-020', name: 'Product guides and accessories', sortOrder: 20 },
        { code: 'C-021', name: 'Guide rail clamps', sortOrder: 21 }, { code: 'C-022', name: 'Product / chain guides and accessories', sortOrder: 22 },
        { code: 'C-023', name: 'Chain guides and accessories', sortOrder: 23 },
      ]},
      { code: 'L', name: 'Levelling Feet', sortOrder: 2, subCategories: [
        { code: 'L-001', name: 'Fixed feet', sortOrder: 1 }, { code: 'L-002', name: 'Articulated feet', sortOrder: 2 },
        { code: 'L-003', name: 'Adjustable feet', sortOrder: 3 }, { code: 'L-004', name: 'Articulated feet, sanitizable', sortOrder: 4 },
        { code: 'L-005', name: 'Adjustable feet, sanitizable', sortOrder: 5 }, { code: 'L-006', name: 'Support accessories', sortOrder: 6 },
        { code: 'L-007', name: 'Bushings', sortOrder: 7 },
      ]},
      { code: 'B', name: 'Bearings', sortOrder: 3, subCategories: [
        { code: 'B-001', name: 'UCF', sortOrder: 1 }, { code: 'B-002', name: 'UCFL', sortOrder: 2 },
        { code: 'B-003', name: 'UCFB', sortOrder: 3 }, { code: 'B-004', name: 'UCP', sortOrder: 4 },
        { code: 'B-005', name: 'UCPA', sortOrder: 5 }, { code: 'B-006', name: 'UCT', sortOrder: 6 },
        { code: 'B-007', name: 'UCFC', sortOrder: 7 }, { code: 'B-008', name: 'F series', sortOrder: 8 },
      ]},
      { code: 'T', name: 'Table Top Chain', sortOrder: 4, subCategories: [
        { code: 'T-001', name: 'Straight running steel chains', sortOrder: 1 }, { code: 'T-002', name: 'Sideflexing steel chains', sortOrder: 2 },
        { code: 'T-003', name: 'Rubberized surface steel chains', sortOrder: 3 }, { code: 'T-004', name: 'Straight running plastic chains', sortOrder: 4 },
        { code: 'T-005', name: 'Sideflexing plastic chains', sortOrder: 5 }, { code: 'T-006', name: 'Rubberized surface plastic chains', sortOrder: 6 },
        { code: 'T-007', name: 'Two-piece chains', sortOrder: 7 }, { code: 'T-008', name: 'Gripper chains', sortOrder: 8 },
        { code: 'T-009', name: 'LBP chains', sortOrder: 9 },
      ]},
      { code: 'M', name: 'Modular Chain', sortOrder: 5, subCategories: [
        { code: 'M-001', name: '8mm Nanopitch belt', sortOrder: 1 }, { code: 'M-002', name: '½" pitch belts and chains', sortOrder: 2 },
        { code: 'M-003', name: '1" pitch light duty', sortOrder: 3 }, { code: 'M-004', name: '¾" pitch medium duty', sortOrder: 4 },
        { code: 'M-005', name: '1" pitch heavy duty', sortOrder: 5 }, { code: 'M-006', name: '1" pitch sideflexing', sortOrder: 6 },
        { code: 'M-007', name: '1¼" pitch heavy duty sideflexing', sortOrder: 7 }, { code: 'M-008', name: 'Heavy duty fixed radius', sortOrder: 8 },
        { code: 'M-009', name: '2" pitch heavy duty raised rib', sortOrder: 9 }, { code: 'M-010', name: '1½" pitch heavy duty UCC', sortOrder: 10 },
      ]},
      { code: 'P', name: 'Power Transmission', sortOrder: 6, subCategories: [
        { code: 'P-001', name: 'Sprockets (power transmission)', sortOrder: 1 }, { code: 'P-002', name: 'Platewheels, Wheels, Hubs, Adaptors', sortOrder: 2 },
        { code: 'P-003', name: 'Chains and Chain riders', sortOrder: 3 }, { code: 'P-004', name: 'Straight spur gears and racks', sortOrder: 4 },
        { code: 'P-005', name: 'Bevel gears', sortOrder: 5 }, { code: 'P-006', name: 'Timing pulleys', sortOrder: 6 },
        { code: 'P-007', name: 'V-belt pulleys', sortOrder: 7 }, { code: 'P-008', name: 'Timing bars, Flanges, Clamping plates', sortOrder: 8 },
        { code: 'P-009', name: 'Taper bushes', sortOrder: 9 }, { code: 'P-010', name: 'Clamping elements', sortOrder: 10 },
        { code: 'P-011', name: 'Flexible couplings, Torque limiters', sortOrder: 11 }, { code: 'P-012', name: 'Collars and washers', sortOrder: 12 },
        { code: 'P-013', name: 'Pillow blocks', sortOrder: 13 },
      ]},
      { code: 'S', name: 'Sprockets & Idlers', sortOrder: 7, subCategories: [
        { code: 'S-001', name: 'Moulded sprockets and idlers', sortOrder: 1 }, { code: 'S-002', name: 'Machined sprockets and idlers', sortOrder: 2 },
      ]},
      { code: 'V', name: 'V-belts', sortOrder: 8, subCategories: [
        { code: 'V-001', name: 'Wrapped classical section', sortOrder: 1 }, { code: 'V-002', name: 'Wrapped narrow section', sortOrder: 2 },
        { code: 'V-003', name: 'Classical raw edge cogged', sortOrder: 3 }, { code: 'V-004', name: 'Narrow raw edge cogged', sortOrder: 4 },
      ]},
      { code: 'D', name: 'Bends', sortOrder: 9, subCategories: [
        { code: 'D-001', name: 'Magnetic bends', sortOrder: 1 }, { code: 'D-002', name: 'TAB bends', sortOrder: 2 },
      ]},
      { code: 'W', name: 'Wear Strips', sortOrder: 10, subCategories: [
        { code: 'W-001', name: 'Machined', sortOrder: 1 }, { code: 'W-002', name: 'Extruded', sortOrder: 2 },
      ]},
      { code: 'G', name: 'Gearbox & Motors', sortOrder: 11, subCategories: [
        { code: 'G-001', name: 'CHM Worm geared motors', sortOrder: 1 }, { code: 'G-002', name: 'CHML Worm gearboxes with torque limiter', sortOrder: 2 },
        { code: 'G-003', name: 'CH Worm geared motors', sortOrder: 3 }, { code: 'G-004', name: 'CHC Helical gear units', sortOrder: 4 },
        { code: 'G-005', name: 'Bevel helical gear units', sortOrder: 5 }, { code: 'G-006', name: 'Electric motors', sortOrder: 6 },
        { code: 'G-007', name: 'Electric motors "Hygienic"', sortOrder: 7 },
      ]},
    ];

    for (const cat of categoryData) {
      const category = await prisma.category.upsert({
        where: { code: cat.code },
        update: { name: cat.name, sortOrder: cat.sortOrder },
        create: { code: cat.code, name: cat.name, sortOrder: cat.sortOrder },
      });
      for (const sub of cat.subCategories) {
        await prisma.subCategory.upsert({
          where: { categoryId_code: { categoryId: category.id, code: sub.code } },
          update: { name: sub.name, sortOrder: sub.sortOrder },
          create: { code: sub.code, name: sub.name, sortOrder: sub.sortOrder, categoryId: category.id },
        });
      }
    }

    // Seed test users
    const BCRYPT_ROUNDS = 12;
    const testCompany = await prisma.company.upsert({
      where: { id: 'test-company-1' },
      update: {},
      create: { id: 'test-company-1', name: 'Test Company', tradingName: 'Test Co', tier: 'END_USER', isActive: true },
    });
    const adminCompany = await prisma.company.upsert({
      where: { id: 'nusaf-internal' },
      update: {},
      create: { id: 'nusaf-internal', name: 'Nusaf Dynamic Technologies', tradingName: 'Nusaf', tier: 'DISTRIBUTOR', isActive: true },
    });
    await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: { email: 'test@example.com', password: await bcrypt.hash('password123', BCRYPT_ROUNDS), firstName: 'Test', lastName: 'User', role: 'CUSTOMER', companyId: testCompany.id, isActive: true },
    });
    await prisma.user.upsert({
      where: { email: 'admin@nusaf.co.za' },
      update: {},
      create: { email: 'admin@nusaf.co.za', password: await bcrypt.hash('admin123', BCRYPT_ROUNDS), firstName: 'Admin', lastName: 'User', role: 'ADMIN', companyId: adminCompany.id, isActive: true },
    });

    await prisma.$disconnect();
    res.json({ success: true, message: 'Database seeded successfully', suppliers: suppliers.length, categories: categoryData.length });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Seed failed' });
  }
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
    },
  });
});

// Helper to log registered routes
function logRoutes(app: express.Application): void {
  console.log('Registered routes:');
  app._router.stack.forEach((middleware: { route?: { path: string; methods: Record<string, boolean> }; name?: string; handle?: { stack?: Array<{ route?: { path: string; methods: Record<string, boolean> } }> }; regexp?: RegExp }) => {
    if (middleware.route) {
      // Direct routes
      console.log(`  ${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === 'router' && middleware.handle?.stack) {
      // Router middleware
      const path = middleware.regexp?.source
        .replace('\\/?(?=\\/|$)', '')
        .replace(/\\\//g, '/')
        .replace('^', '')
        .replace('(?:\\/)?$', '');
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          console.log(`  ${Object.keys(handler.route.methods).join(', ').toUpperCase()} ${path}${handler.route.path}`);
        }
      });
    }
  });
}

// Start server
async function start(): Promise<void> {
  await connectDatabase();

  app.listen(config.port, () => {
    console.log(`Backend running on http://localhost:${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
    logRoutes(app);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
