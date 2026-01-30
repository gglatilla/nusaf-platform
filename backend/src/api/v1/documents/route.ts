import { Router } from 'express';
import multer from 'multer';
import { authenticate, type AuthenticatedRequest } from '../../../middleware/auth';
import {
  uploadDocumentSchema,
  documentListQuerySchema,
} from '../../../utils/validation/documents';
import {
  uploadDocument,
  getDocuments,
  getDocumentsForOrder,
  getDownloadUrl,
  deleteDocument,
  isStorageConfigured,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from '../../../services/document.service';
import type { DocumentType } from '@prisma/client';

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`));
    }
  },
});

/**
 * GET /api/v1/documents
 * List documents with filtering
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    const queryResult = documentListQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: queryResult.error.errors,
        },
      });
    }

    const { orderId, type, page, pageSize } = queryResult.data;

    const result = await getDocuments({
      companyId: authReq.user.companyId,
      orderId,
      type,
      page,
      pageSize,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('List documents error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DOCUMENTS_LIST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch documents',
      },
    });
  }
});

/**
 * GET /api/v1/documents/order/:orderId
 * Get documents for a specific order
 */
router.get('/order/:orderId', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { orderId } = req.params;

    const documents = await getDocumentsForOrder(orderId, authReq.user.companyId);

    return res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error('Get documents for order error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DOCUMENTS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch documents for order',
      },
    });
  }
});

/**
 * GET /api/v1/documents/:id/download
 * Get signed download URL for a document
 */
router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    const result = await getDownloadUrl(id, authReq.user.companyId);

    if (!result.success) {
      const statusCode = result.error === 'Document not found' ? 404 : 500;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Document not found' ? 'NOT_FOUND' : 'DOWNLOAD_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: {
        url: result.url,
        filename: result.filename,
      },
    });
  } catch (error) {
    console.error('Get download URL error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DOWNLOAD_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get download URL',
      },
    });
  }
});

/**
 * POST /api/v1/documents/upload
 * Upload a document
 */
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    if (!isStorageConfigured()) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'STORAGE_NOT_CONFIGURED',
          message: 'Document storage is not configured',
        },
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'No file provided',
        },
      });
    }

    // Validate metadata
    const metaResult = uploadDocumentSchema.safeParse(req.body);
    if (!metaResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid document metadata',
          details: metaResult.error.errors,
        },
      });
    }

    const { orderId, type } = metaResult.data;

    const result = await uploadDocument(
      {
        orderId,
        type: type as DocumentType,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        data: req.file.buffer,
      },
      authReq.user.id,
      authReq.user.companyId
    );

    if (!result.success) {
      const statusCode = result.error?.includes('not found') ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error?.includes('not found') ? 'NOT_FOUND' : 'UPLOAD_FAILED',
          message: result.error,
        },
      });
    }

    return res.status(201).json({
      success: true,
      data: result.document,
    });
  } catch (error) {
    console.error('Upload document error:', error);

    // Handle multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
          },
        });
      }
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: error instanceof Error ? error.message : 'Failed to upload document',
      },
    });
  }
});

/**
 * DELETE /api/v1/documents/:id
 * Delete a document
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    const result = await deleteDocument(id, authReq.user.id, authReq.user.companyId);

    if (!result.success) {
      const statusCode = result.error === 'Document not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Document not found' ? 'NOT_FOUND' : 'DELETE_FAILED',
          message: result.error,
        },
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Delete document error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete document',
      },
    });
  }
});

export default router;
