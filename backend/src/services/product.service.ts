import { Prisma, ProductType, UnitOfMeasure } from '@prisma/client';
import { prisma } from '../config/database';
import { Decimal } from '@prisma/client/runtime/library';

// ============================================
// TYPES
// ============================================

export interface CreateProductInput {
  supplierSku: string;
  nusafSku: string;
  description: string;
  supplierId: string;
  categoryId: string;
  subCategoryId?: string | null;
  unitOfMeasure?: UnitOfMeasure;
  costPrice?: number | null;
  listPrice?: number | null;
  productType?: ProductType;
  assemblyLeadDays?: number | null;
  isConfigurable?: boolean;
  longDescription?: string | null;
  weight?: number | null;
  dimensionsJson?: { length?: number; width?: number; height?: number; unit?: string } | null;
  imageUrl?: string | null;
  defaultReorderPoint?: number | null;
  defaultReorderQty?: number | null;
  defaultMinStock?: number | null;
  defaultMaxStock?: number | null;
  leadTimeDays?: number | null;
}

export interface UpdateProductInput {
  nusafSku?: string;
  supplierSku?: string;
  description?: string;
  supplierId?: string;
  categoryId?: string;
  subCategoryId?: string | null;
  unitOfMeasure?: UnitOfMeasure;
  isActive?: boolean;
  costPrice?: number | null;
  listPrice?: number | null;
  productType?: ProductType;
  assemblyLeadDays?: number | null;
  isConfigurable?: boolean;
  longDescription?: string | null;
  weight?: number | null;
  dimensionsJson?: { length?: number; width?: number; height?: number; unit?: string } | null;
  imageUrl?: string | null;
  defaultReorderPoint?: number | null;
  defaultReorderQty?: number | null;
  defaultMinStock?: number | null;
  defaultMaxStock?: number | null;
  leadTimeDays?: number | null;
}

export interface ProductData {
  id: string;
  supplierSku: string;
  nusafSku: string;
  description: string;
  unitOfMeasure: UnitOfMeasure;
  isActive: boolean;
  costPrice: number | null;
  listPrice: number | null;
  priceUpdatedAt: Date | null;
  productType: ProductType;
  assemblyLeadDays: number | null;
  isConfigurable: boolean;
  longDescription: string | null;
  weight: number | null;
  dimensionsJson: unknown | null;
  imageUrl: string | null;
  defaultReorderPoint: number | null;
  defaultReorderQty: number | null;
  defaultMinStock: number | null;
  defaultMaxStock: number | null;
  leadTimeDays: number | null;
  supplierId: string;
  categoryId: string;
  subCategoryId: string | null;
  supplier: { id: string; code: string; name: string };
  category: { id: string; code: string; name: string };
  subCategory: { id: string; code: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// CREATE PRODUCT
// ============================================

/**
 * Create a new product manually
 */
export async function createProduct(
  input: CreateProductInput,
  userId: string
): Promise<{ success: boolean; product?: ProductData; error?: string }> {
  try {
    // Check for duplicate nusafSku
    const existingByNusafSku = await prisma.product.findUnique({
      where: { nusafSku: input.nusafSku },
    });

    if (existingByNusafSku) {
      return { success: false, error: `Product with Nusaf SKU "${input.nusafSku}" already exists` };
    }

    // Check for duplicate supplierSku within same supplier
    const existingBySupplierSku = await prisma.product.findFirst({
      where: {
        supplierId: input.supplierId,
        supplierSku: input.supplierSku,
      },
    });

    if (existingBySupplierSku) {
      return {
        success: false,
        error: `Product with Supplier SKU "${input.supplierSku}" already exists for this supplier`,
      };
    }

    // Verify supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: input.supplierId },
    });

    if (!supplier) {
      return { success: false, error: 'Supplier not found' };
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
    });

    if (!category) {
      return { success: false, error: 'Category not found' };
    }

    // Verify subcategory if provided
    if (input.subCategoryId) {
      const subCategory = await prisma.subCategory.findUnique({
        where: { id: input.subCategoryId },
      });

      if (!subCategory || subCategory.categoryId !== input.categoryId) {
        return { success: false, error: 'Subcategory not found or does not belong to the selected category' };
      }
    }

