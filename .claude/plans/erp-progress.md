# ERP Remediation Progress Tracker

## Current Phase: Phase 0 — Integration Audit
## Current Micro-Task: 0.3
## Status: IN PROGRESS

---

## Last Session Notes
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

---

## Phase 0: Integration Audit (Foundation)
- [x] 0.1 — Audit GRV → Stock flow ✅ ALL PASS
- [x] 0.2 — Audit Picking Slip → Stock flow ❌ ALL 5 FAIL
- [ ] 0.3 — Audit Job Card → Stock flow
- [ ] 0.4 — Audit Transfer Request → Stock flow
- [ ] 0.5 — Audit Stock Adjustment → Stock flow
- [ ] 0.6 — Audit Quote → Reservation flow
- [ ] 0.7 — Audit Sales Order → Reservation flow
- [ ] 0.8 — Fix all broken/missing flows identified in 0.1-0.7
- [ ] 0.9 — Create integration test script that verifies all 7 flows

## Phase 1A: Fix Product Edit Form
- [ ] 1A.1 — Diagnose dropdown data loading (suppliers, categories, UoM)
- [ ] 1A.2 — Fix text field vs relationship ID disconnect
- [ ] 1A.3 — Verify all edit form fields populate correctly from existing data
- [ ] 1A.4 — Test save round-trip (load → edit → save → reload → verify)

## Phase 1B: Rebuild Product Detail Page (Item Master)
- [ ] 1B.1 — Build product detail header + quick stats bar (read-only)
- [ ] 1B.2 — Build Overview tab (description, specs, attributes, images)
- [ ] 1B.3 — Build Inventory tab (stock per warehouse, recent movements)
- [ ] 1B.4 — Build Pricing tab (staff only — rules, tier prices, margins)
- [ ] 1B.5 — Build Purchasing tab (staff only — suppliers, open POs, history)
- [ ] 1B.6 — Build BOM tab (staff only — component tree, availability)
- [ ] 1B.7 — Build Sales History tab (staff only — orders, customers, trends)
- [ ] 1B.8 — Build Documents tab (datasheets, images, cross-references)
- [ ] 1B.9 — Build Audit Log tab (staff only — change history, movements)
- [ ] 1B.10 — Separate Edit page from View page (different routes)

## Phase 3: Document Chain + Status Propagation
- [ ] 3.1 — Build Sales Order detail page with fulfillment status panel
- [ ] 3.2 — Implement picking slip completion → order status update
- [ ] 3.3 — Implement job card completion → stock + order status update
- [ ] 3.4 — Implement transfer completion → stock + order status update
- [ ] 3.5 — Implement GRV → PO status + stock update propagation
- [ ] 3.6 — Build PO detail page with GRV history + linked orders
- [ ] 3.7 — Build Fulfillment Dashboard (picking queue, jobs, transfers, alerts)
- [ ] 3.8 — Add timeline/activity log to Sales Order page

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
