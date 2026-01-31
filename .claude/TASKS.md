# Task Queue

---

## Current
- [TASK-013B] Product page Inventory tab [Inventory, UI/Frontend]

## Up Next
- [TASK-013C] Product list stock badges [Inventory, UI/Frontend]
- [TASK-013D] Inventory operations dashboard [Inventory, UI/Frontend]

## Backlog
- [TASK-012-2E] Order Fulfillment — Customer Portal [Orders, UI/Frontend]
- [TASK-012-2F] Order Fulfillment — Analytics/Dashboards [Orders, UI/Frontend]
- [TASK-011b] Sales dashboard + quote analytics [Quotes, UI/Frontend]
- [TASK-014] Modular chain configurator [Configurator, UI/Frontend]
- [TASK-015] Public website — Homepage [Public Website]
- [TASK-016] Public website — Product pages [Public Website, UI/Frontend]

## Blocked
(none)

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

---

## Reference: Spec Documents

| File | Location | Purpose |
|------|----------|---------|
| inventory-unified-model-spec.md | docs/specs/ | Architectural reference — product IS inventory item |
| TASK-013A-Unified-Product-Inventory-API.md | project root | Implementation spec for TASK-013A |
| TASK-012-Phase-2D-Issues-Documents.md | project root | Spec for issue flagging + document archive |
| TASK-011-rejection-feedback-and-sales-dashboard.md | project root | Quote rejection feedback + sales dashboard |

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

**Key decision:** Database tables are correctly normalized (Product + StockLevel + StockMovement as separate tables). This is the same approach used by SAP, Odoo, NetSuite. The problem was presentation — the API and UI treated them as disconnected modules.

### TASK-013A (COMPLETE) — Unified Product-Inventory API
Extend product API to include inventory data. A product IS an inventory item.

**Scope (backend only, no frontend):**
- Add `?include=inventory` to GET /api/v1/products/:id — returns stock levels per warehouse embedded in product response
- Add `?include=stockSummary` to GET /api/v1/products — returns stock status badges for product list
- Add nested stock routes: /api/v1/products/:productId/stock/adjustments, /movements, /reservations
- Add default reorder fields to Product model (defaultReorderPoint, defaultReorderQty, defaultMinStock, leadTimeDays)
- Keep per-location reorder overrides on StockLevel
- Create computeStockStatus utility (IN_STOCK, LOW_STOCK, OUT_OF_STOCK, ON_ORDER, OVERSTOCK)
- Add stock status filtering and sorting to product list
- Existing inventory routes continue to work unchanged

**Spec:** TASK-013A-Unified-Product-Inventory-API.md

### TASK-013B (CURRENT) — Product Page Inventory Tab
Add "Inventory" tab to the product detail page.

**Planned scope:**
- Stock overview: total onHand, available, reserved, onOrder across all warehouses
- Per-warehouse breakdown table
- Stock status badge (green/amber/red)
- "Adjust Stock" button → modal to create stock adjustment
- Recent stock movements list for this product (expandable to full history)
- Reorder point settings (edit defaults + per-location overrides)

### TASK-013C — Product List Stock Badges
Add stock indicators to the product listing page.

**Planned scope:**
- Stock status badge/icon next to each product (colored dot or tag)
- Optional "Available" quantity column
- Filter by stock status (in stock, low stock, out of stock)
- Sort by available quantity

### TASK-013D — Inventory Operations Dashboard
Operational inventory management page for warehouse staff.

**Planned scope (NOT a separate "inventory items" CRUD — links back to products):**
- Summary cards: total SKUs, items below reorder point, pending adjustments
- Cross-product stock levels table with filters (warehouse, status, category)
- Pending adjustments queue (approve/reject workflow)
- Stock movement audit log (searchable/filterable)
- Every row links to the product detail page

---

## TASK-012 — Order Fulfillment Operations Breakdown

### Phase 1: Foundation (COMPLETE)
- Sales Order model + basic CRUD
- Order creation from accepted quotes
- Status management
- Basic order list/detail pages

### Phase 2A (COMPLETE) — Sales Orders + Picking Slips
- Picking slip generation from sales orders
- Manual warehouse selection (JHB or CT) — auto-allocation deferred to post-TASK-013
- Per-warehouse picking slips (one order can have JHB + CT picking slips)
- Picking slip statuses: Pending → In Progress → Complete

### Phase 2B (COMPLETE) — Job Cards
- Job card creation for items requiring manufacturing/assembly (always JHB)
- Job card statuses: Pending → In Progress → Complete (+ On Hold)
- Linked to picking slips
- estimatedHours field (no scheduling — scheduling is future enhancement)

### Phase 2C (COMPLETE) — Transfer Requests
- Inter-warehouse transfers (JHB → CT)
- Transfer statuses: Requested → Approved → Picking → Ready to Ship → In Transit → Received → Completed
- Auto-created when JHB picking/job cards complete for CT orders
- Receipt verification and discrepancy management

