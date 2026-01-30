import { Prisma, DocumentType } from '@prisma/client';
import { prisma } from '../config/database';
import {
  uploadToR2,
  downloadFromR2,
  deleteFromR2,
  isR2Configured,
} from './r2-storage.service';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

// R2 configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'nusaf-imports';

// Retention period: 7 years per SA Tax Act
const RETENTION_YEARS = 7;

// Create S3 client for signed URLs
const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Document type labels
 */
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  CUSTOMER_PO: 'Customer PO',
  SIGNED_DELIVERY_NOTE: 'Signed Delivery Note',
};

/**
 * Allowed MIME types for documents
 */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

/**
 * Max file size: 10MB
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Generate R2 key for a document
 */
export function generateDocumentKey(
  companyId: string,
  orderId: string,
  type: DocumentType,
  filename: string
): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `documents/${companyId}/${orderId}/${type}/${timestamp}_${sanitizedFilename}`;
}

/**
 * Calculate retention date (7 years from upload)
 */
export function calculateRetainUntil(): Date {
  const retainUntil = new Date();
  retainUntil.setFullYear(retainUntil.getFullYear() + RETENTION_YEARS);
  return retainUntil;
}

/**
 * Input for uploading a document
 */
export interface UploadDocumentInput {
  orderId: string;
  type: DocumentType;
  filename: string;
  mimeType: string;
  data: Buffer;
}

/**
 * Upload a document to R2 and store metadata
 */
export async function uploadDocument(
  input: UploadDocumentInput,
  userId: string,
  companyId: string
): Promise<{ success: boolean; document?: { id: string; filename: string }; error?: string }> {
  // Check R2 configuration
  if (!isR2Configured()) {
    return { success: false, error: 'Document storage is not configured' };
  }

  // Verify the order exists and belongs to the company
  const order = await prisma.salesOrder.findFirst({
    where: {
      id: input.orderId,
      companyId,
      deletedAt: null,
    },
  });

  if (!order) {
    return { success: false, error: 'Order not found' };
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(input.mimeType)) {
    return {
      success: false,
      error: `File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
    };
  }

  // Validate file size
  if (input.data.length > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  // Generate R2 key
  const r2Key = generateDocumentKey(companyId, input.orderId, input.type, input.filename);

  try {
    // Upload to R2
    await uploadToR2(r2Key, input.data, input.mimeType);

    // Create document record
    const document = await prisma.document.create({
      data: {
        companyId,
        orderId: input.orderId,
        type: input.type,
        filename: input.filename,
        mimeType: input.mimeType,
        sizeBytes: input.data.length,
        r2Key,
        uploadedById: userId,
        retainUntil: calculateRetainUntil(),
      },
    });

    return {
      success: true,
      document: {
        id: document.id,
        filename: document.filename,
      },
    };
  } catch (error) {
    console.error('Failed to upload document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload document',
    };
  }
}

/**
 * Get documents with filtering
 */
export async function getDocuments(options: {
  companyId: string;
  orderId?: string;
  type?: DocumentType;
  page?: number;
  pageSize?: number;
}): Promise<{
  documents: Array<{
    id: string;
    orderId: string;
    orderNumber: string;
    type: DocumentType;
    typeLabel: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    uploadedAt: Date;
    uploadedByName: string;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}> {
  const { companyId, orderId, type, page = 1, pageSize = 20 } = options;

  const where: Prisma.DocumentWhereInput = {
    companyId,
  };

  if (orderId) {
    where.orderId = orderId;
  }

  if (type) {
    where.type = type;
  }

  const [total, documents] = await Promise.all([
    prisma.document.count({ where }),
    prisma.document.findMany({
      where,
      include: {
        order: { select: { orderNumber: true } },
        uploadedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { uploadedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    documents: documents.map((doc) => ({
      id: doc.id,
      orderId: doc.orderId,
      orderNumber: doc.order.orderNumber,
      type: doc.type,
      typeLabel: DOCUMENT_TYPE_LABELS[doc.type],
      filename: doc.filename,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      uploadedAt: doc.uploadedAt,
      uploadedByName: `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}`,
    })),
    pagination: {
      page,
      pageSize,
      totalItems: total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Get documents for an order
 */
export async function getDocumentsForOrder(
  orderId: string,
  companyId: string
): Promise<Array<{
  id: string;
  type: DocumentType;
  typeLabel: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: Date;
  uploadedByName: string;
}>> {
  const documents = await prisma.document.findMany({
    where: {
      orderId,
      companyId,
    },
    include: {
      uploadedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { uploadedAt: 'desc' },
  });

  return documents.map((doc) => ({
    id: doc.id,
    type: doc.type,
    typeLabel: DOCUMENT_TYPE_LABELS[doc.type],
    filename: doc.filename,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    uploadedAt: doc.uploadedAt,
    uploadedByName: `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}`,
  }));
}

/**
 * Get a signed download URL for a document
 */
export async function getDownloadUrl(
  id: string,
  companyId: string
): Promise<{ success: boolean; url?: string; filename?: string; error?: string }> {
  if (!isR2Configured()) {
    return { success: false, error: 'Document storage is not configured' };
  }

  const document = await prisma.document.findFirst({
    where: {
      id,
      companyId,
    },
  });

  if (!document) {
    return { success: false, error: 'Document not found' };
  }

  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: document.r2Key,
      ResponseContentDisposition: `attachment; filename="${document.filename}"`,
    });

    // Generate signed URL that expires in 1 hour
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return {
      success: true,
      url,
      filename: document.filename,
    };
  } catch (error) {
    console.error('Failed to generate download URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate download URL',
    };
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(
  id: string,
  _userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const document = await prisma.document.findFirst({
    where: {
      id,
      companyId,
    },
  });

  if (!document) {
    return { success: false, error: 'Document not found' };
  }

  // Check if we're within retention period
  const now = new Date();
  if (now < document.retainUntil) {
    // Allow deletion but log warning
    console.warn(`Deleting document ${id} before retention period ends (${document.retainUntil})`);
  }

  try {
    // Delete from R2 first
    if (isR2Configured()) {
      await deleteFromR2(document.r2Key);
    }

    // Delete database record
    await prisma.document.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to delete document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete document',
    };
  }
}

/**
 * Check if R2 storage is available
 */
export function isStorageConfigured(): boolean {
  return isR2Configured();
}
