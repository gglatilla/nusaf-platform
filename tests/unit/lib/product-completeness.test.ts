/**
 * Product Completeness Scoring — Unit Tests
 *
 * Tests the calculateCompleteness() function which determines
 * whether a product is ready for publishing on the public website.
 */

import { describe, it, expect } from 'vitest';
import { calculateCompleteness } from '../../../frontend/src/lib/product-completeness';

// Helper to create a fully complete product input
function completeInput() {
  return {
    marketingTitle: 'Heavy Duty Conveyor Chain',
    marketingDescription: 'Industrial grade conveyor chain for mining applications.',
    metaTitle: 'Heavy Duty Conveyor Chain | Nusaf',
    metaDescription: 'Buy heavy duty conveyor chain from South Africa.',
    specifications: { 'Pitch': '25.4mm', 'Material': 'Stainless Steel' },
    imageCount: 3,
    documentCount: 1,
  };
}

// Helper to create an empty product input
function emptyInput() {
  return {
    marketingTitle: null,
    marketingDescription: null,
    metaTitle: null,
    metaDescription: null,
    specifications: null,
    imageCount: 0,
    documentCount: 0,
  };
}

describe('calculateCompleteness', () => {
  describe('score calculation', () => {
    it('returns 100 when all fields are filled', () => {
      const result = calculateCompleteness(completeInput());
      expect(result.score).toBe(100);
    });

    it('returns 0 when no fields are filled', () => {
      const result = calculateCompleteness(emptyInput());
      expect(result.score).toBe(0);
    });

    it('returns partial score when some required fields are filled', () => {
      const input = {
        ...emptyInput(),
        marketingTitle: 'Test Title',        // weight 20
        marketingDescription: 'Test Desc',   // weight 20
      };
      const result = calculateCompleteness(input);
      // 40 out of 100 total weight = 40%
      expect(result.score).toBe(40);
    });

    it('returns score based on all required fields only', () => {
      const input = {
        ...emptyInput(),
        marketingTitle: 'Title',             // weight 20
        marketingDescription: 'Desc',        // weight 20
        metaTitle: 'Meta Title',             // weight 15
        metaDescription: 'Meta Desc',        // weight 15
        imageCount: 1,                       // weight 15
      };
      const result = calculateCompleteness(input);
      // 85 out of 100 total weight = 85%
      expect(result.score).toBe(85);
    });

    it('includes optional fields in score when filled', () => {
      const input = {
        ...emptyInput(),
        marketingTitle: 'Title',             // weight 20
        specifications: { 'Pitch': '25mm' }, // weight 10 (optional)
      };
      const result = calculateCompleteness(input);
      // 30 out of 100 = 30%
      expect(result.score).toBe(30);
    });
  });

  describe('canPublish flag', () => {
    it('is true when ALL required fields are met', () => {
      const input = {
        ...emptyInput(),
        marketingTitle: 'Title',
        marketingDescription: 'Description',
        metaTitle: 'Meta Title',
        metaDescription: 'Meta Description',
        imageCount: 1,
      };
      const result = calculateCompleteness(input);
      expect(result.canPublish).toBe(true);
    });

    it('is false when any required field is missing', () => {
      const input = {
        ...emptyInput(),
        marketingTitle: 'Title',
        marketingDescription: 'Description',
        metaTitle: 'Meta Title',
        metaDescription: 'Meta Description',
        imageCount: 0,  // Missing image
      };
      const result = calculateCompleteness(input);
      expect(result.canPublish).toBe(false);
    });

    it('is true even without optional fields', () => {
      const input = {
        ...emptyInput(),
        marketingTitle: 'Title',
        marketingDescription: 'Description',
        metaTitle: 'Meta Title',
        metaDescription: 'Meta Description',
        imageCount: 1,
        // No specifications or documents
      };
      const result = calculateCompleteness(input);
      expect(result.canPublish).toBe(true);
    });

    it('is false when all optional fields are filled but required are missing', () => {
      const input = {
        ...emptyInput(),
        specifications: { 'Size': '10mm' },
        documentCount: 5,
      };
      const result = calculateCompleteness(input);
      expect(result.canPublish).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('treats empty string as missing', () => {
      const input = {
        ...emptyInput(),
        marketingTitle: '',
      };
      const result = calculateCompleteness(input);
      const titleField = result.fields.find(f => f.key === 'marketingTitle');
      expect(titleField?.met).toBe(false);
    });

    it('treats whitespace-only string as missing', () => {
      const input = {
        ...emptyInput(),
        marketingTitle: '   ',
      };
      const result = calculateCompleteness(input);
      const titleField = result.fields.find(f => f.key === 'marketingTitle');
      expect(titleField?.met).toBe(false);
    });

    it('treats null as missing', () => {
      const result = calculateCompleteness(emptyInput());
      for (const field of result.fields) {
        if (field.required && field.key !== 'images') {
          expect(field.met).toBe(false);
        }
      }
    });

    it('treats zero imageCount as missing', () => {
      const result = calculateCompleteness({ ...emptyInput(), imageCount: 0 });
      const imageField = result.fields.find(f => f.key === 'images');
      expect(imageField?.met).toBe(false);
    });

    it('treats empty specifications object as missing', () => {
      const result = calculateCompleteness({ ...emptyInput(), specifications: {} });
      const specField = result.fields.find(f => f.key === 'specifications');
      expect(specField?.met).toBe(false);
    });
  });

  describe('field counts', () => {
    it('reports correct requiredTotal', () => {
      const result = calculateCompleteness(emptyInput());
      expect(result.requiredTotal).toBe(5);
    });

    it('reports correct requiredMet when all required are filled', () => {
      const input = {
        ...emptyInput(),
        marketingTitle: 'Title',
        marketingDescription: 'Desc',
        metaTitle: 'Meta',
        metaDescription: 'Meta Desc',
        imageCount: 1,
      };
      const result = calculateCompleteness(input);
      expect(result.requiredMet).toBe(5);
    });

    it('reports correct requiredMet when none are filled', () => {
      const result = calculateCompleteness(emptyInput());
      expect(result.requiredMet).toBe(0);
    });

    it('returns 7 total fields', () => {
      const result = calculateCompleteness(emptyInput());
      expect(result.fields).toHaveLength(7);
    });
  });
});
