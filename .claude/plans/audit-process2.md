# PROCESS 2 AUDIT: Procure-to-Pay (Replenishment)

**Date:** 2026-02-08
**Auditor:** Claude Code (comprehensive codebase trace)
**Scope:** End-to-end business process from reorder detection through goods receipt and supplier payment

---

## EXECUTIVE SUMMARY

The Procure-to-Pay process is **structurally well-built** for its core path (PO creation → approval → sending → receiving). The GRV flow in particular is excellent — single-transaction stock updates with proper StockMovement audit trails. However, the process has critical gaps at both ends:

1. **`onOrder` is NEVER updated when a PO is sent** — the reorder report and inventory dashboard have no visibility into outstanding purchase orders
2. **No supplier invoice model, three-way matching, or payment processing exists at all** — the final third of Procure-to-Pay is entirely absent
3. **Rejection sets status to CANCELLED instead of returning to DRAFT** — rejected POs are dead, not revisable (despite UI text claiming otherwise)
4. **No `onOrder` rollback when PO is cancelled** — if it were ever incremented (it isn't currently), cancellation wouldn't reverse it
5. **No confirmation dialog on "Generate Draft PO(s)"** from reorder report — bulk PO creation is one-click with no preview
6. **No concurrent edit protection** — no optimistic locking, versioning, or etag checking on PO updates

**Severity Assessment:** This process is approximately **60% complete**. The core PO→GRV→stock flow works well. The "bookends" (reorder intelligence and supplier payments) are missing or broken.

---

## STEP-BY-STEP AUDIT TABLE

| # | Step | Status | UX | Automation | Safety Nets | Detail |
|---|------|--------|-----|------------|-------------|--------|
| 1 | Reorder report flags products below reorder point | WORKS | CLEAR | AUTO | PARTIAL | `getLowStockProducts()` queries all `StockLevel` records, computes `available = onHand - hardReserved`, filters where `available <= reorderPoint`. Groups by supplier. Shows summary cards (total, out-of-stock, suppliers affected, shortfall). **BUT**: `onOrder` is never updated by PO creation/sending, so the report cannot account for stock already on order. Items with existing POs will keep appearing as "below reorder point". |
| 2 | Purchaser reviews report, clicks "Create Draft PO" | WORKS | CLEAR | ONE_CLICK | PARTIAL | Multi-select items, click "Generate Draft PO(s)". Creates one draft PO per supplier automatically. Uses `reorderQuantity ?? shortfall` as suggested quantity and `costPrice ?? 0` as unit cost. **BUT**: No confirmation dialog before generation. No preview of what POs will be created. For single-supplier selection, auto-redirects to PO detail. For multi-supplier, shows success banner with links. **BUG**: `costPrice ?? 0` means products without a cost price get `unitCost: 0`, but Zod schema requires `unitCost > 0` (positive). The `addLine` call will fail silently for these items. |
| 3 | PO created with supplier, warehouse, lines, costs | WORKS | CLEAR | AUTO | PROTECTED | `createPurchaseOrder()` validates supplier exists and is active, inherits currency from supplier, generates PO-YYYY-NNNNN number atomically. Lines added individually via `addPurchaseOrderLine()`. Duplicate product check prevents same product twice. Line totals auto-calculated. PO totals auto-recalculated after each line change. |
| 4 | Purchaser reviews/edits PO, submits for approval | WORKS | CLEAR | ONE_CLICK | PROTECTED | PO detail page shows lines, totals, supplier info, delivery location, expected date, notes. "Submit for Approval" button visible when DRAFT. `submitForApproval()` validates PO has at least one line. Only PURCHASER role can submit (route-level). Editing restricted to DRAFT and PENDING_APPROVAL statuses. |
| 5 | Manager approves PO | WORKS | CLEAR | ONE_CLICK | PROTECTED | "Approve" button visible when PENDING_APPROVAL. `approvePurchaseOrder()` prevents self-approval (creator cannot approve own PO). Sets `approvedAt` and `approvedBy`. **NOTE**: Approve does NOT auto-advance status — it only records approval. Status stays PENDING_APPROVAL until "Send to Supplier" is clicked. This is a two-step process (approve then send). **NOTE**: ADMIN/MANAGER can bypass approval entirely and send directly from DRAFT. |
| 6 | PO sent to supplier (email/PDF) | WORKS | CLEAR | ONE_CLICK | PROTECTED | "Send to Supplier" modal with email override option. `sendToSupplier()` generates PDF via `generatePurchaseOrderPDF()`, sends email with attachment, updates status to SENT. Status updated to SENT regardless of email delivery success (logged but non-blocking). **BUG**: `onOrder` is NOT incremented on send. Stock levels don't reflect pending orders. |
| 7 | Supplier confirms and ships goods | WORKS | CLEAR | ONE_CLICK | N/A | "Acknowledged" button on PO detail when status=SENT. `acknowledgePurchaseOrder()` transitions SENT→ACKNOWLEDGED. This is an optional step — receiving can happen directly from SENT status. |
| 8 | Warehouse receives goods — creates GRV | WORKS | CLEAR | ONE_CLICK | PROTECTED | "Receive Goods" button opens `ReceiveGoodsModal`. Loads receiving summary showing outstanding quantities per line. "Receive All" quick action. Per-line input for received and rejected quantities. Frontend validates received+rejected ≤ outstanding. Notes field available. Creates GRV in single transaction. |
| 9 | GRV records actual quantities received | WORKS | CLEAR | AUTO | PROTECTED | `createGoodsReceipt()` validates: PO status is SENT/ACKNOWLEDGED/PARTIALLY_RECEIVED; all poLineIds exist on the PO; total incoming ≤ remaining per line. Records `quantityExpected`, `quantityReceived`, `quantityRejected`, `rejectionReason` per line. Tracks `receivedBy` and `receivedByName` for audit. |
| 10 | Stock levels auto-updated, StockMovements created | WORKS | N/A | AUTO | PROTECTED | **Excellent implementation.** All within single `prisma.$transaction()`: (1) PO line `quantityReceived` incremented, (2) StockLevel `onHand` increased by received qty, (3) StockLevel `onOrder` decreased (with `Math.max(0, ...)` floor), (4) StockMovement created with `type=RECEIPT`, `referenceType=GoodsReceivedVoucher`, `referenceId=grv.id`, `referenceNumber=grvNumber`, `notes=Received from PO {poNumber}`. Creates StockLevel record if it doesn't exist. |
| 11 | PO status auto-updates | WORKS | N/A | AUTO | PROTECTED | Within same transaction: checks all PO lines. If ALL `quantityReceived >= quantityOrdered` → RECEIVED. If SOME received > 0 → PARTIALLY_RECEIVED. Correctly handles multi-GRV scenarios (incremental receiving). |
| 12 | Supplier invoice received — three-way match | MISSING | NO_UI | N/A | UNPROTECTED | **No SupplierInvoice model exists.** No schema, no service, no API, no UI. The three-way match (PO ↔ GRV ↔ Invoice) concept is completely absent. No price variance detection. No quantity discrepancy resolution workflow. |
| 13 | Payment processed to supplier | MISSING | NO_UI | N/A | UNPROTECTED | **No supplier payment functionality exists.** No payment model, no accounts payable tracking, no payment scheduling, no payment confirmation recording. PO goes from RECEIVED → CLOSED with no financial closure step. |

---

## SAFETY NET AUDIT

| # | Safety Net | Status | Detail | Code Location |
|---|-----------|--------|--------|---------------|
| 1 | PREVENT OVER-RECEIVING | **PROTECTED** | Backend validates `totalIncoming (received + rejected) > remaining` per line and returns error. Frontend also validates in `ReceiveGoodsModal` with `max={line.outstanding}` on inputs and explicit `received + rejected > outstanding` check. Double-protected at both frontend and backend. | `grv.service.ts:160-171`, `ReceiveGoodsModal.tsx:110-116` |
| 2 | PREVENT NEGATIVE STOCK | **PARTIAL** | GRV only ADDS to `onHand` (receiving), so negative stock is not possible through GRV flow. `Math.max(0, ...)` used for `onOrder` decrement. However, `onOrder` can go negative through GRV if it was never incremented when PO was sent (which it isn't currently). Since `onOrder` starts at 0 and GRV decrements it, `Math.max(0, ...)` prevents negative. Stock cannot go negative through any Procure-to-Pay operation. | `grv.service.ts:247` |
| 3 | PREVENT ORPHANED DOCUMENTS | **UNPROTECTED** | `cancelPurchaseOrder()` only sets status to CANCELLED. It does NOT: (1) check for existing GRVs with received quantities, (2) reverse stock movements from partial GRVs, (3) adjust `onOrder` (since it was never incremented). A PARTIALLY_RECEIVED PO cannot be cancelled (not in valid transitions from PARTIALLY_RECEIVED), but SENT and ACKNOWLEDGED POs CAN be cancelled even if a GRV exists in the gap between receipt and status propagation. The `PO_STATUS_TRANSITIONS` allows SENT→CANCELLED and ACKNOWLEDGED→CANCELLED. | `purchase-order.service.ts:103-108`, `purchase-order.service.ts:374-399` |
| 4 | PREVENT DUPLICATE GRV | **PROTECTED** | Each GRV creation checks remaining = `quantityOrdered - quantityReceived`. Since `quantityReceived` is atomically incremented within the same transaction that creates the GRV, a concurrent duplicate GRV attempt would see updated `quantityReceived` and fail the remaining check. The transaction isolation prevents double-receiving. | `grv.service.ts:160-171` (within `$transaction`) |
| 5 | STATUS REGRESSION | **PROTECTED** | `PO_STATUS_TRANSITIONS` is a strict forward-only map. RECEIVED can only go to CLOSED. CLOSED and CANCELLED have empty arrays (terminal). No backward transitions exist. PARTIALLY_RECEIVED can only go to RECEIVED or CANCELLED. | `purchase-order.service.ts:100-109` |
| 6 | CONCURRENT EDIT PROTECTION | **UNPROTECTED** | No optimistic locking, no version field, no `updatedAt` check. Two users editing the same PO simultaneously will have last-write-wins behavior. No etags in API responses. `updatePurchaseOrder()` does a simple `findUnique` + `update` without checking if the record was modified between reads. Same for line add/update/remove operations. | `purchase-order.service.ts:328-369` |
| 7 | PREVENT PO WITHOUT SUPPLIER | **PROTECTED** | Zod schema requires `supplierId: z.string().min(1)`. Backend `createPurchaseOrder()` validates supplier exists and is active. Frontend requires supplier selection before PO creation button is enabled. Triple-protected. | `purchase-orders.ts:26`, `purchase-order.service.ts:190-196`, `new/page.tsx:70-71` |

---

## AUTOMATION GAPS (Required vs Actual)

### Must Be AUTOMATIC (Zero Clicks) — Per Requirements

| Automation | Required | Actual | Gap |
|-----------|----------|--------|-----|
| GRV completed → Stock levels updated | AUTO | **WORKS** | Stock onHand increased, StockMovement RECEIPT created, all within single transaction. |
| GRV all lines received → PO status COMPLETED (RECEIVED) | AUTO | **WORKS** | Transaction checks all PO lines after GRV creation. Sets RECEIVED if all lines fully received. |
| PO sent → `onOrder` incremented | AUTO | **MISSING** | `onOrder` is NEVER updated when PO transitions to SENT. Reorder report and inventory dashboard have no visibility into pending orders. |
| PO cancelled → `onOrder` decremented | AUTO | **MISSING** (N/A currently since onOrder is never set) | No onOrder adjustment on cancellation. |

### Must Be ONE CLICK with Confirmation — Per Requirements

| Action | Required | Actual | Gap |
|--------|----------|--------|-----|
| Create Draft PO from reorder report | ONE_CLICK + CONFIRM | **ONE_CLICK (no confirm)** | No confirmation dialog. Bulk PO creation happens immediately on button click. No preview of POs to be created. |
| Approve PO | ONE_CLICK + CONFIRM | **WORKS** | `window.confirm()` dialog before approval. Self-approval prevented. |
| Create GRV against PO | ONE_CLICK + CONFIRM | **WORKS** | Modal with line-by-line input. Submit button creates GRV. Clear validation messages. |

---

## FRONTEND UX EVALUATION

### Staff Portal — Reorder Report (`/inventory/reorder`)
- **FLOW LOGIC:** CLEAR — Summary cards give overview, severity tabs filter priority, group-by-supplier shows logical groupings, multi-select enables bulk PO generation.
- **FIELD COMPLETENESS:** Excellent — SKU, description, warehouse, on-hand, available, on-order, reorder point, shortfall, suggested quantity, lead time, status.
- **FIELD ORDER:** Good — Info flows left-to-right from identification to action-relevant data.
- **ROLE CLARITY:** CLEAR — Only ADMIN/MANAGER/PURCHASER see checkboxes and generate button.
- **STATUS VISIBILITY:** Good — Color-coded severity badges (OUT_OF_STOCK red, LOW_STOCK amber).
- **PROBLEM:** On-order column is meaningless since `onOrder` is never populated by PO creation.

### Staff Portal — PO Detail (`/purchase-orders/[id]`)
- **FLOW LOGIC:** CLEAR — Pipeline steps show lifecycle. Action buttons contextual to status. Receiving progress visible. GRVs section shows receipt history.
- **FIELD COMPLETENESS:** Good — Supplier, delivery location, expected date, sent date, approved date, lines, totals, notes, timeline.
- **FIELD ORDER:** Good — Header with status → Pipeline → Lines → GRVs → Notes | Sidebar: Summary + Details + Timeline.
- **ROLE CLARITY:** PARTIAL — All roles see all action buttons. No role-specific visibility. A WAREHOUSE user sees "Submit for Approval" and "Send to Supplier" buttons they shouldn't use (API routes enforce roles, but UI doesn't filter).
- **STATUS VISIBILITY:** Good — Pipeline steps, status badge, receiving progress bar.
- **BUG:** Reject modal text says "The PO will return to DRAFT status for revision" but backend sets status to CANCELLED. Dead letter — rejected POs cannot be revised. The `po.status === 'DRAFT' && po.rejectionReason` banner check will never be true.

### Staff Portal — New PO (`/purchase-orders/new`)
- **FLOW LOGIC:** CONFUSING — Two-step process: (1) create PO header, (2) add lines. Supplier locked after step 1. User must first "Create Purchase Order" then "Add Line". This is unusual — most PO creation flows are single-step.
- **FIELD COMPLETENESS:** Good — Supplier, delivery location, expected date, supplier notes, internal notes, lines.
- **FIELD ORDER:** Good for form layout.
- **NOTE:** No edit page exists. The "new" page creates a DRAFT PO. To edit, user must go to PO detail and... there's no inline editing on the detail page. Line editing can only happen through Add/Remove operations on the detail page.

### Staff Portal — GRV Detail (`/goods-receipts/[id]`)
- **FLOW LOGIC:** CLEAR — Shows what was received, when, by whom, against which PO.
- **FIELD COMPLETENESS:** GRV number, PO number, supplier, location, received date, received by, lines with expected/received/rejected quantities.
- **ROLE CLARITY:** CLEAR for warehouse workers and purchasers.
- **NAVIGATION:** Links back to PO. PO detail links to GRVs.

---

## CRITICAL MISSING PIECES (Priority Order)

### P0 — Business-Breaking Gaps

1. **`onOrder` Update on PO Send** — When a PO transitions to SENT, the system must increment `StockLevel.onOrder` for each line item at the PO's delivery location. When a PO is CANCELLED, decrement. This is the bridge between procurement and inventory visibility. Without it:
   - Reorder report keeps flagging items that already have POs in flight
   - Inventory dashboard shows misleading "available" calculations
   - Duplicate POs get created for the same shortage

2. **Supplier Invoice & Three-Way Match** — Need:
   - `SupplierInvoice` model with lines, amounts, invoice number, invoice date
   - Service: `createSupplierInvoice()`, `matchInvoiceToPO()`, `getInvoiceDiscrepancies()`
   - Three-way match: PO line (ordered qty × unit cost) ↔ GRV line (received qty) ↔ Invoice line (billed qty × billed price)
   - Discrepancy reporting: quantity variances, price variances
   - UI: Invoice capture form, matching interface, discrepancy resolution

3. **Supplier Payment Processing** — Need:
   - Payment recording against invoices
   - Payment methods (EFT, credit card, etc.)
   - Payment status tracking
   - Accounts payable aging report

### P1 — Operational Gaps

4. **Rejection → DRAFT (not CANCELLED)** — `rejectPurchaseOrder()` currently kills the PO permanently. It should return to DRAFT status so the purchaser can revise and resubmit. The UI text already says this ("The PO will return to DRAFT status for revision") but the backend doesn't do it. Fix: Change `status: 'CANCELLED'` to `status: 'DRAFT'` in `rejectPurchaseOrder()`.

5. **Reorder Report PO Generation Confirmation** — Before creating draft POs, show a preview modal:
   - List of POs to be created (one per supplier)
   - Lines per PO with quantities and estimated costs
   - Total estimated value
   - Confirm/Cancel buttons

6. **PO Edit Page** — Currently, PO detail is read-only for header fields. To change delivery location, expected date, or notes on a DRAFT PO, there's no UI (PATCH API exists but no edit form). Need either inline editing on detail page or a separate edit page.

7. **Concurrent Edit Protection** — Add `version` field to PurchaseOrder. Increment on every update. Client sends version with PATCH requests. Server rejects if version mismatch. Alternatively, use `updatedAt` as an etag.

### P2 — Quality Gaps

8. **Role-Based Action Buttons** — PO detail page shows all action buttons to all roles. Should filter: WAREHOUSE users don't see "Submit for Approval" or "Send to Supplier". PURCHASER doesn't see "Approve". Route-level role checks protect the API, but UI should match.

9. **Reorder Report Cost Price Fallback** — When `costPrice` is null, the reorder report passes `0` to `addLine`, which fails Zod validation (`unitCost: z.number().positive()`). Need either: skip items with no cost price, or prompt for cost during PO generation.

10. **Notification System for Procurement** — No notifications exist:
    - PO submitted → notify approver
    - PO approved → notify purchaser
    - PO rejected → notify purchaser
    - Goods received → notify purchaser
    - PO fully received → notify purchaser + requester

11. **PO from Orchestration Linkage** — Orchestration engine creates draft POs for component shortages (`orchestration.service.ts`). These link via `sourceOrderId`. But the PO detail page shows "View Sales Order" link without checking if it's from orchestration vs manual. Link navigation is correct but label could be clearer.

12. **Purchase Requisition → PO Flow** — Purchase Requisitions exist with a full lifecycle (PENDING → CONVERTED_TO_PO / REJECTED / CANCELLED). Approval auto-creates draft POs grouped by supplier. This is well-implemented but disconnected from the main reorder report — no cross-reference between PR-generated POs and reorder-generated POs. Staff may not know which path generated a PO.

---

## ROLE-BASED EXPERIENCE EVALUATION

### Purchaser Experience
- **Pain Points:** Reorder report shows items already on order as still needing POs (onOrder not populated). PO creation is two-step (create header, then add lines). No edit form for PO header. Rejected POs die instead of returning for revision. No notification when PO is approved or rejected.
- **Working Well:** Reorder report with supplier grouping is excellent. Bulk PO generation saves time. Line management (add/remove) works. Receiving summary shows outstanding quantities clearly.
- **Rating:** 6/10 — Core workflow functional but reorder intelligence is undermined by missing onOrder.

### Warehouse Worker Experience
- **Pain Points:** Sees action buttons they can't use (Submit, Send, Approve). No dedicated "pending receipts" queue. Must navigate to PO detail to receive goods.
- **Working Well:** Receive Goods modal is intuitive. "Receive All" quick action. Per-line input with outstanding quantities. Rejection reason tracking.
- **Rating:** 7/10 — Receiving flow is well-designed. Needs a dedicated receiving queue.

### Manager Experience
- **Pain Points:** No PO spending dashboard. No "pending approval" queue/alert. No supplier spend analytics. No aging report for outstanding POs. Cannot see which POs were auto-generated from orchestration vs manual.
- **Working Well:** Approval with self-approval prevention. Can send directly from DRAFT (bypassing approval for urgent orders). Timeline shows audit trail. Receiving progress visualization.
- **Rating:** 5/10 — Can approve and monitor individual POs, but no aggregate procurement visibility.

### Supplier Experience
- **Pain Points:** Receives PDF via email (good). But no supplier portal. No way to confirm receipt online. No way to submit invoice electronically. No status visibility.
- **Working Well:** PDF is generated and emailed. Email includes key details.
- **Rating:** 3/10 — One-way communication only.

---

## DATA INTEGRITY RISKS

1. **`onOrder` is permanently 0** — Since PO creation/sending never increments `onOrder`, and GRV receiving decrements with `Math.max(0, ...)`, `onOrder` is always 0 or incorrectly decremented below what it should be. Every inventory calculation involving `onOrder` (stock status, reorder point comparison, dashboard metrics) is wrong.

2. **GRV counter not inside main transaction** — `generateGRVNumber()` runs as a separate transaction from the main GRV creation. If the main transaction fails after number generation, the counter has already incremented, creating a gap in GRV numbering. Same issue with PO counter. (Minor — gaps are acceptable in most business numbering, but worth noting.)

3. **Reorder report creates POs with `costPrice: 0`** — When a product has no `costPrice` set, `handleGeneratePOs` passes `item.costPrice ?? 0` to `addLine`. The Zod schema `addPurchaseOrderLineSchema` requires `unitCost: z.number().positive()` (strictly > 0). The line addition will fail with a validation error, potentially leaving a draft PO with no lines.

4. **Cancel PO with partial GRVs** — `PO_STATUS_TRANSITIONS` allows `SENT→CANCELLED` and `ACKNOWLEDGED→CANCELLED`. If a GRV was created between the PO being sent and the cancellation attempt, the stock movements from that GRV are not reversed. The `cancelPurchaseOrder()` function does not check for existing GRVs or reverse stock changes. However, `PARTIALLY_RECEIVED→CANCELLED` IS allowed in the transition map, which means a PO with partial receipts CAN be cancelled without stock reversal.

5. **Rejection modal UX mismatch** — Frontend modal says "The PO will return to DRAFT status for revision" but backend sets status to `CANCELLED`. Users will expect to be able to revise and resubmit a rejected PO, but it's actually dead. This is a UX integrity issue — the system says one thing and does another.

---

## PURCHASE REQUISITION FLOW (BONUS — related sub-process)

The system also includes a Purchase Requisition (PR) flow as an alternative entry point:

| Step | Status | Detail |
|------|--------|--------|
| Staff creates PR with product lines | WORKS | Any authenticated staff can create. Lines include product, quantity, estimated cost, delivery location, supplier (auto-filled from product). Urgency levels: LOW/NORMAL/HIGH/CRITICAL. Business justification required. |
| Manager approves PR | WORKS | Self-approval prevented. Approval auto-creates draft POs grouped by supplier. PR status → CONVERTED_TO_PO. Generated PO IDs stored on PR. |
| Manager rejects PR | WORKS | Requires rejection reason. PR status → REJECTED. |
| Creator cancels PR | WORKS | Only creator can cancel. Only from PENDING status. |
| **Gap** | — | PR and reorder report are completely separate paths that both create POs. No deduplication — if both flag the same product, two POs may be created for the same shortage. No visibility of PRs in reorder report or vice versa. |

---

## FILES EXAMINED

### Backend Services
- `backend/src/services/purchase-order.service.ts` — PO CRUD, approval, sending, PDF, acknowledgement
- `backend/src/services/grv.service.ts` — GRV creation with auto stock updates, receiving summary
- `backend/src/services/purchase-requisition.service.ts` — PR lifecycle, auto-PO generation
- `backend/src/services/inventory.service.ts` — Stock levels, low stock products, stock status computation
- `backend/src/services/inventory-dashboard.service.ts` — Dashboard metrics (uses onOrder)

### Backend API Routes
- `backend/src/api/v1/purchase-orders/route.ts` — PO CRUD + workflow + GRV sub-routes
- `backend/src/api/v1/goods-receipts/route.ts` — GRV CRUD + PO-related queries

### Backend Validation
- `backend/src/utils/validation/purchase-orders.ts` — PO Zod schemas
- `backend/src/utils/validation/goods-receipts.ts` — GRV Zod schemas

### Frontend Pages
- `frontend/src/app/(portal)/purchase-orders/page.tsx` — PO list
- `frontend/src/app/(portal)/purchase-orders/new/page.tsx` — Create PO (two-step)
- `frontend/src/app/(portal)/purchase-orders/[id]/page.tsx` — PO detail + workflow actions
- `frontend/src/app/(portal)/goods-receipts/page.tsx` — GRV list
- `frontend/src/app/(portal)/goods-receipts/[id]/page.tsx` — GRV detail
- `frontend/src/app/(portal)/inventory/reorder/page.tsx` — Reorder report + bulk PO generation

### Frontend Components
- `frontend/src/components/goods-receipts/ReceiveGoodsModal.tsx` — GRV creation modal
- `frontend/src/components/purchase-orders/POLineTable.tsx` — PO lines display
- `frontend/src/components/purchase-orders/AddPOLineModal.tsx` — Add line modal
- `frontend/src/components/purchase-orders/po-detail/` — Pipeline, receiving progress, GRVs section, notes

### Frontend Hooks
- `frontend/src/hooks/usePurchaseOrders.ts` — PO React Query hooks
- `frontend/src/hooks/useGoodsReceipts.ts` — GRV React Query hooks

### Schema
- `backend/prisma/schema.prisma` — PurchaseOrder, PurchaseOrderLine, GoodsReceivedVoucher, GrvLine, PurchaseRequisition models

---

*This audit is a report only. No code changes were made.*
