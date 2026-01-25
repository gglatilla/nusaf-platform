---
name: code-quality-standards
description: Code quality standards and maintainability patterns for B2B applications that must be maintainable by non-developers over time. Use when writing code, reviewing PRs, setting up linting, or establishing coding conventions.
---

# Code Quality Standards for B2B Applications

## Core Principle

**This codebase must be maintainable by people who are not full-time developers.**

This means:
- Clear, obvious code over clever code
- Explicit over implicit
- Well-documented business logic
- Consistent patterns throughout
- Strong typing that catches errors early

---

## TypeScript Standards

### Strict Mode Always

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Explicit Types for Business Logic

```typescript
// ❌ Implicit types hide intent
const calculatePrice = (product, quantity, discount) => {
  return product.price * quantity * (1 - discount);
};

// ✅ Explicit types document the contract
interface PriceCalculationInput {
  product: Product;
  quantity: number;
  discountPercent: number;  // 0-100
}

interface PriceCalculationResult {
  subtotal: Decimal;
  discountAmount: Decimal;
  total: Decimal;
}

function calculatePrice(input: PriceCalculationInput): PriceCalculationResult {
  const { product, quantity, discountPercent } = input;
  
  const subtotal = product.price.times(quantity);
  const discountAmount = subtotal.times(discountPercent).dividedBy(100);
  const total = subtotal.minus(discountAmount);
  
  return { subtotal, discountAmount, total };
}
```

### Use Enums for Fixed Values

```typescript
// ❌ Magic strings
if (order.status === 'pending') { ... }

// ✅ Enums with clear values
enum OrderStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  SUBMITTED = 'submitted',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

if (order.status === OrderStatus.PENDING_APPROVAL) { ... }
```

### Avoid `any`

```typescript
// ❌ Defeats the purpose of TypeScript
function processData(data: any): any {
  return data.items.map((item: any) => item.value);
}

// ✅ Proper typing
interface DataPayload {
  items: Array<{ value: number }>;
}

function processData(data: DataPayload): number[] {
  return data.items.map(item => item.value);
}

// When truly unknown, use `unknown` and validate
function processUnknownData(data: unknown): number[] {
  if (!isValidPayload(data)) {
    throw new ValidationError('Invalid data format');
  }
  return data.items.map(item => item.value);
}
```

---

## Naming Conventions

### Files and Folders

```
# Files: kebab-case
price-calculator.ts
quote-service.ts
product-repository.ts

# React components: PascalCase
ProductList.tsx
QuoteBuilder.tsx
PriceDisplay.tsx

# Test files: same name + .test
price-calculator.test.ts
ProductList.test.tsx
```

### Variables and Functions

```typescript
// Variables: camelCase, descriptive
const totalPrice = calculateTotal(items);
const isValidQuote = validateQuote(quote);
const customerDiscountPercent = getCustomerDiscount(customerId);

// Functions: verb + noun, describes action
function calculateTotalPrice(items: LineItem[]): Decimal { }
function validateQuoteItems(quote: Quote): ValidationResult { }
function fetchCustomerOrders(customerId: string): Promise<Order[]> { }

// Boolean variables: is/has/can/should prefix
const isActive = true;
const hasPermission = checkPermission(user, action);
const canApprove = user.role === 'APPROVER';
const shouldShowPrice = priceVisibility.showList;
```

### Constants

```typescript
// SCREAMING_SNAKE_CASE for true constants
const MAX_QUOTE_ITEMS = 100;
const DEFAULT_CURRENCY = 'ZAR';
const VAT_RATE = 0.15;

// Configuration objects: PascalCase
const PaginationDefaults = {
  pageSize: 20,
  maxPageSize: 100,
} as const;
```

### Types and Interfaces

```typescript
// PascalCase, noun-based
interface Product { }
interface PriceCalculation { }
interface CustomerOrder { }

// Props suffix for React props
interface ProductListProps { }
interface QuoteBuilderProps { }

// Input/Output suffix for function parameters
interface CreateQuoteInput { }
interface PriceCalculationOutput { }
```

---

## Code Organization

### Single Responsibility

```typescript
// ❌ Too many responsibilities
class OrderService {
  async createOrder(data) { }
  async calculateShipping(order) { }
  async sendConfirmationEmail(order) { }
  async updateInventory(order) { }
  async syncToOdoo(order) { }
  async generatePDF(order) { }
}

// ✅ Separated concerns
class OrderService {
  constructor(
    private pricingService: PricingService,
    private odooSync: OdooSyncService,
    private notificationService: NotificationService,
  ) {}
  
  async createOrder(data: CreateOrderInput): Promise<Order> {
    // Only handles order creation logic
  }
}

class OdooSyncService {
  async syncOrder(order: Order): Promise<void> {
    // Only handles Odoo sync
  }
}
```

