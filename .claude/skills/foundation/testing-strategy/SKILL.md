---
name: testing-strategy
description: Testing strategy and patterns for B2B applications where accuracy is critical - pricing calculations, configurator rules, and order workflows. Use when writing tests, setting up testing infrastructure, or making testing decisions.
---

# Testing Strategy for B2B Applications

## Why Testing is Critical

In B2B applications, errors have direct financial impact:
- **Pricing errors** → Lost revenue or customer disputes
- **Configurator bugs** → Invalid products quoted
- **Invoice errors** → Payment delays, customer complaints
- **Permission bugs** → Data breaches

**Testing is not optional.**

---

## Testing Pyramid

```
         /\
        /  \
       / E2E\          ~5-10% - Critical user journeys
      /------\
     /  Integ \        ~20-30% - API, DB, external systems
    /----------\
   /    Unit    \      ~60-70% - Business logic, utilities
  /--------------\
```

### Where to Focus

| Test Type | Focus Areas | Tools |
|-----------|-------------|-------|
| Unit | Pricing calculations, validation, utilities | Vitest, Jest |
| Integration | API endpoints, database, Odoo client | Vitest, Supertest |
| E2E | Quoting flow, checkout, critical paths | Playwright |

---

## Directory Structure

```
/tests
├── unit/
│   ├── services/
│   │   ├── pricing/
│   │   │   ├── calculator.test.ts
│   │   │   └── rules-engine.test.ts
│   │   └── configurator/
│   │       └── chain-builder.test.ts
│   └── utils/
│       └── currency.test.ts
│
├── integration/
│   ├── api/
│   │   ├── products.test.ts
│   │   ├── quotes.test.ts
│   │   └── pricing.test.ts
│   ├── repositories/
│   │   └── product.repo.test.ts
│   └── integrations/
│       └── odoo-client.test.ts
│
├── e2e/
│   ├── flows/
│   │   ├── quote-to-order.spec.ts
│   │   └── price-list-import.spec.ts
│   └── pages/
│       └── products.spec.ts
│
├── fixtures/
│   ├── products.ts
│   ├── price-lists.ts
│   └── users.ts
│
└── helpers/
    ├── db.ts
    ├── auth.ts
    └── factories.ts
```

---

## Unit Testing

### Testing Pricing Calculations (CRITICAL)

```typescript
// tests/unit/services/pricing/calculator.test.ts
import { describe, it, expect } from 'vitest';
import { PriceCalculator } from '@/services/pricing/calculator';

describe('PriceCalculator', () => {
  describe('calculateLandedCost', () => {
    it('applies supplier discount correctly', () => {
      const result = PriceCalculator.calculateLandedCost({
        grossPrice: 100,
        supplierDiscount: 20,  // 20%
        exchangeRate: 1,
        freightPercentage: 0,
      });
      
      expect(result.netPrice).toBe(80);
    });
    
    it('applies exchange rate after discount', () => {
      const result = PriceCalculator.calculateLandedCost({
        grossPrice: 100,
        supplierDiscount: 20,
        exchangeRate: 20,  // EUR to ZAR
        freightPercentage: 0,
      });
      
      // 100 - 20% = 80 EUR × 20 = 1600 ZAR
      expect(result.landedCostZAR).toBe(1600);
    });
    
    it('applies freight percentage on ZAR value', () => {
      const result = PriceCalculator.calculateLandedCost({
        grossPrice: 100,
        supplierDiscount: 0,
        exchangeRate: 20,
        freightPercentage: 10,  // 10% freight
      });
      
      // 100 EUR × 20 = 2000 ZAR + 10% = 2200 ZAR
      expect(result.landedCostZAR).toBe(2200);
    });
    
    it('calculates list price with markup', () => {
      const result = PriceCalculator.calculateListPrice({
        landedCost: 1000,
        markupPercentage: 40,
        additionalMarkup: 10,
      });
      
      // 1000 + 40% = 1400 + 10% = 1540
      expect(result.listPrice).toBe(1540);
    });
  });
  
  describe('edge cases', () => {
    it('handles zero prices', () => {
      const result = PriceCalculator.calculateLandedCost({
        grossPrice: 0,
        supplierDiscount: 20,
        exchangeRate: 20,
        freightPercentage: 10,
      });
      
      expect(result.landedCostZAR).toBe(0);
    });
    
    it('handles 100% discount', () => {
      const result = PriceCalculator.calculateLandedCost({
        grossPrice: 100,
        supplierDiscount: 100,
        exchangeRate: 20,
        freightPercentage: 10,
      });
      
      expect(result.netPrice).toBe(0);
      expect(result.landedCostZAR).toBe(0);
    });
    
    it('rounds to 4 decimal places', () => {
      const result = PriceCalculator.calculateLandedCost({
        grossPrice: 33.33,
        supplierDiscount: 17,
        exchangeRate: 20.123,
        freightPercentage: 8.5,
      });
      
      // Verify precision
      expect(result.netPrice.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(4);
    });
  });
  
  describe('calculation audit trail', () => {
    it('returns all intermediate values', () => {
      const result = PriceCalculator.calculateLandedCost({
        grossPrice: 100,
        supplierDiscount: 20,
        exchangeRate: 20,
        freightPercentage: 10,
      });
      
      expect(result).toMatchObject({
        grossPrice: 100,
        discountAmount: 20,
        netPrice: 80,
        netPriceZAR: 1600,
        freightAmount: 160,
        landedCostZAR: 1760,
      });
    });
  });
});
```