### Phase 2D (COMPLETE) — Issue Flagging + Document Archive
- Issue flagging on Picking Slips + Job Cards
- Categories: STOCK, QUALITY, PRODUCTION, TIMING, DOCUMENTATION
- Severity: CRITICAL, HIGH, MEDIUM, LOW with SLA targets
- Document archive with R2 storage
- Documents grouped by invoice number for traceability
- Upload types: Customer PO, Signed Delivery Note (POD), Invoice
- Traceability view: search by invoice, see all related documents

### Phase 2E (BACKLOG) — Customer Portal
- Customer-facing order tracking view
- Status visibility: "Awaiting JHB transfer", progress percentages
- Decision point: separate portal vs role-based access in existing system

### Phase 2F (BACKLOG) — Analytics/Dashboards
- Order cycle time, perfect order rate, pick accuracy
- On-time delivery, issue resolution time, backorder rate
- Operations dashboard with key metrics

### Fulfillment Flows Reference

**JHB Customer:**
Sales Order → Picking Slip (JHB) → Job Cards (if needed) → Pick & manufacture → Invoice → Dispatch from JHB

**Mbombela Customer:**
Sales Order → Picking Slip (JHB) → Job Cards (if needed) → Pick & manufacture → Invoice → Dispatch from JHB to Mbombela

**CT Customer:**
Sales Order → Check CT stock → CT Picking Slip (available stock) + JHB Picking Slip (remainder) → Job Cards (if assembly needed, always JHB) → JHB completes → Transfer Request (JHB → CT) → CT receives → Invoice → Dispatch from CT

### Key Business Rules
- All manufacturing/assembly happens in JHB only
- CT warehouse carries finished goods only
- Mbombela is sales office only — orders always ship from JHB
- Invoice before dispatch (B2B standard)
- Sales Order is a temporary working document — deleted after invoicing
- Permanent records: Quote, Customer PO, Job Cards, Invoice, Signed Delivery Note
- Issues flagged manually by warehouse staff on picking slips and job cards

---

## TASK-011 — Quote System Summary

### Phase 1: Database (COMPLETE)
- [x] Created migration for Quote and QuoteItem models
- [x] Created QuoteRequest model for guest flow
- [x] Implemented quote number generator (QUO-YYYY-NNNNN)

### Phase 2: Backend Core (COMPLETE)
- [x] Created Zod validation schemas for quotes
- [x] Created quote.service.ts (CRUD, totals calculation)
- [x] Created routes: POST /quotes, GET /quotes, GET /quotes/:id
- [x] Created item routes: POST/PATCH/DELETE items
- [x] Created action routes: finalize, accept, reject
- [x] Company isolation enforced in all service methods

### Phase 3: Frontend — Quote Management (COMPLETE)
- [x] Created useQuotes.ts React Query hooks
- [x] Added quote API methods to lib/api.ts
- [x] Created QuoteStatusBadge component
- [x] Created QuoteTotals component
- [x] Created QuoteListTable component
- [x] Created /quotes page
- [x] Created QuoteItemsTable component
- [x] Created /quotes/[id] page

### Phase 4: Frontend — Add to Quote (COMPLETE)
- [x] Created AddToQuoteModal component
- [x] Created QuoteCart component
- [x] Created QuoteCartDropdown (part of QuoteCart)
- [x] Updated Header.tsx to include QuoteCart
- [x] Updated ProductDetailModal (replaced TODO with AddToQuoteModal)
- [x] Quotes navigation already in sidebar

### Phase 5: Testing (PENDING)
- [ ] Write integration tests for quote API (skipped — jest not configured)
- [ ] Test full flow end-to-end (manual testing)
- [ ] Add loading states and error handling (already included)

### Quote Status Flow
```
DRAFT → CREATED → ACCEPTED → CONVERTED
            ↘ REJECTED
            ↘ EXPIRED
            ↘ CANCELLED
```

### Quote Rejection Feedback (added to reject flow)
- Optional reason selection: PRICE_TOO_HIGH, LEAD_TIME, WENT_ELSEWHERE, PROJECT_CHANGED, SPECS_MISMATCH, OTHER
- Optional free-text notes
- Both fields optional — customer can skip entirely

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

## TASK-008 Summary (COMPLETE)

Components built:
- Dialog component (`/components/ui/dialog.tsx`)
- ProductDetailModal (`/components/products/ProductDetailModal.tsx`)

---

## TASK-007 Summary (COMPLETE)

**Backend:**
- GET /api/v1/categories
- GET /api/v1/products
- GET /api/v1/products/:id

**Frontend:**
- ProductCard, ProductGrid, CategoryFilter, ProductSearch, Pagination
- Products page at /products with full filtering

---

## Warehouse / Location Reference

| ID  | Name         | Warehouse | Machining/Assembly | Sales Office |
|-----|--------------|-----------|--------------------|--------------|
| JHB | Johannesburg | ✓ (main)  | ✓                  | ✓            |
| CT  | Cape Town    | ✓ (finished goods only) | ✗        | ✓            |
| MBB | Mbombela     | ✗         | ✗                  | ✓            |

---

## Task Breakdown Guidelines

Each task should be broken into micro-tasks when worked on.

Break down tasks BEFORE starting implementation.