---
name: database-design-b2b
description: Database design patterns for B2B applications with audit trails, soft deletes, versioned pricing, and multi-tenancy. Use when designing database schemas, creating migrations, or making decisions about data modeling.
---

# Database Design for B2B Applications

## Core Principles

### 1. Auditability is Non-Negotiable

Every business-critical table must track:
- Who created it
- When it was created
- Who last modified it
- When it was last modified
- What changed (for critical data)

### 2. Never Hard Delete Business Data

Use soft deletes for all business data. Hard deletes only for:
- Temporary/session data
- Cache entries
- Truly orphaned records (carefully)

### 3. Version Critical Data

Pricing, configurations, and rules must maintain history:
- What was the price on this date?
- What rules applied when this quote was created?
- What exchange rate was used?

### 4. Your System is Source of Truth

All data lives in your PostgreSQL database. Design for:
- Complete data ownership
- Full audit history
- Future integration readiness (accounting, shipping, etc.)

---

## Base Table Patterns

### Standard Audit Columns

Every table should include:

```sql
-- PostgreSQL / Prisma pattern
CREATE TABLE example (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Audit columns (REQUIRED on all tables)
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by      UUID REFERENCES users(id),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_by      UUID REFERENCES users(id),
    
    -- Soft delete (REQUIRED on business tables)
    deleted_at      TIMESTAMP WITH TIME ZONE,
    deleted_by      UUID REFERENCES users(id),
    
    -- Business columns...
);

-- Auto-update updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON example
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Prisma Schema Pattern

```prisma
// Base mixin (conceptual - apply to all models)
model BaseFields {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now()) @map("created_at")
  createdBy String?  @map("created_by")
  updatedAt DateTime @updatedAt @map("updated_at")
  updatedBy String?  @map("updated_by")
  deletedAt DateTime? @map("deleted_at")
  deletedBy String?  @map("deleted_by")
}
```

---

## Customer Model

Since you own customer data, design for full B2B needs:

```prisma
model Customer {
  id              String    @id @default(uuid())
  
  // Business info
  companyName     String    @map("company_name")
  tradingName     String?   @map("trading_name")
  registrationNo  String?   @map("registration_no")  // Company reg number
  vatNumber       String?   @map("vat_number")
  
  // Contact
  email           String
  phone           String?
  website         String?
  
  // Classification
  customerType    CustomerType @default(PROSPECT) @map("customer_type")
  pricingTierId   String?   @map("pricing_tier_id")
  
  // Credit
  creditLimit     Decimal?  @map("credit_limit") @db.Decimal(12, 2)
  paymentTerms    String?   @map("payment_terms")  // "NET30", "COD", etc.
  
  // Status
  isActive        Boolean   @default(true) @map("is_active")
  
  // Relations
  addresses       CustomerAddress[]
  contacts        CustomerContact[]
  quotes          Quote[]
  orders          Order[]
  invoices        Invoice[]
  
  // Audit
  createdAt       DateTime  @default(now()) @map("created_at")
  createdBy       String?   @map("created_by")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  updatedBy       String?   @map("updated_by")
  deletedAt       DateTime? @map("deleted_at")
  deletedBy       String?   @map("deleted_by")
  
  @@map("customers")
}

enum CustomerType {
  PROSPECT
  ACTIVE
  VIP
  ON_HOLD
  INACTIVE
}

model CustomerAddress {
  id              String    @id @default(uuid())
  customerId      String    @map("customer_id")
  customer        Customer  @relation(fields: [customerId], references: [id])
  
  addressType     AddressType @map("address_type")
  line1           String
  line2           String?
  city            String
  province        String?
  postalCode      String?   @map("postal_code")
  country         String    @default("ZA")
  
  isDefault       Boolean   @default(false) @map("is_default")
  
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  
  @@map("customer_addresses")
}

enum AddressType {
  BILLING
  SHIPPING
  BOTH
}

