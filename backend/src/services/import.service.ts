import { PrismaClient } from '@prisma/client';
import { convertTecomSku } from '@nusaf/shared';
import type { ParsedRow } from './excel-parser.service';
import type {
  RowValidationResult,
  RowError,
  RowWarning,
  ImportValidationResult,
} from '../utils/validation/imports';

const prisma = new PrismaClient();

/**
 * Validates a single row of import data
 */
export async function validateRow(
  row: ParsedRow,
  supplierCode: string,
  existingSkus: Set<string>,
  categoryMap: Map<string, string>,
  subcategoryMap: Map<string, { id: string; categoryId: string }>,
  seenSkusInFile: Set<string>
): Promise<RowValidationResult> {
  const errors: RowError[] = [];
  const warnings: RowWarning[] = [];
  const mapped = row.mapped;

  // Required field: CODE
  if (!mapped.code || mapped.code.trim() === '') {
    errors.push({ field: 'CODE', message: 'Product code is required' });
  }

  // Required field: PRICE
  if (mapped.price === null || mapped.price === undefined) {
    errors.push({ field: 'PRICE', message: 'Price is required' });
  } else if (mapped.price <= 0) {
    warnings.push({ field: 'PRICE', message: 'Price is zero or negative' });
  }

  // Required field: DESCRIPTION
  if (!mapped.description || mapped.description.trim() === '') {
    errors.push({ field: 'DESCRIPTION', message: 'Description is required' });
  }

  // Required field: CATEGORY
  if (!mapped.category || mapped.category.trim() === '') {
    errors.push({ field: 'CATEGORY', message: 'Category code is required' });
  } else if (!categoryMap.has(mapped.category)) {
    errors.push({ field: 'CATEGORY', message: `Unknown category code: ${mapped.category}` });
  }

  // Optional field: SUBCATEGORY (but validate if provided)
  if (mapped.subcategory && mapped.subcategory.trim() !== '') {
    const subcat = subcategoryMap.get(mapped.subcategory);
    if (!subcat) {
      errors.push({ field: 'SUBCATEGORY', message: `Unknown subcategory code: ${mapped.subcategory}` });
    } else {
      // Verify subcategory belongs to the specified category
      const categoryId = categoryMap.get(mapped.category || '');
      if (categoryId && subcat.categoryId !== categoryId) {
        errors.push({
          field: 'SUBCATEGORY',
          message: `Subcategory ${mapped.subcategory} does not belong to category ${mapped.category}`,
        });
      }
    }
  }

  // Validate unit of measure
  const validUMs = ['EA', 'M', 'KG', 'BOX', 'SET', 'PAIR', 'ROLL'];
  const um = (mapped.um || 'EA').toUpperCase();
  if (!validUMs.includes(um)) {
    warnings.push({ field: 'UM', message: `Unknown unit of measure: ${um}, defaulting to EA` });
  }

  // Convert SKU for Tecom
  let nusafSku = mapped.code || '';
  if (supplierCode === 'TECOM' && mapped.code) {
    try {
      nusafSku = convertTecomSku(mapped.code);
    } catch (error) {
      errors.push({
        field: 'CODE',
        message: `Invalid Tecom SKU format: ${mapped.code}`,
      });
    }
  }

  // Check for duplicate in file
  if (mapped.code && seenSkusInFile.has(mapped.code)) {
    warnings.push({ field: 'CODE', message: 'Duplicate SKU in file' });
  } else if (mapped.code) {
    seenSkusInFile.add(mapped.code);
  }

  // Check if product exists in database
  const existsInDb = existingSkus.has(nusafSku);
  if (existsInDb) {
    // This is informational - we'll update existing products
  }

  const isValid = errors.length === 0;

  return {
    rowNumber: row.rowNumber,
    isValid,
    errors,
    warnings,
    data: isValid
      ? {
          supplierSku: mapped.code!,
          nusafSku,
          description: mapped.description!,
          price: mapped.price!,
          unitOfMeasure: validUMs.includes(um) ? um : 'EA',
          categoryCode: mapped.category!,
          subcategoryCode: mapped.subcategory || undefined,
        }
      : null,
  };
}

/**
 * Validates all rows in an import file
 */
