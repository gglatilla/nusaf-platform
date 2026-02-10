import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../../../middleware/auth';
import { prisma } from '../../../../config/database';
import { hashPassword } from '../../../../utils/password';

const router = Router();

// All routes require authentication + ADMIN or MANAGER role
router.use(authenticate);

// Validation schemas
const staffRoles = ['ADMIN', 'MANAGER', 'SALES', 'PURCHASER', 'WAREHOUSE'] as const;

const userListQuerySchema = z.object({
  search: z.string().optional(),
  role: z.enum(staffRoles).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(50),
});

const createUserSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  role: z.enum(staffRoles),
  employeeCode: z.string().max(20).optional(),
  primaryWarehouse: z.enum(['JHB', 'CT']).optional(),
  companyId: z.string().cuid('Valid company ID required'),
});

const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: z.enum(staffRoles).optional(),
  employeeCode: z.string().max(20).nullish(),
  primaryWarehouse: z.enum(['JHB', 'CT']).nullish(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

/**
 * GET /api/v1/admin/users
 * List staff users with pagination, search, and role filter
 */
router.get('/', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const parseResult = userListQuerySchema.safeParse(req.query);

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

    const { search, role, page, pageSize } = parseResult.data;
    const skip = (page - 1) * pageSize;

    // Only show staff users (exclude CUSTOMER role)
    const where: Record<string, unknown> = {
      role: role ? role : { not: 'CUSTOMER' },
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          employeeCode: true,
          primaryWarehouse: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          company: {
            select: { id: true, name: true },
          },
        },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        skip,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('List users error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to list users',
      },
    });
  }
});

/**
 * POST /api/v1/admin/users
 * Create a new staff user
 */
router.post('/', requireRole('ADMIN'), async (req, res) => {
  try {
    const parseResult = createUserSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid user data',
          details: parseResult.error.flatten().fieldErrors,
        },
      });
    }

    const { password, ...userData } = parseResult.data;

    // Check email uniqueness
    const existing = await prisma.user.findUnique({ where: { email: userData.email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_EMAIL', message: 'A user with this email already exists' },
      });
    }

    // Check employee code uniqueness if provided
    if (userData.employeeCode) {
      const existingCode = await prisma.user.findUnique({ where: { employeeCode: userData.employeeCode } });
      if (existingCode) {
        return res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE_CODE', message: 'This employee code is already in use' },
        });
      }
    }

    // Verify company exists
    const company = await prisma.company.findUnique({ where: { id: userData.companyId } });
    if (!company) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_COMPANY', message: 'Company not found' },
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        employeeCode: true,
        primaryWarehouse: true,
        isActive: true,
        createdAt: true,
        company: {
          select: { id: true, name: true },
        },
      },
    });

    return res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create user',
      },
    });
  }
});

/**
 * PATCH /api/v1/admin/users/:id
 * Update a staff user (role, employeeCode, isActive, primaryWarehouse, password)
 */
router.patch('/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const parseResult = updateUserSchema.safeParse(req.body);

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

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    const { password, ...updateData } = parseResult.data;

    // Check employee code uniqueness if changing
    if (updateData.employeeCode && updateData.employeeCode !== existing.employeeCode) {
      const existingCode = await prisma.user.findUnique({ where: { employeeCode: updateData.employeeCode } });
      if (existingCode) {
        return res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE_CODE', message: 'This employee code is already in use' },
        });
      }
    }

    const data: Record<string, unknown> = { ...updateData };

    // Handle password change
    if (password) {
      data.password = await hashPassword(password);
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        employeeCode: true,
        primaryWarehouse: true,
        isActive: true,
        createdAt: true,
        company: {
          select: { id: true, name: true },
        },
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update user',
      },
    });
  }
});

export default router;