model CustomerContact {
  id              String    @id @default(uuid())
  customerId      String    @map("customer_id")
  customer        Customer  @relation(fields: [customerId], references: [id])
  
  firstName       String    @map("first_name")
  lastName        String    @map("last_name")
  email           String?
  phone           String?
  jobTitle        String?   @map("job_title")
  
  isPrimary       Boolean   @default(false) @map("is_primary")
  
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  
  @@map("customer_contacts")
}
```

---

## Versioned Data Pattern

For pricing and configuration data that must maintain history:

```prisma
// Price list with versions
model PriceList {
  id            String    @id @default(uuid())
  supplierId    String    @map("supplier_id")
  supplier      Supplier  @relation(fields: [supplierId], references: [id])
  
  version       Int       @default(1)
  effectiveFrom DateTime  @map("effective_from")
  effectiveTo   DateTime? @map("effective_to")  // NULL = current
  status        PriceListStatus @default(DRAFT)
  
  // Metadata
  importedFrom  String?   @map("imported_from")  // Original filename
  importedAt    DateTime? @map("imported_at")
  publishedAt   DateTime? @map("published_at")
  publishedBy   String?   @map("published_by")
  
  // Relations
  items         PriceListItem[]
  
  // Audit
  createdAt     DateTime  @default(now()) @map("created_at")
  createdBy     String?   @map("created_by")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  
  @@unique([supplierId, version])
  @@index([supplierId, status])
  @@map("price_lists")
}

enum PriceListStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  PUBLISHED
  SUPERSEDED
  ARCHIVED
}

model PriceListItem {
  id            String    @id @default(uuid())
  priceListId   String    @map("price_list_id")
  priceList     PriceList @relation(fields: [priceListId], references: [id])
  
  supplierSku   String    @map("supplier_sku")
  description   String?
  
  // Pricing in supplier currency
  grossPrice    Decimal   @map("gross_price") @db.Decimal(12, 4)
  currency      String    @default("EUR")  // Supplier currency
  discountPct   Decimal?  @map("discount_pct") @db.Decimal(5, 2)
  netPrice      Decimal   @map("net_price") @db.Decimal(12, 4)  // Calculated
  
  // Categorization
  category      String?
  subCategory   String?   @map("sub_category")
  
  // Status
  isActive      Boolean   @default(true) @map("is_active")
  discontinuedAt DateTime? @map("discontinued_at")
  
  // Audit
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  
  @@unique([priceListId, supplierSku])
  @@index([supplierSku])
  @@map("price_list_items")
}
```

### Point-in-Time Pricing Lookup

```sql
-- Get price as it was on a specific date
SELECT pli.* 
FROM price_list_items pli
JOIN price_lists pl ON pli.price_list_id = pl.id
WHERE pl.supplier_id = $1
  AND pli.supplier_sku = $2
  AND pl.effective_from <= $3  -- target date
  AND (pl.effective_to IS NULL OR pl.effective_to > $3)
  AND pl.status = 'PUBLISHED'
ORDER BY pl.effective_from DESC
LIMIT 1;
```

---

## Pricing Rules Schema

For your complex pricing engine:

```prisma
model PricingRule {
  id              String    @id @default(uuid())
  
  // Scope (from broad to specific)
  scope           PricingRuleScope
  supplierId      String?   @map("supplier_id")
  categoryCode    String?   @map("category_code")
  subCategoryCode String?   @map("sub_category_code")
  productSku      String?   @map("product_sku")
  customerId      String?   @map("customer_id")  // For customer-specific pricing
  
  // Rule type
  ruleType        PricingRuleType @map("rule_type")
  
  // Values (use appropriate field based on rule type)
  percentageValue Decimal?  @map("percentage_value") @db.Decimal(8, 4)
  fixedValue      Decimal?  @map("fixed_value") @db.Decimal(12, 4)
  currency        String?
  
  // Priority (higher = applied later, can override)
  priority        Int       @default(0)
  
  // Validity
  effectiveFrom   DateTime  @map("effective_from")
  effectiveTo     DateTime? @map("effective_to")
  isActive        Boolean   @default(true) @map("is_active")
  
  // Audit
  createdAt       DateTime  @default(now()) @map("created_at")
  createdBy       String?   @map("created_by")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  approvedAt      DateTime? @map("approved_at")
  approvedBy      String?   @map("approved_by")
  
  @@index([scope, supplierId])
  @@index([isActive, effectiveFrom])
  @@map("pricing_rules")
}

