# NUSAF Platform - Comprehensive Gap Analysis

> **Purpose**: Identify missing foundational pieces for automated fulfillment orchestration
> **Date**: February 2026

---

## Executive Summary

The NUSAF platform has solid foundations for **order processing** and **inventory tracking**, but is missing critical pieces for **automated fulfillment orchestration**. The system currently requires manual intervention at every step of the fulfillment chain.

### Current State
- Products are **view-only** (created via Excel import, no editing UI)
- Picking slips, job cards, and transfers are **manually created**
- No **product type classification** (stock vs assembly)
- No **BOM/component relationships**
- No **procurement system** (Purchase Orders, GRVs)
- No **manufacturing setup** (work centers, routing)

### To Enable Orchestration
When a quote is accepted, the system should automatically determine:
1. What to pick from stock → Generate picking slips
2. What to manufacture → Generate job cards
3. What to purchase → Generate purchase orders
4. What to transfer → Generate transfer requests

This requires building several foundational layers first.

---

## 1. SCHEMA AUDIT

### What Exists

| Model | Status | Notes |
|-------|--------|-------|
| Product | Exists | View-only, no edit UI, no product type field |
| Supplier | Exists | Read-only, seeded via import, no CRUD |
| Category/SubCategory | Exists | Read-only, no CRUD |
| StockLevel | Exists | Per product per warehouse |
| StockMovement | Exists | Full audit trail |
| StockReservation | Exists | SOFT (quotes) and HARD (orders) |
| StockAdjustment | Exists | Pending → Approved workflow |
| Quote/QuoteItem | Exists | Full workflow |
| SalesOrder/SalesOrderLine | Exists | Full workflow |
| PickingSlip/PickingSlipLine | Exists | Manual creation only |
| JobCard | Exists | Manual creation, no routing |
| TransferRequest | Exists | Manual creation only |
| IssueFlag/IssueComment | Exists | Full workflow |
| Document | Exists | R2 storage |

### What's Missing

| Model | Status | Impact |
|-------|--------|--------|
| **Product.productType** | Missing field | Can't auto-detect assembly vs stock |
| **BomItem** | Missing model | Can't track component relationships |
| **PurchaseOrder** | Missing model | Can't auto-generate procurement |
| **PurchaseOrderLine** | Missing model | — |
| **GoodsReceivedVoucher (GRV)** | Missing model | Can't process supplier receipts |
| **Vendor/SupplierContact** | Missing model | Supplier has no contacts |
| **WorkCenter** | Missing model | No manufacturing routing |
| **ProductRouting** | Missing model | No manufacturing steps |
| **ProductionSchedule** | Missing model | No capacity planning |

---

## 2. DETAILED GAP ANALYSIS

### 2.1 Product Management

#### Current State
- Products created **only via Excel import**
- PATCH endpoint exists but **only for inventory defaults**:
  - `defaultReorderPoint`, `defaultReorderQty`
  - `defaultMinStock`, `defaultMaxStock`
  - `leadTimeDays`
- **No UI for editing** product core fields
- **No product type field** to distinguish stock vs assembly

#### What's Missing

**Schema additions needed:**
```prisma
model Product {
  // ADD these fields:
  productType       ProductType    @default(STOCK_ONLY)
  assemblyLeadDays  Int?           // Days to manufacture
  weight            Decimal?       // For shipping calculations
  dimensions        Json?          // L x W x H
  imageUrl          String?        // Product image

  // ADD this relation:
  bomItems          BomItem[]      // Components if assembly
}

enum ProductType {
  STOCK_ONLY         // Pick from shelf
  ASSEMBLY_REQUIRED  // Requires job card
  MADE_TO_ORDER      // Always manufactured
  KIT                // Bundle of stock items
}
```

**API endpoints needed:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| PATCH | `/products/:id` | Update ALL product fields (not just inventory) |
| POST | `/products` | Create product manually (not just import) |
| DELETE | `/products/:id` | Soft delete product |

