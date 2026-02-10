import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../../../middleware/auth';
import { prisma } from '../../../../config/database';
import { generateAccountNumber } from '../../../../utils/number-generation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// Validation schemas
// ============================================

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
  assignedSalesRepId: z.string().cuid().optional(),
  // New customer management fields
  creditLimit: z.coerce.number().min(0).optional(),
  creditStatus: z.enum(['GOOD_STANDING', 'ON_HOLD', 'SUSPENDED', 'COD_ONLY']).optional(),
  accountStatus: z.enum(['PROSPECT', 'ACTIVE', 'DORMANT', 'CHURNED']).optional(),
  territory: z.string().max(50).optional(),
  discountOverride: z.coerce.number().min(0).max(100).optional(),
  defaultShippingMethod: z.enum(['COLLECTION', 'NUSAF_DELIVERY', 'COURIER', 'FREIGHT']).optional(),
  statementEmail: z.string().email().optional(),
  invoiceEmail: z.string().email().optional(),
  internalNotes: z.string().optional(),
  bbbeeLevel: z.coerce.number().int().min(1).max(8).optional(),
  bbbeeExpiryDate: z.coerce.date().optional(),
});

const updateCompanySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  tradingName: z.string().max(200).nullish(),
  registrationNumber: z.string().max(50).nullish(),
  vatNumber: z.string().max(50).nullish(),
  tier: z.enum(['END_USER', 'OEM_RESELLER', 'DISTRIBUTOR']).optional(),
  paymentTerms: z.enum(['PREPAY', 'COD', 'NET_30', 'NET_60', 'NET_90']).optional(),
  isActive: z.boolean().optional(),
  primaryWarehouse: z.enum(['JHB', 'CT']).nullish(),
  fulfillmentPolicy: z.enum(['SHIP_PARTIAL', 'SHIP_COMPLETE', 'SALES_DECISION']).optional(),
  assignedSalesRepId: z.string().cuid().nullish(),
  // Customer management fields
  creditLimit: z.coerce.number().min(0).nullish(),
  creditStatus: z.enum(['GOOD_STANDING', 'ON_HOLD', 'SUSPENDED', 'COD_ONLY']).optional(),
  accountStatus: z.enum(['PROSPECT', 'ACTIVE', 'DORMANT', 'CHURNED']).optional(),
  territory: z.string().max(50).nullish(),
  discountOverride: z.coerce.number().min(0).max(100).nullish(),
  defaultShippingMethod: z.enum(['COLLECTION', 'NUSAF_DELIVERY', 'COURIER', 'FREIGHT']).nullish(),
  statementEmail: z.string().email().nullish(),
  invoiceEmail: z.string().email().nullish(),
  internalNotes: z.string().nullish(),
  bbbeeLevel: z.coerce.number().int().min(1).max(8).nullish(),
  bbbeeExpiryDate: z.coerce.date().nullish(),
});

const createAddressSchema = z.object({
  type: z.enum(['BILLING', 'SHIPPING']),
  label: z.string().max(100).optional(),
  line1: z.string().min(1, 'Address line 1 is required').max(200),
  line2: z.string().max(200).optional(),
  suburb: z.string().max(100).optional(),
  city: z.string().min(1, 'City is required').max(100),
  province: z.string().min(1, 'Province is required').max(50),
  postalCode: z.string().min(1, 'Postal code is required').max(10),
  country: z.string().max(100).optional().default('South Africa'),
  isDefault: z.boolean().optional().default(false),
  deliveryInstructions: z.string().optional(),
  contactName: z.string().max(100).optional(),
  contactPhone: z.string().max(30).optional(),
});

const updateAddressSchema = createAddressSchema.partial();

const createContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Valid email required'),
  phone: z.string().max(30).optional(),
  mobile: z.string().max(30).optional(),
  jobTitle: z.string().max(100).optional(),
  contactRole: z.enum(['BUYER', 'FINANCE', 'TECHNICAL', 'RECEIVING', 'DECISION_MAKER']).optional(),
  isPrimary: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

const updateContactSchema = createContactSchema.partial();

// ============================================
// Shared select for list response
// ============================================

const companyListSelect = {
  id: true,
  accountNumber: true,
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
  accountStatus: true,
  territory: true,
  assignedSalesRepId: true,
  assignedSalesRep: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      employeeCode: true,
    },
  },
  createdAt: true,
  _count: {
    select: {
      users: true,
      orders: true,
    },
  },
} as const;

// ============================================
// Company CRUD routes
// ============================================

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
            { accountNumber: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : { isInternal: false };

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        select: companyListSelect,
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
 * GET /api/v1/admin/companies/staff-users
 * List staff users eligible for sales rep assignment (ADMIN, MANAGER, SALES roles)
 * NOTE: Must be defined BEFORE /:id to avoid Express matching "staff-users" as an :id param
 */
router.get('/staff-users', requireRole('ADMIN', 'MANAGER', 'SALES'), async (_req, res) => {
  try {
    const staffUsers = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'MANAGER', 'SALES'] },
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        employeeCode: true,
        role: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });

    return res.json({ success: true, data: staffUsers });
  } catch (error) {
    console.error('List staff users error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to list staff users',
      },
    });
  }
});

