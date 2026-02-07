// Build: 2026-02-05-v1 - Supplier System Fix
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config';
import { connectDatabase } from './config/database';
import { logger } from './utils/logger';
import {
  CATEGORY_DEFINITIONS,
  CATEGORY_CODE_MIGRATION,
  SUBCATEGORY_CODE_MIGRATION,
  normalizeSubCategoryName,
} from './config/categories';
import healthRoutes from './api/v1/health/route';
import authRoutes from './api/v1/auth/route';
import importsRoutes from './api/v1/admin/imports/route';
import settingsRoutes from './api/v1/admin/settings/route';
import pricingRulesRoutes from './api/v1/admin/pricing-rules/route';
import diagnosticsRoutes from './api/v1/admin/diagnostics/route';
import productsRoutes from './api/v1/products/route';
import categoriesRoutes from './api/v1/categories/route';
import quotesRoutes from './api/v1/quotes/route';
import ordersRoutes from './api/v1/orders/route';
import pickingSlipsRoutes from './api/v1/picking-slips/route';
import jobCardsRoutes from './api/v1/job-cards/route';
import transferRequestsRoutes from './api/v1/transfer-requests/route';
import issuesRoutes from './api/v1/issues/route';
import documentsRoutes from './api/v1/documents/route';
import inventoryRoutes from './api/v1/inventory/route';
import suppliersRoutes from './api/v1/suppliers/route';
import purchaseOrdersRoutes from './api/v1/purchase-orders/route';
import goodsReceiptsRoutes from './api/v1/goods-receipts/route';
import fulfillmentRoutes from './api/v1/fulfillment/route';
import publicQuoteRequestsRoutes from './api/v1/public/quote-requests/route';
import publicProductsRoutes from './api/v1/public/products/route';
import publicCategoriesRoutes from './api/v1/public/categories/route';
import publicContactRoutes from './api/v1/public/contact/route';
import { requestIdMiddleware } from './middleware/request-id';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

const app = express();

// Trust first proxy (Railway reverse proxy) so req.ip resolves correctly
app.set('trust proxy', 1);

// Middleware
app.use(requestIdMiddleware); // Add request ID first for logging
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));
app.use(express.json());

// API Routes
app.use('/api/v1/health', healthRoutes);