enum PricingRuleScope {
  GLOBAL           // Applies to everything
  SUPPLIER         // Applies to one supplier
  CATEGORY         // Applies to a category
  SUB_CATEGORY     // Applies to a sub-category
  PRODUCT          // Applies to specific product
  CUSTOMER         // Customer-specific pricing
}

enum PricingRuleType {
  SUPPLIER_DISCOUNT    // Discount from supplier
  EXCHANGE_RATE        // Currency conversion
  FREIGHT_PERCENTAGE   // Freight as % of value
  FREIGHT_FIXED        // Fixed freight amount
  MARKUP_PERCENTAGE    // Your margin %
  MARKUP_FIXED         // Fixed markup amount
  LIST_PRICE_MARKUP    // Additional markup for list price
  CUSTOMER_DISCOUNT    // Customer-specific discount
}
```

### Exchange Rate History

```prisma
model ExchangeRate {
  id            String    @id @default(uuid())
  fromCurrency  String    @map("from_currency")
  toCurrency    String    @map("to_currency")
  rate          Decimal   @db.Decimal(12, 6)
  effectiveDate Date      @map("effective_date")
  source        String?   // "manual", "api", etc.
  
  createdAt     DateTime  @default(now()) @map("created_at")
  createdBy     String?   @map("created_by")
  
  @@unique([fromCurrency, toCurrency, effectiveDate])
  @@index([fromCurrency, toCurrency, effectiveDate])
  @@map("exchange_rates")
}
```

---

## Multi-Tenant Pattern

For customer-facing portal with company isolation:

```prisma
model Company {
  id              String    @id @default(uuid())
  
  // Odoo reference
  odooId          Int?      @unique @map("odoo_id")
  
  // Company details
  name            String
  code            String    @unique  // Short code for reference
  
  // Settings
  defaultCurrency String    @default("ZAR") @map("default_currency")
  pricingTierId   String?   @map("pricing_tier_id")
  creditLimit     Decimal?  @map("credit_limit") @db.Decimal(12, 2)
  paymentTerms    String?   @map("payment_terms")  // "NET30", "NET60", etc.
  
  // Relations
  users           CompanyUser[]
  quotes          Quote[]
  
  // Status
  isActive        Boolean   @default(true) @map("is_active")
  
  // Audit
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at")
  
  @@map("companies")
}

model CompanyUser {
  id              String    @id @default(uuid())
  companyId       String    @map("company_id")
  company         Company   @relation(fields: [companyId], references: [id])
  userId          String    @map("user_id")
  user            User      @relation(fields: [userId], references: [id])
  
  role            CompanyRole @default(BUYER)
  spendingLimit   Decimal?  @map("spending_limit") @db.Decimal(12, 2)
  canApproveOrders Boolean  @default(false) @map("can_approve_orders")
  
  // Audit
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  
  @@unique([companyId, userId])
  @@map("company_users")
}

