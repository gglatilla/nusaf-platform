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
} from '../../../../utils/validation/imports';
import {
  isR2Configured,
  uploadToR2,
  deleteFromR2,
  generateImportKey,
} from '../../../../services/r2-storage.service';
import type { ParseResult } from '../../../../services/excel-parser.service';

const router = Router();

// Apply authentication and admin role check to all routes
router.use(authenticate);
router.use(requireRole('ADMIN', 'MANAGER', 'SALES'));

// In-memory storage for uploaded files (fallback for development without R2)
// In production with R2 configured, files are stored in Cloudflare R2
const fileStore = new Map<string, { buffer: Buffer; parseResult: ParseResult; supplierCode: string; fileName: string }>();

// Store metadata separately when using R2 (parseResult is kept in memory, file in R2)
const r2MetadataStore = new Map<string, { r2Key: string; parseResult: ParseResult; supplierCode: string; fileName: string }>();

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

    // Use R2 if configured, otherwise fallback to in-memory storage
    if (isR2Configured()) {
      const r2Key = generateImportKey(file.originalname, supplierCode);
      await uploadToR2(r2Key, file.buffer, file.mimetype);
      r2MetadataStore.set(fileId, {
        r2Key,
        parseResult: excelResult,
        supplierCode,
        fileName: file.originalname,
      });
    } else {
      fileStore.set(fileId, {
        buffer: file.buffer,
        parseResult: excelResult,
        supplierCode,
        fileName: file.originalname,
      });
    }

    // Auto-detect column mapping
    const detectedMapping = autoDetectColumnMapping(excelResult.headers);

    // Get sample rows for preview
    const sampleRows = getSampleRows(excelResult.rows);

    return res.json({
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
    return res.status(500).json({
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

    // Get stored file (check R2 metadata first, then in-memory)
    const r2Metadata = r2MetadataStore.get(fileId);
    const memoryStored = fileStore.get(fileId);

    if (!r2Metadata && !memoryStored) {
      return res.status(404).json({
        success: false,
        error: { code: 'FILE_NOT_FOUND', message: 'File not found. Please upload again.' },
      });
    }

    const storedSupplierCode = r2Metadata?.supplierCode || memoryStored?.supplierCode;
    const storedParseResult = r2Metadata?.parseResult || memoryStored?.parseResult;

    // Verify supplier code matches
    if (storedSupplierCode !== supplierCode) {
      return res.status(400).json({
        success: false,
        error: { code: 'SUPPLIER_MISMATCH', message: 'Supplier code does not match uploaded file' },
      });
    }

    // Apply column mapping
    const mappedRows = applyColumnMapping(storedParseResult!.rows, columnMapping);

    // Validate all rows
    const validationResult = await validateImport(mappedRows, supplierCode);

    return res.json({
      success: true,
      data: validationResult,
    });
  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({
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

    // Get stored file (check R2 metadata first, then in-memory)
    const r2Metadata = r2MetadataStore.get(fileId);
    const memoryStored = fileStore.get(fileId);

    if (!r2Metadata && !memoryStored) {
      return res.status(404).json({
        success: false,
        error: { code: 'FILE_NOT_FOUND', message: 'File not found. Please upload again.' },
      });
    }

    const storedParseResult = r2Metadata?.parseResult || memoryStored?.parseResult;

    // Apply column mapping
    const mappedRows = applyColumnMapping(storedParseResult!.rows, columnMapping);

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
    if (r2Metadata) {
      await deleteFromR2(r2Metadata.r2Key);
      r2MetadataStore.delete(fileId);
    } else {
      fileStore.delete(fileId);
    }

    return res.json({
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
    return res.status(500).json({
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
 * GET /api/v1/admin/imports/history
 * Get import history
 */
router.get('/history', async (_req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const imports = await prisma.importBatch.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        _count: {
          select: { rows: true },
        },
      },
    });

    await prisma.$disconnect();

    res.json({
      success: true,
      data: imports.map((batch) => ({
        id: batch.id,
        fileName: batch.fileName,
        supplierCode: batch.supplierCode,
        status: batch.status,
        totalRows: batch.totalRows,
        processedRows: batch.processedRows,
        successRows: batch.successRows,
        errorRows: batch.errorRows,
        createdAt: batch.createdAt,
        completedAt: batch.completedAt,
        rowCount: batch._count.rows,
      })),
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get import history' },
    });
  }
});

/**
 * GET /api/v1/admin/imports/categories
 * Debug endpoint to list categories in database - useful for diagnosing validation failures
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

    const totalSubCategories = categories.reduce((sum, cat) => sum + cat.subCategories.length, 0);

    res.json({
      success: true,
      data: {
        categoryCount: categories.length,
        subCategoryCount: totalSubCategories,
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
      error: {
        code: 'DATABASE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get categories'
      },
    });
  }
});

export default router;
