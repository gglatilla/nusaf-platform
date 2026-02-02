# Task Queue

---

## Current
- [TASK-015] Public Website Homepage (IN_PROGRESS)

## Up Next
- [TASK-016] Public Website Product Pages

## Backlog

### Phase A: Master Data Management (Foundation)
- [TASK-017] Supplier CRUD [Master Data, Backend, UI] ✓
- [TASK-018] Product Editing [Master Data, Backend, UI] ✓
- [TASK-018A] Product Type Field [Master Data, Schema] ✓ (merged into TASK-018)

### Phase B: Bill of Materials
- [TASK-019] BOM Schema & API [Master Data, Backend] ✓
- [TASK-019A] BOM UI [Master Data, UI] ✓

### Phase C: Procurement
- [TASK-020] Purchase Orders [Procurement, Backend] ✓
- [TASK-020A] Goods Receipt (GRV) [Procurement, Backend] ✓
- [TASK-020B] Procurement UI [Procurement, UI]

### Phase D: Fulfillment Orchestration ✓ COMPLETE
- [TASK-021] Stock Allocation Service [Fulfillment, Backend] ✓
- [TASK-021A] BOM Explosion Service [Fulfillment, Backend] ✓
- [TASK-022] Fulfillment Orchestration Engine [Fulfillment, Backend] ✓
- [TASK-022A] Fulfillment Orchestration UI [Fulfillment, UI] ✓

### Phase E: Enhancements (Existing Backlog)
- [TASK-012-2E] Order Fulfillment — Customer Portal [Orders, UI/Frontend]
- [TASK-012-2F] Order Fulfillment — Analytics/Dashboards [Orders, UI/Frontend]
- [TASK-011b] Sales dashboard + quote analytics [Quotes, UI/Frontend]
- [TASK-014] Modular chain configurator [Configurator, UI/Frontend]
- [TASK-015] Public website — Homepage [Public Website]
- [TASK-016] Public website — Product pages [Public Website, UI/Frontend]

## Blocked
(none)

---

## Dependency Chain

```
TASK-017 (Supplier CRUD)
    │
    ├──► TASK-018 (Product Editing)
    │        │
    │        └──► TASK-018A (Product Type Field)
    │                  │
    │                  └──► TASK-019 (BOM Schema & API)
    │                            │
    │                            ├──► TASK-019A (BOM UI)
    │                            │
    │                            └──► TASK-021A (BOM Explosion)
    │
    └──► TASK-020 (Purchase Orders)
              │
              └──► TASK-020A (GRV)
                        │
                        └──► TASK-020B (Procurement UI)

TASK-021 (Stock Allocation) ─── Can start anytime (no dependencies)

All above ──► TASK-022 (Orchestration Engine)
                   │
                   └──► TASK-022A (Orchestration UI)
```

---

## Completed

- [TASK-001] Project initialization and setup ✓
- [TASK-002] Database schema — Product tables (suppliers, categories, products) ✓
- [TASK-003] Authentication system (login, logout, sessions) ✓
- [TASK-004] Customer portal layout (sidebar, header, main content) ✓
- [TASK-005] Supplier price list import ✓
- [TASK-006] Pricing engine — Calculate prices per customer tier ✓
- [TASK-007] Product catalog — Display products with categories ✓
- [TASK-008] Product detail modal ✓
- [TASK-009] Admin pricing rules UI ✓
- [TASK-010] Quote system implementation ✓
- [TASK-011] Quote system enhancements + bug fixes ✓
- [TASK-012] Order Fulfillment Operations — Phase 1 Foundation ✓
- [TASK-012-2A] Order Fulfillment — Sales Orders + Picking Slips ✓
- [TASK-012-2B] Order Fulfillment — Job Cards ✓
- [TASK-012-2C] Order Fulfillment — Transfer Requests ✓
- [TASK-012-2D] Order Fulfillment — Issue Flagging + Document Archive ✓
- [TASK-013] Inventory tracking backend (StockLevel, StockMovement, StockAdjustment, StockReservation services + API) ✓
- [TASK-013A] Unified Product-Inventory API — backend API unification ✓
- [TASK-013B] Product page Inventory tab ✓
- [TASK-013C] Product list stock badges ✓
- [TASK-013D] Inventory operations dashboard ✓
- [TASK-017] Supplier CRUD ✓
- [TASK-018] Product Editing (includes TASK-018A) ✓
- [TASK-019] BOM Schema & API ✓
- [TASK-019A] BOM UI ✓
- [TASK-020] Purchase Orders ✓
- [TASK-020A] Goods Receipt (GRV) ✓
- [TASK-020B] Procurement UI ✓
- [TASK-021] Stock Allocation Service ✓
- [TASK-021A] BOM Explosion Service ✓ (already implemented in TASK-019)
- [TASK-022] Fulfillment Orchestration Engine ✓
- [TASK-022A] Fulfillment Orchestration UI ✓

