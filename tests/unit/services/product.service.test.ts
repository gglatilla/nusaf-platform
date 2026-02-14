/**
 * Product Service — Unit Tests
 *
 * Tests nusafSku change logic: uniqueness validation, SkuMapping cascade,
 * and backward compatibility when nusafSku is not provided.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// =============================================================================
// MOCK SETUP
// =============================================================================

const { mockPrisma } = vi.hoisted(() => {
  return {
    mockPrisma: {
      product: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      supplier: {
        findUnique: vi.fn(),
      },
      category: {
        findUnique: vi.fn(),
      },
      subCategory: {
        findUnique: vi.fn(),
      },
      skuMapping: {
        updateMany: vi.fn(),
      },
    },
  };
});

vi.mock('../../../backend/src/config/database', () => ({
  prisma: mockPrisma,
}));

import { updateProduct } from '../../../backend/src/services/product.service';

// =============================================================================
// TEST DATA
// =============================================================================

const EXISTING_PRODUCT = {
  id: 'prod-001',
  supplierSku: 'C020080271',
  nusafSku: '1200-80271',
  description: 'Conveyor Chain',
  supplierId: 'sup-001',
  categoryId: 'cat-001',
  subCategoryId: null,
  unitOfMeasure: 'EA' as const,
  isActive: true,
  deletedAt: null,
  costPrice: null,
  listPrice: null,
  productType: 'STOCK_ONLY' as const,
  assemblyLeadDays: null,
  isConfigurable: false,
  longDescription: null,
  weight: null,
  dimensionsJson: null,
  imageUrl: null,
  defaultReorderPoint: null,
  defaultReorderQty: null,
  defaultMinStock: null,
  defaultMaxStock: null,
  leadTimeDays: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'user-001',
  updatedBy: null,
  priceUpdatedAt: null,
  marketingTitle: null,
  marketingDescription: null,
  metaTitle: null,
  metaDescription: null,
  completenessScore: 0,
  isPublished: false,
  publishedAt: null,
};

const UPDATED_PRODUCT_RESULT = {
  ...EXISTING_PRODUCT,
  supplier: { id: 'sup-001', code: 'TECOM', name: 'Tecom' },
  category: { id: 'cat-001', code: 'CONV', name: 'Conveyors' },
  subCategory: null,
};

// =============================================================================
// TESTS
// =============================================================================

describe('Product Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateProduct — nusafSku changes', () => {
    it('should update nusafSku when the new SKU is unique', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(EXISTING_PRODUCT);
      mockPrisma.product.findUnique.mockResolvedValue(null); // No conflict
      mockPrisma.product.update.mockResolvedValue({
        ...UPDATED_PRODUCT_RESULT,
        nusafSku: 'NEW-SKU-123',
      });
      mockPrisma.skuMapping.updateMany.mockResolvedValue({ count: 1 });

      const result = await updateProduct('prod-001', { nusafSku: 'NEW-SKU-123' }, 'user-001');

      expect(result.success).toBe(true);
      expect(result.product?.nusafSku).toBe('NEW-SKU-123');

      // Verify nusafSku was included in update data
      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ nusafSku: 'NEW-SKU-123' }),
        })
      );

      // Verify SkuMapping cascade
      expect(mockPrisma.skuMapping.updateMany).toHaveBeenCalledWith({
        where: { nusafSku: '1200-80271' },
        data: { nusafSku: 'NEW-SKU-123' },
      });
    });

    it('should reject nusafSku change when the new SKU already exists', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(EXISTING_PRODUCT);
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'prod-002', // Different product owns this SKU
        nusafSku: 'TAKEN-SKU',
      });

      const result = await updateProduct('prod-001', { nusafSku: 'TAKEN-SKU' }, 'user-001');

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
      expect(mockPrisma.product.update).not.toHaveBeenCalled();
    });

    it('should allow setting the same nusafSku (no-op)', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(EXISTING_PRODUCT);
      mockPrisma.product.update.mockResolvedValue(UPDATED_PRODUCT_RESULT);

      const result = await updateProduct(
        'prod-001',
        { nusafSku: '1200-80271' }, // Same as existing
        'user-001'
      );

      expect(result.success).toBe(true);
      // Should NOT check uniqueness for same SKU (skuChanged is false)
      expect(mockPrisma.product.findUnique).not.toHaveBeenCalled();
      // Should NOT cascade SkuMapping
      expect(mockPrisma.skuMapping.updateMany).not.toHaveBeenCalled();
    });

    it('should not touch nusafSku when field is not provided', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(EXISTING_PRODUCT);
      mockPrisma.product.update.mockResolvedValue(UPDATED_PRODUCT_RESULT);

      const result = await updateProduct(
        'prod-001',
        { description: 'Updated description' }, // No nusafSku field
        'user-001'
      );

      expect(result.success).toBe(true);
      expect(mockPrisma.product.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.skuMapping.updateMany).not.toHaveBeenCalled();

      // Verify nusafSku was NOT included in update data
      const updateCall = mockPrisma.product.update.mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty('nusafSku');
    });
  });
});
