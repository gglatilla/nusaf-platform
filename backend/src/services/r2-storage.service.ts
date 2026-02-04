import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

// R2 configuration from environment variables
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'nusaf-imports';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

// Create S3 client configured for Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Check if R2 is configured
 */
export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
}

/**
 * Upload a file to R2
 * @param key - The object key (file path in bucket)
 * @param data - The file data as Buffer
 * @param contentType - The MIME type of the file
 * @returns The key of the uploaded file
 */
export async function uploadToR2(
  key: string,
  data: Buffer,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: data,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return key;
}

/**
 * Download a file from R2
 * @param key - The object key to download
 * @returns The file data as Buffer, or null if not found
 */
export async function downloadFromR2(key: string): Promise<Buffer | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return null;
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'NoSuchKey') {
      return null;
    }
    throw error;
  }
}

/**
 * Check if a file exists in R2
 * @param key - The object key to check
 * @returns true if the file exists
 */
export async function existsInR2(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(command);
    return true;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
}

/**
 * Delete a file from R2
 * @param key - The object key to delete
 */
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Generate a unique key for an import file
 * @param fileName - Original file name
 * @param supplierCode - Supplier code
 * @returns A unique key for storing the file
 */
export function generateImportKey(fileName: string, supplierCode: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `imports/${supplierCode}/${timestamp}_${sanitizedFileName}`;
}

/**
 * Generate a unique key for quote request attachments
 * @param sessionId - Guest session ID
 * @param fileName - Original file name
 * @returns A unique key for storing the file
 */
export function generateQuoteRequestKey(sessionId: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `quote-requests/${sessionId}/${timestamp}_${sanitizedFileName}`;
}

/**
 * Storage key types for product assets
 */
export type StorageKeyType = 'document' | 'image';

/**
 * Generate a unique storage key for product assets
 * @param type - Type of asset (document or image)
 * @param productId - The product ID
 * @param fileName - Original file name (extension is preserved)
 * @returns A unique key for storing the file
 */
export function generateStorageKey(
  type: StorageKeyType,
  productId: string,
  fileName: string
): string {
  const extension = fileName.includes('.')
    ? fileName.substring(fileName.lastIndexOf('.'))
    : '';
  const uniqueId = randomUUID();

  if (type === 'document') {
    return `products/${productId}/documents/${uniqueId}${extension}`;
  } else {
    return `products/${productId}/images/${uniqueId}${extension}`;
  }
}

/**
 * Get the public URL for a stored file
 * @param key - The object key
 * @returns The full public URL
 */
export function getPublicUrl(key: string): string {
  if (!R2_PUBLIC_URL) {
    throw new Error('R2_PUBLIC_URL is not configured');
  }
  // Ensure no double slashes
  const baseUrl = R2_PUBLIC_URL.endsWith('/')
    ? R2_PUBLIC_URL.slice(0, -1)
    : R2_PUBLIC_URL;
  return `${baseUrl}/${key}`;
}

/**
 * Get a signed URL for direct client uploads
 * @param key - The object key where the file will be stored
 * @param contentType - The MIME type of the file
 * @param expiresIn - URL expiry time in seconds (default 3600 = 1 hour)
 * @returns A signed URL for uploading
 */
export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Upload a file and return both the key and public URL
 * Convenience wrapper for product document/image uploads
 * @param type - Type of asset (document or image)
 * @param productId - The product ID
 * @param fileName - Original file name
 * @param data - The file data as Buffer
 * @param contentType - The MIME type of the file
 * @returns Object with key and url
 */
export async function uploadProductAsset(
  type: StorageKeyType,
  productId: string,
  fileName: string,
  data: Buffer,
  contentType: string
): Promise<{ key: string; url: string }> {
  const key = generateStorageKey(type, productId, fileName);
  await uploadToR2(key, data, contentType);
  const url = getPublicUrl(key);
  return { key, url };
}
