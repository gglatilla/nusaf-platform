# ERP Remediation Progress Tracker

## Current Phase: Phase 4 — Inventory Module
## Current Micro-Task: 4.5 (Cycle Count Workflow)
## Status: IN PROGRESS (4.1-4.2, 4.4 complete, order: 4.5→4.3, dashboard last)

---

## Last Session Notes
### Session 7 — Phase 4 Micro-Task 4.4 (2026-02-07)
**Micro-task 4.4 — Reorder Report**
**Result: COMPLETE — Both backend and frontend compile cleanly**

**Note:** Phase 4 order changed per user direction — dashboard (4.3) moved to last since it aggregates data from all other features. New order: 4.1→4.2→4.4→4.5→4.3.

**What was done:**
- Enriched `getLowStockProducts()` backend service to include supplier info (id, code, name, currency), costPrice, leadTimeDays, onOrder
- Added PURCHASER and WAREHOUSE roles to `GET /inventory/stock/low` endpoint
- Added `LowStockProduct` type, `LowStockProductsResponse` type, `getLowStockProducts()` API method on frontend
- Added `useLowStockProducts()` hook
- Built Reorder Report page at `/inventory/reorder` with:
  - Summary cards (total below reorder, out of stock, suppliers affected, total shortfall)
  - Filter toolbar (severity tabs, warehouse dropdown, supplier dropdown)
  - Group-by-supplier toggle with collapsible supplier sections
  - Checkbox selection per row and per supplier group
  - Generate Draft PO(s) from selected items — creates PO per supplier with pre-populated lines
  - Clickable links: SKU → item detail, supplier → supplier detail, generated PO → PO detail
- Added "Reorder Report" nav item to inventoryNavigation (ADMIN, MANAGER, PURCHASER)

**Files created (1):**
- `frontend/src/app/(portal)/inventory/reorder/page.tsx`

**Files modified (5):**
- `backend/src/services/inventory.service.ts` — enriched getLowStockProducts() product select + return shape
- `backend/src/api/v1/inventory/route.ts` — added PURCHASER, WAREHOUSE roles to /stock/low
- `frontend/src/lib/api.ts` — added LowStockProduct types + getLowStockProducts() method
- `frontend/src/hooks/useInventory.ts` — added useLowStockProducts() hook
- `frontend/src/lib/navigation.ts` — added Reorder Report nav item

### Session 6 — Phase 4 Micro-Task 4.2 (2026-02-07)
**Micro-task 4.2 — Stock Adjustment Workflow**
**Result: COMPLETE — TypeScript compiles cleanly**

**What was done:**
- Added `CreateInventoryAdjustmentData` type + `StockAdjustmentReason` type + `notes` field to `StockAdjustment` interface
- Added `createInventoryAdjustment()` API method (POST /inventory/adjustments)
- Added `useCreateInventoryAdjustment()` hook with invalidation
- Built adjustments list page at `/inventory/adjustments` with status filter tabs (All/Pending/Approved/Rejected), warehouse filter, pagination, linked adjustment numbers
- Built adjustment detail page at `/inventory/adjustments/[id]` with status banners, info grid, line items table with product links, net change summary, approve/reject actions for ADMIN/MANAGER
- Built create adjustment page at `/inventory/adjustments/new` with product search, multi-line form, validation
- Added "Adjustments" nav item to inventoryNavigation (ADMIN, MANAGER only)

**Files created (3):**
- `frontend/src/app/(portal)/inventory/adjustments/page.tsx`
- `frontend/src/app/(portal)/inventory/adjustments/[id]/page.tsx`
- `frontend/src/app/(portal)/inventory/adjustments/new/page.tsx`

**Files modified (3):**
- `frontend/src/lib/api.ts` — added types + createInventoryAdjustment method
- `frontend/src/hooks/useInventory.ts` — added useCreateInventoryAdjustment hook
- `frontend/src/lib/navigation.ts` — added Adjustments nav item

### Session 5 — Phase 4 Micro-Task 4.1 (2026-02-07)
**Micro-task 4.1 — Stock Movements Page**
**Result: COMPLETE — Both frontend and backend compile cleanly**

**What was done:**
- Updated `StockMovementItem` type to match actual backend response (was using wrong field names: `warehouseId`/`type` vs actual `location`/`movementType`)
- Extracted `REFERENCE_TYPE_ROUTES` + `WAREHOUSE_NAMES` to shared constants at `frontend/src/lib/constants/reference-routes.ts`
- Enhanced `MovementLogTable`: added warehouse filter, product SKU/name as clickable links to item detail, reference numbers as clickable links to source documents, updated search to filter on SKU/description/referenceNumber
- Created dedicated `/inventory/movements` page with PageHeader
- Added "Movements" nav item to inventoryNavigation (ADMIN, MANAGER, WAREHOUSE)
- Expanded backend movements endpoint role to include WAREHOUSE

**Files created (2):**
- `frontend/src/lib/constants/reference-routes.ts`
- `frontend/src/app/(portal)/inventory/movements/page.tsx`

**Files modified (5):**
- `frontend/src/lib/api.ts` — updated StockMovementItem interface
- `frontend/src/components/inventory/MovementLogTable.tsx` — complete rewrite
- `frontend/src/components/inventory/product-detail/AuditLogTab.tsx` — shared constant import
- `frontend/src/lib/navigation.ts` — added Movements nav item
- `backend/src/api/v1/inventory/route.ts` — expanded role

### Session 4 — Phase 2 Micro-Task 2.9 (2026-02-07)
**Micro-task 2.9 — Data Leak Audit + Verification**
**Result: COMPLETE — All 11 checks PASS, 4 backend vulnerabilities fixed, TypeScript compiles cleanly**

**Audit scope:** 11 checks across frontend (4), backend/API (4), and auth (3) layers.

**Vulnerabilities found and fixed:**

| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| 1 | Products LIST API returned `supplier` to CUSTOMER | MEDIUM | Conditional spread `...(isCustomer ? {} : { supplier })` |
| 2 | Products LIST API returned `stockSummary.totalOnHand/totalAvailable` to CUSTOMER | MEDIUM | Customer gets `{ status }` only |
| 3 | Products DETAIL API returned `costPrice`, `landedCost`, `supplierId`, inventory quantities | HIGH | All stripped for CUSTOMER role |
| 4 | Orders DETAIL API returned `internalNotes` to CUSTOMER | HIGH | Set to `undefined` for CUSTOMER |
| 5 | Quotes API global `requireRole('ADMIN','MANAGER','SALES')` blocked CUSTOMER from ALL quote operations | CRITICAL | Removed global role check; company isolation enforced in service layer |

**Files modified (3):**
- `backend/src/api/v1/products/route.ts` — role-based field filtering on LIST and DETAIL endpoints
- `backend/src/api/v1/orders/route.ts` — strip internalNotes + warehouse for CUSTOMER
- `backend/src/api/v1/quotes/route.ts` — removed global requireRole, removed unused import

**Phase 2 is now COMPLETE.** Next phase: Phase 4 (Inventory Module) or Phase 5 (Missing ERP Documents).

### Session 3 — Phase 2 Micro-Task 2.8 (2026-02-07)
**Micro-task 2.8 — Customer Account Page**
**Result: COMPLETE — TypeScript compiles cleanly**

**What was done:**
- Added `POST /api/v1/auth/change-password` backend endpoint with validation
- Verifies current password, hashes new one, revokes all sessions for security
- Added `changePassword()` method to frontend API client
- Built customer account page at `/my/account` with profile info, company info, change password form
- After password change, all sessions revoked and user redirected to login

**Files created (1):**
- `frontend/src/app/(customer)/my/account/page.tsx`

**Files modified (3):**
- `backend/src/api/v1/auth/route.ts` — added change-password endpoint
- `backend/src/utils/validation/auth.ts` — added changePasswordSchema
- `frontend/src/lib/api.ts` — added changePassword method

### Session 3 — Phase 2 Micro-Task 2.7 (2026-02-07)
**Micro-task 2.7 — Customer Orders List + Detail Pages**
**Result: COMPLETE — TypeScript compiles cleanly**

**What was done:**
- Modified backend orders API to allow CUSTOMER role on GET routes (list, detail, timeline)
- Write operations (create, confirm, hold, release, cancel, fulfillment) remain staff-only via `staffOnly` middleware
- Company isolation already protects cross-company access (all queries filter by `companyId`)
- Built customer orders list at `/my/orders` with status filter tabs (All, Confirmed, In Progress, Shipped, Delivered, Cancelled)
- Built customer order detail at `/my/orders/[id]` with pipeline steps, items, totals, key dates
- Added `linkPrefix` and `quotesHref` props to `OrderListTable` for portal reuse
- Added `hideOperationalColumns` prop to `OrderLineTable` to hide Status and Picked columns
- Customer order detail hides: picking slips, job cards, transfers, internal notes, fulfillment stats, warehouse, company name, hold/cancel reasons (generic messages only)

**Files created (2):**
- `frontend/src/app/(customer)/my/orders/page.tsx`
- `frontend/src/app/(customer)/my/orders/[id]/page.tsx`

**Files modified (3):**
- `backend/src/api/v1/orders/route.ts` — per-route auth instead of global staff-only
- `frontend/src/components/orders/OrderListTable.tsx` — added linkPrefix + quotesHref props
- `frontend/src/components/orders/OrderLineTable.tsx` — added hideOperationalColumns prop

### Session 2 — Phase 2 Micro-Tasks 2.4-2.6 (2026-02-07)
**Micro-task 2.6 — Customer Quotes List + Detail Pages**
**Result: COMPLETE — TypeScript compiles cleanly**

**What was done:**
- Built customer quotes list at `/my/quotes` with status filter tabs, active draft banner, pagination
- Built customer quote detail at `/my/quotes/[id]` with items table, totals, validity banner
- Added `linkPrefix` and `browseHref` props to `QuoteListTable` for portal reuse
- Customer can: view quotes, filter by status, edit DRAFT items, submit (finalize), accept/reject CREATED quotes
- No internal data shown: no customer tier, no company name, no Create Order (staff action)

**Files created (2):**
- `frontend/src/app/(customer)/my/quotes/page.tsx`
- `frontend/src/app/(customer)/my/quotes/[id]/page.tsx`

**Files modified (1):**
- `frontend/src/components/quotes/QuoteListTable.tsx` — added linkPrefix + browseHref props

### Session 2 — Phase 2 Micro-Tasks 2.4-2.5 (2026-02-07)
**Micro-task 2.5 — Customer Product Detail Page**
**Result: COMPLETE — TypeScript compiles cleanly**

**What was done:**
- Built customer product detail page at `/my/products/[sku]`
- Two-column layout: image gallery (left) + product info (right)
- Dual data source: public API for rich content (images, specs, docs), catalog API for tier pricing + stock badge
- Inline add-to-quote with quantity selector, line total, success confirmation
- Tabbed bottom section: Specifications, Documents, Cross-References (conditional tabs)
- Loading skeleton and error state with back link
- Breadcrumb navigation linking to category filters

**Files created (1):**
- `frontend/src/app/(customer)/my/products/[sku]/page.tsx`

**Key decisions:**
- Inlined image gallery + add-to-quote components to avoid creating separate files for customer-specific variants
- Used `useProducts({ search: sku })` to get authenticated tier pricing (public API has no pricing)
- Cross-references shown to help customers identify replacement parts
- No supplier info, no stock quantities, no internal data (Golden Rule 4)

### Session 2 — Phase 2 Micro-Task 2.4 (2026-02-07)
**Result: COMPLETE — TypeScript compiles cleanly**