### File Length Guidelines

| File Type | Recommended Max | Action if Exceeded |
|-----------|-----------------|-------------------|
| Service | 300 lines | Split by domain |
| Component | 200 lines | Extract sub-components |
| Utility | 150 lines | Split by function group |
| Test file | 500 lines | Split by test group |

### Import Organization

```typescript
// 1. External libraries (alphabetical)
import { Decimal } from 'decimal.js';
import { z } from 'zod';

// 2. Internal absolute imports (alphabetical)
import { PricingService } from '@/services/pricing';
import { Product } from '@/types';
import { formatCurrency } from '@/utils/currency';

// 3. Relative imports (parent first, then siblings)
import { BaseService } from '../base-service';
import { calculateDiscount } from './helpers';
```

---

## Documentation Standards

### Function Documentation

```typescript
/**
 * Calculates the landed cost for a product from a European supplier.
 * 
 * Calculation steps:
 * 1. Apply supplier discount to gross price
 * 2. Convert from EUR to ZAR using current exchange rate
 * 3. Add freight percentage
 * 
 * @param input - The calculation parameters
 * @returns The calculated landed cost with full breakdown
 * 
 * @example
 * const result = calculateLandedCost({
 *   grossPriceEur: 100,
 *   supplierDiscountPercent: 20,
 *   exchangeRate: 20.5,
 *   freightPercent: 10,
 * });
 * // result.landedCostZar = 1804.4
 */
function calculateLandedCost(input: LandedCostInput): LandedCostResult {
  // ...
}
```

### Complex Business Logic Comments

```typescript
function calculateCustomerPrice(
  product: Product,
  customer: Customer,
  quantity: number
): Decimal {
  // Start with the standard list price
  let price = product.listPrice;
  
  // Customer tier discounts (Gold: 10%, Silver: 5%, Bronze: 2%)
  // These are defined in the customer master data from Odoo
  if (customer.pricingTier) {
    const tierDiscount = TIER_DISCOUNTS[customer.pricingTier];
    price = price.times(1 - tierDiscount);
  }
  
  // Volume discounts apply AFTER tier discounts
  // Thresholds: 100+ units = 5%, 500+ units = 10%, 1000+ units = 15%
  const volumeDiscount = getVolumeDiscount(quantity);
  if (volumeDiscount > 0) {
    price = price.times(1 - volumeDiscount);
  }
  
  // Customer-specific pricing overrides everything
  // These are negotiated prices stored in our system
  const specificPrice = await getCustomerSpecificPrice(product.id, customer.id);
  if (specificPrice) {
    price = specificPrice;  // No additional discounts on specific prices
  }
  
  return price;
}
```

### API Endpoint Documentation

```typescript
/**
 * @route POST /api/v1/quotes
 * @description Create a new quote
 * @access Authenticated users with 'quotes:create' permission
 * 
 * @body {CreateQuoteInput}
 * @body.items {QuoteItemInput[]} - Line items (required, min 1)
 * @body.customerId {string} - Customer ID (optional for internal quotes)
 * @body.validDays {number} - Quote validity in days (default: 30)
 * 
 * @returns {201} {Quote} - Created quote with calculated totals
 * @returns {400} {ValidationError} - Invalid input
 * @returns {401} {AuthError} - Not authenticated
 * @returns {403} {ForbiddenError} - Missing permission
 */
router.post('/quotes', authenticate, authorize('quotes:create'), createQuote);
```

---

## Error Handling Patterns

### Always Handle Errors Explicitly

```typescript
// ❌ Silent failures
async function getProduct(id: string) {
  try {
    return await prisma.product.findUnique({ where: { id } });
  } catch (e) {
    return null;  // Hides the error!
  }
}

// ✅ Explicit error handling
async function getProduct(id: string): Promise<Product> {
  const product = await prisma.product.findUnique({ where: { id } });
  
  if (!product) {
    throw new NotFoundError('Product', id);
  }
  
  return product;
}
```

### Use Result Types for Expected Failures

```typescript
// For operations where failure is expected and normal
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

async function validatePriceList(
  file: Buffer
): Promise<Result<ParsedPriceList, ValidationError[]>> {
  const errors: ValidationError[] = [];
  const items: ParsedItem[] = [];
  
  // ... validation logic
  
  if (errors.length > 0) {
    return { success: false, error: errors };
  }
  
  return { success: true, data: { items } };
}

// Usage
const result = await validatePriceList(file);

if (!result.success) {
  // TypeScript knows result.error is ValidationError[]
  return res.status(400).json({ errors: result.error });
}

// TypeScript knows result.data is ParsedPriceList
await savePriceList(result.data);
```

---

## Decimal Handling (Critical for Pricing)

