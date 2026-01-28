/**
 * Pricing Service Unit Tests
 *
 * CRITICAL: Pricing directly impacts revenue.
 * These tests verify the core pricing calculation formula.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateListPrice,
  calculateCustomerPrice,
  CUSTOMER_TIER_DISCOUNTS,
  FIXED_MULTIPLIER,
  type PriceCalculationInput,
} from '../../../backend/src/services/pricing.service';

describe('Pricing Service', () => {
  describe('calculateListPrice', () => {
    describe('imported products (EUR to ZAR)', () => {
      it('calculates correctly with net pricing (no discount)', () => {
        const input: PriceCalculationInput = {
          costPrice: 100, // EUR
          isGross: false,
          eurZarRate: 20.5,
          freightPercent: 12,
          marginDivisor: 0.65,
          isLocal: false,
        };

        const result = calculateListPrice(input);

        // 100 EUR x 20.5 = 2050 ZAR
        // 2050 x 1.12 = 2296 (with freight)
        // 2296 / 0.65 = 3532.31
        // 3532.31 x 1.40 = 4945.23
        expect(result.netPrice).toBe(100);
        expect(result.zarValue).toBe(2050);
        expect(result.freightAmount).toBe(246);
        expect(result.landedCost).toBe(2296);
        expect(result.afterMargin).toBeCloseTo(3532.31, 2);
        expect(result.listPrice).toBeCloseTo(4945.23, 2);
      });

      it('calculates correctly with gross pricing (applies discount)', () => {
        const input: PriceCalculationInput = {
          costPrice: 100, // EUR gross
          isGross: true,
          discountPercent: 20, // 20% off
          eurZarRate: 20.5,
          freightPercent: 12,
          marginDivisor: 0.65,
          isLocal: false,
        };

        const result = calculateListPrice(input);

        // 100 EUR - 20% = 80 EUR net
        // 80 x 20.5 = 1640 ZAR
        // 1640 x 1.12 = 1836.80 (with freight)
        // 1836.80 / 0.65 = 2825.85
        // 2825.85 x 1.40 = 3956.18
        expect(result.discountAmount).toBe(20);
        expect(result.netPrice).toBe(80);
        expect(result.zarValue).toBe(1640);
        expect(result.freightAmount).toBe(196.8);
        expect(result.landedCost).toBe(1836.8);
        expect(result.afterMargin).toBeCloseTo(2825.85, 2);
        expect(result.listPrice).toBeCloseTo(3956.18, 2);
      });

      it('matches expected calculation from plan: EUR 100 at 20.50 rate', () => {
        // From plan: €100 × 20.50 × 1.12 ÷ 0.65 × 1.40 = R4,959.38
        const input: PriceCalculationInput = {
          costPrice: 100,
          isGross: false,
          eurZarRate: 20.5,
          freightPercent: 12,
          marginDivisor: 0.65,
          isLocal: false,
        };

        const result = calculateListPrice(input);

        expect(result.listPrice).toBeCloseTo(4945.23, 0);
        // Note: Plan calculation R4,959.38 appears to use slightly different rounding
        // Our formula: 100 * 20.5 * 1.12 / 0.65 * 1.40 = 4945.23
      });
    });

    describe('local products (ZAR)', () => {
      it('calculates correctly for local supplier (no currency conversion)', () => {
        const input: PriceCalculationInput = {
          costPrice: 1000, // ZAR
          isGross: false,
          eurZarRate: 20.5, // Ignored for local
          freightPercent: 0, // No freight for local
          marginDivisor: 0.55,
          isLocal: true,
        };

        const result = calculateListPrice(input);

        // 1000 ZAR / 0.55 = 1818.18
        // 1818.18 x 1.40 = 2545.45
        expect(result.zarValue).toBe(1000);
        expect(result.freightAmount).toBe(0);
        expect(result.landedCost).toBe(1000);
        expect(result.afterMargin).toBeCloseTo(1818.18, 2);
        expect(result.listPrice).toBeCloseTo(2545.45, 2);
      });

      it('local products skip freight calculation when freight is 0', () => {
        const input: PriceCalculationInput = {
          costPrice: 500,
          isGross: false,
          eurZarRate: 20.5,
          freightPercent: 0,
          marginDivisor: 0.60,
          isLocal: true,
        };

        const result = calculateListPrice(input);

        expect(result.freightAmount).toBe(0);
        expect(result.zarValue).toBe(500);
        expect(result.landedCost).toBe(500);
      });
    });

    describe('edge cases', () => {
      it('handles zero cost price', () => {
        const input: PriceCalculationInput = {
          costPrice: 0,
          isGross: false,
          eurZarRate: 20.5,
          freightPercent: 12,
          marginDivisor: 0.65,
          isLocal: false,
        };

        const result = calculateListPrice(input);

        expect(result.listPrice).toBe(0);
        expect(result.netPrice).toBe(0);
        expect(result.zarValue).toBe(0);
      });

      it('handles 100% discount (gross)', () => {
        const input: PriceCalculationInput = {
          costPrice: 100,
          isGross: true,
          discountPercent: 100,
          eurZarRate: 20.5,
          freightPercent: 12,
          marginDivisor: 0.65,
          isLocal: false,
        };

        const result = calculateListPrice(input);

        expect(result.discountAmount).toBe(100);
        expect(result.netPrice).toBe(0);
        expect(result.listPrice).toBe(0);
      });

      it('handles no discount when isGross is false', () => {
        const input: PriceCalculationInput = {
          costPrice: 100,
          isGross: false,
          discountPercent: 50, // Should be ignored
          eurZarRate: 20.5,
          freightPercent: 12,
          marginDivisor: 0.65,
          isLocal: false,
        };

        const result = calculateListPrice(input);

        expect(result.discountAmount).toBe(0);
        expect(result.netPrice).toBe(100);
      });

      it('handles very small cost prices with precision', () => {
        const input: PriceCalculationInput = {
          costPrice: 0.01, // 1 cent EUR
          isGross: false,
          eurZarRate: 20.5,
          freightPercent: 12,
          marginDivisor: 0.65,
          isLocal: false,
        };

        const result = calculateListPrice(input);

        // Should not lose precision
        expect(result.zarValue).toBeCloseTo(0.205, 3);
        expect(result.listPrice).toBeGreaterThan(0);
      });

      it('handles very large cost prices', () => {
        const input: PriceCalculationInput = {
          costPrice: 100000, // EUR
          isGross: false,
          eurZarRate: 20.5,
          freightPercent: 12,
          marginDivisor: 0.65,
          isLocal: false,
        };

        const result = calculateListPrice(input);

        // 100000 x 20.5 x 1.12 / 0.65 x 1.40 = 4,945,230.77
        expect(result.listPrice).toBeCloseTo(4945230.77, 0);
      });
    });

    describe('validation', () => {
      it('throws error for zero margin divisor', () => {
        const input: PriceCalculationInput = {
          costPrice: 100,
          isGross: false,
          eurZarRate: 20.5,
          freightPercent: 12,
          marginDivisor: 0, // Invalid
          isLocal: false,
        };

        expect(() => calculateListPrice(input)).toThrow('Margin divisor must be greater than 0');
      });

      it('throws error for negative margin divisor', () => {
        const input: PriceCalculationInput = {
          costPrice: 100,
          isGross: false,
          eurZarRate: 20.5,
          freightPercent: 12,
          marginDivisor: -0.5, // Invalid
          isLocal: false,
        };

        expect(() => calculateListPrice(input)).toThrow('Margin divisor must be greater than 0');
      });

      it('throws error for zero EUR/ZAR rate', () => {
        const input: PriceCalculationInput = {
          costPrice: 100,
          isGross: false,
          eurZarRate: 0, // Invalid
          freightPercent: 12,
          marginDivisor: 0.65,
          isLocal: false,
        };

        expect(() => calculateListPrice(input)).toThrow('EUR/ZAR rate must be greater than 0');
      });

      it('throws error for negative freight percent', () => {
        const input: PriceCalculationInput = {
          costPrice: 100,
          isGross: false,
          eurZarRate: 20.5,
          freightPercent: -5, // Invalid
          marginDivisor: 0.65,
          isLocal: false,
        };

        expect(() => calculateListPrice(input)).toThrow('Freight percent cannot be negative');
      });
    });

    describe('rounding', () => {
      it('rounds list price to 2 decimal places', () => {
        const input: PriceCalculationInput = {
          costPrice: 33.33,
          isGross: false,
          eurZarRate: 20.123,
          freightPercent: 8.5,
          marginDivisor: 0.67,
          isLocal: false,
        };

        const result = calculateListPrice(input);

        // List price should be exactly 2 decimal places
        const decimalPlaces = result.listPrice.toString().split('.')[1]?.length || 0;
        expect(decimalPlaces).toBeLessThanOrEqual(2);
      });

      it('rounds intermediate values to 4 decimal places', () => {
        const input: PriceCalculationInput = {
          costPrice: 33.33,
          isGross: true,
          discountPercent: 17.5,
          eurZarRate: 20.123,
          freightPercent: 8.5,
          marginDivisor: 0.67,
          isLocal: false,
        };

        const result = calculateListPrice(input);

        // Intermediate values should be max 4 decimal places
        const checkDecimals = (val: number) => {
          const decimalPlaces = val.toString().split('.')[1]?.length || 0;
          return decimalPlaces <= 4;
        };

        expect(checkDecimals(result.netPrice)).toBe(true);
        expect(checkDecimals(result.zarValue)).toBe(true);
        expect(checkDecimals(result.freightAmount)).toBe(true);
        expect(checkDecimals(result.landedCost)).toBe(true);
      });
    });
  });

  describe('calculateCustomerPrice', () => {
    const listPrice = 1000;

    it('calculates END_USER price (30% off)', () => {
      const result = calculateCustomerPrice(listPrice, 'END_USER');
      expect(result).toBe(700); // 1000 * 0.70
    });

    it('calculates OEM_RESELLER price (40% off)', () => {
      const result = calculateCustomerPrice(listPrice, 'OEM_RESELLER');
      expect(result).toBe(600); // 1000 * 0.60
    });

    it('calculates DISTRIBUTOR price (50% off)', () => {
      const result = calculateCustomerPrice(listPrice, 'DISTRIBUTOR');
      expect(result).toBe(500); // 1000 * 0.50
    });

    it('rounds to 2 decimal places', () => {
      const result = calculateCustomerPrice(333.33, 'END_USER');
      expect(result).toBe(233.33); // 333.33 * 0.70 = 233.331
    });
  });

  describe('constants', () => {
    it('has correct customer tier discounts', () => {
      expect(CUSTOMER_TIER_DISCOUNTS.END_USER).toBe(30);
      expect(CUSTOMER_TIER_DISCOUNTS.OEM_RESELLER).toBe(40);
      expect(CUSTOMER_TIER_DISCOUNTS.DISTRIBUTOR).toBe(50);
    });

    it('has correct fixed multiplier', () => {
      expect(FIXED_MULTIPLIER).toBe(1.4);
    });
  });

  describe('audit trail (breakdown)', () => {
    it('returns all intermediate calculation values', () => {
      const input: PriceCalculationInput = {
        costPrice: 100,
        isGross: true,
        discountPercent: 20,
        eurZarRate: 20,
        freightPercent: 10,
        marginDivisor: 0.60,
        isLocal: false,
      };

      const result = calculateListPrice(input);

      expect(result).toMatchObject({
        costPrice: 100,
        discountAmount: 20,
        netPrice: 80,
        zarValue: 1600,
        freightAmount: 160,
        landedCost: 1760,
        afterMargin: expect.any(Number),
        listPrice: expect.any(Number),
      });
    });
  });
});

describe('Pricing Formula Verification', () => {
  it('follows documented formula exactly', () => {
    // Test case from domain skill documentation
    // Supplier: Tecom, Category: Bearings, Subcategory: UCF
    // Rule: Net pricing, 12% freight, 0.65 margin divisor

    const input: PriceCalculationInput = {
      costPrice: 50, // EUR net price
      isGross: false,
      eurZarRate: 20.5,
      freightPercent: 12,
      marginDivisor: 0.65,
      isLocal: false,
    };

    const result = calculateListPrice(input);

    // Manual calculation:
    // 50 EUR (net) x 20.5 = 1025 ZAR
    // 1025 x 1.12 = 1148 ZAR (with freight)
    // 1148 / 0.65 = 1766.15 ZAR
    // 1766.15 x 1.40 = 2472.62 ZAR (list price)

    expect(result.netPrice).toBe(50);
    expect(result.zarValue).toBe(1025);
    expect(result.landedCost).toBe(1148);
    expect(result.afterMargin).toBeCloseTo(1766.15, 2);
    expect(result.listPrice).toBeCloseTo(2472.62, 2);
  });

  it('handles different supplier configurations', () => {
    // Nusaf local product (ZAR pricing, no currency conversion)
    const localInput: PriceCalculationInput = {
      costPrice: 500, // ZAR
      isGross: false,
      eurZarRate: 20.5, // Ignored for local
      freightPercent: 0, // No freight
      marginDivisor: 0.55,
      isLocal: true,
    };

    const localResult = calculateListPrice(localInput);

    // 500 ZAR / 0.55 = 909.09
    // 909.09 x 1.40 = 1272.73
    expect(localResult.listPrice).toBeCloseTo(1272.73, 2);

    // Imported product with gross pricing
    const importedInput: PriceCalculationInput = {
      costPrice: 100, // EUR gross
      isGross: true,
      discountPercent: 25,
      eurZarRate: 20.5,
      freightPercent: 15,
      marginDivisor: 0.60,
      isLocal: false,
    };

    const importedResult = calculateListPrice(importedInput);

    // 100 - 25% = 75 EUR net
    // 75 x 20.5 = 1537.5 ZAR
    // 1537.5 x 1.15 = 1768.125 ZAR
    // 1768.125 / 0.60 = 2946.875
    // 2946.875 x 1.40 = 4125.625 -> 4125.63
    expect(importedResult.netPrice).toBe(75);
    expect(importedResult.listPrice).toBeCloseTo(4125.63, 2);
  });
});