**What was done:**
- Built customer product catalog page at `/my/products`
- Added `hideSupplier` prop to ProductCard, ProductGrid, ProductDetailModal (Golden Rule 4 compliance)
- Added `detailLinkPrefix` prop to ProductDetailModal for configurable "View Full Details" link
- Customer page: grid-only, published products only, no supplier info, no stock quantities (badges only)
- Full filter support: category sidebar, search, stock status chips, sort dropdown, URL-synced state, pagination

**Files modified (3):**
- `frontend/src/components/products/ProductCard.tsx` — added hideSupplier prop
- `frontend/src/components/products/ProductGrid.tsx` — added hideSupplier passthrough
- `frontend/src/components/products/ProductDetailModal.tsx` — added hideSupplier + detailLinkPrefix props

**Files created (1):**
- `frontend/src/app/(customer)/my/products/page.tsx`

**Key decisions:**
- Reused existing ProductGrid/ProductCard/CategoryFilter/Pagination components with new props
- Customer always sees `isPublished: 'true'` filter (cannot see unpublished products)
- No warehouse selector (customer sees aggregate availability)
- "View Full Details" link points to `/my/products/${sku}` (customer detail page, micro-task 2.5)

### Session 1 — Phase 2 Micro-Tasks 2.1-2.3 (2026-02-07)
**Result: COMPLETE — TypeScript compiles cleanly**

**What was done:**
- 2.1: Created `(customer)` route group with layout infrastructure
  - `CustomerAuthGuard` — checks auth + enforces role=CUSTOMER
  - `CustomerHeader` — horizontal top nav (logo, Products/Quotes/Orders/Account, QuoteCart, user menu, mobile hamburger)
  - `CustomerLayout` — header-based layout (no sidebar), max-w-7xl centered content
  - `customer-navigation.ts` — nav items config
  - `(customer)/layout.tsx` — wraps children in CustomerAuthGuard + CustomerLayout

- 2.2: Login redirect + middleware + cross-guards
  - Login page: role-based redirect (CUSTOMER → `/my/dashboard`, staff → `/dashboard`)
  - Middleware: added `/my` to portalRoutes for domain routing
  - AuthGuard: blocks CUSTOMER from ERP routes → redirects to `/my/dashboard`
  - QuoteCart: role-aware links ("Browse Products" → `/my/products` for CUSTOMER, `/catalog` for staff; "View Quote" → `/my/quotes/[id]` for CUSTOMER)

- 2.3: Customer dashboard at `/my/dashboard`
  - Welcome banner with company/tier
  - Active quote banner with "Continue Shopping" and "View Quote" CTAs
  - Stats cards (total quotes, total orders, company info)
  - Recent quotes (5) with status badges and links to `/my/quotes/[id]`
  - Recent orders (5) with status badges and links to `/my/orders/[id]`
  - Empty states with CTAs

**Files created (7):**
- `frontend/src/lib/customer-navigation.ts`
- `frontend/src/components/auth/CustomerAuthGuard.tsx`
- `frontend/src/components/layout/CustomerHeader.tsx`
- `frontend/src/components/layout/CustomerLayout.tsx`
- `frontend/src/app/(customer)/layout.tsx`
- `frontend/src/app/(customer)/my/dashboard/page.tsx`

**Files modified (4):**
- `frontend/src/app/(auth)/login/page.tsx` — role-based redirect
- `frontend/src/middleware.ts` — added `/my` to portalRoutes
- `frontend/src/components/auth/AuthGuard.tsx` — blocks CUSTOMER from ERP
- `frontend/src/components/quotes/QuoteCart.tsx` — role-aware links

**Next session:** Micro-tasks 2.4-2.8 (products, quotes, orders, account pages)

### Micro-Task 3.9 — Multi-warehouse Fulfillment Orchestration Verification + Fix (2026-02-07)
**Result: COMPLETE — Verified + one gap fixed, TypeScript compiles cleanly, 31 tests pass**

**Verification findings:**
- Multi-warehouse fulfillment orchestration was ALREADY implemented in TASK-022/022A
- Allocation service correctly handles CT-first + JHB spillover for stock products
- Orchestration engine creates per-warehouse picking slips + transfer requests
- Execution creates all documents in a single Prisma transaction with stale-plan protection

**Gap found and fixed:**
- `processAssemblyLine()` did NOT create transfer lines for CT customers ordering assembly products
- After a job card completes at JHB, finished goods would have no planned transfer to CT
- **Fix:** Added `customerWarehouse` and `transferLines` params to `processAssemblyLine()`. When customerWarehouse is CT, assembly finished goods are now added to transfer lines, ensuring a JHB→CT transfer request appears in the plan.

**Files modified:**
- `backend/src/services/orchestration.service.ts` — 3 edits: pass params to processAssemblyLine, add params to signature, add CT transfer logic

**Verification checklist:**
| Check | Result |
|-------|--------|
| CT stock splitting (CT first, JHB spillover) | ✅ PASS |
| JHB customer allocation (JHB only) | ✅ PASS |
| CT assembly products → transfer planned | ✅ PASS (after fix) |
| Backorder → PO generation | ✅ PASS |
| SHIP_COMPLETE policy blocking | ✅ PASS |
| Stale plan detection | ✅ PASS |
| TypeScript compiles | ✅ PASS |
| 31 integration tests pass | ✅ PASS |

### Micro-Task 3.8 — Add Timeline/Activity Log to Sales Order Page (2026-02-07)
**Result: COMPLETE — Both backend and frontend compile cleanly**

**What was done:**
- Created backend service `getOrderTimeline()` that aggregates events from the order itself + all related documents (picking slips, job cards, transfer requests)
- Two-phase query: first fetch all documents in parallel, then resolve user names from collected IDs
- Created `GET /api/v1/orders/:id/timeline` endpoint (staff-only auth)
- Created frontend `TimelineEvent` type + `getOrderTimeline()` API method + `useOrderTimeline()` hook
- Created `OrderTimelineSection` component with vertical timeline UI (colored dots, icons per event type, clickable document links, actor names, relative timestamps)
- Integrated timeline into order detail page sidebar (below Documents section)