### Never Use JavaScript Numbers for Money

```typescript
// ❌ JavaScript floating point errors
const price = 0.1 + 0.2;  // = 0.30000000000000004

// ✅ Use Decimal.js
import { Decimal } from 'decimal.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

const price = new Decimal('0.1').plus('0.2');  // = 0.3

// In Prisma schema
model Product {
  price Decimal @db.Decimal(12, 4)  // 12 digits, 4 decimal places
}
```

### Standard Precision Rules

```typescript
const PRECISION = {
  // Prices: 4 decimal places during calculation
  CALCULATION: 4,
  
  // Display: 2 decimal places
  DISPLAY: 2,
  
  // Exchange rates: 6 decimal places
  EXCHANGE_RATE: 6,
  
  // Percentages: 2 decimal places
  PERCENTAGE: 2,
};

function roundForDisplay(value: Decimal): Decimal {
  return value.toDecimalPlaces(PRECISION.DISPLAY, Decimal.ROUND_HALF_UP);
}
```

---

## Code Review Checklist

### Before Submitting PR

- [ ] TypeScript compiles without errors
- [ ] ESLint passes with no warnings
- [ ] All tests pass
- [ ] New code has tests
- [ ] Complex logic is documented
- [ ] No console.log statements
- [ ] No hardcoded values (use constants/config)
- [ ] Error cases are handled
- [ ] Loading and empty states handled (frontend)

### Reviewer Checklist

- [ ] Code is understandable without explanation
- [ ] Naming is clear and consistent
- [ ] No obvious bugs or edge cases missed
- [ ] Performance considerations addressed
- [ ] Security considerations addressed
- [ ] Follows established patterns in codebase
- [ ] Tests cover happy path and error cases

---

## Linting Configuration

### ESLint Setup

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier',  // Must be last
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    // Enforce explicit return types on exported functions
    '@typescript-eslint/explicit-function-return-type': ['error', {
      allowExpressions: true,
    }],
    
    // No any
    '@typescript-eslint/no-explicit-any': 'error',
    
    // Enforce consistent naming
    '@typescript-eslint/naming-convention': [
      'error',
      { selector: 'interface', format: ['PascalCase'] },
      { selector: 'typeAlias', format: ['PascalCase'] },
      { selector: 'enum', format: ['PascalCase'] },
      { selector: 'enumMember', format: ['UPPER_CASE'] },
    ],
    
    // No unused variables
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
    }],
    
    // Require await in async functions
    'require-await': 'off',
    '@typescript-eslint/require-await': 'error',
    
    // Console statements
    'no-console': ['error', { allow: ['warn', 'error'] }],
  },
};
```

### Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

---

## Git Commit Standards

### Commit Message Format

```
type(scope): short description

Longer description if needed, explaining WHY the change
was made, not just WHAT changed.

Refs: #123
```

### Types

| Type | Use For |
|------|---------|
| feat | New feature |
| fix | Bug fix |
| docs | Documentation only |
| style | Formatting, no code change |
| refactor | Code change that neither fixes nor adds |
| perf | Performance improvement |
| test | Adding tests |
| chore | Build process, dependencies |

### Examples

```
feat(pricing): add volume discount calculation

Implements tiered volume discounts that apply after customer
tier discounts. Thresholds are configurable per supplier.

Refs: #45

---

fix(quotes): prevent duplicate submissions

Added optimistic locking to prevent users from accidentally
submitting the same quote twice when double-clicking.

Refs: #78

---

refactor(odoo): extract sync logic to separate service

Moved Odoo synchronization logic from OrderService to
dedicated OdooSyncService for better separation of concerns.
```

---

## Folder-Level README Files

Each major folder should have a README:

```markdown
<!-- services/README.md -->
# Services

Business logic layer. Services orchestrate operations and contain
the core business rules.

## Guidelines

- Services should be stateless
- Inject dependencies through constructor
- One primary responsibility per service
- Use repositories for data access, never call Prisma directly

## Services

- **PricingService** - Price calculations and rules
- **QuoteService** - Quote lifecycle management
- **OdooSyncService** - Synchronization with Odoo ERP

## Adding a New Service

1. Create file: `{name}.service.ts`
2. Add tests: `{name}.service.test.ts`
3. Register in dependency injection container
4. Update this README
```

---

## Summary Checklist

### Every File Should Have

- [ ] Explicit TypeScript types
- [ ] Clear, descriptive names
- [ ] JSDoc for exported functions
- [ ] No `any` types
- [ ] Error handling for all paths

### Every PR Should Have

- [ ] Passing CI (lint, test, build)
- [ ] Descriptive commit messages
- [ ] Tests for new functionality
- [ ] Documentation updates if needed
- [ ] No unrelated changes
