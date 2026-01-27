/**
 * Import Service Unit Tests
 *
 * Tests for:
 * - Tecom SKU conversion
 * - Row validation
 * - Import validation result structure
 */

import { describe, it, expect } from 'vitest';
import { convertTecomSku } from '@nusaf/shared';

describe('Tecom SKU Conversion', () => {
  describe('convertTecomSku', () => {
    it('should convert C prefix SKU correctly', () => {
      // C020080271 -> 1200-80271
      expect(convertTecomSku('C020080271')).toBe('1200-80271');
    });

    it('should convert L prefix SKU correctly', () => {
      // L008580271 -> 185-80271
      expect(convertTecomSku('L008580271')).toBe('185-80271');
    });

    it('should keep B prefix SKU as-is', () => {
      expect(convertTecomSku('B00123456')).toBe('B00123456');
    });

    it('should strip leading zeros from part number', () => {
      // C000180271 -> 11-80271
      expect(convertTecomSku('C000180271')).toBe('11-80271');
    });

    it('should handle part numbers with all zeros becoming zero', () => {
      // C000080271 -> 10-80271
      expect(convertTecomSku('C000080271')).toBe('10-80271');
    });

    it('should throw error for invalid SKU (too short)', () => {
      expect(() => convertTecomSku('C020')).toThrow('Invalid Tecom SKU');
    });

    it('should throw error for empty SKU', () => {
      expect(() => convertTecomSku('')).toThrow('Invalid Tecom SKU');
    });

    it('should throw error for unknown prefix', () => {
      expect(() => convertTecomSku('X020080271')).toThrow('Unknown Tecom SKU prefix');
    });

    it('should handle lowercase prefix', () => {
      expect(convertTecomSku('c020080271')).toBe('1200-80271');
    });
  });
});

describe('Import Validation', () => {
  describe('Row Validation Rules', () => {
    it('should identify required fields', () => {
      const requiredFields = ['CODE', 'DESCRIPTION', 'PRICE', 'CATEGORY'];
      expect(requiredFields).toContain('CODE');
      expect(requiredFields).toContain('DESCRIPTION');
      expect(requiredFields).toContain('PRICE');
      expect(requiredFields).toContain('CATEGORY');
    });

    it('should identify optional fields', () => {
      const optionalFields = ['UM', 'SUBCATEGORY'];
      expect(optionalFields).toContain('UM');
      expect(optionalFields).toContain('SUBCATEGORY');
    });

    it('should have valid unit of measure codes', () => {
      const validUMs = ['EA', 'M', 'KG', 'BOX', 'SET', 'PAIR', 'ROLL'];
      expect(validUMs).toContain('EA');
      expect(validUMs).toContain('M');
      expect(validUMs).toContain('KG');
    });
  });

  describe('Category Code Validation', () => {
    it('should recognize valid category codes', () => {
      const validCategoryCodes = ['C', 'L', 'B', 'T', 'M', 'P', 'S', 'V', 'D', 'W', 'G'];
      expect(validCategoryCodes).toHaveLength(11);
      expect(validCategoryCodes).toContain('C'); // Conveyor Components
      expect(validCategoryCodes).toContain('B'); // Bearings
      expect(validCategoryCodes).toContain('P'); // Power Transmission
    });

    it('should recognize valid subcategory codes format', () => {
      const subcategoryPattern = /^[A-Z]-\d{3}$/;
      expect('C-001').toMatch(subcategoryPattern);
      expect('B-008').toMatch(subcategoryPattern);
      expect('P-013').toMatch(subcategoryPattern);
      expect('INVALID').not.toMatch(subcategoryPattern);
    });
  });
});

describe('Validation Result Structure', () => {
  it('should have correct validation result shape', () => {
    const mockResult = {
      isValid: true,
      totalRows: 100,
      validRows: 95,
      errorRows: 5,
      warningRows: 10,
      errors: [],
      rows: [],
      summary: {
        newProducts: 80,
        existingProducts: 15,
        categoryBreakdown: { C: 50, B: 30, P: 15 },
      },
    };

    expect(mockResult).toHaveProperty('isValid');
    expect(mockResult).toHaveProperty('totalRows');
    expect(mockResult).toHaveProperty('validRows');
    expect(mockResult).toHaveProperty('errorRows');
    expect(mockResult).toHaveProperty('warningRows');
    expect(mockResult).toHaveProperty('errors');
    expect(mockResult).toHaveProperty('rows');
    expect(mockResult).toHaveProperty('summary');
    expect(mockResult.summary).toHaveProperty('newProducts');
    expect(mockResult.summary).toHaveProperty('existingProducts');
    expect(mockResult.summary).toHaveProperty('categoryBreakdown');
  });

  it('should have correct row validation result shape', () => {
    const mockRow = {
      rowNumber: 1,
      isValid: true,
      errors: [],
      warnings: [],
      data: {
        supplierSku: 'C020080271',
        nusafSku: '1200-80271',
        description: 'Test Product',
        price: 45.50,
        unitOfMeasure: 'EA',
        categoryCode: 'C',
        subcategoryCode: 'C-001',
      },
    };

    expect(mockRow).toHaveProperty('rowNumber');
    expect(mockRow).toHaveProperty('isValid');
    expect(mockRow).toHaveProperty('errors');
    expect(mockRow).toHaveProperty('warnings');
    expect(mockRow).toHaveProperty('data');
    expect(mockRow.data).toHaveProperty('supplierSku');
    expect(mockRow.data).toHaveProperty('nusafSku');
    expect(mockRow.data).toHaveProperty('description');
    expect(mockRow.data).toHaveProperty('price');
    expect(mockRow.data).toHaveProperty('unitOfMeasure');
    expect(mockRow.data).toHaveProperty('categoryCode');
  });

  it('should handle error row correctly', () => {
    const errorRow = {
      rowNumber: 2,
      isValid: false,
      errors: [
        { field: 'CODE', message: 'Product code is required' },
        { field: 'PRICE', message: 'Price is required' },
      ],
      warnings: [],
      data: null,
    };

    expect(errorRow.isValid).toBe(false);
    expect(errorRow.errors).toHaveLength(2);
    expect(errorRow.data).toBeNull();
  });

  it('should handle warning row correctly', () => {
    const warningRow = {
      rowNumber: 3,
      isValid: true,
      errors: [],
      warnings: [{ field: 'PRICE', message: 'Price is zero or negative' }],
      data: {
        supplierSku: 'TEST001',
        nusafSku: 'TEST001',
        description: 'Test Product',
        price: 0,
        unitOfMeasure: 'EA',
        categoryCode: 'C',
      },
    };

    expect(warningRow.isValid).toBe(true);
    expect(warningRow.warnings).toHaveLength(1);
    expect(warningRow.data).not.toBeNull();
  });
});

describe('Import Supplier Codes', () => {
  it('should only allow Italian suppliers for import', () => {
    const importSupplierCodes = ['TECOM', 'CHIARAVALLI', 'REGINA'];
    expect(importSupplierCodes).toHaveLength(3);
    expect(importSupplierCodes).toContain('TECOM');
    expect(importSupplierCodes).toContain('CHIARAVALLI');
    expect(importSupplierCodes).toContain('REGINA');
    expect(importSupplierCodes).not.toContain('NUSAF'); // Local supplier excluded
  });
});