/**
 * POST /api/v1/admin/companies
 * Create a new company (auto-generates account number)
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

    const accountNumber = await generateAccountNumber();

    const company = await prisma.company.create({
      data: {
        ...parseResult.data,
        accountNumber,
      },
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
 * Get full company detail with addresses and contacts
 */
router.get('/:id', requireRole('ADMIN', 'MANAGER', 'SALES'), async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.params.id },
      include: {
        users: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
        },
        addresses: {
          orderBy: [{ isDefault: 'desc' }, { type: 'asc' }, { createdAt: 'asc' }],
        },
        contacts: {
          orderBy: [{ isPrimary: 'desc' }, { isActive: 'desc' }, { firstName: 'asc' }],
        },
        assignedSalesRep: {
          select: { id: true, firstName: true, lastName: true, email: true, employeeCode: true },
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
 * Update company fields
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

// ============================================
// Address sub-routes
// ============================================

/**
 * POST /api/v1/admin/companies/:id/addresses
 */
router.post('/:id/addresses', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const parseResult = createAddressSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid address data', details: parseResult.error.flatten().fieldErrors },
      });
    }

    const company = await prisma.company.findUnique({ where: { id: req.params.id } });
    if (!company) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Company not found' } });
    }

    // If this is the new default, unset previous defaults of same type
    if (parseResult.data.isDefault) {
      await prisma.companyAddress.updateMany({
        where: { companyId: req.params.id, type: parseResult.data.type, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.companyAddress.create({
      data: { ...parseResult.data, companyId: req.params.id },
    });

    return res.status(201).json({ success: true, data: address });
  } catch (error) {
    console.error('Create address error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Failed to create address' },
    });
  }
});

/**
 * PATCH /api/v1/admin/companies/:id/addresses/:addressId
 */
router.patch('/:id/addresses/:addressId', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const parseResult = updateAddressSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid address data', details: parseResult.error.flatten().fieldErrors },
      });
    }

    const existing = await prisma.companyAddress.findFirst({
      where: { id: req.params.addressId, companyId: req.params.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Address not found' } });
    }

    // If setting as new default, unset previous defaults of same type
    if (parseResult.data.isDefault) {
      const type = parseResult.data.type || existing.type;
      await prisma.companyAddress.updateMany({
        where: { companyId: req.params.id, type, isDefault: true, id: { not: req.params.addressId } },
        data: { isDefault: false },
      });
    }

    const address = await prisma.companyAddress.update({
      where: { id: req.params.addressId },
      data: parseResult.data,
    });

    return res.json({ success: true, data: address });
  } catch (error) {
    console.error('Update address error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Failed to update address' },
    });
  }
});

/**
 * DELETE /api/v1/admin/companies/:id/addresses/:addressId
 */
router.delete('/:id/addresses/:addressId', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const existing = await prisma.companyAddress.findFirst({
      where: { id: req.params.addressId, companyId: req.params.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Address not found' } });
    }

    await prisma.companyAddress.delete({ where: { id: req.params.addressId } });

    return res.json({ success: true, data: null });
  } catch (error) {
    console.error('Delete address error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Failed to delete address' },
    });
  }
});

// ============================================
// Contact sub-routes
// ============================================

/**
 * POST /api/v1/admin/companies/:id/contacts
 */
router.post('/:id/contacts', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const parseResult = createContactSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid contact data', details: parseResult.error.flatten().fieldErrors },
      });
    }

    const company = await prisma.company.findUnique({ where: { id: req.params.id } });
    if (!company) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Company not found' } });
    }

    // If setting as primary, unset previous primary
    if (parseResult.data.isPrimary) {
      await prisma.companyContact.updateMany({
        where: { companyId: req.params.id, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const contact = await prisma.companyContact.create({
      data: { ...parseResult.data, companyId: req.params.id },
    });

    return res.status(201).json({ success: true, data: contact });
  } catch (error) {
    console.error('Create contact error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Failed to create contact' },
    });
  }
});

/**
 * PATCH /api/v1/admin/companies/:id/contacts/:contactId
 */
router.patch('/:id/contacts/:contactId', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const parseResult = updateContactSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid contact data', details: parseResult.error.flatten().fieldErrors },
      });
    }

    const existing = await prisma.companyContact.findFirst({
      where: { id: req.params.contactId, companyId: req.params.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Contact not found' } });
    }

    // If setting as primary, unset previous primary
    if (parseResult.data.isPrimary) {
      await prisma.companyContact.updateMany({
        where: { companyId: req.params.id, isPrimary: true, id: { not: req.params.contactId } },
        data: { isPrimary: false },
      });
    }

    const contact = await prisma.companyContact.update({
      where: { id: req.params.contactId },
      data: parseResult.data,
    });

    return res.json({ success: true, data: contact });
  } catch (error) {
    console.error('Update contact error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Failed to update contact' },
    });
  }
});

/**
 * DELETE /api/v1/admin/companies/:id/contacts/:contactId
 */
router.delete('/:id/contacts/:contactId', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const existing = await prisma.companyContact.findFirst({
      where: { id: req.params.contactId, companyId: req.params.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Contact not found' } });
    }

    await prisma.companyContact.delete({ where: { id: req.params.contactId } });

    return res.json({ success: true, data: null });
  } catch (error) {
    console.error('Delete contact error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Failed to delete contact' },
    });
  }
});

export default router;
