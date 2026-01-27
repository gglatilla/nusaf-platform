import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { authenticate, requireRole, type AuthenticatedRequest } from '../../../../middleware/auth';
import {
  parseExcelFile,
  applyColumnMapping,
  autoDetectColumnMapping,
  getSampleRows,
} from '../../../../services/excel-parser.service';
import {
  validateImport,
  executeImport,
} from '../../../../services/import.service';
import {
  uploadFileSchema,
  validateImportSchema,
  executeImportSchema,
  type ColumnMapping,
} from '../../../../utils/validation/imports';
import type { ParseResult, ParsedRow } from '../../../../services/excel-parser.service';

const router = Router();

// Apply authentication and admin role check to all routes
router.use(authenticate);
router.use(requireRole('ADMIN', 'MANAGER', 'SALES'));

// In-memory storage for uploaded files (temporary - for development)
// In production, use R2 or similar cloud storage
const fileStore = new Map<string, { buffer: Buffer; parseResult: ParseResult; supplierCode: string; fileName: string }>();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept xlsx and xls files
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    const allowedExts = ['.xlsx', '.xls'];

    const hasAllowedMime = allowedMimes.includes(file.mimetype);
    const hasAllowedExt = allowedExts.some((ext) => file.originalname.toLowerCase().endsWith(ext));

    if (hasAllowedMime || hasAllowedExt) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  },
});

/**
 * POST /api/v1/admin/imports/upload
 * Upload an Excel file for import
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No file uploaded' },
      });
    }

    // Validate supplier code
    const parseResult = uploadFileSchema.safeParse(req.body);
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

    const { supplierCode } = parseResult.data;

    // Parse the Excel file
    const excelResult = parseExcelFile(file.buffer);
    if (!excelResult.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'PARSE_ERROR', message: excelResult.error },
      });
    }

    // Generate file ID and store
    const fileId = randomUUID();
    fileStore.set(fileId, {
      buffer: file.buffer,
      parseResult: excelResult,
      supplierCode,
      fileName: file.originalname,
    });

    // Auto-detect column mapping
    const detectedMapping = autoDetectColumnMapping(excelResult.headers);

    // Get sample rows for preview
    const sampleRows = getSampleRows(excelResult.rows);

    res.json({
      success: true,
      data: {
        fileId,
        fileName: file.originalname,
        headers: excelResult.headers,
        rowCount: excelResult.rowCount,
        sampleRows: sampleRows.map((r) => r.raw),
        detectedMapping,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: error instanceof Error ? error.message : 'Failed to upload file',
      },
    });
  }
});

/**
 * POST /api/v1/admin/imports/validate
 * Validate import data with column mapping
 */
router.post('/validate', async (req, res) => {
  try {
    const parseResult = validateImportSchema.safeParse(req.body);
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

    const { fileId, supplierCode, columnMapping } = parseResult.data;

    // Get stored file
    const stored = fileStore.get(fileId);
    if (!stored) {
      return res.status(404).json({
        success: false,
        error: { code: 'FILE_NOT_FOUND', message: 'File not found. Please upload again.' },
      });
    }

    // Verify supplier code matches
    if (stored.supplierCode !== supplierCode) {
      return res.status(400).json({
        success: false,
        error: { code: 'SUPPLIER_MISMATCH', message: 'Supplier code does not match uploaded file' },
      });
    }

    // Apply column mapping
    const mappedRows = applyColumnMapping(stored.parseResult.rows, columnMapping);

    // Validate all rows
    const validationResult = await validateImport(mappedRows, supplierCode);

    res.json({
      success: true,
      data: validationResult,
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to validate import',
      },
    });
  }
});

/**
 * POST /api/v1/admin/imports/execute
 * Execute the import after validation
 */
router.post('/execute', async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const parseResult = executeImportSchema.safeParse(req.body);
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

    const { fileId, supplierCode, columnMapping, skipErrors } = parseResult.data;

    // Get stored file
    const stored = fileStore.get(fileId);
    if (!stored) {
      return res.status(404).json({
        success: false,
        error: { code: 'FILE_NOT_FOUND', message: 'File not found. Please upload again.' },
      });
    }

    // Apply column mapping
    const mappedRows = applyColumnMapping(stored.parseResult.rows, columnMapping);

    // Validate first
    const validationResult = await validateImport(mappedRows, supplierCode);

    if (!validationResult.isValid && !skipErrors) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Import has validation errors. Set skipErrors=true to import valid rows only.',
        },
        data: {
          errorCount: validationResult.errorRows,
          errors: validationResult.rows.filter((r) => !r.isValid).slice(0, 10),
        },
      });
    }

    // Execute import
    const result = await executeImport(
      validationResult.rows,
      supplierCode,
      authReq.user.id,
      skipErrors
    );

    // Clean up stored file
    fileStore.delete(fileId);

    res.json({
      success: true,
      data: {
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
        errors: result.errors,
        total: result.created + result.updated + result.skipped,
      },
    });
  } catch (error) {
    console.error('Execute error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EXECUTE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to execute import',
      },
    });
  }
});

/**
 * GET /api/v1/admin/imports/suppliers
 * Get list of suppliers available for import
 */
router.get('/suppliers', async (_req, res) => {
  try {
    // For MVP, only Italian suppliers
    const suppliers = [
      { code: 'TECOM', name: 'Tecom', country: 'Italy' },
      { code: 'CHIARAVALLI', name: 'Chiaravalli', country: 'Italy' },
      { code: 'REGINA', name: 'Regina', country: 'Italy' },
    ];

    res.json({
      success: true,
      data: suppliers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get suppliers' },
    });
  }
});

/**
 * GET /api/v1/admin/imports/categories
 * Get list of categories for mapping reference
 */
router.get('/categories', async (_req, res) => {
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
      data: categories.map((cat) => ({
        code: cat.code,
        name: cat.name,
        subcategories: cat.subCategories.map((sub) => ({
          code: sub.code,
          name: sub.name,
        })),
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get categories' },
    });
  }
});

export default router;