### Testing Configuration Rules

```typescript
// tests/unit/services/configurator/chain-builder.test.ts
import { describe, it, expect } from 'vitest';
import { ChainConfigurator } from '@/services/configurator/chain-builder';

describe('ChainConfigurator', () => {
  describe('validateConfiguration', () => {
    it('rejects invalid width for chain type', () => {
      const config = {
        chainType: 'MODULAR_880',
        width: 50,  // Too narrow for this type
        length: 1000,
      };
      
      const result = ChainConfigurator.validate(config);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'width',
        message: 'Width must be between 83mm and 1000mm for MODULAR_880',
      });
    });
    
    it('validates attachment compatibility', () => {
      const config = {
        chainType: 'MODULAR_880',
        width: 200,
        attachments: [
          { type: 'TAB', position: 'CENTER' },
          { type: 'FLIGHT', position: 'SIDE' },
        ],
      };
      
      const result = ChainConfigurator.validate(config);
      
      expect(result.valid).toBe(true);
    });
    
    it('rejects incompatible attachment combinations', () => {
      const config = {
        chainType: 'MODULAR_880',
        width: 100,
        attachments: [
          { type: 'FLIGHT', height: 50 },  // Requires min width
        ],
      };
      
      const result = ChainConfigurator.validate(config);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'attachments',
        message: '50mm flights require minimum width of 150mm',
      });
    });
  });
  
  describe('calculatePrice', () => {
    it('calculates base chain price by width', () => {
      const config = {
        chainType: 'MODULAR_880',
        width: 200,
        length: 1000,
      };
      
      const price = ChainConfigurator.calculatePrice(config);
      
      expect(price.breakdown).toContainEqual({
        item: 'Base chain (200mm × 1000mm)',
        quantity: 1,
        unitPrice: expect.any(Number),
        total: expect.any(Number),
      });
    });
    
    it('adds attachment costs', () => {
      const config = {
        chainType: 'MODULAR_880',
        width: 200,
        length: 1000,
        attachments: [
          { type: 'TAB', count: 10 },
        ],
      };
      
      const price = ChainConfigurator.calculatePrice(config);
      
      expect(price.breakdown).toContainEqual({
        item: 'TAB attachment',
        quantity: 10,
        unitPrice: expect.any(Number),
        total: expect.any(Number),
      });
    });
  });
});
```

### Testing Utilities