**UI needed:**
- Product edit page: `/products/[id]/edit`
- Product create page: `/products/new` (or modal)
- Product type selector in edit form
- Image upload component

---

### 2.2 Bill of Materials (BOM)

#### Current State
- **Does not exist**
- No way to define that Product A requires components B + C
- Job cards reference a single product, not components

#### What's Missing

**Schema:**
```prisma
model BomItem {
  id             String   @id @default(cuid())
  parentProductId String  @map("parent_product_id")
  parentProduct  Product  @relation("ParentProduct", fields: [parentProductId], references: [id])

  componentProductId String  @map("component_product_id")
  componentProduct   Product @relation("ComponentProduct", fields: [componentProductId], references: [id])

  quantity       Decimal  @db.Decimal(10, 4)  // e.g., 2.5 meters of chain
  unit           String?  // Override unit if different from component
  notes          String?
  sortOrder      Int      @default(0)

  createdAt      DateTime @default(now())
  createdBy      String?
  updatedAt      DateTime @updatedAt

  @@unique([parentProductId, componentProductId])
  @@map("bom_items")
}
```

**API endpoints needed:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/products/:id/bom` | Get BOM for product |
| POST | `/products/:id/bom` | Add component to BOM |
| PATCH | `/products/:id/bom/:componentId` | Update quantity |
| DELETE | `/products/:id/bom/:componentId` | Remove component |
| GET | `/products/:id/where-used` | Where is this product used? |

**UI needed:**
- BOM tab on product detail page
- Component picker modal
- Quantity input with unit
- Where-used view (reverse BOM)

---

### 2.3 Procurement (Purchase Orders)

#### Current State
- **Does not exist**
- No way to order stock from suppliers
- No goods receipt process
- `StockLevel.onOrder` field exists but nothing populates it

#### What's Missing

**Schema:**
```prisma
model PurchaseOrder {
  id              String   @id @default(cuid())
  poNumber        String   @unique @map("po_number")  // PO-2026-00001
  supplierId      String   @map("supplier_id")
  supplier        Supplier @relation(fields: [supplierId], references: [id])

  status          PurchaseOrderStatus @default(DRAFT)

  // Shipping
  deliveryLocation Warehouse @default(JHB)
  expectedDate     DateTime? @map("expected_date")

  // Totals (supplier currency)
  currency        SupplierCurrency @default(EUR)
  subtotal        Decimal  @db.Decimal(12, 2)
  total           Decimal  @db.Decimal(12, 2)

  // Reference (if created from sales order backorder)
  sourceOrderId   String?  @map("source_order_id")

  // Notes
  internalNotes   String?
  supplierNotes   String?

  lines           PurchaseOrderLine[]
  receipts        GoodsReceivedVoucher[]

  createdAt       DateTime @default(now())
  createdBy       String
  updatedAt       DateTime @updatedAt
  sentAt          DateTime?

  @@map("purchase_orders")
}

enum PurchaseOrderStatus {
  DRAFT
  SENT
  ACKNOWLEDGED
  PARTIALLY_RECEIVED
  RECEIVED
  CLOSED
  CANCELLED
}

model PurchaseOrderLine {
  id              String   @id @default(cuid())
  purchaseOrderId String   @map("purchase_order_id")
  purchaseOrder   PurchaseOrder @relation(...)
  lineNumber      Int

  productId       String
  productSku      String
  productDescription String

  quantityOrdered   Int
  quantityReceived  Int      @default(0)

  unitCost          Decimal  @db.Decimal(10, 4)  // Supplier price
  lineTotal         Decimal  @db.Decimal(12, 2)

  // Link to sales order line if backorder
  salesOrderLineId  String?

  @@map("purchase_order_lines")
}

model GoodsReceivedVoucher {
  id              String   @id @default(cuid())
  grvNumber       String   @unique @map("grv_number")  // GRV-2026-00001
  purchaseOrderId String   @map("purchase_order_id")
  purchaseOrder   PurchaseOrder @relation(...)

  location        Warehouse
  receivedAt      DateTime @default(now())
  receivedBy      String
  receivedByName  String

  notes           String?

  lines           GrvLine[]

  @@map("goods_received_vouchers")
}

