/**
 * Cash Customer Utilities Unit Tests
 *
 * Tests for resolveCustomerName, resolveCustomerVat, and pickCashCustomerFields.
 */

import { describe, it, expect } from 'vitest';
import {
  resolveCustomerName,
  resolveCustomerVat,
  pickCashCustomerFields,
} from '../../../backend/src/utils/cash-customer';

describe('Cash Customer Utilities', () => {
  describe('resolveCustomerName', () => {
    it('returns cash customer company name when present', () => {
      const order = {
        cashCustomerCompany: 'Smith Engineering',
        cashCustomerName: 'John Smith',
        company: { name: 'Cash Sales - Johannesburg' },
      };
      expect(resolveCustomerName(order)).toBe('Smith Engineering');
    });

    it('falls back to cash customer personal name when no company', () => {
      const order = {
        cashCustomerCompany: null,
        cashCustomerName: 'John Smith',
        company: { name: 'Cash Sales - Johannesburg' },
      };
      expect(resolveCustomerName(order)).toBe('John Smith');
    });

    it('falls back to generic company name when no cash details', () => {
      const order = {
        cashCustomerCompany: null,
        cashCustomerName: null,
        company: { name: 'Acme Corp' },
      };
      expect(resolveCustomerName(order)).toBe('Acme Corp');
    });

    it('handles undefined cash fields (regular non-cash orders)', () => {
      const order = {
        company: { name: 'Regular Customer Ltd' },
      };
      expect(resolveCustomerName(order)).toBe('Regular Customer Ltd');
    });

    it('skips empty strings for cash customer company', () => {
      const order = {
        cashCustomerCompany: '',
        cashCustomerName: 'Jane Doe',
        company: { name: 'Cash Sales - Cape Town' },
      };
      expect(resolveCustomerName(order)).toBe('Jane Doe');
    });
  });

  describe('resolveCustomerVat', () => {
    it('returns cash customer VAT when present', () => {
      const order = {
        cashCustomerVat: '4512345678',
        company: { vatNumber: '1234567890' },
      };
      expect(resolveCustomerVat(order)).toBe('4512345678');
    });

    it('falls back to company VAT when no cash VAT', () => {
      const order = {
        cashCustomerVat: null,
        company: { vatNumber: '1234567890' },
      };
      expect(resolveCustomerVat(order)).toBe('1234567890');
    });

    it('returns null when neither has VAT', () => {
      const order = {
        cashCustomerVat: null,
        company: { vatNumber: null },
      };
      expect(resolveCustomerVat(order)).toBeNull();
    });

    it('handles undefined cash VAT (regular orders)', () => {
      const order = {
        company: { vatNumber: '9876543210' },
      };
      expect(resolveCustomerVat(order)).toBe('9876543210');
    });
  });

  describe('pickCashCustomerFields', () => {
    it('extracts all 6 cash customer fields', () => {
      const source = {
        cashCustomerName: 'John',
        cashCustomerPhone: '0821234567',
        cashCustomerEmail: 'john@example.com',
        cashCustomerCompany: 'John Co',
        cashCustomerVat: '4512345678',
        cashCustomerAddress: '123 Main St',
        // Extra fields should be ignored
        id: 'xyz',
        status: 'DRAFT',
      };

      const result = pickCashCustomerFields(source);
      expect(result).toEqual({
        cashCustomerName: 'John',
        cashCustomerPhone: '0821234567',
        cashCustomerEmail: 'john@example.com',
        cashCustomerCompany: 'John Co',
        cashCustomerVat: '4512345678',
        cashCustomerAddress: '123 Main St',
      });
    });

    it('converts undefined to null', () => {
      const result = pickCashCustomerFields({});
      expect(result).toEqual({
        cashCustomerName: null,
        cashCustomerPhone: null,
        cashCustomerEmail: null,
        cashCustomerCompany: null,
        cashCustomerVat: null,
        cashCustomerAddress: null,
      });
    });

    it('preserves explicit null values', () => {
      const result = pickCashCustomerFields({
        cashCustomerName: null,
        cashCustomerPhone: null,
      });
      expect(result.cashCustomerName).toBeNull();
      expect(result.cashCustomerPhone).toBeNull();
    });
  });
});