```typescript
// tests/unit/utils/currency.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency, parseCurrency, convertCurrency } from '@/utils/currency';

describe('currency utilities', () => {
  describe('formatCurrency', () => {
    it('formats ZAR correctly', () => {
      expect(formatCurrency(1234.56, 'ZAR')).toBe('R 1,234.56');
    });
    
    it('formats EUR correctly', () => {
      expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
    });
    
    it('handles negative values', () => {
      expect(formatCurrency(-1234.56, 'ZAR')).toBe('-R 1,234.56');
    });
    
    it('handles zero', () => {
      expect(formatCurrency(0, 'ZAR')).toBe('R 0.00');
    });
  });
  
  describe('parseCurrency', () => {
    it('parses formatted currency strings', () => {
      expect(parseCurrency('R 1,234.56')).toBe(1234.56);
      expect(parseCurrency('€1.234,56')).toBe(1234.56);
    });
    
    it('handles plain numbers', () => {
      expect(parseCurrency('1234.56')).toBe(1234.56);
    });
  });
});
```

---

## Integration Testing

### API Endpoint Tests

```typescript
// tests/integration/api/quotes.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '@/app';
import { createTestUser, createTestCompany, getAuthToken } from '@tests/helpers/auth';
import { seedTestProducts } from '@tests/helpers/db';

describe('POST /api/v1/quotes', () => {
  let authToken: string;
  let testProducts: Product[];
  
  beforeAll(async () => {
    const user = await createTestUser({ role: 'BUYER' });
    const company = await createTestCompany();
    authToken = await getAuthToken(user, company);
    testProducts = await seedTestProducts();
  });
  
  afterAll(async () => {
    await cleanupTestData();
  });
  
  it('creates a quote with valid items', async () => {
    const response = await request(app)
      .post('/api/v1/quotes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        items: [
          {
            productId: testProducts[0].id,
            quantity: 10,
          },
        ],
        validDays: 30,
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      quoteNumber: expect.stringMatching(/^QUO-\d{4}-\d{5}$/),
      status: 'draft',
      items: expect.arrayContaining([
        expect.objectContaining({
          productId: testProducts[0].id,
          quantity: 10,
        }),
      ]),
    });
  });
  
  it('calculates totals correctly', async () => {
    const response = await request(app)
      .post('/api/v1/quotes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        items: [
          { productId: testProducts[0].id, quantity: 2 },  // Price: 100
          { productId: testProducts[1].id, quantity: 3 },  // Price: 50
        ],
      });
    
    expect(response.status).toBe(201);
    expect(response.body.data.totals).toMatchObject({
      subtotal: 350,     // (2×100) + (3×50)
      vat: 52.50,        // 15% VAT
      total: 402.50,
    });
  });
  
  it('rejects unauthorized users', async () => {
    const response = await request(app)
      .post('/api/v1/quotes')
      .send({ items: [] });
    
    expect(response.status).toBe(401);
  });
  
  it('validates required fields', async () => {
    const response = await request(app)
      .post('/api/v1/quotes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({});
    
    expect(response.status).toBe(400);
    expect(response.body.error.details).toContainEqual({
      field: 'items',
      message: 'At least one item is required',
    });
  });
});
```

### Database Repository Tests