**Timeline event sources:**
| Source | Events |
|--------|--------|
| SalesOrder | Created, Confirmed, Shipped, Delivered, On Hold, Cancelled |
| PickingSlip | Created, Started, Completed |
| JobCard | Created, Started, On Hold, Completed |
| TransferRequest | Created, Shipped, Received |

**Files created:**
- `backend/src/services/order-timeline.service.ts`
- `frontend/src/components/orders/order-detail/OrderTimelineSection.tsx`

**Files modified:**
- `backend/src/api/v1/orders/route.ts` — added timeline endpoint
- `frontend/src/lib/api.ts` — added TimelineEvent types + getOrderTimeline()
- `frontend/src/hooks/useOrders.ts` — added useOrderTimeline() hook
- `frontend/src/components/orders/order-detail/index.ts` — exported OrderTimelineSection
- `frontend/src/app/(portal)/orders/[id]/page.tsx` — integrated timeline into sidebar

**Key decisions:**
- Events sorted newest-first for easy scanning
- User names resolved via second query phase (not embedded in documents)
- Sidebar placement keeps main content area for fulfillment documents
- Document references are clickable links to detail pages

### Micro-Task 3.7 — Build Fulfillment Dashboard (2026-02-07)
**Result: COMPLETE — Both backend and frontend compile cleanly**

**What was done:**
- Created backend service with `getFulfillmentDashboard()` running 19 parallel Prisma queries
- Created `GET /api/v1/fulfillment/dashboard` endpoint with auth + role check
- Created 7 dashboard section components + summary bar
- Created `/fulfillment` page with role-based section ordering (warehouse→picking first, purchaser→delivery first, sales→ready-to-ship first, manager→exceptions first)
- Added "Fulfillment" nav item (staff-only, excludes CUSTOMER)
- Hook auto-refreshes every 30 seconds for live operations feel

**Dashboard sections:**
| Section | Shows | Data |
|---------|-------|------|
| Summary Bar | 6 count cards across top | Totals per category |
| Picking Queue | PENDING + IN_PROGRESS picking slips | Top 5, links to detail + order |
| Jobs In Progress | PENDING + IN_PROGRESS + ON_HOLD job cards | Top 5, job type, assigned to |
| Pending Transfers | PENDING + IN_TRANSIT transfers | Top 5, from→to, linked order |
| Awaiting Delivery | SENT + ACKNOWLEDGED + PARTIALLY_RECEIVED POs | Top 5, supplier, overdue flag |
| Ready to Ship | READY_TO_SHIP orders | Top 5, customer, total |
| Exception Alerts | Overdue POs, stalled jobs (48h+), on-hold orders | Count + links |

**Files created:**
- `backend/src/services/fulfillment-dashboard.service.ts`
- `backend/src/api/v1/fulfillment/route.ts`
- `frontend/src/app/(portal)/fulfillment/page.tsx`
- `frontend/src/components/fulfillment/dashboard/FulfillmentSummaryBar.tsx`
- `frontend/src/components/fulfillment/dashboard/PickingQueueSection.tsx`
- `frontend/src/components/fulfillment/dashboard/JobsInProgressSection.tsx`
- `frontend/src/components/fulfillment/dashboard/PendingTransfersSection.tsx`
- `frontend/src/components/fulfillment/dashboard/AwaitingDeliverySection.tsx`
- `frontend/src/components/fulfillment/dashboard/ReadyToShipSection.tsx`
- `frontend/src/components/fulfillment/dashboard/ExceptionAlertsSection.tsx`
- `frontend/src/components/fulfillment/dashboard/index.ts`

**Files modified:**
- `backend/src/index.ts` — registered fulfillment route
- `frontend/src/lib/api.ts` — added FulfillmentDashboardData types + getFulfillmentDashboard()
- `frontend/src/hooks/useFulfillment.ts` — added useFulfillmentDashboard() hook
- `frontend/src/lib/navigation.ts` — added Fulfillment nav item

**Key decisions:**
- POs are not company-scoped (no companyId on PurchaseOrder model) — PO queries don't filter by company
- Schema uses snapshot fields (orderNumber, assignedToName) — no relation joins needed for most queries
- 30s refetchInterval for near-real-time operations dashboard
- Exception thresholds: stalled = ON_HOLD > 48 hours, overdue = expectedDate < now

### Micro-Task 3.6 — Enhance PO Detail Page with GRV History + Linked Orders (2026-02-06)
**Result: COMPLETE — TypeScript compiles cleanly**

**What was done:**
- Created 4 new components in `components/purchase-orders/po-detail/`
- Added PO status pipeline steps (Draft → Approval → Sent → Acknowledged → Receiving → Received)
- Added receiving progress bar with stats (ordered/received/outstanding + rejected warning)
- Enhanced GRV section with per-GRV quantities received/rejected, better layout
- Added sidebar Timeline with full audit trail (created, approved, rejected, sent, received events)
- Enhanced POLineTable: product SKUs are clickable links to `/inventory/items/[sku]`, per-line receiving progress bars, SO linkage indicator
- Integrated `usePurchaseOrderReceivingSummary` hook (existed but was unused)
- Added cancelled status banner

**Files created:**
- `frontend/src/components/purchase-orders/po-detail/POPipelineSteps.tsx`
- `frontend/src/components/purchase-orders/po-detail/POReceivingProgress.tsx`
- `frontend/src/components/purchase-orders/po-detail/GoodsReceiptsSection.tsx`
- `frontend/src/components/purchase-orders/po-detail/PONotesSection.tsx`
- `frontend/src/components/purchase-orders/po-detail/index.ts`

**Files modified:**
- `frontend/src/components/purchase-orders/POLineTable.tsx` — clickable SKU links, per-line progress bars
- `frontend/src/app/(portal)/purchase-orders/[id]/page.tsx` — integrated all new components

### Micro-Task 3.1 — Enhance Sales Order Detail Page with Fulfillment Status Panel (2026-02-06)
**Result: COMPLETE — All changes compile cleanly**

