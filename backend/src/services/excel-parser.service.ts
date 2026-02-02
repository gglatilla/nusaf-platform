import * as XLSX from 'xlsx';
import type { ColumnMapping } from '../utils/validation/imports';

/**
 * Parsed row from Excel file
 */
export interface ParsedRow {
  rowNumber: number;
  raw: Record<string, unknown>;
  mapped: {
    code: string | null;
    description: string | null;
    price: number | null;
    um: string | null;
    category: string | null;
    subcategory: string | null;
    weight: number | null;
  };
}

/**
 * Result of parsing an Excel file
 */
export interface ParseResult {
  success: boolean;
  error?: string;
  headers: string[];
  rowCount: number;
  rows: ParsedRow[];
}

/**
 * Parses an Excel file buffer and extracts headers and rows
 */
export function parseExcelFile(buffer: Buffer): ParseResult {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return {
        success: false,
        error: 'No sheets found in Excel file',
        headers: [],
        rowCount: 0,
        rows: [],
      };
    }

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      return {
        success: false,
        error: 'Could not read worksheet',
        headers: [],
        rowCount: 0,
        rows: [],
      };
    }

    // Convert to JSON with headers
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

    if (jsonData.length === 0) {
      return {
        success: false,
        error: 'Excel file is empty',
        headers: [],
        rowCount: 0,
        rows: [],
      };
    }

    // First row is headers
    const headers = (jsonData[0] || []).map((h) => String(h || '').trim());

    // Rest are data rows
    const rows: ParsedRow[] = [];
    for (let i = 1; i < jsonData.length; i++) {
      const rowData = jsonData[i] || [];

      // Skip completely empty rows
      if (rowData.every((cell) => cell === undefined || cell === null || cell === '')) {
        continue;
      }

      const raw: Record<string, unknown> = {};
      headers.forEach((header, index) => {
        raw[header] = rowData[index];
      });

      rows.push({
        rowNumber: i + 1, // 1-indexed for user display
        raw,
        mapped: {
          code: null,
          description: null,
          price: null,
          um: null,
          category: null,
          subcategory: null,
          weight: null,
        },
      });
    }

    return {
      success: true,
      headers,
      rowCount: rows.length,
      rows,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse Excel file',
      headers: [],
      rowCount: 0,
      rows: [],
    };
  }
}

/**
 * Applies column mapping to parsed rows
 */
export function applyColumnMapping(
  rows: ParsedRow[],
  mapping: ColumnMapping
): ParsedRow[] {
  return rows.map((row) => {
    const getValue = (columnName: string | undefined): string | null => {
      if (!columnName) return null;
      const value = row.raw[columnName];
      if (value === undefined || value === null) return null;
      return String(value).trim();
    };

    const getNumericValue = (columnName: string | undefined): number | null => {
      if (!columnName) return null;
      const value = row.raw[columnName];
      if (value === undefined || value === null) return null;
      const num = typeof value === 'number' ? value : parseFloat(String(value));
      return isNaN(num) ? null : num;
    };

    return {
      ...row,
      mapped: {
        code: getValue(mapping.CODE),
        description: getValue(mapping.DESCRIPTION),
        price: getNumericValue(mapping.PRICE),
        um: getValue(mapping.UM) || 'EA', // Default to 'EA' if not mapped
        category: getValue(mapping.CATEGORY),
        subcategory: getValue(mapping.SUBCATEGORY) || null,
        weight: getNumericValue(mapping.WEIGHT),
      },
    };
  });
}

/**
 * Auto-detect column mapping based on common column names
 */
export function autoDetectColumnMapping(headers: string[]): Partial<ColumnMapping> {
  const mapping: Partial<ColumnMapping> = {};

  const headerLower = headers.map((h) => h.toLowerCase());

  // CODE patterns
  const codePatterns = ['code', 'sku', 'article', 'articolo', 'codice', 'item', 'part', 'product code'];
  const codeIndex = headerLower.findIndex((h) =>
    codePatterns.some((p) => h.includes(p))
  );
  if (codeIndex >= 0) mapping.CODE = headers[codeIndex];

  // DESCRIPTION patterns
  const descPatterns = ['description', 'descrizione', 'desc', 'name', 'nome', 'product name'];
  const descIndex = headerLower.findIndex((h) =>
    descPatterns.some((p) => h.includes(p))
  );
  if (descIndex >= 0) mapping.DESCRIPTION = headers[descIndex];

  // PRICE patterns
  const pricePatterns = ['price', 'prezzo', 'cost', 'costo', 'list', 'listino', 'unit price'];
  const priceIndex = headerLower.findIndex((h) =>
    pricePatterns.some((p) => h.includes(p))
  );
  if (priceIndex >= 0) mapping.PRICE = headers[priceIndex];

  // UM patterns
  const umPatterns = ['um', 'uom', 'unit', 'unita', 'measure', 'misura'];
  const umIndex = headerLower.findIndex((h) =>
    umPatterns.some((p) => h === p || h.includes(p))
  );
  if (umIndex >= 0) mapping.UM = headers[umIndex];

  // CATEGORY patterns
  const catPatterns = ['category', 'categoria', 'cat', 'group', 'gruppo'];
  const catIndex = headerLower.findIndex((h) =>
    catPatterns.some((p) => h.includes(p))
  );
  if (catIndex >= 0) mapping.CATEGORY = headers[catIndex];

  // SUBCATEGORY patterns
  const subCatPatterns = ['subcategory', 'sottocategoria', 'subcat', 'sub category', 'sub-category'];
  const subCatIndex = headerLower.findIndex((h) =>
    subCatPatterns.some((p) => h.includes(p))
  );
  if (subCatIndex >= 0) mapping.SUBCATEGORY = headers[subCatIndex];

  // WEIGHT patterns
  const weightPatterns = ['weight', 'peso', 'kg', 'mass', 'massa'];
  const weightIndex = headerLower.findIndex((h) =>
    weightPatterns.some((p) => h === p || h.includes(p))
  );
  if (weightIndex >= 0) mapping.WEIGHT = headers[weightIndex];

  return mapping;
}

/**
 * Get sample data from parsed rows for preview
 */
export function getSampleRows(rows: ParsedRow[], count: number = 5): ParsedRow[] {
  return rows.slice(0, count);
}