model GrvLine {
  id              String   @id @default(cuid())
  grvId           String   @map("grv_id")
  grv             GoodsReceivedVoucher @relation(...)

  poLineId        String   @map("po_line_id")
  productId       String
  productSku      String

  quantityExpected  Int
  quantityReceived  Int
  quantityRejected  Int    @default(0)
  rejectionReason   String?

  @@map("grv_lines")
}
```

**API endpoints needed:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/purchase-orders` | Create PO |
| GET | `/purchase-orders` | List POs with filters |
| GET | `/purchase-orders/:id` | Get PO details |
| PATCH | `/purchase-orders/:id` | Update PO |
| POST | `/purchase-orders/:id/send` | Mark as sent |
| POST | `/purchase-orders/:id/lines` | Add line |
| POST | `/purchase-orders/:id/receive` | Create GRV |
| GET | `/grvs` | List GRVs |
| GET | `/grvs/:id` | GRV details |

**UI needed:**
- Purchase Orders list page: `/purchase-orders`
- PO detail page: `/purchase-orders/[id]`
- Create PO modal/page
- Receive goods modal (creates GRV, updates stock)
- GRV list and detail pages

---

### 2.4 Supplier Management

#### Current State
- Supplier model exists but is **read-only**
- Created via seeding or Excel import
- No CRUD endpoints
- No contact information
- No payment terms

#### What's Missing

**Schema additions:**
```prisma
model Supplier {
  // ADD these fields:
  email           String?
  phone           String?
  website         String?
  address         String?
  paymentTerms    String?        // e.g., "Net 30"
  minimumOrder    Decimal?       // Minimum order value

  // ADD this relation:
  contacts        SupplierContact[]
  purchaseOrders  PurchaseOrder[]
}

model SupplierContact {
  id           String   @id @default(cuid())
  supplierId   String   @map("supplier_id")
  supplier     Supplier @relation(...)

  firstName    String
  lastName     String
  email        String
  phone        String?
  role         String?   // e.g., "Sales Rep", "Accounts"
  isPrimary    Boolean   @default(false)

  @@map("supplier_contacts")
}
```

**API endpoints needed:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/suppliers` | List suppliers |
| GET | `/suppliers/:id` | Supplier details |
| POST | `/suppliers` | Create supplier |
| PATCH | `/suppliers/:id` | Update supplier |
| POST | `/suppliers/:id/contacts` | Add contact |

**UI needed:**
- Suppliers list page: `/suppliers`
- Supplier detail page: `/suppliers/[id]`
- Supplier edit modal
- Contact management

---

### 2.5 Manufacturing Setup

#### Current State
- Job cards exist but are **simple**
- Only fields: jobType (MACHINING | ASSEMBLY), status, notes
- No routing, work centers, or time tracking
- No capacity planning

#### What's Missing (Future - Lower Priority)

For basic orchestration, the current JobCard model is sufficient. For advanced manufacturing, you'd need:

```prisma
model WorkCenter {
  id              String   @id @default(cuid())
  code            String   @unique
  name            String
  location        Warehouse @default(JHB)
  capacityPerDay  Int?     // Units per day
  isActive        Boolean  @default(true)
}