enum CompanyRole {
  VIEWER          // Can view only
  BUYER           // Can create quotes
  APPROVER        // Can approve orders
  ADMIN           // Can manage company users
}
```

---

## Quote Schema

Quotes live entirely in your system:

```prisma
model Quote {
  id              String      @id @default(uuid())
  quoteNumber     String      @unique @map("quote_number")  // QUO-2024-00001
  
  // Customer
  customerId      String?     @map("customer_id")
  customer        Customer?   @relation(fields: [customerId], references: [id])
  
  // For walk-in quotes (no customer record yet)
  customerName    String?     @map("customer_name")
  customerEmail   String?     @map("customer_email")
  customerPhone   String?     @map("customer_phone")
  
  // Pricing snapshot
  currency        String      @default("ZAR")
  exchangeRateUsed Decimal?   @map("exchange_rate_used") @db.Decimal(12, 6)
  
  // Totals
  subtotal        Decimal     @default(0) @db.Decimal(12, 2)
  discountAmount  Decimal     @default(0) @map("discount_amount") @db.Decimal(12, 2)
  vatAmount       Decimal     @default(0) @map("vat_amount") @db.Decimal(12, 2)
  total           Decimal     @default(0) @db.Decimal(12, 2)
  
  // Status
  status          QuoteStatus @default(DRAFT)
  
  // Validity
  validFrom       DateTime    @default(now()) @map("valid_from")
  validUntil      DateTime    @map("valid_until")
  
  // Conversion
  convertedToOrderId String?  @map("converted_to_order_id")
  convertedAt     DateTime?   @map("converted_at")
  
  // Notes
  internalNotes   String?     @map("internal_notes")
  customerNotes   String?     @map("customer_notes")
  
  // Relations
  items           QuoteItem[]
  
  // Audit
  createdAt       DateTime    @default(now()) @map("created_at")
  createdBy       String      @map("created_by")
  updatedAt       DateTime    @updatedAt @map("updated_at")
  updatedBy       String?     @map("updated_by")
  
  @@index([customerId, status])
  @@index([quoteNumber])
  @@map("quotes")
}

enum QuoteStatus {
  DRAFT
  SENT
  VIEWED
  ACCEPTED
  REJECTED
  EXPIRED
  CONVERTED
  CANCELLED
}

model QuoteItem {
  id              String    @id @default(uuid())
  quoteId         String    @map("quote_id")
  quote           Quote     @relation(fields: [quoteId], references: [id])
  
  lineNumber      Int       @map("line_number")
  
  // Product reference
  productId       String?   @map("product_id")
  sku             String?
  description     String
  
  // Configuration (for configured items)
  configurationId String?   @map("configuration_id")
  configData      Json?     @map("config_data")  // Snapshot of configuration
  
  // Quantity
  quantity        Decimal   @db.Decimal(12, 4)
  unitOfMeasure   String    @default("EA") @map("unit_of_measure")
  
  // Pricing (all in quote currency)
  unitCost        Decimal   @map("unit_cost") @db.Decimal(12, 4)
  unitPrice       Decimal   @map("unit_price") @db.Decimal(12, 4)
  discountPct     Decimal?  @map("discount_pct") @db.Decimal(5, 2)
  lineTotal       Decimal   @map("line_total") @db.Decimal(12, 2)
  
  // Pricing breakdown (for auditability)
  pricingSnapshot Json?     @map("pricing_snapshot")
  
  // Audit
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  
  @@index([quoteId])
  @@map("quote_items")
}
```

---

## Order Schema

When a quote is accepted:

```prisma
model Order {
  id              String      @id @default(uuid())
  orderNumber     String      @unique @map("order_number")  // ORD-2024-00001
  
  // Customer
  customerId      String      @map("customer_id")
  customer        Customer    @relation(fields: [customerId], references: [id])
  
  // Origin
  quoteId         String?     @map("quote_id")
  
  // Addresses (snapshot at time of order)
  billingAddress  Json        @map("billing_address")
  shippingAddress Json        @map("shipping_address")
  
  // Totals
  currency        String      @default("ZAR")
  subtotal        Decimal     @db.Decimal(12, 2)
  discountAmount  Decimal     @default(0) @map("discount_amount") @db.Decimal(12, 2)
  shippingAmount  Decimal     @default(0) @map("shipping_amount") @db.Decimal(12, 2)
  vatAmount       Decimal     @map("vat_amount") @db.Decimal(12, 2)
  total           Decimal     @db.Decimal(12, 2)
  
  // Status
  status          OrderStatus @default(PENDING)
  
  // Dates
  orderDate       DateTime    @default(now()) @map("order_date")
  requiredDate    DateTime?   @map("required_date")
  shippedDate     DateTime?   @map("shipped_date")
  deliveredDate   DateTime?   @map("delivered_date")
  
  // Payment
  paymentTerms    String?     @map("payment_terms")
  paymentStatus   PaymentStatus @default(UNPAID) @map("payment_status")
  
  // Notes
  internalNotes   String?     @map("internal_notes")
  customerNotes   String?     @map("customer_notes")
  
  // Relations
  items           OrderItem[]
  invoices        Invoice[]
  
  // Audit
  createdAt       DateTime    @default(now()) @map("created_at")
  createdBy       String      @map("created_by")
  updatedAt       DateTime    @updatedAt @map("updated_at")
  updatedBy       String?     @map("updated_by")
  
  @@index([customerId, status])
  @@map("orders")
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  READY_TO_SHIP
  SHIPPED
  DELIVERED
  COMPLETED
  CANCELLED
}

