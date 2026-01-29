import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { authenticate, requireRole, type AuthenticatedRequest } from '../../../../middleware/auth';
import { recalculateProductPrices } from '../../../../services/pricing.service';

const router = Router();
const prisma = new PrismaClient();

// Apply authentication and admin role check to all routes
router.use(authenticate);
router.use(requireRole('ADMIN', 'MANAGER'));

// Validation schemas
const createPricingRuleSchema = z.object({
  supplierId: z.string().min(1, 'Supplier ID is required'),
  categoryId: z.string().min(1, 'Category ID is required'),
  subCategoryId: z.string().nullable().optional(),
  isGross: z.boolean().default(false),
  discountPercent: z.number().min(0).max(100).nullable().optional(),
  freightPercent: z.number().min(0).max(100),
  marginDivisor: z.number().positive().max(1, 'Margin divisor must be between 0 and 1'),
});

const updatePricingRuleSchema = createPricingRuleSchema.partial().omit({
  supplierId: true,
  categoryId: true,
  subCategoryId: true,
});

/**
 * GET /api/v1/admin/pricing-rules
 * List all pricing rules with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { supplierId, categoryId } = req.query;

    const where: { supplierId?: string; categoryId?: string } = {};

    // Lookup supplier by code if provided (frontend sends code, not CUID)
    if (typeof supplierId === 'string') {
      const supplier = await prisma.supplier.findUnique({
        where: { code: supplierId },
      });
      if (supplier) {
        where.supplierId = supplier.id;
      } else {
        // Code not found - return empty array instead of all rules
        return res.json({ success: true, data: [] });
      }
    }

    // Lookup category by code if provided
    if (typeof categoryId === 'string') {
      const category = await prisma.category.findUnique({
        where: { code: categoryId },
      });
      if (category) {
        where.categoryId = category.id;
      } else {
        return res.json({ success: true, data: [] });
      }
    }

    const rules = await prisma.pricingRule.findMany({
      where,
      include: {
        supplier: { select: { id: true, code: true, name: true } },
        category: { select: { id: true, code: true, name: true } },
        subCategory: { select: { id: true, code: true, name: true } },
      },
      orderBy: [{ supplier: { code: 'asc' } }, { category: { code: 'asc' } }, { subCategory: { code: 'asc' } }],
    });

    return res.json({
      success: true,
      data: rules.map((rule) => ({
        id: rule.id,
        supplier: rule.supplier,
        category: rule.category,
        subCategory: rule.subCategory,
        isGross: rule.isGross,
        discountPercent: rule.discountPercent ? Number(rule.discountPercent) : null,
        freightPercent: Number(rule.freightPercent),
        marginDivisor: Number(rule.marginDivisor),
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
      })),
    });
  } catch (error) {
    console.error('List pricing rules error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'LIST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to list pricing rules',
      },
    });
  }
});

/**
 * GET /api/v1/admin/pricing-rules/:id
 * Get a single pricing rule
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const rule = await prisma.pricingRule.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, code: true, name: true } },
        category: { select: { id: true, code: true, name: true } },
        subCategory: { select: { id: true, code: true, name: true } },
      },
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Pricing rule not found' },
      });
    }

    return res.json({
      success: true,
      data: {
        id: rule.id,
        supplier: rule.supplier,
        category: rule.category,
        subCategory: rule.subCategory,
        isGross: rule.isGross,
        discountPercent: rule.discountPercent ? Number(rule.discountPercent) : null,
        freightPercent: Number(rule.freightPercent),
        marginDivisor: Number(rule.marginDivisor),
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get pricing rule error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'GET_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get pricing rule',
      },
    });
  }
});

/**
 * POST /api/v1/admin/pricing-rules
 * Create a new pricing rule
 */