model ProductRouting {
  id              String   @id @default(cuid())
  productId       String
  workCenterId    String
  stepNumber      Int
  operation       String   // "Cut to length", "Drill holes", etc.
  setupMinutes    Int?
  runMinutesPerUnit Int?
}
```

**Recommendation**: Defer this. Current JobCard is sufficient for Phase 1 orchestration.

---

### 2.6 Product Editing UI

#### Current State
- No product edit page exists
- Admin settings page only has: Exchange Rate, Pricing Rules, Categories (view-only)
- Products are import-only

#### What's Missing

**UI needed:**
- Product edit page with tabs:
  - **Details**: SKU, description, category, supplier, unit
  - **Pricing**: Cost, list price, pricing rule link
  - **Inventory**: Reorder settings (exists), lead time
  - **BOM**: Component list (if assembly type)
  - **Stock**: Current levels per warehouse (view)
  - **History**: Movement log (exists)

---

## 3. DEPENDENCY MAP

```
                    ┌─────────────────────────────────────────────────┐
                    │           FULFILLMENT ORCHESTRATION             │
                    │   (Auto-generate picking/jobs/POs/transfers)    │
                    └─────────────────────────────────────────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
                    ▼                     ▼                     ▼
          ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
          │   Stock Check   │   │   BOM Explode   │   │  Procurement    │
          │   & Allocation  │   │   & Job Cards   │   │  (Backorders)   │
          └────────┬────────┘   └────────┬────────┘   └────────┬────────┘
                   │                     │                     │
                   │                     │                     │
          ┌────────┴────────┐            │            ┌────────┴────────┐
          │   StockLevel    │            │            │  PurchaseOrder  │
          │   (EXISTS)      │            │            │  (MISSING)      │
          └─────────────────┘            │            └────────┬────────┘
                                         │                     │
                              ┌──────────┴──────────┐          │
                              │                     │          │
                    ┌─────────┴─────────┐   ┌───────┴───────┐  │
                    │     BomItem       │   │ Product.type  │  │
                    │    (MISSING)      │   │  (MISSING)    │  │
                    └─────────┬─────────┘   └───────┬───────┘  │
                              │                     │          │
                              └──────────┬──────────┘          │
                                         │                     │
                              ┌──────────┴──────────┐          │
                              │   Product Editing   │          │
                              │     (MISSING)       │◄─────────┘
                              └──────────┬──────────┘
                                         │
                              ┌──────────┴──────────┐
                              │   Supplier CRUD     │
                              │    (MISSING)        │
                              └─────────────────────┘
```

### Build Order (Bottom-Up)

1. **Supplier CRUD** → Foundation for procurement
2. **Product Editing** → Enables product type, BOM editing
3. **Product Type Field** → Enables assembly detection
4. **BOM Model** → Enables component tracking
5. **Purchase Order** → Enables procurement
6. **Stock Allocation Logic** → Enables smart picking slip generation
7. **Fulfillment Orchestration** → The goal

---

## 4. PROPOSED BUILD ORDER

### Phase A: Master Data Management (Foundation)

| Task | Name | Description | Depends On |
|------|------|-------------|------------|
| **TASK-017** | Supplier CRUD | API endpoints + UI for supplier management | None |
| **TASK-018** | Product Editing | Full product edit UI (not just inventory defaults) | TASK-017 |
| **TASK-018A** | Product Type Field | Add productType enum, migration, UI selector | TASK-018 |

### Phase B: Bill of Materials

| Task | Name | Description | Depends On |
|------|------|-------------|------------|
| **TASK-019** | BOM Schema & API | BomItem model, CRUD endpoints | TASK-018A |
| **TASK-019A** | BOM UI | Component picker, BOM tab on product page | TASK-019 |

### Phase C: Procurement

| Task | Name | Description | Depends On |
|------|------|-------------|------------|
| **TASK-020** | Purchase Orders | PO model, CRUD, status workflow | TASK-017 |
| **TASK-020A** | Goods Receipt | GRV model, receiving flow, stock updates | TASK-020 |
| **TASK-020B** | PO UI | List, detail, create pages | TASK-020A |

### Phase D: Fulfillment Orchestration

| Task | Name | Description | Depends On |
|------|------|-------------|------------|
| **TASK-021** | Stock Allocation Service | Check stock, allocate to warehouses | TASK-013 (done) |
| **TASK-021A** | BOM Explosion Service | Explode assembly into components | TASK-019 |
| **TASK-022** | Orchestration Engine | Quote accepted → auto-generate all documents | TASK-021, TASK-021A, TASK-020 |
| **TASK-022A** | Orchestration UI | Review/approve generated documents before commit | TASK-022 |

### Phase E: Enhancements (From Existing Backlog)

| Task | Name | Description | Depends On |
|------|------|-------------|------------|
| TASK-012-2E | Customer Order Tracking | Customer portal view | TASK-022 |
| TASK-012-2F | Operations Analytics | KPIs, dashboards | TASK-022 |
| TASK-011b | Sales Dashboard | Quote analytics | None |

---

## 5. DETAILED TASK SPECIFICATIONS

### TASK-017: Supplier CRUD

**Models**: Extend existing `Supplier`, add `SupplierContact`

**Schema changes**:
```prisma
model Supplier {
  // ADD:
  email           String?
  phone           String?
  website         String?
  addressLine1    String?
  addressLine2    String?
  city            String?
  country         String   @default("Italy")
  paymentTerms    String?
  minimumOrderValue Decimal? @db.Decimal(12, 2)
  notes           String?

  contacts        SupplierContact[]
  purchaseOrders  PurchaseOrder[]
}