// API Documentation (Swagger UI)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Nusaf API Documentation',
}));
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin/imports', importsRoutes);
app.use('/api/v1/admin/settings', settingsRoutes);
app.use('/api/v1/admin/pricing-rules', pricingRulesRoutes);
app.use('/api/v1/admin/diagnostics', diagnosticsRoutes);
app.use('/api/v1/products', productsRoutes);
app.use('/api/v1/categories', categoriesRoutes);
app.use('/api/v1/quotes', quotesRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/picking-slips', pickingSlipsRoutes);
app.use('/api/v1/job-cards', jobCardsRoutes);
app.use('/api/v1/transfer-requests', transferRequestsRoutes);
app.use('/api/v1/issues', issuesRoutes);
app.use('/api/v1/documents', documentsRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/suppliers', suppliersRoutes);
app.use('/api/v1/purchase-orders', purchaseOrdersRoutes);
app.use('/api/v1/goods-receipts', goodsReceiptsRoutes);
app.use('/api/v1/fulfillment', fulfillmentRoutes);

// Public routes (no authentication required)
app.use('/api/v1/public/quote-requests', publicQuoteRequestsRoutes);
app.use('/api/v1/public/products', publicProductsRoutes);
app.use('/api/v1/public/categories', publicCategoriesRoutes);
app.use('/api/v1/public/contact', publicContactRoutes);

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

// Migration endpoint - fixes category/subcategory codes without deleting data
app.post('/api/v1/admin/migrate-category-codes', async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (authHeader !== 'Bearer seed-nusaf-2026') {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const results = {
      categories: { updated: 0, skipped: 0, errors: [] as string[] },
      subCategories: { updated: 0, skipped: 0, errors: [] as string[] },
    };

    // Fix V-002 conflict: if it has wrong name (cogged/raw edge), change to V-004
    const wrongV002 = await prisma.subCategory.findFirst({
      where: {
        code: 'V-002',
        OR: [
          { name: { contains: 'cogged', mode: 'insensitive' } },
          { name: { contains: 'raw edge', mode: 'insensitive' } },
        ],
      },
    });

    if (wrongV002) {
      await prisma.subCategory.update({
        where: { id: wrongV002.id },
        data: { code: 'V-004' },
      });
      logger.info(`Fixed V-002 conflict: renamed to V-004 (${wrongV002.name})`);
      results.subCategories.updated++;
    }

    // Get all existing categories
    const existingCategories = await prisma.category.findMany({
      include: { subCategories: true },
    });

    // Build lookup from definition by name (normalized)
    const categoryByName = new Map(
      CATEGORY_DEFINITIONS.map((c) => [c.name.toLowerCase(), c])
    );

    for (const existingCat of existingCategories) {
      // Check if code needs migration
      const newCategoryCode = CATEGORY_CODE_MIGRATION[existingCat.code];

      if (newCategoryCode) {
        // Old code like 'LVL' -> migrate to 'L'
        try {
          await prisma.category.update({
            where: { id: existingCat.id },
            data: { code: newCategoryCode },
          });
          results.categories.updated++;
          logger.info(`Migrated category: ${existingCat.code} -> ${newCategoryCode}`);
        } catch (err) {
          results.categories.errors.push(
            `Failed to migrate category ${existingCat.code}: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
      } else if (CATEGORY_DEFINITIONS.some((c) => c.code === existingCat.code)) {
        // Already has correct code
        results.categories.skipped++;
      } else {
        // Unknown code - try to match by name
        const defByName = categoryByName.get(existingCat.name.toLowerCase());
        if (defByName) {
          try {
            await prisma.category.update({
              where: { id: existingCat.id },
              data: { code: defByName.code },
            });
            results.categories.updated++;
            logger.info(`Migrated category by name: ${existingCat.code} -> ${defByName.code}`);
          } catch (err) {
            results.categories.errors.push(
              `Failed to migrate category ${existingCat.code} by name: ${err instanceof Error ? err.message : 'Unknown error'}`
            );
          }
        } else {
          results.categories.errors.push(`Unknown category code: ${existingCat.code}`);
        }
      }

      // Migrate subcategories
      // Need to determine the correct category code for subcategory prefix
      const targetCatCode = newCategoryCode || existingCat.code;
      const categoryDef = CATEGORY_DEFINITIONS.find((c) => c.code === targetCatCode);

      if (!categoryDef) {
        continue; // Skip if we can't find the category definition
      }

      for (const existingSub of existingCat.subCategories) {
        // Check if already correct format (X-NNN)
        const correctFormat = /^[A-Z]-\d{3}$/.test(existingSub.code);

        if (correctFormat && existingSub.code.startsWith(targetCatCode + '-')) {
          results.subCategories.skipped++;
          continue;
        }

        // FIRST: Check direct code migration mapping
        const directMappedCode = SUBCATEGORY_CODE_MIGRATION[existingSub.code];
        if (directMappedCode) {
          try {
            await prisma.subCategory.update({
              where: { id: existingSub.id },
              data: { code: directMappedCode },
            });
            results.subCategories.updated++;
            logger.info(`Migrated subcategory (direct): ${existingSub.code} -> ${directMappedCode}`);
            continue;
          } catch (err) {
            results.subCategories.errors.push(
              `Failed to migrate subcategory ${existingSub.code}: ${err instanceof Error ? err.message : 'Unknown error'}`
            );
            continue;
          }
        }

        // THEN: Try to find matching subcategory by name
        const normalizedName = normalizeSubCategoryName(existingSub.name);
        const matchingSub = categoryDef.subCategories.find(
          (s) => normalizeSubCategoryName(s.name) === normalizedName
        );

        if (matchingSub) {
          try {
            await prisma.subCategory.update({
              where: { id: existingSub.id },
              data: { code: matchingSub.code },
            });
            results.subCategories.updated++;
            logger.info(`Migrated subcategory: ${existingSub.code} -> ${matchingSub.code}`);
          } catch (err) {
            results.subCategories.errors.push(
              `Failed to migrate subcategory ${existingSub.code}: ${err instanceof Error ? err.message : 'Unknown error'}`
            );
          }
        } else {
          // Try fuzzy match - maybe the name has slight differences
          const fuzzyMatch = categoryDef.subCategories.find((s) => {
            const defNorm = normalizeSubCategoryName(s.name);
            const existNorm = normalizedName;
            // Check if one contains the other or they share significant words
            return (
              defNorm.includes(existNorm) ||
              existNorm.includes(defNorm) ||
              defNorm.split(' ').some((w) => w.length > 3 && existNorm.includes(w))
            );
          });

          if (fuzzyMatch) {
            try {
              await prisma.subCategory.update({
                where: { id: existingSub.id },
                data: { code: fuzzyMatch.code },
              });
              results.subCategories.updated++;
              logger.info(
                `Migrated subcategory (fuzzy): ${existingSub.code} -> ${fuzzyMatch.code} (${existingSub.name} matched ${fuzzyMatch.name})`
              );
            } catch (err) {
              results.subCategories.errors.push(
                `Failed to migrate subcategory ${existingSub.code}: ${err instanceof Error ? err.message : 'Unknown error'}`
              );
            }
          } else {
            results.subCategories.errors.push(
              `Could not match subcategory: ${existingSub.code} (${existingSub.name}) in category ${targetCatCode}`
            );
          }
        }
      }
    }

    await prisma.$disconnect();

    res.json({
      success: true,
      message: 'Migration completed',
      results,
    });
  } catch (error) {
    logger.error('Migration error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Migration failed',
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

    // Seed categories using centralized config
    for (const cat of CATEGORY_DEFINITIONS) {
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
    logger.error('Reseed error:', error);
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

    // Seed categories using centralized config
    for (const cat of CATEGORY_DEFINITIONS) {
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
    res.json({ success: true, message: 'Database seeded successfully', suppliers: suppliers.length, categories: CATEGORY_DEFINITIONS.length });
  } catch (error) {
    logger.error('Seed error:', error);
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
  logger.error('Unhandled error:', err);
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
  logger.info('Registered routes:');
  app._router.stack.forEach((middleware: { route?: { path: string; methods: Record<string, boolean> }; name?: string; handle?: { stack?: Array<{ route?: { path: string; methods: Record<string, boolean> } }> }; regexp?: RegExp }) => {
    if (middleware.route) {
      // Direct routes
      logger.info(`  ${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === 'router' && middleware.handle?.stack) {
      // Router middleware
      const path = middleware.regexp?.source
        .replace('\\/?(?=\\/|$)', '')
        .replace(/\\\//g, '/')
        .replace('^', '')
        .replace('(?:\\/)?$', '');
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          logger.info(`  ${Object.keys(handler.route.methods).join(', ').toUpperCase()} ${path}${handler.route.path}`);
        }
      });
    }
  });
}

// Start server
async function start(): Promise<void> {
  await connectDatabase();

  app.listen(config.port, () => {
    logger.info(`Backend running on http://localhost:${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logRoutes(app);
  });
}

start().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