---

## Reference: Spec Documents

| File | Location | Purpose |
|------|----------|---------|
| inventory-unified-model-spec.md | docs/specs/ | Architectural reference — product IS inventory item |
| TASK-013A-Unified-Product-Inventory-API.md | project root | Implementation spec for TASK-013A |
| TASK-012-Phase-2D-Issues-Documents.md | project root | Spec for issue flagging + document archive |
| TASK-011-rejection-feedback-and-sales-dashboard.md | project root | Quote rejection feedback + sales dashboard |
| NUSAF-Gap-Analysis.md | docs/specs/ | Comprehensive gap analysis for fulfillment orchestration |
| TASK-017-Supplier-CRUD.md | docs/specs/ | Spec for supplier management |

---

## Fulfillment Orchestration — Overview

### The Goal
When a quote is accepted, the system should automatically determine:
1. What to pick from stock → Generate picking slips
2. What to manufacture → Generate job cards
3. What to purchase → Generate purchase orders
4. What to transfer → Generate transfer requests

### Current State (Gap Analysis)
- Products are **view-only** (created via Excel import, no editing UI)
- Picking slips, job cards, and transfers are **manually created**
- No **product type classification** (stock vs assembly)
- No **BOM/component relationships**
- No **procurement system** (Purchase Orders, GRVs)
- No **manufacturing setup** (work centers, routing)

### Effort Estimate
- **Phase A** (Master Data): ~4 days
- **Phase B** (BOM): ~3 days
- **Phase C** (Procurement): ~5 days
- **Phase D** (Orchestration): ~5 days
- **Total**: ~17 days of development

---

## TASK-017 — Supplier CRUD

### Purpose
The Supplier model exists but is read-only (seeded via import). We need full CRUD capabilities to support the procurement system.

### Current State
- Supplier model exists with: id, code, name, currency, isActive, createdAt, updatedAt
- Products reference Supplier via supplierId
- No API endpoints for create/update/delete
- No UI for supplier management
- No contact information stored

### Schema Changes
```prisma
model Supplier {
  // EXISTING fields - keep as is
  id            String   @id @default(cuid())
  code          String   @unique
  name          String
  currency      SupplierCurrency @default(EUR)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // ADD these fields
  email         String?
  phone         String?
  website       String?
  addressLine1  String?  @map("address_line_1")
  addressLine2  String?  @map("address_line_2")
  city          String?
  postalCode    String?  @map("postal_code")
  country       String   @default("Italy")
  paymentTerms  String?  @map("payment_terms")
  minimumOrderValue Decimal? @db.Decimal(12, 2) @map("minimum_order_value")
  notes         String?
  
  contacts      SupplierContact[]

  @@map("suppliers")
}

model SupplierContact {
  id          String   @id @default(cuid())
  supplierId  String   @map("supplier_id")
  supplier    Supplier @relation(fields: [supplierId], references: [id], onDelete: Cascade)
  
  firstName   String   @map("first_name")
  lastName    String   @map("last_name")
  email       String
  phone       String?
  role        String?
  isPrimary   Boolean  @default(false) @map("is_primary")
  
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("supplier_contacts")
}
```