model SupplierContact {
  id           String   @id @default(cuid())
  supplierId   String
  supplier     Supplier @relation(...)
  firstName    String
  lastName     String
  email        String
  phone        String?
  role         String?
  isPrimary    Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("supplier_contacts")
}
```

**API endpoints**:
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/suppliers` | List all suppliers |
| GET | `/suppliers/:id` | Get supplier with contacts |
| POST | `/suppliers` | Create supplier |
| PATCH | `/suppliers/:id` | Update supplier |
| DELETE | `/suppliers/:id` | Soft delete |
| POST | `/suppliers/:id/contacts` | Add contact |
| PATCH | `/suppliers/:id/contacts/:contactId` | Update contact |
| DELETE | `/suppliers/:id/contacts/:contactId` | Remove contact |

**UI pages**:
- `/suppliers` - List with search, filter by active
- `/suppliers/[id]` - Detail view with contacts tab
- Supplier edit modal
- Contact add/edit modal

**Dependencies**: None

**Estimated scope**: Medium (1-2 days)

---

### TASK-018: Product Editing

**Schema changes**:
```prisma
model Product {
  // ADD:
  productType      ProductType @default(STOCK_ONLY)
  assemblyLeadDays Int?
  weight           Decimal?    @db.Decimal(10, 3)
  dimensionsJson   Json?       // { length, width, height, unit }
  imageUrl         String?
  longDescription  String?     // Rich text / markdown
  isConfigurable   Boolean     @default(false)  // For future configurator

  bomItems         BomItem[]   @relation("ParentProduct")
  usedIn           BomItem[]   @relation("ComponentProduct")
}

enum ProductType {
  STOCK_ONLY
  ASSEMBLY_REQUIRED
  MADE_TO_ORDER
  KIT
}
```

**API endpoints**:
| Method | Endpoint | Purpose |
|--------|----------|---------|
| PATCH | `/products/:id` | Update ALL product fields |
| POST | `/products` | Create product manually |
| DELETE | `/products/:id` | Soft delete |
| POST | `/products/:id/image` | Upload product image |

**UI pages**:
- `/products/[id]/edit` - Full edit page with tabs:
  - Details (description, SKU, category, type)
  - Pricing (cost, list, rules)
  - Inventory (reorder settings)
  - Images (upload/manage)
  - BOM (placeholder, built in TASK-019A)

**Dependencies**: TASK-017 (supplier dropdown needs CRUD)

**Estimated scope**: Medium-Large (2-3 days)

---

### TASK-019: BOM Schema & API

