import * as XLSX from "xlsx";
import { tecomToNusafSku } from "../utils";

export interface PriceListRow {
  productCode: string;
  nusafSku?: string; // Auto-converted from Tecom
  description?: string;
  price: number;
  uom?: string;
  weight?: number;
}

export interface ImportResult {
  success: boolean;
  items: PriceListRow[];
  errors: string[];
  warnings: string[];
  stats: {
    totalRows: number;
    validRows: number;
    skippedRows: number;
    convertedSkus: number;
  };
}

export interface ColumnMapping {
  productCode: string;
  description?: string;
  price: string;
  uom?: string;
  weight?: string;
}

/**
 * Import a price list from Excel or CSV file
 */
export async function importPriceList(
  fileBuffer: ArrayBuffer,
  mapping: ColumnMapping,
  options: {
    convertTecomSkus?: boolean;
    supplierCode?: string;
    skipEmptyRows?: boolean;
  } = {}
): Promise<ImportResult> {
  const { convertTecomSkus = false, skipEmptyRows = true } = options;

  const errors: string[] = [];
  const warnings: string[] = [];
  const items: PriceListRow[] = [];

  let totalRows = 0;
  let validRows = 0;
  let skippedRows = 0;
  let convertedSkus = 0;

  try {
    // Read the workbook
    const workbook = XLSX.read(fileBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
      defval: "",
    });

    totalRows = rows.length;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Account for header row and 0-indexing

      // Get product code
      const productCode = String(row[mapping.productCode] || "").trim();
      if (!productCode) {
        if (skipEmptyRows) {
          skippedRows++;
          continue;
        }
        errors.push(`Row ${rowNum}: Missing product code`);
        continue;
      }

      // Get price
      const priceRaw = row[mapping.price];
      const price = parseFloat(String(priceRaw).replace(/[^0-9.-]/g, ""));
      if (isNaN(price) || price < 0) {
        errors.push(`Row ${rowNum}: Invalid price "${priceRaw}" for ${productCode}`);
        continue;
      }

      // Build the item
      const item: PriceListRow = {
        productCode,
        price,
      };

      // Convert Tecom SKU to Nusaf SKU if applicable
      if (convertTecomSkus) {
        const nusafSku = tecomToNusafSku(productCode);
        if (nusafSku) {
          item.nusafSku = nusafSku;
          convertedSkus++;
        }
      }

      // Optional fields
      if (mapping.description) {
        item.description = String(row[mapping.description] || "").trim();
      }

      if (mapping.uom) {
        item.uom = String(row[mapping.uom] || "EACH").trim();
      }

      if (mapping.weight) {
        const weightRaw = row[mapping.weight];
        const weight = parseFloat(String(weightRaw).replace(/[^0-9.-]/g, ""));
        if (!isNaN(weight) && weight >= 0) {
          item.weight = weight;
        }
      }

      items.push(item);
      validRows++;
    }
  } catch (error) {
    errors.push(`Failed to parse file: ${error instanceof Error ? error.message : "Unknown error"}`);
    return {
      success: false,
      items: [],
      errors,
      warnings,
      stats: {
        totalRows: 0,
        validRows: 0,
        skippedRows: 0,
        convertedSkus: 0,
      },
    };
  }

  return {
    success: errors.length === 0,
    items,
    errors,
    warnings,
    stats: {
      totalRows,
      validRows,
      skippedRows,
      convertedSkus,
    },
  };
}

/**
 * Auto-detect column mapping from file headers
 */
export function detectColumnMapping(headers: string[]): Partial<ColumnMapping> {
  const mapping: Partial<ColumnMapping> = {};

  const lowerHeaders = headers.map((h) => h.toLowerCase());

  // Product code patterns
  const codePatterns = ["code", "sku", "part", "item", "product", "articolo"];
  for (let i = 0; i < lowerHeaders.length; i++) {
    if (codePatterns.some((p) => lowerHeaders[i].includes(p))) {
      mapping.productCode = headers[i];
      break;
    }
  }

  // Description patterns
  const descPatterns = ["desc", "name", "title", "designazione"];
  for (let i = 0; i < lowerHeaders.length; i++) {
    if (descPatterns.some((p) => lowerHeaders[i].includes(p))) {
      mapping.description = headers[i];
      break;
    }
  }

  // Price patterns
  const pricePatterns = ["price", "cost", "amount", "prezzo", "eur"];
  for (let i = 0; i < lowerHeaders.length; i++) {
    if (pricePatterns.some((p) => lowerHeaders[i].includes(p))) {
      mapping.price = headers[i];
      break;
    }
  }

  // UOM patterns
  const uomPatterns = ["uom", "unit", "um", "measure"];
  for (let i = 0; i < lowerHeaders.length; i++) {
    if (uomPatterns.some((p) => lowerHeaders[i].includes(p))) {
      mapping.uom = headers[i];
      break;
    }
  }

  // Weight patterns
  const weightPatterns = ["weight", "peso", "kg", "mass"];
  for (let i = 0; i < lowerHeaders.length; i++) {
    if (weightPatterns.some((p) => lowerHeaders[i].includes(p))) {
      mapping.weight = headers[i];
      break;
    }
  }

  return mapping;
}

/**
 * Get headers from an Excel/CSV file
 */
export function getFileHeaders(fileBuffer: ArrayBuffer): string[] {
  const workbook = XLSX.read(fileBuffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Get the header row
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
  const headers: string[] = [];

  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    const cell = worksheet[cellAddress];
    headers.push(cell ? String(cell.v) : `Column ${col + 1}`);
  }

  return headers;
}