enum PaymentStatus {
  UNPAID
  PARTIAL
  PAID
  REFUNDED
}

model OrderItem {
  id              String    @id @default(uuid())
  orderId         String    @map("order_id")
  order           Order     @relation(fields: [orderId], references: [id])
  
  lineNumber      Int       @map("line_number")
  productId       String?   @map("product_id")
  sku             String?
  description     String
  
  quantity        Decimal   @db.Decimal(12, 4)
  unitOfMeasure   String    @default("EA") @map("unit_of_measure")
  
  unitPrice       Decimal   @map("unit_price") @db.Decimal(12, 4)
  discountPct     Decimal?  @map("discount_pct") @db.Decimal(5, 2)
  lineTotal       Decimal   @map("line_total") @db.Decimal(12, 2)
  
  // Fulfillment
  quantityShipped Decimal   @default(0) @map("quantity_shipped") @db.Decimal(12, 4)
  
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  
  @@map("order_items")
}
```

---

## Invoice Schema

```prisma
model Invoice {
  id              String        @id @default(uuid())
  invoiceNumber   String        @unique @map("invoice_number")  // INV-2024-00001
  
  // Customer
  customerId      String        @map("customer_id")
  customer        Customer      @relation(fields: [customerId], references: [id])
  
  // Origin
  orderId         String?       @map("order_id")
  order           Order?        @relation(fields: [orderId], references: [id])
  
  // Addresses (snapshot)
  billingAddress  Json          @map("billing_address")
  
  // Totals
  currency        String        @default("ZAR")
  subtotal        Decimal       @db.Decimal(12, 2)
  vatAmount       Decimal       @map("vat_amount") @db.Decimal(12, 2)
  total           Decimal       @db.Decimal(12, 2)
  amountPaid      Decimal       @default(0) @map("amount_paid") @db.Decimal(12, 2)
  amountDue       Decimal       @map("amount_due") @db.Decimal(12, 2)
  
  // Status
  status          InvoiceStatus @default(DRAFT)
  
  // Dates
  invoiceDate     DateTime      @default(now()) @map("invoice_date")
  dueDate         DateTime      @map("due_date")
  paidDate        DateTime?     @map("paid_date")
  
  // PDF
  pdfUrl          String?       @map("pdf_url")
  
  // Relations
  items           InvoiceItem[]
  payments        Payment[]
  
  // Audit
  createdAt       DateTime      @default(now()) @map("created_at")
  createdBy       String        @map("created_by")
  updatedAt       DateTime      @updatedAt @map("updated_at")
  
  @@index([customerId, status])
  @@map("invoices")
}

enum InvoiceStatus {
  DRAFT
  SENT
  VIEWED
  PAID
  PARTIAL
  OVERDUE
  CANCELLED
  WRITTEN_OFF
}