```typescript
// tests/integration/repositories/product.repo.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProductRepository } from '@/repositories/product.repo';
import { prisma } from '@/lib/prisma';
import { createTestSupplier } from '@tests/helpers/factories';

describe('ProductRepository', () => {
  let repo: ProductRepository;
  let testSupplierId: string;
  
  beforeEach(async () => {
    repo = new ProductRepository(prisma);
    const supplier = await createTestSupplier();
    testSupplierId = supplier.id;
  });
  
  afterEach(async () => {
    await prisma.product.deleteMany({ where: { supplierId: testSupplierId } });
    await prisma.supplier.delete({ where: { id: testSupplierId } });
  });
  
  describe('findBySku', () => {
    it('finds product by SKU', async () => {
      await prisma.product.create({
        data: {
          sku: 'TEST-001',
          name: 'Test Product',
          supplierId: testSupplierId,
        },
      });
      
      const product = await repo.findBySku('TEST-001');
      
      expect(product).not.toBeNull();
      expect(product?.name).toBe('Test Product');
    });
    
    it('excludes soft-deleted products', async () => {
      await prisma.product.create({
        data: {
          sku: 'DELETED-001',
          name: 'Deleted Product',
          supplierId: testSupplierId,
          deletedAt: new Date(),
        },
      });
      
      const product = await repo.findBySku('DELETED-001');
      
      expect(product).toBeNull();
    });
  });
  
  describe('findWithFilters', () => {
    beforeEach(async () => {
      await prisma.product.createMany({
        data: [
          { sku: 'CHAIN-001', name: 'Chain A', category: 'chains', supplierId: testSupplierId, price: 100 },
          { sku: 'CHAIN-002', name: 'Chain B', category: 'chains', supplierId: testSupplierId, price: 200 },
          { sku: 'GEAR-001', name: 'Gear A', category: 'gears', supplierId: testSupplierId, price: 150 },
        ],
      });
    });
    
    it('filters by category', async () => {
      const results = await repo.findWithFilters({ category: 'chains' });
      
      expect(results.data).toHaveLength(2);
      expect(results.data.every(p => p.category === 'chains')).toBe(true);
    });
    
    it('filters by price range', async () => {
      const results = await repo.findWithFilters({ minPrice: 100, maxPrice: 150 });
      
      expect(results.data).toHaveLength(2);
    });
    
    it('paginates results', async () => {
      const page1 = await repo.findWithFilters({ page: 1, pageSize: 2 });
      const page2 = await repo.findWithFilters({ page: 2, pageSize: 2 });
      
      expect(page1.data).toHaveLength(2);
      expect(page2.data).toHaveLength(1);
      expect(page1.pagination.totalItems).toBe(3);
    });
  });
});
```

### PDF Generation Tests

```typescript
// tests/integration/services/invoice-pdf.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { InvoicePdfService } from '@/services/pdf/invoice-pdf';
import { createTestInvoice } from '@tests/helpers/factories';

describe('InvoicePdfService', () => {
  let pdfService: InvoicePdfService;
  
  beforeAll(() => {
    pdfService = new InvoicePdfService();
  });
  
  describe('generatePdf', () => {
    it('generates valid PDF buffer', async () => {
      const invoice = await createTestInvoice({
        items: [
          { description: 'Chain 100mm', quantity: 10, unitPrice: 100 },
          { description: 'Sprocket 20T', quantity: 5, unitPrice: 50 },
        ],
      });
      
      const pdfBuffer = await pdfService.generatePdf(invoice);
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
      // PDF magic bytes
      expect(pdfBuffer.slice(0, 4).toString()).toBe('%PDF');
    });
    
    it('includes all invoice details', async () => {
      const invoice = await createTestInvoice();
      
      const pdfBuffer = await pdfService.generatePdf(invoice);
      const pdfText = await extractPdfText(pdfBuffer);
      
      expect(pdfText).toContain(invoice.invoiceNumber);
      expect(pdfText).toContain(invoice.customer.companyName);
    });
    
    it('calculates totals correctly in PDF', async () => {
      const invoice = await createTestInvoice({
        subtotal: 1000,
        vatAmount: 150,
        total: 1150,
      });
      
      const pdfBuffer = await pdfService.generatePdf(invoice);
      const pdfText = await extractPdfText(pdfBuffer);
      
      expect(pdfText).toContain('1,150.00');  // Total
    });
  });
});
```

---

## E2E Testing

### Playwright Setup

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  projects: [
    {
      name: 'chrome',
      use: { browserName: 'chromium' },
    },
  ],
});
```

### Critical Flow: Quote to Order

```typescript
// tests/e2e/flows/quote-to-order.spec.ts
import { test, expect } from '@playwright/test';
import { loginAs, seedTestData } from '@tests/e2e/helpers';