### API Endpoints
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/suppliers` | List suppliers with pagination, search, filter | Admin, Sales |
| GET | `/suppliers/:id` | Get supplier with contacts | Admin, Sales |
| POST | `/suppliers` | Create new supplier | Admin |
| PATCH | `/suppliers/:id` | Update supplier | Admin |
| DELETE | `/suppliers/:id` | Soft delete (set isActive=false) | Admin |
| POST | `/suppliers/:id/contacts` | Add contact | Admin |
| PATCH | `/suppliers/:id/contacts/:contactId` | Update contact | Admin |
| DELETE | `/suppliers/:id/contacts/:contactId` | Delete contact | Admin |

### UI Pages
- `/suppliers` — List with search, filter by active
- `/suppliers/[id]` — Detail view with contacts tab
- Supplier edit modal
- Contact add/edit modal

### Dependencies
None

### Estimated Effort
1-2 days

---

## TASK-018 — Product Editing

### Purpose
Products are currently created only via Excel import. We need full editing capabilities to manage product details, especially product type for orchestration.

### Current State
- Products created **only via Excel import**
- PATCH endpoint exists but **only for inventory defaults**
- **No UI for editing** product core fields
- **No product type field** to distinguish stock vs assembly

### Schema Additions
```prisma
model Product {
  // ADD these fields
  productType      ProductType @default(STOCK_ONLY)
  assemblyLeadDays Int?
  weight           Decimal?    @db.Decimal(10, 3)
  dimensionsJson   Json?
  imageUrl         String?
  longDescription  String?
  isConfigurable   Boolean     @default(false)

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

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| PATCH | `/products/:id` | Update ALL product fields |
| POST | `/products` | Create product manually |
| DELETE | `/products/:id` | Soft delete |
| POST | `/products/:id/image` | Upload product image |

### UI Pages
- `/products/[id]/edit` — Full edit page with tabs:
  - Details (description, SKU, category, type)
  - Pricing (cost, list, rules)
  - Inventory (reorder settings)
  - Images (upload/manage)
  - BOM (placeholder for TASK-019A)

### Dependencies
TASK-017 (supplier dropdown needs CRUD)

### Estimated Effort
2-3 days

---

## TASK-018A — Product Type Field

### Purpose
Add productType enum to Product model to enable assembly detection in orchestration.

### Scope
- Migration to add productType field
- Default all existing products to STOCK_ONLY
- Add selector to product edit form
- Display on product detail page

### Dependencies
TASK-018

### Estimated Effort
0.5 days

---

## TASK-019 — BOM Schema & API

### Purpose
Track component relationships between products. Required for assembly detection and job card generation.

### Schema
```prisma
model BomItem {
  id                 String   @id @default(cuid())
  parentProductId    String   @map("parent_product_id")
  parentProduct      Product  @relation("ParentProduct", fields: [parentProductId], references: [id])

  componentProductId String   @map("component_product_id")
  componentProduct   Product  @relation("ComponentProduct", fields: [componentProductId], references: [id])

  quantity           Decimal  @db.Decimal(10, 4)
  unitOverride       String?
  notes              String?
  sortOrder          Int      @default(0)
  isOptional         Boolean  @default(false)

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

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/products/:id/bom` | Get BOM tree for product |
| POST | `/products/:id/bom` | Add component |
| PATCH | `/products/:id/bom/:componentId` | Update quantity |
| DELETE | `/products/:id/bom/:componentId` | Remove component |
| GET | `/products/:id/where-used` | Reverse BOM lookup |
| POST | `/products/:id/bom/copy-from/:sourceId` | Copy BOM from another product |

### Service Functions
- `explodeBom(productId, quantity)` — Returns flat list of all components
- `checkBomStock(productId, quantity, warehouse)` — Stock availability for all components
- `validateBomCircular(parentId, componentId)` — Prevent circular references

### Dependencies
TASK-018A (needs productType field)

### Estimated Effort
1-2 days

---

## TASK-019A — BOM UI

### Purpose
UI for managing component relationships on products.

### Scope
- BOM tab on product detail/edit page
- Component picker modal (search products)
- Quantity input with unit
- Drag-and-drop reordering
- Where-used view (reverse BOM)
- Copy BOM from another product

### Dependencies
TASK-019

### Estimated Effort
1-2 days

---

## TASK-020 — Purchase Orders

### Purpose
Enable procurement from suppliers. Required for backorder handling in orchestration.

### Schema
```prisma
model PurchaseOrder {
  id              String   @id @default(cuid())
  poNumber        String   @unique @map("po_number")
  supplierId      String   @map("supplier_id")
  supplier        Supplier @relation(fields: [supplierId], references: [id])

  status          PurchaseOrderStatus @default(DRAFT)

  deliveryLocation Warehouse @default(JHB)
  expectedDate     DateTime? @map("expected_date")

  currency        SupplierCurrency @default(EUR)
  subtotal        Decimal  @db.Decimal(12, 2)
  total           Decimal  @db.Decimal(12, 2)

  sourceOrderId   String?  @map("source_order_id")

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
  purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])
  lineNumber      Int

  productId       String
  productSku      String
  productDescription String

  quantityOrdered   Int
  quantityReceived  Int      @default(0)

  unitCost          Decimal  @db.Decimal(10, 4)
  lineTotal         Decimal  @db.Decimal(12, 2)

  salesOrderLineId  String?

  @@map("purchase_order_lines")
}
```

### API Endpoints
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

### Dependencies
TASK-017 (needs supplier CRUD)

### Estimated Effort
2-3 days

---

## TASK-020A — Goods Receipt (GRV)

### Purpose
Receive goods from suppliers into inventory. Links Purchase Orders to stock updates.

### Schema
```prisma
model GoodsReceivedVoucher {
  id              String   @id @default(cuid())
  grvNumber       String   @unique @map("grv_number")
  purchaseOrderId String   @map("purchase_order_id")
  purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])

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
  grv             GoodsReceivedVoucher @relation(fields: [grvId], references: [id])

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

### Stock Integration
- GRV complete → StockMovement.RECEIPT for each line
- Updates `StockLevel.onHand` (increase)
- Updates `StockLevel.onOrder` (decrease)

### Dependencies
TASK-020

### Estimated Effort
1-2 days

---

## TASK-020B — Procurement UI

### Purpose
User interface for managing purchase orders and goods receipts.

### UI Pages
- `/purchase-orders` — List with status filters
- `/purchase-orders/[id]` — Detail with lines, receive button
- `/purchase-orders/new` — Create PO (select supplier, add lines)
- Receive goods modal (creates GRV, updates stock)
- `/grvs` — List of goods received vouchers
- `/grvs/[id]` — GRV detail

### Dependencies
TASK-020A

### Estimated Effort
1-2 days

---

## TASK-021 — Stock Allocation Service

### Purpose
Smart allocation of stock to orders based on customer warehouse and availability.

### Service Functions
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
```

### Business Rules
1. CT customer → Check CT first → Spill to JHB for remainder
2. JHB/MBB customer → JHB only
3. Assembly products → Always JHB (manufacturing)
4. Respect hard reservations
5. Create backorder list for anything not in stock

### Dependencies
None (existing inventory system is sufficient)

### Estimated Effort
1-2 days

---

## TASK-021A — BOM Explosion Service

### Purpose
Explode a product's BOM to get all required components, recursively if needed.

### Service Functions
```typescript
// Explode BOM to flat component list
async function explodeBom(
  productId: string,
  quantity: number
): Promise<{
  components: { productId: string; quantity: number; level: number }[];
  hasNestedBom: boolean;
}>

// Check if all components are in stock
async function checkComponentAvailability(
  productId: string,
  quantity: number,
  warehouse: Warehouse
): Promise<{
  allAvailable: boolean;
  components: {
    productId: string;
    required: number;
    available: number;
    shortfall: number;
  }[];
}>
```

### Dependencies
TASK-019 (BOM Schema)

### Estimated Effort
1 day

---

## TASK-022 — Fulfillment Orchestration Engine

### Purpose
The main automation layer. When an order is confirmed, automatically determine and generate all fulfillment documents.

### Service Functions
```typescript
interface OrchestrationPlan {
  orderId: string;
  pickingSlips: {
    warehouse: Warehouse;
    lines: { productId: string; quantity: number }[];
  }[];
  jobCards: {
    productId: string;
    quantity: number;
    jobType: JobType;
    components: { productId: string; quantity: number }[];
  }[];
  transferRequests: {
    fromWarehouse: Warehouse;
    toWarehouse: Warehouse;
    lines: { productId: string; quantity: number }[];
  }[];
  purchaseOrders: {
    supplierId: string;
    lines: { productId: string; quantity: number }[];
  }[];
}

// Generate fulfillment plan (doesn't commit)
async function generateFulfillmentPlan(orderId: string): Promise<OrchestrationPlan>

// Execute plan (creates all documents)
async function executeFulfillmentPlan(plan: OrchestrationPlan, userId: string): Promise<void>
```

### Decision Logic
```
For each order line:
1. Check finished goods stock
   - In stock → Picking Slip
   - Not in stock → Continue

2. Check if product has BOM (can be manufactured)
   - No BOM → Purchase Request
   - Has BOM → Continue

3. Check component availability
   - All available → Job Card (reserve components)
   - Some missing → Purchase Request for components, then Job Card

4. Apply customer fulfillment policy
   - SHIP_PARTIAL → Ship what's available, backorder rest
   - SHIP_COMPLETE → Hold until all ready
```

### Trigger Points
1. Quote accepted → Auto-create order + generate plan (review before execute)
2. Order confirmed → Execute plan (auto-generate all documents)
3. Manual trigger → "Generate Fulfillment" button on order page

### Dependencies
TASK-021, TASK-021A, TASK-020

### Estimated Effort
3-4 days

---

## TASK-022A — Fulfillment Orchestration UI

### Purpose
User interface for reviewing and approving generated fulfillment plans.

### UI Features
- "Generate Fulfillment Plan" button on order detail page
- Plan preview showing:
  - Picking slips to be created (per warehouse)
  - Job cards to be created
  - Transfer requests to be created
  - Purchase orders to be created
  - Stock reservations to be made
- Approve/Reject buttons
- Option to modify before executing
- Execution progress indicator

### Dependencies
TASK-022

### Estimated Effort
1-2 days

---

## TASK-013 — Inventory System Breakdown

### TASK-013 (COMPLETE) — Inventory Tracking Backend
Backend services and API for inventory management. Separate tables with proper normalization.

**What was built:**
- StockLevel model — tracks onHand, reserved, onOrder per product per warehouse
- StockMovement model — complete audit trail of every stock change
- StockAdjustment model — workflow for corrections (pending → approved/rejected)
- StockReservation model — two-tier system (soft for quotes, hard for orders)
- API routes: GET /api/v1/inventory/stock, POST /api/v1/inventory/adjustments, etc.
- Movement types: RECEIPT, ISSUE, TRANSFER_OUT, TRANSFER_IN, MANUFACTURE_IN, MANUFACTURE_OUT, ADJUSTMENT_IN, ADJUSTMENT_OUT, SCRAP

### TASK-013A (COMPLETE) — Unified Product-Inventory API
Extend product API to include inventory data. A product IS an inventory item.

### TASK-013B (COMPLETE) — Product Page Inventory Tab
Add "Inventory" tab to the product detail page.

### TASK-013C (COMPLETE) — Product List Stock Badges
Add stock indicators to the product listing page.

### TASK-013D (COMPLETE) — Inventory Operations Dashboard
Operational inventory management page for warehouse staff.

---

## TASK-012 — Order Fulfillment Operations Breakdown

### Phase 1: Foundation (COMPLETE)
Sales Order model + basic CRUD, order creation from accepted quotes.

### Phase 2A (COMPLETE) — Sales Orders + Picking Slips
Picking slip generation from sales orders, manual warehouse selection.

### Phase 2B (COMPLETE) — Job Cards
Job card creation for items requiring manufacturing/assembly.

### Phase 2C (COMPLETE) — Transfer Requests
Inter-warehouse transfers (JHB → CT).

### Phase 2D (COMPLETE) — Issue Flagging + Document Archive
Issue flagging on picking slips and job cards, document archive with R2 storage.

### Phase 2E (BACKLOG) — Customer Portal
Customer-facing order tracking view.

### Phase 2F (BACKLOG) — Analytics/Dashboards
Order cycle time, perfect order rate, pick accuracy metrics.

### Fulfillment Flows Reference

**JHB Customer:**
Sales Order → Picking Slip (JHB) → Job Cards (if needed) → Pick & manufacture → Invoice → Dispatch from JHB

**Mbombela Customer:**
Sales Order → Picking Slip (JHB) → Job Cards (if needed) → Pick & manufacture → Invoice → Dispatch from JHB to Mbombela

**CT Customer:**
Sales Order → Check CT stock → CT Picking Slip (available stock) + JHB Picking Slip (remainder) → Job Cards (if assembly needed, always JHB) → JHB completes → Transfer Request (JHB → CT) → CT receives → Invoice → Dispatch from CT

---

## TASK-011 — Quote System Summary

### Quote Status Flow
```
DRAFT → CREATED → ACCEPTED → CONVERTED
            ↘ REJECTED
            ↘ EXPIRED
            ↘ CANCELLED
```

### Quote API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/v1/quotes | Create draft quote |
| GET | /api/v1/quotes | List quotes |
| GET | /api/v1/quotes/active | Get active draft |
| GET | /api/v1/quotes/:id | Get quote details |
| PATCH | /api/v1/quotes/:id | Update notes |
| POST | /api/v1/quotes/:id/items | Add item |
| PATCH | /api/v1/quotes/:id/items/:itemId | Update quantity |
| DELETE | /api/v1/quotes/:id/items/:itemId | Remove item |
| POST | /api/v1/quotes/:id/finalize | Finalize (DRAFT → CREATED) |
| POST | /api/v1/quotes/:id/accept | Accept |
| POST | /api/v1/quotes/:id/reject | Reject (with optional reason) |

---

## Warehouse / Location Reference

| ID  | Name         | Warehouse | Machining/Assembly | Sales Office |
|-----|--------------|-----------|--------------------|--------------|
| JHB | Johannesburg | ✓ (main)  | ✓                  | ✓            |
| CT  | Cape Town    | ✓ (finished goods only) | ✗        | ✓            |
| MBB | Mbombela     | ✗         | ✗                  | ✓            |

---

## Manufacturing Equipment Reference (JHB)

| Type | Equipment | Qty |
|------|-----------|-----|
| CNC | CNC Routers | 3 |
| Manual | Milling Machines | 2 |
| Manual | Lathes | 2 |
| Manual | Router | 1 |
| Assembly | Table Top Assembly | 1 |
| Assembly | Modular Chain Assembly Tables | 2 |
| Assembly | Components Assembly Station | 1 |
| Assembly | Gearbox/Motor Assembly Station | 1 |

---

## Task Breakdown Guidelines

Each task should be broken into micro-tasks when worked on.

Break down tasks BEFORE starting implementation.