    const product = await prisma.product.create({
      data: {
        supplierSku: input.supplierSku,
        nusafSku: input.nusafSku,
        description: input.description,
        supplierId: input.supplierId,
        categoryId: input.categoryId,
        subCategoryId: input.subCategoryId ?? null,
        unitOfMeasure: input.unitOfMeasure ?? 'EA',
        isActive: true,
        costPrice: input.costPrice != null ? new Decimal(input.costPrice) : null,
        listPrice: input.listPrice != null ? new Decimal(input.listPrice) : null,
        priceUpdatedAt: input.listPrice != null ? new Date() : null,
        productType: input.productType ?? 'STOCK_ONLY',
        assemblyLeadDays: input.assemblyLeadDays ?? null,
        isConfigurable: input.isConfigurable ?? false,
        longDescription: input.longDescription ?? null,
        weight: input.weight != null ? new Decimal(input.weight) : null,
        dimensionsJson: input.dimensionsJson ?? Prisma.JsonNull,
        imageUrl: input.imageUrl ?? null,
        defaultReorderPoint: input.defaultReorderPoint ?? null,
        defaultReorderQty: input.defaultReorderQty ?? null,
        defaultMinStock: input.defaultMinStock ?? null,
        defaultMaxStock: input.defaultMaxStock ?? null,
        leadTimeDays: input.leadTimeDays ?? null,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        supplier: { select: { id: true, code: true, name: true } },
        category: { select: { id: true, code: true, name: true } },
        subCategory: { select: { id: true, code: true, name: true } },
      },
    });

    return {
      success: true,
      product: transformProduct(product),
    };
  } catch (error) {
    console.error('Create product error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create product',
    };
  }
}

// ============================================
// UPDATE PRODUCT
// ============================================

/**
 * Update an existing product
 */
export async function updateProduct(
  productIdOrSku: string,
  input: UpdateProductInput,
  userId: string
): Promise<{ success: boolean; product?: ProductData; error?: string }> {
  try {
    // Support both UUID (id) and SKU (nusafSku) lookup
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productIdOrSku);
    const whereClause = isUUID ? { id: productIdOrSku } : { nusafSku: productIdOrSku };

    // Check if product exists
    const existing = await prisma.product.findFirst({
      where: { ...whereClause, isActive: true, deletedAt: null },
    });

    if (!existing) {
      return { success: false, error: 'Product not found' };
    }

    // Use the actual product ID for remaining operations
    const productId = existing.id;

    // If changing nusafSku, verify uniqueness
    const skuChanged = input.nusafSku && input.nusafSku !== existing.nusafSku;
    if (skuChanged) {
      const existingByNusafSku = await prisma.product.findUnique({
        where: { nusafSku: input.nusafSku },
      });

      if (existingByNusafSku && existingByNusafSku.id !== productId) {
        return {
          success: false,
          error: `Product with Nusaf SKU "${input.nusafSku}" already exists`,
        };
      }
    }

    // If changing supplier, verify it exists
    if (input.supplierId && input.supplierId !== existing.supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: input.supplierId },
      });

      if (!supplier) {
        return { success: false, error: 'Supplier not found' };
      }

      // Check for duplicate supplierSku in new supplier
      if (input.supplierSku || existing.supplierSku) {
        const sku = input.supplierSku ?? existing.supplierSku;
        const existingBySupplierSku = await prisma.product.findFirst({
          where: {
            supplierId: input.supplierId,
            supplierSku: sku,
            id: { not: productId },
          },
        });

        if (existingBySupplierSku) {
          return {
            success: false,
            error: `Product with Supplier SKU "${sku}" already exists for this supplier`,
          };
        }
      }
    }

    // If changing category, verify it exists
    if (input.categoryId && input.categoryId !== existing.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: input.categoryId },
      });

      if (!category) {
        return { success: false, error: 'Category not found' };
      }
    }

    // If changing subcategory, verify it exists and belongs to the category
    if (input.subCategoryId !== undefined) {
      if (input.subCategoryId !== null) {
        const categoryId = input.categoryId ?? existing.categoryId;
        const subCategory = await prisma.subCategory.findUnique({
          where: { id: input.subCategoryId },
        });

        if (!subCategory || subCategory.categoryId !== categoryId) {
          return { success: false, error: 'Subcategory not found or does not belong to the selected category' };
        }
      }
    }

    // Build update data
    const updateData: Prisma.ProductUpdateInput = {
      updatedBy: userId,
    };

    // Core fields
    if (input.nusafSku !== undefined) updateData.nusafSku = input.nusafSku;
    if (input.supplierSku !== undefined) updateData.supplierSku = input.supplierSku;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.supplierId !== undefined) updateData.supplier = { connect: { id: input.supplierId } };
    if (input.categoryId !== undefined) updateData.category = { connect: { id: input.categoryId } };
    if (input.subCategoryId !== undefined) {
      if (input.subCategoryId === null) {
        updateData.subCategory = { disconnect: true };
      } else {
        updateData.subCategory = { connect: { id: input.subCategoryId } };
      }
    }
    if (input.unitOfMeasure !== undefined) updateData.unitOfMeasure = input.unitOfMeasure;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    // Pricing
    if (input.costPrice !== undefined) {
      updateData.costPrice = input.costPrice === null ? null : new Decimal(input.costPrice);
    }
    if (input.listPrice !== undefined) {
      updateData.listPrice = input.listPrice === null ? null : new Decimal(input.listPrice);
      updateData.priceUpdatedAt = input.listPrice === null ? null : new Date();
    }

    // Classification
    if (input.productType !== undefined) updateData.productType = input.productType;
    if (input.assemblyLeadDays !== undefined) updateData.assemblyLeadDays = input.assemblyLeadDays;
    if (input.isConfigurable !== undefined) updateData.isConfigurable = input.isConfigurable;

    // Extended info
    if (input.longDescription !== undefined) updateData.longDescription = input.longDescription;
    if (input.weight !== undefined) {
      updateData.weight = input.weight === null ? null : new Decimal(input.weight);
    }
    if (input.dimensionsJson !== undefined) {
      updateData.dimensionsJson = input.dimensionsJson === null ? Prisma.JsonNull : input.dimensionsJson;
    }
    if (input.imageUrl !== undefined) updateData.imageUrl = input.imageUrl;

    // Inventory defaults
    if (input.defaultReorderPoint !== undefined) updateData.defaultReorderPoint = input.defaultReorderPoint;
    if (input.defaultReorderQty !== undefined) updateData.defaultReorderQty = input.defaultReorderQty;
    if (input.defaultMinStock !== undefined) updateData.defaultMinStock = input.defaultMinStock;
    if (input.defaultMaxStock !== undefined) updateData.defaultMaxStock = input.defaultMaxStock;
    if (input.leadTimeDays !== undefined) updateData.leadTimeDays = input.leadTimeDays;

    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        supplier: { select: { id: true, code: true, name: true } },
        category: { select: { id: true, code: true, name: true } },
        subCategory: { select: { id: true, code: true, name: true } },
      },
    });

    // Cascade SKU change to SkuMapping records
    if (skuChanged && input.nusafSku) {
      const oldSku = existing.nusafSku;
      await prisma.skuMapping.updateMany({
        where: { nusafSku: oldSku },
        data: { nusafSku: input.nusafSku },
      });
      console.info('[SKU_CHANGE]', {
        productId,
        oldSku,
        newSku: input.nusafSku,
        userId,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      success: true,
      product: transformProduct(product),
    };
  } catch (error) {
    console.error('Update product error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update product',
    };
  }
}

