import { Router } from 'express';
import { authenticate, requireRole, type AuthenticatedRequest } from '../../../middleware/auth';
import {
  listSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  softDeleteSupplier,
  addContact,
  updateContact,
  deleteContact,
} from '../../../services/supplier.service';
import {
  supplierListQuerySchema,
  createSupplierSchema,
  updateSupplierSchema,
  createContactSchema,
  updateContactSchema,
} from '../../../utils/validation/suppliers';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// SUPPLIER ROUTES
// ============================================

/**
 * GET /api/v1/suppliers
 * List suppliers with pagination and filtering
 * Access: Admin, Manager, Sales
 */
router.get('/', requireRole('ADMIN', 'MANAGER', 'SALES'), async (req, res) => {
  try {
    const parseResult = supplierListQuerySchema.safeParse(req.query);

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

    const result = await listSuppliers(parseResult.data);

    return res.json({
      success: true,
      data: result.suppliers,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('List suppliers error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to list suppliers',
      },
    });
  }
});

/**
 * GET /api/v1/suppliers/:id
 * Get supplier by ID with contacts
 * Access: Admin, Manager, Sales
 */
router.get('/:id', requireRole('ADMIN', 'MANAGER', 'SALES'), async (req, res) => {
  try {
    const supplier = await getSupplierById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Supplier not found',
        },
      });
    }

    return res.json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    console.error('Get supplier error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get supplier',
      },
    });
  }
});

/**
 * POST /api/v1/suppliers
 * Create a new supplier
 * Access: Admin only
 */
router.post('/', requireRole('ADMIN'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const parseResult = createSupplierSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parseResult.error.flatten().fieldErrors,
        },
      });
    }

    const result = await createSupplier(parseResult.data, authReq.user.id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: result.error,
        },
      });
    }

    return res.status(201).json({
      success: true,
      data: result.supplier,
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create supplier',
      },
    });
  }
});

/**
 * PATCH /api/v1/suppliers/:id
 * Update a supplier
 * Access: Admin only
 */
router.patch('/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const parseResult = updateSupplierSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parseResult.error.flatten().fieldErrors,
        },
      });
    }

    const result = await updateSupplier(req.params.id, parseResult.data, authReq.user.id);

    if (!result.success) {
      const statusCode = result.error === 'Supplier not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 404 ? 'NOT_FOUND' : 'UPDATE_ERROR',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: result.supplier,
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update supplier',
      },
    });
  }
});

/**
 * DELETE /api/v1/suppliers/:id
 * Soft delete a supplier (set isActive = false)
 * Access: Admin only
 */
router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const result = await softDeleteSupplier(req.params.id, authReq.user.id);

    if (!result.success) {
      const statusCode = result.error === 'Supplier not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 404 ? 'NOT_FOUND' : 'DELETE_ERROR',
          message: result.error,
        },
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Delete supplier error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete supplier',
      },
    });
  }
});

// ============================================
// SUPPLIER CONTACT ROUTES
// ============================================

/**
 * POST /api/v1/suppliers/:id/contacts
 * Add a contact to a supplier
 * Access: Admin only
 */
router.post('/:id/contacts', requireRole('ADMIN'), async (req, res) => {
  try {
    const parseResult = createContactSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parseResult.error.flatten().fieldErrors,
        },
      });
    }

    const result = await addContact(req.params.id, parseResult.data);

    if (!result.success) {
      const statusCode = result.error === 'Supplier not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 404 ? 'NOT_FOUND' : 'CREATE_ERROR',
          message: result.error,
        },
      });
    }

    return res.status(201).json({
      success: true,
      data: result.contact,
    });
  } catch (error) {
    console.error('Add contact error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to add contact',
      },
    });
  }
});

/**
 * PATCH /api/v1/suppliers/:id/contacts/:contactId
 * Update a supplier contact
 * Access: Admin only
 */
router.patch('/:id/contacts/:contactId', requireRole('ADMIN'), async (req, res) => {
  try {
    const parseResult = updateContactSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parseResult.error.flatten().fieldErrors,
        },
      });
    }

    const result = await updateContact(req.params.contactId, parseResult.data);

    if (!result.success) {
      const statusCode = result.error === 'Contact not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 404 ? 'NOT_FOUND' : 'UPDATE_ERROR',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: result.contact,
    });
  } catch (error) {
    console.error('Update contact error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update contact',
      },
    });
  }
});

/**
 * DELETE /api/v1/suppliers/:id/contacts/:contactId
 * Delete a supplier contact
 * Access: Admin only
 */
router.delete('/:id/contacts/:contactId', requireRole('ADMIN'), async (req, res) => {
  try {
    const result = await deleteContact(req.params.contactId);

    if (!result.success) {
      const statusCode = result.error === 'Contact not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 404 ? 'NOT_FOUND' : 'DELETE_ERROR',
          message: result.error,
        },
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Delete contact error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete contact',
      },
    });
  }
});

export default router;