**What was done:**
- Enriched 3 backend summary endpoints (picking slips, job cards, transfer requests) to return richer data: assignee names, dates, locations
- Updated frontend types in both `api/types/orders.ts` and `api.ts`
- Built 3 new fulfillment panel components: `FulfillmentPipelineSteps` (horizontal step indicator), `FulfillmentStatsBar` (picked/shipped/delivered stats), `FulfillmentProgressBar` (stacked line status bar)
- Extracted 4 inline sections into reusable components: `PickingSlipsSection`, `JobCardsSection`, `TransferRequestsSection`, `OrderNotesSection`
- Restructured the order detail page: reduced from 649 lines to ~375 lines, integrated all new components

**Backend enrichments:**
| Service | Added Fields |
|---------|-------------|
| picking-slip.service.ts | assignedToName, createdAt, startedAt, completedAt |
| job-card.service.ts | assignedToName, createdAt, startedAt, completedAt |
| transfer-request.service.ts | fromLocation, toLocation, createdAt, shippedAt, receivedAt |

**Files created:**
- `frontend/src/components/orders/order-detail/FulfillmentPipelineSteps.tsx`
- `frontend/src/components/orders/order-detail/FulfillmentStatsBar.tsx`
- `frontend/src/components/orders/order-detail/FulfillmentProgressBar.tsx`
- `frontend/src/components/orders/order-detail/PickingSlipsSection.tsx`
- `frontend/src/components/orders/order-detail/JobCardsSection.tsx`
- `frontend/src/components/orders/order-detail/TransferRequestsSection.tsx`
- `frontend/src/components/orders/order-detail/OrderNotesSection.tsx`
- `frontend/src/components/orders/order-detail/index.ts`

**Files modified:**
- `backend/src/services/picking-slip.service.ts` — enriched getPickingSlipsForOrder()
- `backend/src/services/job-card.service.ts` — enriched getJobCardsForOrder()
- `backend/src/services/transfer-request.service.ts` — enriched getTransferRequestsForOrder()
- `frontend/src/lib/api/types/orders.ts` — updated summary interfaces
- `frontend/src/lib/api.ts` — updated duplicate summary interfaces
- `frontend/src/app/(portal)/orders/[id]/page.tsx` — restructured with new components

**Note:** Micro-tasks 3.2-3.5 were already completed in Phase 0.8 (backend status propagation logic). Next task is 3.6 (PO detail page).


### Micro-Task 0.1 — Audit GRV → Stock Flow (2026-02-06)
**Result: ALL 6 CHECKS PASS — No fixes needed**

| Check | Result | Location |
|-------|--------|----------|
| (a) StockMovement type=RECEIPT | PASS | grv.service.ts:263 |
| (b) referenceType + referenceId | PASS | grv.service.ts:266-268 (uses 'GoodsReceivedVoucher') |
| (c) StockLevel.onHand increase | PASS | grv.service.ts:246,249-256 |
| (d) StockLevel.onOrder decrease | PASS | grv.service.ts:247,253 (Math.max(0,...) prevents negatives) |
| (e) POLine.quantityReceived update | PASS | grv.service.ts:217-222 |
| (f) PO status propagation | PASS | grv.service.ts:277-300 (RECEIVED/PARTIALLY_RECEIVED) |

**Additional:** All within Prisma $transaction, quantity validation prevents over-receiving, StockLevel auto-created if missing, full audit trail with userId.

**Files examined:** `backend/src/services/grv.service.ts`, `backend/src/api/v1/goods-receipts/route.ts`, `backend/src/utils/validation/goods-receipts.ts`

### Micro-Task 0.2 — Audit Picking Slip → Stock Flow (2026-02-06)
**Result: ALL 5 CHECKS FAIL — completePicking() is status-only, no stock integration**

| Check | Result | Location |
|-------|--------|----------|
| (a) StockMovement type=ISSUE | FAIL | picking-slip.service.ts:409-450 — not implemented |
| (b) referenceType + referenceId | FAIL | not implemented |
| (c) StockLevel.onHand decrease | FAIL | not implemented |
| (d) StockReservation release | FAIL | not implemented |
| (e) SalesOrder status propagation | FAIL | not implemented |

**Root cause:** `completePicking()` only sets `status: 'COMPLETE'` + `completedAt` (lines 441-447). No Prisma transaction, no stock operations, no reservation release, no parent order update.

**Fix needed in 0.8:** Rewrite `completePicking()` with full transaction: create ISSUE movements, decrease onHand, release hardReserved, propagate to SalesOrder.

**Files examined:** `backend/src/services/picking-slip.service.ts`, `backend/prisma/schema.prisma`

### Micro-Task 0.3 — Audit Job Card → Stock Flow (2026-02-06)
**Result: ALL 5 CHECKS FAIL — completeJobCard() is status-only, no stock integration**

| Check | Result | Location |
|-------|--------|----------|
| (a) StockMovement type=MANUFACTURE_IN for finished product | FAIL | job-card.service.ts:453-482 — not implemented |
| (b) StockMovement type=MANUFACTURE_OUT for BOM components | FAIL | not implemented — service has no BomItem awareness |
| (c) StockLevel.onHand increase for finished product | FAIL | not implemented |
| (d) StockLevel.onHand decrease for consumed components | FAIL | not implemented |
| (e) referenceType='JOB_CARD' + referenceId on all movements | FAIL | not implemented |

**Root cause:** `completeJobCard()` only sets `status: 'COMPLETE'` + `completedAt` (lines 473-479). No Prisma transaction, no stock operations, no BOM component lookup, no parent order update. Identical pattern to picking slip (0.2).

**BOM model status:** `BomItem` model exists (schema.prisma:1463) with parentProductId, componentProductId, quantity — data structure is ready for the fix.

**Fix needed in 0.8:** Rewrite `completeJobCard()` with full transaction: lookup BOM via BomItem, create MANUFACTURE_IN for finished product (+onHand), create MANUFACTURE_OUT per component (-onHand scaled by job quantity), propagate to SalesOrder.