router.post('/', async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const parseResult = createPricingRuleSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request',
          details: parseResult.error.flatten().fieldErrors,
        },
      });
    }

    const data = parseResult.data;

    // Lookup supplier by code (frontend sends code, database expects CUID)
    const supplier = await prisma.supplier.findUnique({
      where: { code: data.supplierId },
    });
    if (!supplier) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SUPPLIER',
          message: `Supplier not found: ${data.supplierId}`,
        },
      });
    }

    // Lookup category by code
    const category = await prisma.category.findUnique({
      where: { code: data.categoryId },
    });
    if (!category) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CATEGORY',
          message: `Category not found: ${data.categoryId}`,
        },
      });
    }

    // Lookup subCategory by code + categoryId (code is not unique across categories)
    let subCategoryId: string | null = null;
    if (data.subCategoryId) {
      const subCategory = await prisma.subCategory.findFirst({
        where: {
          code: data.subCategoryId,
          categoryId: category.id,
        },
      });
      if (!subCategory) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_SUBCATEGORY',
            message: `SubCategory not found: ${data.subCategoryId}`,
          },
        });
      }
      subCategoryId = subCategory.id;
    }

    // Check if rule already exists for this combination
    const existing = await prisma.pricingRule.findFirst({
      where: {
        supplierId: supplier.id,
        categoryId: category.id,
        subCategoryId: subCategoryId,
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE',
          message: 'A pricing rule already exists for this supplier/category/subcategory combination',
        },
      });
    }

    const rule = await prisma.pricingRule.create({
      data: {
        supplierId: supplier.id,
        categoryId: category.id,
        subCategoryId: subCategoryId,
        isGross: data.isGross,
        discountPercent: data.discountPercent != null ? new Decimal(data.discountPercent) : null,
        freightPercent: new Decimal(data.freightPercent),
        marginDivisor: new Decimal(data.marginDivisor),
        createdBy: authReq.user.id,
      },
      include: {
        supplier: { select: { id: true, code: true, name: true } },
        category: { select: { id: true, code: true, name: true } },
        subCategory: { select: { id: true, code: true, name: true } },
      },
    });

    // Trigger price recalculation for affected products
    try {
      await recalculateProductPrices({
        supplierId: supplier.id,
        categoryId: category.id,
        userId: authReq.user.id,
      });
    } catch (recalcError) {
      // Log but don't fail the request - rule was created successfully
      console.error('Price recalculation failed:', recalcError);
    }

    return res.status(201).json({
      success: true,
      data: {
        id: rule.id,
        supplier: rule.supplier,
        category: rule.category,
        subCategory: rule.subCategory,
        isGross: rule.isGross,
        discountPercent: rule.discountPercent ? Number(rule.discountPercent) : null,
        freightPercent: Number(rule.freightPercent),
        marginDivisor: Number(rule.marginDivisor),
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
      },
    });
  } catch (error) {
    console.error('Create pricing rule error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create pricing rule',
      },
    });
  }
});

/**
 * PATCH /api/v1/admin/pricing-rules/:id
 * Update a pricing rule
 */
router.patch('/:id', async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;
    const parseResult = updatePricingRuleSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request',
          details: parseResult.error.flatten().fieldErrors,
        },
      });
    }

    const data = parseResult.data;

    // Check if rule exists
    const existing = await prisma.pricingRule.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Pricing rule not found' },
      });
    }

    const rule = await prisma.pricingRule.update({
      where: { id },
      data: {
        ...(data.isGross !== undefined && { isGross: data.isGross }),
        ...(data.discountPercent !== undefined && {
          discountPercent: data.discountPercent != null ? new Decimal(data.discountPercent) : null,
        }),
        ...(data.freightPercent !== undefined && { freightPercent: new Decimal(data.freightPercent) }),
        ...(data.marginDivisor !== undefined && { marginDivisor: new Decimal(data.marginDivisor) }),
        updatedBy: authReq.user.id,
      },
      include: {
        supplier: { select: { id: true, code: true, name: true } },
        category: { select: { id: true, code: true, name: true } },
        subCategory: { select: { id: true, code: true, name: true } },
      },
    });

    // Trigger price recalculation for affected products
    try {
      await recalculateProductPrices({
        supplierId: existing.supplierId,
        categoryId: existing.categoryId,
        userId: authReq.user.id,
      });
    } catch (recalcError) {
      // Log but don't fail the request - rule was updated successfully
      console.error('Price recalculation failed:', recalcError);
    }

    return res.json({
      success: true,
      data: {
        id: rule.id,
        supplier: rule.supplier,
        category: rule.category,
        subCategory: rule.subCategory,
        isGross: rule.isGross,
        discountPercent: rule.discountPercent ? Number(rule.discountPercent) : null,
        freightPercent: Number(rule.freightPercent),
        marginDivisor: Number(rule.marginDivisor),
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update pricing rule error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update pricing rule',
      },
    });
  }
});

/**
 * DELETE /api/v1/admin/pricing-rules/:id
 * Delete a pricing rule
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if rule exists
    const existing = await prisma.pricingRule.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Pricing rule not found' },
      });
    }

    await prisma.pricingRule.delete({ where: { id } });

    return res.json({
      success: true,
      message: 'Pricing rule deleted',
    });
  } catch (error) {
    console.error('Delete pricing rule error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete pricing rule',
      },
    });
  }
});

export default router;
