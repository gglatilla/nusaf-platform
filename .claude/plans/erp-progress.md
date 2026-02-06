# ERP Remediation Progress Tracker

## Current Phase: Phase 3 — Document Chain + Status Propagation
## Current Micro-Task: 3.1 DONE — Next: 3.6 (PO detail page)
## Status: IN PROGRESS (3.1 complete, 3.2-3.5 already done in Phase 0.8)

---

## Last Session Notes
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
- [ ] 3.6 — Build PO detail page with GRV history + linked orders
- [ ] 3.7 — Build Fulfillment Dashboard (picking queue, jobs, transfers, alerts)
- [ ] 3.8 — Add timeline/activity log to Sales Order page
- [ ] 3.9 — Multi-warehouse fulfillment orchestration (auto picking slip splitting + transfer requests)

## Phase 2: Route Separation (ERP vs Portal)
- [ ] 2.1 — Create (erp) and (portal) route groups in Next.js
- [ ] 2.2 — Build portal layout (header, sidebar, navigation)
- [ ] 2.3 — Build customer product catalog page (their prices only, no internals)
- [ ] 2.4 — Build customer dashboard (quotes, orders, account status)
- [ ] 2.5 — Build customer quote flow (browse → cart → submit → track)
- [ ] 2.6 — Build customer order tracking (simple status, no internal docs)
- [ ] 2.7 — Implement role-based middleware redirect after auth
- [ ] 2.8 — Verify no internal data leaks to customer views

## Phase 4: Inventory Module
- [ ] 4.1 — Build Stock Movements page (filterable audit log)
- [ ] 4.2 — Build Stock Adjustment workflow (create → approve → apply)
- [ ] 4.3 — Build Inventory Dashboard (multi-warehouse summary, alerts)
- [ ] 4.4 — Build Reorder Report (below reorder point, suggested PO quantities)
- [ ] 4.5 — Build Cycle Count workflow (create session → count → reconcile)

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