**Files examined:** `backend/src/services/job-card.service.ts`, `backend/src/api/v1/job-cards/route.ts`, `backend/src/utils/validation/job-cards.ts`, `backend/prisma/schema.prisma`

### Micro-Task 0.4 — Audit Transfer Request → Stock Flow (2026-02-06)
**Result: 4 of 5 CHECKS FAIL — shipTransfer() and receiveTransfer() are status-only, no stock integration**

| Check | Result | Location |
|-------|--------|----------|
| (a) StockMovement type=TRANSFER_OUT at source on ship | FAIL | transfer-request.service.ts:379-411 — not implemented |
| (b) StockLevel.onHand decrease at source on ship | FAIL | not implemented |
| (c) StockMovement type=TRANSFER_IN at destination on receive | FAIL | transfer-request.service.ts:470-514 — not implemented |
| (d) StockLevel.onHand increase at destination on receive | FAIL | not implemented |
| (e) TransferRequest status update | PASS | transfer-request.service.ts:504 (sets RECEIVED) |

**Root cause:** Both `shipTransfer()` and `receiveTransfer()` only update status fields. Neither creates StockMovement records nor modifies StockLevel. No Prisma $transaction wrapping the updates.

**Note:** `receiveTransfer()` validates receivedQuantity > 0 for all lines (line 495-501) but never uses these quantities for stock updates.

**Fix needed in 0.8:** shipTransfer(): wrap in transaction, create TRANSFER_OUT per line, decrease source onHand. receiveTransfer(): wrap in transaction, create TRANSFER_IN per line (using receivedQuantity), increase destination onHand.

**Files examined:** `backend/src/services/transfer-request.service.ts`

### Micro-Task 0.5 — Audit Stock Adjustment → Stock Flow (2026-02-06)
**Result: ALL 3 CHECKS PASS — No fixes needed**

| Check | Result | Location |
|-------|--------|----------|
| (a) StockMovement type=ADJUSTMENT_IN/OUT | PASS | inventory.service.ts:1124 (delta >= 0 ? ADJUSTMENT_IN : ADJUSTMENT_OUT) |
| (b) StockLevel.onHand updated | PASS | inventory.service.ts:1127-1133 (updateStockLevel with delta) |
| (c) Records who approved and when | PASS | inventory.service.ts:1114-1118 (approvedAt, approvedBy, updatedBy) |

**Additional:** Full Prisma $transaction, per-line processing, referenceType='StockAdjustment' + referenceId + referenceNumber + adjustmentReason on movements, approval/rejection workflow.

**Files examined:** `backend/src/services/inventory.service.ts`

### Micro-Task 0.6 — Audit Quote → Reservation Flow (2026-02-06)
**Result: ALL 3 CHECKS PASS — No fixes needed**

| Check | Result | Location |
|-------|--------|----------|
| (a) StockReservation type=SOFT | PASS | inventory.service.ts:1232 (reservationType: 'SOFT') |
| (b) StockLevel.softReserved increased | PASS | inventory.service.ts:1243-1249 (updateStockLevel with softReserved delta) |
| (c) Linked to quote (referenceType='Quote') | PASS | quote.service.ts:456-458 (referenceType, referenceId, referenceNumber) |

**Additional:** createSoftReservation() within Prisma $transaction, expiresAt set from 30-day validity, rejectQuote() releases reservations via releaseReservationsByReference().

**Minor concern:** Quote status update and reservation creation are separate transactions — potential for orphaned state on partial failure. Not critical.

**Files examined:** `backend/src/services/quote.service.ts`, `backend/src/services/inventory.service.ts`

### Micro-Task 0.7 — Audit Sales Order → Reservation Flow (2026-02-06)
**Result: ALL 3 CHECKS PASS — No fixes needed**

| Check | Result | Location |
|-------|--------|----------|
| (a) Convert SOFT→HARD on order creation | PASS | order.service.ts:342 (release soft) + 345-357 (create hard) |
| (b) Create HARD reservations with referenceType='SalesOrder' | PASS | order.service.ts:351 (referenceType: 'SalesOrder') |
| (c) StockLevel.hardReserved updated | PASS | inventory.service.ts:1319-1325 (updateStockLevel with hardReserved delta) |

**Additional:** createHardReservation() validates available stock, full Prisma $transaction, cancelOrder() releases reservations via releaseReservationsByReference(). Reservation conversion is outside order creation transaction (minor concern, same as 0.6).

**Files examined:** `backend/src/services/order.service.ts`, `backend/src/services/inventory.service.ts`

---

## Phase 0 Audit Summary

| Flow | Result | Fix in 0.8? |
|------|--------|-------------|
| 0.1 GRV → Stock | ✅ ALL PASS | No |
| 0.2 Picking Slip → Stock | ❌ ALL 5 FAIL | YES — rewrite completePicking() |
| 0.3 Job Card → Stock | ❌ ALL 5 FAIL | YES — rewrite completeJobCard() |
| 0.4 Transfer Request → Stock | ❌ 4/5 FAIL | YES — rewrite shipTransfer() + receiveTransfer() |
| 0.5 Stock Adjustment → Stock | ✅ ALL PASS | No |
| 0.6 Quote → Reservation | ✅ ALL PASS | No |
| 0.7 Sales Order → Reservation | ✅ ALL PASS | No |

**3 services need fixes in 0.8:** picking-slip, job-card, transfer-request

### Micro-Task 0.8 — Fix All Broken/Missing Flows (2026-02-06)
**Result: ALL 3 SERVICES FIXED — TypeScript compiles cleanly**

**Approach:** Exported `updateStockLevel` and `createStockMovement` helpers from `inventory.service.ts` and reused them in all 3 services to ensure consistent stock operations within Prisma transactions.