**Schema**:
```prisma
model BomItem {
  id                 String   @id @default(cuid())
  parentProductId    String   @map("parent_product_id")
  parentProduct      Product  @relation("ParentProduct", fields: [parentProductId], references: [id])

  componentProductId String   @map("component_product_id")
  componentProduct   Product  @relation("ComponentProduct", fields: [componentProductId], references: [id])

  quantity           Decimal  @db.Decimal(10, 4)
  unitOverride       String?  // If different from component's unit
  notes              String?
  sortOrder          Int      @default(0)
  isOptional         Boolean  @default(false)  // For configurator

  createdAt          DateTime @default(now())
  createdBy          String?
  updatedAt          DateTime @updatedAt
  updatedBy          String?

  @@unique([parentProductId, componentProductId])
  @@index([parentProductId])
  @@index([componentProductId])
  @@map("bom_items")
}
```

**API endpoints**:
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/products/:id/bom` | Get BOM tree for product |
| POST | `/products/:id/bom` | Add component |
| PATCH | `/products/:id/bom/:componentId` | Update quantity |
| DELETE | `/products/:id/bom/:componentId` | Remove component |
| GET | `/products/:id/where-used` | Reverse BOM lookup |
| POST | `/products/:id/bom/copy-from/:sourceId` | Copy BOM from another product |

**Service functions**:
- `explodeBom(productId, quantity)` → Returns flat list of all components
- `checkBomStock(productId, quantity, warehouse)` → Stock availability for all components
- `validateBomCircular(parentId, componentId)` → Prevent circular references

**Dependencies**: TASK-018A (needs productType field)

**Estimated scope**: Medium (1-2 days)

---

### TASK-020: Purchase Orders

**Schema**: See Section 2.3 above

**API endpoints**:
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/purchase-orders` | Create PO |
| GET | `/purchase-orders` | List with filters |
| GET | `/purchase-orders/:id` | Get PO with lines |
| PATCH | `/purchase-orders/:id` | Update PO |
| DELETE | `/purchase-orders/:id` | Cancel PO |
| POST | `/purchase-orders/:id/lines` | Add line |
| PATCH | `/purchase-orders/:id/lines/:lineId` | Update line |
| DELETE | `/purchase-orders/:id/lines/:lineId` | Remove line |
| POST | `/purchase-orders/:id/send` | Mark as sent to supplier |

**Service functions**:
- `createPoFromBackorders(supplierId, productIds)` → Create PO for out-of-stock items
- `calculatePoTotals(poId)` → Recalculate totals

**Dependencies**: TASK-017 (needs supplier CRUD)

**Estimated scope**: Medium-Large (2-3 days)

---

### TASK-020A: Goods Receipt (GRV)

**Schema**: See Section 2.3 above

**API endpoints**:
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/purchase-orders/:id/receive` | Create GRV from PO |
| GET | `/grvs` | List GRVs |
| GET | `/grvs/:id` | GRV details |
| PATCH | `/grvs/:id/lines/:lineId` | Update received/rejected qty |
| POST | `/grvs/:id/complete` | Finalize receipt, update stock |

**Service functions**:
- `receiveGoods(grvId)` → Creates StockMovements (RECEIPT), updates StockLevel.onHand
- `updateOnOrder(poLineId, qty)` → Adjusts StockLevel.onOrder

**Stock movement integration**:
- GRV complete → StockMovement.RECEIPT for each line
- Updates `StockLevel.onHand` (increase)
- Updates `StockLevel.onOrder` (decrease)

**Dependencies**: TASK-020

**Estimated scope**: Medium (1-2 days)

---

### TASK-021: Stock Allocation Service

**No schema changes** - pure business logic

**Service functions**:
```typescript
interface AllocationResult {
  warehouse: Warehouse;
  productId: string;
  quantityAllocated: number;
  quantityBackorder: number;
}

// Check availability across warehouses
async function checkAvailability(
  productId: string,
  quantity: number,
  preferredWarehouse?: Warehouse
): Promise<{
  canFulfill: boolean;
  allocations: AllocationResult[];
  backorderQty: number;
}>

// Allocate stock for an order
async function allocateForOrder(
  orderId: string,
  customerWarehouse: Warehouse
): Promise<{
  pickingSlips: { warehouse: Warehouse; lines: PickingSlipLine[] }[];
  backorders: { productId: string; quantity: number }[];
}>