// ============================================
// SOFT DELETE PRODUCT
// ============================================

/**
 * Soft delete a product (set deletedAt timestamp)
 */
export async function softDeleteProduct(
  productId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if product exists
    const existing = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existing) {
      return { success: false, error: 'Product not found' };
    }

    if (existing.deletedAt) {
      return { success: false, error: 'Product is already deleted' };
    }

    await prisma.product.update({
      where: { id: productId },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        isActive: false,
        updatedBy: userId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Soft delete product error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete product',
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Transform Prisma product to ProductData
 */
function transformProduct(product: Prisma.ProductGetPayload<{
  include: {
    supplier: { select: { id: true; code: true; name: true } };
    category: { select: { id: true; code: true; name: true } };
    subCategory: { select: { id: true; code: true; name: true } };
  };
}>): ProductData {
  return {
    id: product.id,
    supplierSku: product.supplierSku,
    nusafSku: product.nusafSku,
    description: product.description,
    unitOfMeasure: product.unitOfMeasure,
    isActive: product.isActive,
    costPrice: product.costPrice ? Number(product.costPrice) : null,
    listPrice: product.listPrice ? Number(product.listPrice) : null,
    priceUpdatedAt: product.priceUpdatedAt,
    productType: product.productType,
    assemblyLeadDays: product.assemblyLeadDays,
    isConfigurable: product.isConfigurable,
    longDescription: product.longDescription,
    weight: product.weight ? Number(product.weight) : null,
    dimensionsJson: product.dimensionsJson,
    imageUrl: product.imageUrl,
    defaultReorderPoint: product.defaultReorderPoint,
    defaultReorderQty: product.defaultReorderQty,
    defaultMinStock: product.defaultMinStock,
    defaultMaxStock: product.defaultMaxStock,
    leadTimeDays: product.leadTimeDays,
    supplierId: product.supplierId,
    categoryId: product.categoryId,
    subCategoryId: product.subCategoryId,
    supplier: product.supplier,
    category: product.category,
    subCategory: product.subCategory,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}
