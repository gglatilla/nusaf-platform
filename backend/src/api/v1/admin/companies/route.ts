import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../../../middleware/auth';
import { prisma } from '../../../../config/database';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const companyListQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(200),
  tradingName: z.string().max(200).optional(),
  registrationNumber: z.string().max(50).optional(),
  vatNumber: z.string().max(50).optional(),
  tier: z.enum(['END_USER', 'OEM_RESELLER', 'DISTRIBUTOR']).optional().default('END_USER'),
  primaryWarehouse: z.enum(['JHB', 'CT']).optional(),
  fulfillmentPolicy: z.enum(['SHIP_PARTIAL', 'SHIP_COMPLETE', 'SALES_DECISION']).optional().default('SHIP_COMPLETE'),
  paymentTerms: z.enum(['PREPAY', 'COD', 'NET_30', 'NET_60', 'NET_90']).optional().default('NET_30'),
});

const updateCompanySchema = z.object({
  paymentTerms: z.enum(['PREPAY', 'COD', 'NET_30', 'NET_60', 'NET_90']).optional(),
  tier: z.enum(['END_USER', 'OEM_RESELLER', 'DISTRIBUTOR']).optional(),
  isActive: z.boolean().optional(),
  primaryWarehouse: z.enum(['JHB', 'CT']).nullish(),
  fulfillmentPolicy: z.enum(['SHIP_PARTIAL', 'SHIP_COMPLETE', 'SALES_DECISION']).optional(),
});

/**
 * GET /api/v1/admin/companies
 * List companies with pagination and search
 */
router.get('/', requireRole('ADMIN', 'MANAGER', 'SALES'), async (req, res) => {
  try {
    const parseResult = companyListQuerySchema.safeParse(req.query);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: parseResult.error.flatten().fieldErrors,
        },
      });
    }

    const { search, page, pageSize } = parseResult.data;
    const skip = (page - 1) * pageSize;

    // Hide internal companies (e.g. Nusaf) from the customer list
    const where = search
      ? {
          isInternal: false,
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { tradingName: { contains: search, mode: 'insensitive' as const } },
            { registrationNumber: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : { isInternal: false };

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        select: {
          id: true,
          name: true,
          tradingName: true,
          registrationNumber: true,
          vatNumber: true,
          tier: true,
          isActive: true,
          isCashAccount: true,
          primaryWarehouse: true,
          fulfillmentPolicy: true,
          paymentTerms: true,
          createdAt: true,
          _count: {
            select: {
              users: true,
              orders: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: pageSize,
      }),
      prisma.company.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        companies,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('List companies error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to list companies',
      },
    });
  }
});

/**
 * POST /api/v1/admin/companies
 * Create a new company
 */
router.post('/', requireRole('ADMIN'), async (req, res) => {
  try {
    const parseResult = createCompanySchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid company data',
          details: parseResult.error.flatten().fieldErrors,
        },
      });
    }

    const company = await prisma.company.create({
      data: parseResult.data,
    });

    return res.status(201).json({ success: true, data: company });
  } catch (error) {
    console.error('Create company error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create company',
      },
    });
  }
});

/**
 * GET /api/v1/admin/companies/:id
 * Get company detail
 */
router.get('/:id', requireRole('ADMIN', 'MANAGER', 'SALES'), async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.params.id },
      include: {
        users: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
        },
        _count: {
          select: { orders: true, quotes: true },
        },
      },
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Company not found' },
      });
    }

    return res.json({ success: true, data: company });
  } catch (error) {
    console.error('Get company error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get company',
      },
    });
  }
});

/**
 * PATCH /api/v1/admin/companies/:id
 * Update company (mainly paymentTerms, tier, etc.)
 */
router.patch('/:id', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const parseResult = updateCompanySchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid update data',
          details: parseResult.error.flatten().fieldErrors,
        },
      });
    }

    const existing = await prisma.company.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Company not found' },
      });
    }

    const updated = await prisma.company.update({
      where: { id: req.params.id },
      data: parseResult.data,
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update company error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update company',
      },
    });
  }
});

export default router;