test.describe('Quote to Order Flow', () => {
  test.beforeEach(async ({ page }) => {
    await seedTestData();
    await loginAs(page, 'buyer@testcompany.com');
  });
  
  test('buyer can create and submit quote', async ({ page }) => {
    // Navigate to products
    await page.goto('/dashboard/products');
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
    
    // Search for product
    await page.getByPlaceholder('Search products...').fill('modular chain');
    await page.keyboard.press('Enter');
    
    // Add to quote
    await page.getByRole('row', { name: /CHAIN-001/ }).getByRole('button', { name: 'Add to Quote' }).click();
    
    // Set quantity
    await page.getByLabel('Quantity').fill('10');
    await page.getByRole('button', { name: 'Add' }).click();
    
    // Verify cart
    await expect(page.getByTestId('quote-cart-count')).toHaveText('1');
    
    // Go to quote
    await page.getByRole('link', { name: 'View Quote' }).click();
    
    // Verify totals calculated
    await expect(page.getByTestId('quote-subtotal')).not.toHaveText('R 0.00');
    
    // Submit quote
    await page.getByRole('button', { name: 'Submit Quote' }).click();
    
    // Confirm
    await page.getByRole('button', { name: 'Confirm' }).click();
    
    // Verify success
    await expect(page.getByText('Quote submitted successfully')).toBeVisible();
    await expect(page.getByTestId('quote-status')).toHaveText('Pending Approval');
  });
  
  test('approver can approve quote', async ({ page }) => {
    // ... setup pending quote
    await loginAs(page, 'approver@testcompany.com');
    
    await page.goto('/dashboard/quotes?status=pending');
    await page.getByRole('row', { name: /QUO-2024/ }).getByRole('link', { name: 'View' }).click();
    
    await page.getByRole('button', { name: 'Approve' }).click();
    await page.getByRole('button', { name: 'Confirm Approval' }).click();
    
    await expect(page.getByText('Quote approved')).toBeVisible();
    await expect(page.getByTestId('quote-status')).toHaveText('Approved');
  });
});
```

---

## Test Data Management

### Factories

```typescript
// tests/helpers/factories.ts
import { faker } from '@faker-js/faker';
import { prisma } from '@/lib/prisma';

export async function createTestProduct(overrides = {}) {
  return prisma.product.create({
    data: {
      sku: faker.string.alphanumeric(10),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      category: 'test',
      price: faker.number.float({ min: 10, max: 1000, precision: 0.01 }),
      ...overrides,
    },
  });
}

export async function createTestQuote(overrides = {}) {
  const product = await createTestProduct();
  
  return prisma.quote.create({
    data: {
      quoteNumber: `QUO-TEST-${faker.string.numeric(5)}`,
      status: 'DRAFT',
      validUntil: faker.date.future(),
      items: {
        create: [
          {
            productId: product.id,
            quantity: 1,
            unitPrice: product.price,
            lineTotal: product.price,
          },
        ],
      },
      ...overrides,
    },
    include: { items: true },
  });
}
```

### Fixtures

```typescript
// tests/fixtures/price-lists.ts
export const validPriceListImport = [
  { sku: 'CHAIN-001', description: 'Modular Chain 100mm', grossPrice: 45.00, discount: 20 },
  { sku: 'CHAIN-002', description: 'Modular Chain 200mm', grossPrice: 65.00, discount: 20 },
  { sku: 'GEAR-001', description: 'Sprocket 20T', grossPrice: 12.00, discount: 15 },
];

export const invalidPriceListImport = [
  { sku: '', description: 'Missing SKU', grossPrice: 45.00 },  // Invalid
  { sku: 'CHAIN-003', description: 'Negative price', grossPrice: -10 },  // Invalid
];
```

---

## Running Tests

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --dir tests/unit",
    "test:integration": "vitest run --dir tests/integration",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage",
    "test:ci": "vitest run && playwright test"
  }
}
```

### CI Pipeline

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:unit -- --coverage
      
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test
          POSTGRES_PASSWORD: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install
      - run: npm run build
      - run: npm run test:e2e
```

---

## Checklist

### Before Committing

- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] No console.log left in tests
- [ ] Test data cleaned up

### Test Quality

- [ ] Tests are independent (no shared state)
- [ ] Tests are deterministic (no flaky tests)
- [ ] Tests have meaningful names
- [ ] Edge cases covered
- [ ] Error paths tested