| Service | Function | What was added |
|---------|----------|----------------|
| picking-slip.service.ts | `completePicking()` | ISSUE movements, onHand decrease, hard reservation release, SalesOrder status propagation |
| job-card.service.ts | `completeJobCard()` | MANUFACTURE_IN for finished product (+onHand), MANUFACTURE_OUT per BOM component (-onHand), SalesOrder status propagation. Manufacturing location hardcoded to JHB. |
| transfer-request.service.ts | `shipTransfer()` | TRANSFER_OUT movements, onHand decrease at source |
| transfer-request.service.ts | `receiveTransfer()` | TRANSFER_IN movements, onHand increase at destination (using receivedQuantity) |

**Key decisions:**
- Manufacturing always at JHB (only manufacturing location per business rules)
- BOM component consumption uses `Math.ceil(bomItem.quantity * jobQty)` for fractional BOM quantities
- SalesOrder propagation: CONFIRMED→PROCESSING (partial fulfillment), PROCESSING→READY_TO_SHIP (all picking+jobs complete)
- Reservation release happens per-product per-location, matching HARD reservations linked to the SalesOrder

**Files modified:**
- `backend/src/services/inventory.service.ts` — exported `updateStockLevel` and `createStockMovement`
- `backend/src/services/picking-slip.service.ts` — rewrote `completePicking()` (~90 lines added)
- `backend/src/services/job-card.service.ts` — rewrote `completeJobCard()` (~100 lines added)
- `backend/src/services/transfer-request.service.ts` — rewrote `shipTransfer()` and `receiveTransfer()` (~70 lines each)

### Micro-Task 0.9 — Create Integration Test Script (2026-02-06)
**Result: 31 TESTS ALL PASS**

Created `tests/integration/stock-flows.test.ts` with Vitest mock-based tests:

| Test Group | Tests | What's Verified |
|------------|-------|-----------------|
| Flow 0.2: Picking Slip | 7 | ISSUE movements, onHand decrease, reservation release, READY_TO_SHIP/PROCESSING propagation, validation |
| Flow 0.3: Job Card | 7 | MANUFACTURE_IN/OUT, BOM component consumption, fractional qty ceiling, optional BOM skip, propagation |
| Flow 0.4: Transfer Request | 8 | TRANSFER_OUT at source, TRANSFER_IN at destination (uses receivedQuantity), status validation |
| Flows 0.1, 0.5-0.7 (structural) | 7 | Function exports exist and are callable |
| **Total** | **31** | |

**Mocking approach:** `vi.hoisted()` for mock variables, `vi.mock()` for database and inventory helpers, `vi.importActual()` for structural assertions.

**Files created:**
- `tests/integration/stock-flows.test.ts` (~800 lines)

---

## Phase 0: Integration Audit (Foundation)
- [x] 0.1 — Audit GRV → Stock flow ✅ ALL PASS
- [x] 0.2 — Audit Picking Slip → Stock flow ❌ ALL 5 FAIL
- [x] 0.3 — Audit Job Card → Stock flow ❌ ALL 5 FAIL
- [x] 0.4 — Audit Transfer Request → Stock flow ❌ 4 of 5 FAIL
- [x] 0.5 — Audit Stock Adjustment → Stock flow ✅ ALL PASS
- [x] 0.6 — Audit Quote → Reservation flow ✅ ALL PASS
- [x] 0.7 — Audit Sales Order → Reservation flow ✅ ALL PASS
- [x] 0.8 — Fix all broken/missing flows identified in 0.1-0.7 ✅ ALL 3 SERVICES FIXED
- [x] 0.9 — Create integration test script ✅ 31 TESTS ALL PASS

## Phase 1A: Fix Product Edit Form ✅ COMPLETE
- [x] 1A.1 — Create shared UoM constants + fix UoM enum mismatch in both form pages
- [x] 1A.2 — Add category/subcategory editing + supplierSku to edit page
- [x] 1A.3 — Fix UoM in remaining components (dedup + display labels)
- [x] 1A.4 — TypeScript check + verification (tsc --noEmit clean)

### Phase 1A Session Notes (2026-02-06)

**Root cause found:** Frontend UoM dropdown values (`EACH`, `METER`, `PAIR`, `BOX`) did NOT match backend Prisma enum (`EA`, `MTR`, `PR`, `BX`). This caused Zod validation failures on create/update. `ROL` (Roll) was missing entirely from frontend.

**What was NOT broken (original assumption wrong):** Supplier/category dropdowns correctly used IDs, not text fields. No "text field vs relationship ID disconnect" existed.

**Actual fixes applied:**
| File | What Changed |
|------|-------------|
| `frontend/src/lib/constants/unit-of-measure.ts` | NEW — shared UoM constants, labels, helper |
| `frontend/src/app/(portal)/inventory/items/new/page.tsx` | Fixed UoM default `EACH`→`EA`, replaced hardcoded options |
| `frontend/src/app/(portal)/inventory/items/[sku]/page.tsx` | Fixed UoM default, options, display; added category/subcategory dropdowns; made supplierSku editable |
| `frontend/src/components/products/ProductFormModal.tsx` | Removed local `UOM_OPTIONS`, imported shared, added labels |
| `frontend/src/components/products/ProductEditor.tsx` | Same as ProductFormModal |
| `frontend/src/components/products/ProductDetailModal.tsx` | Added `getUomLabel()` for display |
| `frontend/src/components/quotes/AddToQuoteModal.tsx` | Added `getUomLabel()` for display |
| `frontend/src/components/products/BomTable.tsx` | Added `getUomLabel()` for display |
| `frontend/src/app/(portal)/catalog/[slug]/page.tsx` | Added `getUomLabel()` for display |
| `frontend/src/app/(website)/products/p/[sku]/page.tsx` | Added `getUomLabel()` for display |

**Key decisions:**
- Single source of truth: `@nusaf/shared` `UNIT_OF_MEASURE_LABELS` constant
- Supplier stays read-only on edit page (business rule: changing supplier has cascading pricing effects)
- `InventoryItemForm.tsx` skipped (orphaned component — exported but never imported by any page)