export async function validateImport(
  rows: ParsedRow[],
  supplierCode: string
): Promise<ImportValidationResult> {
  // Get supplier
  const supplier = await prisma.supplier.findUnique({
    where: { code: supplierCode },
  });

  if (!supplier) {
    return {
      isValid: false,
      totalRows: rows.length,
      validRows: 0,
      errorRows: rows.length,
      warningRows: 0,
      errors: [{ code: 'INVALID_SUPPLIER', message: `Unknown supplier: ${supplierCode}` }],
      rows: [],
      summary: { newProducts: 0, existingProducts: 0, categoryBreakdown: {} },
    };
  }

  // Load categories and subcategories
  const categories = await prisma.category.findMany({ where: { isActive: true } });
  const subcategories = await prisma.subCategory.findMany({
    where: { isActive: true },
    include: { category: true },
  });

  const categoryMap = new Map(categories.map((c) => [c.code, c.id]));
  const subcategoryMap = new Map(
    subcategories.map((s) => [s.code, { id: s.id, categoryId: s.categoryId }])
  );

  // Load existing products for this supplier
  const existingProducts = await prisma.product.findMany({
    where: { supplierId: supplier.id },
    select: { nusafSku: true },
  });
  const existingSkus = new Set(existingProducts.map((p) => p.nusafSku));

  // Validate each row
  const seenSkusInFile = new Set<string>();
  const validatedRows: RowValidationResult[] = [];

  for (const row of rows) {
    const result = await validateRow(
      row,
      supplierCode,
      existingSkus,
      categoryMap,
      subcategoryMap,
      seenSkusInFile
    );
    validatedRows.push(result);
  }

  // Calculate summary
  const validRows = validatedRows.filter((r) => r.isValid);
  const errorRows = validatedRows.filter((r) => !r.isValid);
  const warningRows = validatedRows.filter((r) => r.warnings.length > 0);

  let newProducts = 0;
  let existingProductsCount = 0;
  const categoryBreakdown: Record<string, number> = {};

  for (const row of validRows) {
    if (row.data) {
      if (existingSkus.has(row.data.nusafSku)) {
        existingProductsCount++;
      } else {
        newProducts++;
      }

      const catCode = row.data.categoryCode;
      categoryBreakdown[catCode] = (categoryBreakdown[catCode] || 0) + 1;
    }
  }

  return {
    isValid: errorRows.length === 0,
    totalRows: rows.length,
    validRows: validRows.length,
    errorRows: errorRows.length,
    warningRows: warningRows.length,
    errors: [],
    rows: validatedRows,
    summary: {
      newProducts,
      existingProducts: existingProductsCount,
      categoryBreakdown,
    },
  };
}

/**
 * Executes the import, creating/updating products in the database
 */
export async function executeImport(
  rows: RowValidationResult[],
  supplierCode: string,
  userId: string,
  skipErrors: boolean = false
): Promise<{
  success: boolean;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ rowNumber: number; message: string }>;
}> {
  const supplier = await prisma.supplier.findUnique({
    where: { code: supplierCode },
  });

  if (!supplier) {
    return {
      success: false,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [{ rowNumber: 0, message: `Unknown supplier: ${supplierCode}` }],
    };
  }

  // Load categories and subcategories for ID lookup
  const categories = await prisma.category.findMany();
  const subcategories = await prisma.subCategory.findMany();

  const categoryMap = new Map(categories.map((c) => [c.code, c.id]));
  const subcategoryMap = new Map(subcategories.map((s) => [s.code, s.id]));

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: Array<{ rowNumber: number; message: string }> = [];

  // Process rows in batches
  const validRows = skipErrors ? rows.filter((r) => r.isValid) : rows;

  for (const row of validRows) {
    if (!row.isValid || !row.data) {
      if (!skipErrors) {
        errors.push({ rowNumber: row.rowNumber, message: row.errors[0]?.message || 'Invalid row' });
      }
      skipped++;
      continue;
    }

    const { data } = row;
    const categoryId = categoryMap.get(data.categoryCode);
    const subcategoryId = data.subcategoryCode ? subcategoryMap.get(data.subcategoryCode) : undefined;

    if (!categoryId) {
      errors.push({ rowNumber: row.rowNumber, message: `Category not found: ${data.categoryCode}` });
      skipped++;
      continue;
    }

    try {
      // Check if product exists
      const existingProduct = await prisma.product.findFirst({
        where: {
          supplierId: supplier.id,
          supplierSku: data.supplierSku,
        },
      });

      if (existingProduct) {
        // Update existing product
        await prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            description: data.description,
            unitOfMeasure: data.unitOfMeasure as 'EA' | 'M' | 'KG' | 'BOX' | 'SET' | 'PAIR' | 'ROLL',
            categoryId,
            subCategoryId: subcategoryId,
            updatedBy: userId,
          },
        });
        updated++;
      } else {
        // Create new product
        await prisma.product.create({
          data: {
            supplierSku: data.supplierSku,
            nusafSku: data.nusafSku,
            description: data.description,
            unitOfMeasure: data.unitOfMeasure as 'EA' | 'M' | 'KG' | 'BOX' | 'SET' | 'PAIR' | 'ROLL',
            supplierId: supplier.id,
            categoryId,
            subCategoryId: subcategoryId,
            createdBy: userId,
          },
        });
        created++;
      }
    } catch (error) {
      errors.push({
        rowNumber: row.rowNumber,
        message: error instanceof Error ? error.message : 'Database error',
      });
      skipped++;
    }
  }

  return {
    success: errors.length === 0,
    created,
    updated,
    skipped,
    errors,
  };
}