// Smart allocation: CT customer gets CT stock first, spill to JHB
async function getOptimalAllocation(
  lines: OrderLine[],
  customerWarehouse: Warehouse
): Promise<AllocationPlan>
```

**Business rules**:
1. CT customer → Check CT first → Spill to JHB for remainder
2. JHB/MBB customer → JHB only
3. Assembly products → Always JHB (manufacturing)
4. Respect hard reservations
5. Create backorder list for anything not in stock

**Dependencies**: TASK-013 (done - inventory exists)

**Estimated scope**: Medium (1-2 days)

---

### TASK-022: Fulfillment Orchestration Engine

**The main goal**

**Service functions**:
```typescript
interface OrchestrationPlan {
  orderId: string;
  pickingSlips: {
    warehouse: Warehouse;
    lines: { productId, quantity }[];
  }[];
  jobCards: {
    productId: string;
    quantity: number;
    jobType: JobType;
    components: { productId, quantity }[];  // From BOM
  }[];
  transferRequests: {
    fromWarehouse: Warehouse;
    toWarehouse: Warehouse;
    lines: { productId, quantity }[];
  }[];
  purchaseOrders: {
    supplierId: string;
    lines: { productId, quantity }[];
  }[];
}

// Generate fulfillment plan (doesn't commit)
async function generateFulfillmentPlan(orderId: string): Promise<OrchestrationPlan>

// Execute plan (creates all documents)
async function executeFulfillmentPlan(plan: OrchestrationPlan, userId: string): Promise<void>
```

**Trigger points**:
1. **Quote accepted** → Auto-create order + generate plan (review before execute)
2. **Order confirmed** → Execute plan (auto-generate all documents)
3. **Manual trigger** → "Generate Fulfillment" button on order page

**Dependencies**: TASK-021, TASK-021A (BOM explosion), TASK-020 (PO for backorders)

**Estimated scope**: Large (3-4 days)

---

## 6. RECOMMENDED PRIORITY

### Must Have (for basic orchestration)
1. **TASK-018A**: Product Type Field (enables assembly detection)
2. **TASK-021**: Stock Allocation Service (enables smart picking)
3. **TASK-022**: Orchestration Engine (the goal)

### Should Have (for complete workflow)
4. **TASK-017**: Supplier CRUD
5. **TASK-018**: Product Editing
6. **TASK-019**: BOM Schema & API
7. **TASK-020**: Purchase Orders

### Nice to Have (enhancements)
8. **TASK-019A**: BOM UI
9. **TASK-020A/B**: GRV and PO UI
10. **TASK-022A**: Orchestration review UI

---

## 7. QUICK WINS

These could be done immediately with minimal effort:

1. **Add `productType` field to Product** (15 min)
   - Migration + enum
   - Default all existing to STOCK_ONLY
   - Add to product detail display

2. **Add "Generate Fulfillment" button to Order page** (30 min)
   - Manual trigger for orchestration
   - Even without automation, lets user see what would be generated

3. **Add stock availability warning on Quote finalize** (1 hour)
   - Before finalizing, check if all items are in stock
   - Show warning if backorder needed

---

## 8. SUMMARY

### Current State
- **22% complete** for automated fulfillment
- Missing: Product type, BOM, Procurement, Stock allocation, Orchestration engine

### Effort Estimate
- **Phase A** (Master Data): ~4 days
- **Phase B** (BOM): ~3 days
- **Phase C** (Procurement): ~5 days
- **Phase D** (Orchestration): ~5 days
- **Total**: ~17 days of development

### Recommended Approach
1. Start with **TASK-018A** (Product Type) - unblocks everything
2. Then **TASK-021** (Stock Allocation) - enables smart picking
3. Then **TASK-022** (Orchestration) - the main goal
4. Add BOM and Procurement as needed for specific product types

---

*Document generated: February 2026*