## Phase 1B: Rebuild Product Detail Page (Item Master) ✅ COMPLETE
- [x] 1B.10 — Separate Edit page from View page (different routes) ✅
- [x] 1B.1 — Build product detail header + quick stats bar + tab shell ✅
- [x] 1B.2 — Build Overview tab (description, specs, attributes, images) ✅
- [x] 1B.3 — Build Inventory tab (stock per warehouse, recent movements) ✅
- [x] 1B.4 — Build Pricing tab (staff only — waterfall, tier prices, margins) ✅
- [x] 1B.5 — Build Purchasing tab (staff only — suppliers, open POs, history) ✅ + backend endpoint
- [x] 1B.6 — Build BOM tab (staff only — component tree, reuses ProductBomTab) ✅
- [x] 1B.7 — Build Sales History tab (staff only — orders, customers, summary stats) ✅ + backend endpoint
- [x] 1B.8 — Build Documents tab (images, documents, with upload/delete) ✅
- [x] 1B.9 — Build Audit Log tab (staff only — timeline from stock movements) ✅

### Phase 1B Session Notes (2026-02-06)

**Architecture:**
- View page: `/inventory/items/[sku]` — read-only, 8 tabs, role-based visibility
- Edit page: `/inventory/items/[sku]/edit` — form for ADMIN/MANAGER only
- Components: `frontend/src/components/inventory/product-detail/` (10 component files + barrel index)

**New backend endpoints:**
- `GET /api/v1/products/:productId/purchase-history` — PO lines for product
- `GET /api/v1/products/:productId/sales-history` — SO lines for product with summary stats

**Tab visibility by role:**
| Tab | ADMIN/MANAGER | SALES | WAREHOUSE | PURCHASER | CUSTOMER |
|-----|:---:|:---:|:---:|:---:|:---:|
| Overview | ✓ | ✓ | ✓ | ✓ | redirected |
| Inventory | ✓ | ✓ | ✓ | ✓ | redirected |
| Pricing | ✓ | | | | |
| Purchasing | ✓ | | | ✓ | |
| BOM | ✓ | ✓ | ✓ | ✓ | |
| Sales History | ✓ | ✓ | | | |
| Documents | ✓ | ✓ | ✓ | ✓ | |
| Audit Log | ✓ | | | | |

**Key reuse:** WarehouseStockTable, StockOverviewCards, StockMovementsTable, AdjustStockModal, ProductBomTab, ProductImageGallery, ProductDocumentsList — all existing components composed into tabs.

**Files created:**
- `frontend/src/app/(portal)/inventory/items/[sku]/edit/page.tsx`
- `frontend/src/components/inventory/product-detail/` (10 files)

**Files modified:**
- `frontend/src/app/(portal)/inventory/items/[sku]/page.tsx` — complete rewrite
- `frontend/src/lib/api.ts` — added getProductPurchaseHistory, getProductSalesHistory
- `frontend/src/hooks/useProductInventory.ts` — added useProductPurchaseHistory, useProductSalesHistory
- `backend/src/api/v1/products/route.ts` — added 2 new endpoints

## Phase 3: Document Chain + Status Propagation
- [x] 3.1 — Build Sales Order detail page with fulfillment status panel ✅
- [x] 3.2 — Implement picking slip completion → order status update ✅ (done in Phase 0.8)
- [x] 3.3 — Implement job card completion → stock + order status update ✅ (done in Phase 0.8)
- [x] 3.4 — Implement transfer completion → stock + order status update ✅ (done in Phase 0.8)
- [x] 3.5 — Implement GRV → PO status + stock update propagation ✅ (done in Phase 0.1)
- [x] 3.6 — Build PO detail page with GRV history + linked orders ✅
- [x] 3.7 — Build Fulfillment Dashboard (picking queue, jobs, transfers, alerts) ✅
- [x] 3.8 — Add timeline/activity log to Sales Order page ✅
- [x] 3.9 — Multi-warehouse fulfillment orchestration (verified + fixed assembly→CT transfer gap) ✅

## Phase 2: Route Separation (ERP vs Customer Portal)
- [x] 2.1 — Create (customer) route group + layout infrastructure (CustomerAuthGuard, CustomerHeader, CustomerLayout) ✅
- [x] 2.2 — Login redirect + middleware + cross-guards (AuthGuard blocks CUSTOMER, QuoteCart role-aware) ✅
- [x] 2.3 — Build customer dashboard at /my/dashboard ✅
- [x] 2.4 — Build customer product catalog page (tier pricing, no internals) ✅
- [x] 2.5 — Build customer product detail page ✅
- [x] 2.6 — Build customer quotes list + detail pages ✅
- [x] 2.7 — Build customer orders list + detail pages ✅
- [x] 2.8 — Build customer account page ✅
- [x] 2.9 — Data leak audit + verification ✅

## Phase 4: Inventory Module (reordered: dashboard last)
- [x] 4.1 — Build Stock Movements page (filterable audit log) ✅
- [x] 4.2 — Build Stock Adjustment workflow (create → approve → apply) ✅
- [x] 4.4 — Build Reorder Report (below reorder point, suggested PO quantities) ✅
- [ ] 4.5 — Build Cycle Count workflow (create session → count → reconcile)
- [ ] 4.3 — Build Inventory Dashboard (multi-warehouse summary, alerts) — LAST

## Phase 5: Missing ERP Documents
- [ ] 5.1 — Build Delivery Note model + create from picking slips
- [ ] 5.2 — Build Proforma Invoice generation from Sales Order
- [ ] 5.3 — Build Purchase Requisition workflow
- [ ] 5.4 — Build Return Authorization process
- [ ] 5.5 — Build Packing List generation

## Phase 6: Reports & Analytics
- [ ] 6.1 — Sales reports (by customer, product, category, conversion rate)
- [ ] 6.2 — Inventory reports (valuation, aging, dead stock, turnover)
- [ ] 6.3 — Purchasing reports (by supplier, open POs, lead time performance)
- [ ] 6.4 — Operations reports (fulfillment rate, picking accuracy, output)