model InvoiceItem {
  id              String    @id @default(uuid())
  invoiceId       String    @map("invoice_id")
  invoice         Invoice   @relation(fields: [invoiceId], references: [id])
  
  lineNumber      Int       @map("line_number")
  description     String
  quantity        Decimal   @db.Decimal(12, 4)
  unitPrice       Decimal   @map("unit_price") @db.Decimal(12, 4)
  lineTotal       Decimal   @map("line_total") @db.Decimal(12, 2)
  
  @@map("invoice_items")
}

model Payment {
  id              String        @id @default(uuid())
  invoiceId       String        @map("invoice_id")
  invoice         Invoice       @relation(fields: [invoiceId], references: [id])
  
  amount          Decimal       @db.Decimal(12, 2)
  paymentMethod   PaymentMethod @map("payment_method")
  reference       String?       // Bank reference, check number, etc.
  
  paymentDate     DateTime      @map("payment_date")
  
  createdAt       DateTime      @default(now()) @map("created_at")
  createdBy       String        @map("created_by")
  
  @@map("payments")
}

enum PaymentMethod {
  BANK_TRANSFER
  CREDIT_CARD
  CASH
  CHECK
  OTHER
}
```

---

## Indexing Strategy

### Always Index

```sql
-- Foreign keys
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);

-- Lookup fields
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_supplier_sku ON products(supplier_sku);

-- Status + date combinations
CREATE INDEX idx_quotes_status_created ON quotes(status, created_at);
CREATE INDEX idx_price_lists_supplier_status ON price_lists(supplier_id, status);

-- Soft delete filter (partial index)
CREATE INDEX idx_products_active ON products(id) WHERE deleted_at IS NULL;

-- Full-text search
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || description));
```

### Index Checklist

- [ ] All foreign keys
- [ ] Fields used in WHERE clauses
- [ ] Fields used in ORDER BY
- [ ] Fields used in JOIN conditions
- [ ] Composite indexes for common query patterns
- [ ] Partial indexes for soft-deleted records

---

## Migration Best Practices

### Safe Migration Pattern

```typescript
// migrations/20240124_add_pricing_rules.ts

// 1. Add new column as nullable first
ALTER TABLE products ADD COLUMN new_field VARCHAR(100);

// 2. Backfill data (in separate migration or script)
UPDATE products SET new_field = 'default_value' WHERE new_field IS NULL;

// 3. Add NOT NULL constraint (in separate migration)
ALTER TABLE products ALTER COLUMN new_field SET NOT NULL;
```

### Never Do

- Drop columns in production without data migration plan
- Change column types without considering existing data
- Add NOT NULL columns without default values
- Run migrations without backups

---

## Query Patterns

### Always Filter Soft Deletes

```typescript
// Repository pattern
class ProductRepository {
  async findById(id: string) {
    return prisma.product.findFirst({
      where: { 
        id,
        deletedAt: null  // ALWAYS include this
      }
    });
  }
  
  async findAll() {
    return prisma.product.findMany({
      where: { deletedAt: null }
    });
  }
}
```

### Always Set Audit Fields

```typescript
// Service pattern
class ProductService {
  async create(data: CreateProductDto, userId: string) {
    return prisma.product.create({
      data: {
        ...data,
        createdBy: userId,
        updatedBy: userId,
      }
    });
  }
  
  async update(id: string, data: UpdateProductDto, userId: string) {
    return prisma.product.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      }
    });
  }
  
  async softDelete(id: string, userId: string) {
    return prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      }
    });
  }
}
```

---

## Checklist for New Tables

- [ ] UUID primary key (not auto-increment integers)
- [ ] created_at, created_by columns
- [ ] updated_at, updated_by columns
- [ ] deleted_at, deleted_by columns (for business data)
- [ ] Odoo ID column if synced with Odoo
- [ ] Appropriate indexes on foreign keys
- [ ] Appropriate indexes on lookup fields
- [ ] Decimal precision specified for money fields
- [ ] Enum types for status fields
- [ ] Timestamps with time zone
- [ ] Table and column names in snake_case
- [ ] Prisma @@map for table names
