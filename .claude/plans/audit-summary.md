# COMPREHENSIVE AUDIT SUMMARY — All 5 Business Processes

**Date:** 2026-02-08
**Source Audits:** Process 1 (Quote-to-Cash), Process 2 (Procure-to-Pay), Process 3 (Make-to-Order), Process 4 (Returns & Credit), Process 5 (Inventory Operations)

---

## 1. SAFETY NETS SCORECARD

### Process 1: Quote-to-Cash

| # | Safety Net | Verdict | Evidence |
|---|-----------|---------|----------|
| 1.1 | Prevent Overselling (quote exceeds stock) | **FAIL** | `quote.service.ts:140-274` — `addQuoteItem()` does not check stock availability. No warning or block. |
| 1.2 | Prevent Double-Picking | **PASS** | `orchestration.service.ts:1083-1187` — Picking slips created in single transaction. Manual button hidden when slips exist. |
| 1.3 | Prevent Shipping Without Payment | **FAIL** | `order.service.ts:379-411`, `orchestration.service.ts:391` — No payment concept exists. Fulfillment runs on any CONFIRMED order. |
| 1.4 | Prevent Duplicate Stock Movements | **PASS** | `picking-slip.service.ts:433`, `job-card.service.ts` — Status checks before all completion functions. Idempotent. |
| 1.5 | Prevent Price Tampering | **PASS** | `quote.service.ts:202-203` — Price always computed via `calculateCustomerPrice()`. No API override parameter. |
| 1.6 | Prevent Missing Customer on Quote | **PARTIAL** | `quote.service.ts:95-134` — Auth user always has companyId, but staff can't create quotes for other companies. |
| 1.7 | Prevent Wrong Warehouse | **PARTIAL** | `order.service.ts:287` — `createOrderFromQuote()` defaults to JHB. Does not read `company.primaryWarehouse`. |
| 1.8 | Status Regression (Orders) | **PASS** | `order.service.ts:17-29` — `STATUS_TRANSITIONS` map enforces forward-only movement. Terminal states have empty arrays. |
| 1.9 | Prevent Negative Stock (Picking/Manufacturing) | **PARTIAL** | `inventory.service.ts:updateStockLevel` — Validates `newOnHand >= 0` but uses read-then-write pattern (not atomic increment). |

### Process 2: Procure-to-Pay

| # | Safety Net | Verdict | Evidence |
|---|-----------|---------|----------|
| 2.1 | Prevent Over-Receiving (GRV > PO qty) | **PASS** | `grv.service.ts:160-171`, `ReceiveGoodsModal.tsx:110-116` — Double-protected at frontend and backend. |
| 2.2 | Prevent Negative Stock (GRV) | **PASS** | `grv.service.ts:247` — GRV only adds to onHand. `Math.max(0,...)` for onOrder decrement. |
| 2.3 | Prevent Orphaned Documents (Cancel PO with GRVs) | **FAIL** | `purchase-order.service.ts:374-399` — `cancelPurchaseOrder()` does not check for existing GRVs or reverse stock movements. PARTIALLY_RECEIVED→CANCELLED is allowed. |
| 2.4 | Prevent Duplicate GRV | **PASS** | `grv.service.ts:160-171` — Atomic increment of `quantityReceived` within transaction prevents double-receiving. |
| 2.5 | Status Regression (PO) | **PASS** | `purchase-order.service.ts:100-109` — Strict forward-only map. RECEIVED→CLOSED only. Terminal states enforced. |
| 2.6 | Concurrent Edit Protection (PO) | **FAIL** | `purchase-order.service.ts:328-369` — No optimistic locking, no version field, no etag. Last-write-wins. |
| 2.7 | Prevent PO Without Supplier | **PASS** | `purchase-orders.ts:26`, `purchase-order.service.ts:190-196` — Triple-protected: Zod, backend validation, frontend gating. |

### Process 3: Make-to-Order (Manufacturing)

| # | Safety Net | Verdict | Evidence |
|---|-----------|---------|----------|
| 3.1 | Prevent Duplicate Stock Movements (Job Card) | **PASS** | `job-card.service.ts:8-13, 483-484` — Status check before completion. COMPLETE is terminal. Transaction ensures all-or-nothing. |
| 3.2 | Prevent Negative Stock (Manufacturing) | **PASS** | `inventory.service.ts:643-655` — `updateStockLevel()` validates `newOnHand >= 0`. Transaction rolls back entirely if any component insufficient. |
| 3.3 | Prevent Manufacturing Without Raw Materials | **FAIL** | `job-card.service.ts:355-384` — `startJobCard()` performs NO stock check. Worker can start with zero components. Failure only at completion time. |
| 3.4 | Status Regression (Job Card) | **PASS** | `job-card.service.ts:8-13` — `JOB_CARD_STATUS_TRANSITIONS` enforces forward-only. COMPLETE is terminal. |
| 3.5 | BOM Accuracy (Snapshot vs Live) | **FAIL** | `job-card.service.ts:524-529` — `completeJobCard()` queries LIVE BOM at completion time. No snapshot at creation. BOM changes between order and completion are silently consumed. |
| 3.6 | Transfer Request Check in READY_TO_SHIP | **FAIL** | `job-card.service.ts:558-590`, `picking-slip.service.ts:519-550` — Only checks job cards + picking slips. Does NOT check transfer request status. CT orders can go READY_TO_SHIP while transfers are in transit. |
| 3.7 | Concurrent Job Card Completion | **PARTIAL** | `job-card.service.ts:491` — Default READ_COMMITTED isolation. Two concurrent completions consuming same component could race. Mitigated by negative stock check but error is opaque. |

### Process 4: Returns & Credit

| # | Safety Net | Verdict | Evidence |
|---|-----------|---------|----------|
| 4.1 | Prevent Returning More Than Delivered | **FAIL** | `return-authorization.service.ts:143-237`, `validation/return-authorizations.ts:37` — Backend only validates `quantityReturned >= 1`. No upper bound against shipped qty. Frontend check is client-side only. |
| 4.2 | Prevent Duplicate Returns (same order line) | **FAIL** | `return-authorization.service.ts:143-237` — No cumulative quantity check across existing RAs. Same line can be returned multiple times. |
| 4.3 | Prevent Negative Stock (Returns) | **PASS** | `inventory.service.ts:644-645` — RESTOCK only adds. SCRAP doesn't change onHand. Negative impossible through returns. |
| 4.4 | Prevent Orphaned Credits (cancel after receipt) | **PARTIAL** | `return-authorization.service.ts:652-681` — Cannot cancel after ITEMS_RECEIVED. But no reversal mechanism for COMPLETED RAs. |
| 4.5 | Status Regression (RA) | **PASS** | `return-authorization.service.ts` — COMPLETED, REJECTED, CANCELLED are terminal. Each transition checks exact current status. |
| 4.6 | Prevent Return Without Valid Order | **PARTIAL** | `validation/return-authorizations.ts:62-64` — Requires orderId or deliveryNoteId. But does NOT check order status. RA can be created against DRAFT/CANCELLED orders via API. |

### Process 5: Inventory Operations

| # | Safety Net | Verdict | Evidence |
|---|-----------|---------|----------|
| 5.1 | Prevent Negative Stock (Adjustments/Transfers) | **PASS** | `inventory.service.ts:644-655` — All four stock fields validated >=0. Transaction rolls back on violation. Applies to all stock operations. |
| 5.2 | Prevent Unapproved Adjustments | **PASS** | `route.ts:382` (create), `route.ts:454` (approve) — ADMIN/MANAGER role required. PENDING status required for approval. |
| 5.3 | Prevent Transfer to Same Warehouse | **PASS** | `transfer-request.service.ts:125-126, 183-184` — Hardcoded JHB→CT. No user input for locations. (But no explicit validation if refactored.) |
| 5.4 | Concurrent Edit Protection (Stock Levels) | **PARTIAL** | `inventory.service.ts:619-666` — Read-then-write pattern inside transaction. Not using Prisma atomic `{increment}`. Last-write-wins under concurrent approval. |
| 5.5 | Status Regression (Adjustments/Transfers/Counts) | **PASS** | All three document types have strict forward-only status maps. Terminal states enforced. |
| 5.6 | Prevent Duplicate Transfers | **PASS** | `transfer-request.service.ts:413, 547` — Status guards prevent re-ship and re-receive. Atomic within transaction. |

### SCORECARD TOTALS

| Verdict | Count | Percentage |
|---------|-------|------------|
| **PASS** | 19 | 53% |
| **PARTIAL** | 8 | 22% |
| **FAIL** | 9 | 25% |
| **Total** | 36 | 100% |

**FAIL items (9):** Overselling (1.1), Payment gate (1.3), PO orphaned docs (2.3), PO concurrent edits (2.6), Manufacturing without materials (3.3), BOM snapshot (3.5), Transfer in READY_TO_SHIP (3.6), Over-return (4.1), Duplicate returns (4.2)

---

## 2. AUTOMATION GAPS

Transitions that should be automatic but currently require manual intervention.

| # | Transition | Process | What Exists | What's Needed | Clicks Today |
|---|-----------|---------|-------------|---------------|--------------|
| A1 | Quote accepted → Sales Order created | P1 | `acceptQuote()` sets ACCEPTED, stops. Staff must manually create order. | `acceptQuote()` should auto-call `createOrderFromQuote()` and return order ID to customer. | 3+ (manual) |
| A2 | SO created → Proforma Invoice generated | P1 | Proforma service exists. Button on order detail (CONFIRMED only). | Auto-generate proforma when order is created or payment is confirmed. | 2 (manual) |
| A3 | Payment confirmed → Fulfillment triggers | P1 | No payment concept exists at all. | After payment recorded, auto-generate and execute fulfillment plan. | N/A (missing) |
| A4 | All PS + JC + TR complete → READY_TO_SHIP | P1, P3 | Checks picking slips + job cards only. | Must also check `allTransfers.every(tr => tr.status === 'RECEIVED')`. | Bug — premature transition |
| A5 | PO sent → `onOrder` incremented | P2 | `onOrder` is NEVER updated when PO transitions to SENT. | `sendToSupplier()` must increment `StockLevel.onOrder` for each PO line. | N/A (missing) |
| A6 | PO cancelled → `onOrder` decremented | P2 | No `onOrder` adjustment on cancellation. | `cancelPurchaseOrder()` must decrement `onOrder` for each line. | N/A (missing) |
| A7 | Fulfillment detects BOM → Job Card auto-created | P3 | Orchestration requires manual plan + execute (3 clicks). | Should auto-trigger after payment confirmation. | 3 (manual) |
| A8 | RA completed → Credit Note auto-generated | P4 | No credit note system exists. | `completeReturnAuthorization()` should auto-generate credit note. | N/A (missing) |
| A9 | Return request → Staff notification | P4 | No notification system. Staff must poll RA list. | Auto-notify ADMIN/MANAGER/SALES on new return request. | N/A (missing) |
| A10 | Cycle count reconciled → Stock updated | P5 | Reconciliation creates PENDING adjustment requiring separate approval. | Should optionally auto-approve (reconcile + apply in one step). | 2-step |
| A11 | Low stock detected → Proactive alert | P5 | Query-based only — staff must visit reorder page. | Scheduled job or event-driven notification for below-reorder-point items. | N/A (missing) |

---

## 3. CRITICAL BLOCKERS

Steps that **completely prevent** a process from being used end-to-end. A user literally cannot complete the workflow.

| # | Blocker | Process | Impact | Detail |
|---|---------|---------|--------|--------|
| B1 | **No payment recording mechanism** | P1 | Cannot enforce prepayment model. Orders fulfilled without payment. | No schema fields, no API, no service, no UI for recording payment. The entire prepayment business model is unenforceable. |
| B2 | **No tax invoice** | P1 | Cannot issue SARS-compliant invoice. Legal compliance gap. | Only proforma exists (explicitly "THIS IS NOT A TAX INVOICE"). No TaxInvoice model, service, PDF, or UI. |
| B3 | **No credit note system** | P4 | Returns have no financial resolution. Stock is adjusted but no financial document is created. | No CreditNote model, service, API, or UI. The "Credit" half of "Returns & Credit" is entirely absent. |
| B4 | **No supplier invoice / three-way match** | P2 | Cannot verify what supplier billed vs what was ordered vs what was received. No accounts payable. | No SupplierInvoice model. No price/quantity variance detection. No payment processing to suppliers. |
| B5 | **`onOrder` never updated by PO** | P2 | Reorder report is blind to outstanding POs. Duplicate POs get created for same shortage. Inventory dashboard shows wrong available stock. | `sendToSupplier()` does not increment `onOrder`. GRV decrements from 0 with `Math.max(0,...)`. Every `onOrder`-based calculation is wrong. |

---

## 4. MISSING FEATURES

Features that don't exist at all yet but are required for the process to work.

| # | Feature | Process | What's Needed |
|---|---------|---------|---------------|
| F1 | Payment Recording & Gate | P1 | Schema fields (paymentReceivedAt, paymentAmount, paymentReference, paymentMethod) on SalesOrder. Service function `recordPayment()`. API endpoint. UI modal on order detail. Fulfillment gate requiring payment. |
| F2 | Tax Invoice | P1 | TaxInvoice model (SARS-compliant). Service, PDF generation (INV-YYYY-NNNNN numbering). Auto-generate on DELIVERED or INVOICED status. Staff + customer UI. |
| F3 | Credit Note | P4 | CreditNote model with lines. Auto-generate on RA completion. PDF generation (CN-YYYY-NNNNN). Staff + customer UI for viewing/downloading. |
| F4 | Supplier Invoice & Three-Way Match | P2 | SupplierInvoice model with lines. Match interface (PO ↔ GRV ↔ Invoice). Discrepancy reporting (qty + price variances). |
| F5 | Supplier Payment Processing | P2 | Payment recording against supplier invoices. Payment method tracking. AP aging report. |
| F6 | Staff-on-Behalf-of-Customer Quotes | P1 | Customer company picker. API accepting `companyId` param with ADMIN/MANAGER/SALES auth. |
| F7 | Quote PDF Generation & Send | P1 | PDF generation on finalize. Email sending to customer. `pdfUrl` field exists but is never populated. |
| F8 | BOM Components Display on Job Card | P3 | API to include BOM data on job card detail. UI section showing components, quantities needed, stock levels, shortfall indicators. |
| F9 | Raw Material Availability Check | P3 | `startJobCard()` must call `checkBomStock()` before allowing start. Warn or block if components insufficient. |
| F10 | BOM Snapshot at Order Time | P3 | Snapshot BOM at job card creation. Consume from snapshot at completion, not live BOM. |
| F11 | Notification System | P1-P4 | Email/push notifications for: quote finalized, quote accepted, payment received, order shipped, delivery confirmed, return submitted, return approved/rejected. |
| F12 | Standalone Transfer UI | P5 | Frontend page/modal for creating non-order-based warehouse transfers (backend API exists). |
| F13 | Reverse Transfer (CT→JHB) | P5 | Remove hardcoded JHB→CT. Allow bidirectional transfers with source≠destination validation. |
| F14 | Photo/Evidence Upload for Returns | P4 | File upload on return request. R2 storage integration. Display on staff RA detail. |
| F15 | Return Tracking Number | P4 | `trackingNumber` field on RA model. Input field on customer portal. |
| F16 | Job Card Cancellation | P3 | No CANCELLED state exists. Need cancel function with reservation release. |
| F17 | PO Edit Page | P2 | No UI to edit PO header fields (delivery location, expected date, notes) on DRAFT POs. PATCH API exists but no edit form. |

---

## 5. PRIORITY FIX ORDER

### P0 — BLOCKS REVENUE (Quote-to-Cash gaps)

| # | Description | Process(es) | Complexity | What Needs to Happen |
|---|-------------|-------------|------------|---------------------|
| P0-1 | **Payment Recording & Fulfillment Gate** | P1 | **L** | Add schema fields to SalesOrder. Create `recordPayment()` service. Add API endpoint. Build UI modal. Gate fulfillment orchestration on payment recorded. Consider AWAITING_PAYMENT status. |
| P0-2 | **Tax Invoice System** | P1 | **L** | Create TaxInvoice model + lines. Service with SARS-compliant fields (VAT number, company reg). PDF generation. Auto-generate on DELIVERED. Staff + customer UI. |
| P0-3 | **Quote Accepted → Auto-Create Sales Order** | P1 | **S** | Inside `acceptQuote()`, auto-call `createOrderFromQuote()`. Return order ID to customer. Eliminate 3+ click manual conversion. |
| P0-4 | **`onOrder` Update on PO Send/Cancel** | P2 | **S** | In `sendToSupplier()`, increment `StockLevel.onOrder` per PO line. In `cancelPurchaseOrder()`, decrement. Fixes reorder report, inventory dashboard, and duplicate PO problem. |
| P0-5 | **Credit Note System** | P4 | **L** | Create CreditNote model + lines (CN-YYYY-NNNNN). Auto-generate on RA completion. PDF generation. Staff + customer UI. Link to RA and original SO. |

### P1 — BLOCKS OPERATIONS (Fulfillment, manufacturing, receiving)

| # | Description | Process(es) | Complexity | What Needs to Happen |
|---|-------------|-------------|------------|---------------------|
| P1-1 | **Transfer Request Check in READY_TO_SHIP Gate** | P1, P3 | **S** | In `completePicking()` and `completeJobCard()`, add check: `allTransfers.every(tr => tr.status === 'RECEIVED')` before setting READY_TO_SHIP. Without this, CT customer orders ship prematurely. |
| P1-2 | **BOM Components Display on Job Card** | P3 | **M** | Modify `getJobCardById()` to include BOM data. Build UI section on job card detail: component table with quantities, stock levels, shortfall indicators. Without this, manufacturing workers are flying blind. |
| P1-3 | **Raw Material Availability Check on Job Start** | P3 | **S** | In `startJobCard()`, call `checkBomStock()`. Show shortfall warning. Optionally block if insufficient. Prevents wasted manufacturing time. |
| P1-4 | **SO Created → Auto-Generate Proforma** | P1 | **S** | Trigger proforma generation inside `createOrderFromQuote()` or after payment confirmation. Eliminate manual step. |
| P1-5 | **Staff-on-Behalf-of-Customer Quotes** | P1 | **M** | Add customer company picker. Modify `getOrCreateDraftQuote()` to accept `companyId`. Auth-gate to ADMIN/MANAGER/SALES. |
| P1-6 | **PO Rejection → DRAFT (not CANCELLED)** | P2 | **S** | Change `rejectPurchaseOrder()` from `status: 'CANCELLED'` to `status: 'DRAFT'`. Fix UI text mismatch. Allow revision and resubmission. |
| P1-7 | **Warehouse Workers Can Create Adjustments** | P5 | **S** | Add WAREHOUSE to allowed roles for `POST /adjustments`. Adjustments still require manager approval (PENDING status). |
| P1-8 | **Order Warehouse Auto-Selection** | P1 | **S** | In `createOrderFromQuote()`, read `company.primaryWarehouse` instead of defaulting to JHB. Prevents CT customer orders from fulfilling incorrectly. |
| P1-9 | **Standalone Transfer UI** | P5 | **M** | Build page/modal for creating non-order-based transfers. Backend API and hooks already exist. |

### P2 — MISSING SAFETY NETS (Data corruption or financial errors)

| # | Description | Process(es) | Complexity | What Needs to Happen |
|---|-------------|-------------|------------|---------------------|
| P2-1 | **Backend Return Quantity Validation** | P4 | **M** | In `createReturnAuthorization()`: fetch order line's `quantityShipped`, sum existing RA quantities for that line, validate `existing + new <= shipped`. Fixes both over-return AND duplicate return bugs. |
| P2-2 | **Return Order Status Validation** | P4 | **S** | In `createReturnAuthorization()`: verify parent order status is DELIVERED (or SHIPPED at minimum). Reject RAs against DRAFT/CONFIRMED/CANCELLED orders. |
| P2-3 | **BOM Snapshot at Job Card Creation** | P3 | **M** | Store BOM snapshot (JSON or related model) on JobCard at creation time. At completion, consume from snapshot instead of live BOM. Prevents silent BOM change consumption. |
| P2-4 | **Negative Stock Prevention (Picking/Manufacturing)** | P1, P3 | **S** | `updateStockLevel()` already validates >= 0, but uses read-then-write. Switch to Prisma atomic `{increment: delta}` for race condition safety. |
| P2-5 | **Overselling Warning on Quote** | P1 | **S** | In `addQuoteItem()`, check stock availability. Show warning (not hard block) when quoted qty exceeds available. |
| P2-6 | **PO Cancel with Existing GRVs** | P2 | **S** | In `cancelPurchaseOrder()`, check for existing GRVs. Either block cancellation or reverse stock movements from partial receipts. |
| P2-7 | **Reservation Cleanup on Order Cancel** | P1 | **M** | `cancelOrder()` releases 'SalesOrder' reservations but not 'PickingSlip' or 'JobCard' reservations created by orchestration. Must release all reference types. Also release BOM component reservations from job cards. |
| P2-8 | **Double Reservation Prevention** | P1 | **M** | Orchestration creates reservations for picking slips IN ADDITION to order-level hard reservations. Review and deduplicate — either release order-level reservations when orchestration runs, or don't create picking-level ones. |
| P2-9 | **Soft Reservation Expiry Job** | P1 | **M** | No background job releases expired soft reservations. `expiresAt` exists but nothing reads it. Need a scheduled cleanup job. |
| P2-10 | **Concurrent Edit Protection (PO)** | P2 | **M** | Add `version` field to PurchaseOrder. Increment on update. Reject if client version mismatches. Alternatively use `updatedAt` as etag. |

### P3 — UX IMPROVEMENTS (Works but confusing or multi-step)

| # | Description | Process(es) | Complexity | What Needs to Happen |
|---|-------------|-------------|------------|---------------------|
| P3-1 | **Order Detail — Too Many Action Buttons** | P1 | **M** | Role-specific action prioritization. Show "next step" guidance instead of all 8+ buttons simultaneously. Highlight the recommended action. |
| P3-2 | **Cycle Count Reconcile + Apply in One Step** | P5 | **S** | Add option to auto-approve adjustment on reconciliation. Single "Reconcile & Apply" button instead of reconcile → navigate → approve. |
| P3-3 | **Missing Confirmation on Adjustment Approval** | P5 | **S** | Add `window.confirm('Apply these stock changes?')` to `handleApprove()`. Consistent with transfer ship/receive confirmations. |
| P3-4 | **Reorder Report PO Generation Confirmation** | P2, P5 | **S** | Show preview modal before creating draft POs: list of POs to create, lines, quantities, estimated costs. Confirm/Cancel. |
| P3-5 | **PO Detail — Role-Based Action Buttons** | P2 | **S** | Hide "Submit for Approval" and "Send to Supplier" from WAREHOUSE users. Hide "Approve" from PURCHASER. API routes enforce roles but UI should match. |
| P3-6 | **Customer Dead End After Quote Accept** | P1 | **S** | After accepting, show link to resulting order (once auto-created per P0-3). Currently customer sees ACCEPTED with no next step. |
| P3-7 | **Reorder Report Cost Price Fallback** | P2 | **S** | When `costPrice` is null, skip item or prompt during PO generation. Currently passes 0 which fails Zod validation (`unitCost > 0`). |
| P3-8 | **Manufacturing Queue View** | P3 | **M** | Dedicated view with: "Assigned to me" filter, priority sorting, component availability status per job card, quick-start from list. |
| P3-9 | **Merge Return Receive + Complete** | P4 | **M** | Single "Receive & Inspect" action combining quantity entry + disposition per line. Reduces 2-step process to 1-step. |
| P3-10 | **PO Edit Form** | P2 | **M** | Build inline editing or separate edit page for DRAFT PO header fields (delivery location, expected date, notes). |

### P4 — NICE TO HAVE (Not blocking but improves efficiency)

| # | Description | Process(es) | Complexity | What Needs to Happen |
|---|-------------|-------------|------------|---------------------|
| P4-1 | **Notification System (All Processes)** | P1-P4 | **L** | Email/push notifications across all processes: quote events, payment, shipping, returns, PO approval. Foundational infrastructure needed first. |
| P4-2 | **Supplier Invoice & Three-Way Match** | P2 | **L** | SupplierInvoice model, match interface, discrepancy reporting. Full AP sub-system. |
| P4-3 | **Supplier Payment Processing** | P2 | **L** | Payment recording against invoices. Payment status tracking. AP aging report. |
| P4-4 | **Quote PDF Generation** | P1 | **M** | Generate PDF on finalize. Populate `pdfUrl` field. Email PDF to customer. |
| P4-5 | **Photo/Evidence Upload for Returns** | P4 | **M** | File upload on return request form. R2 integration. Display on staff review page. |
| P4-6 | **Reverse Transfer (CT→JHB)** | P5 | **M** | Remove hardcoded direction. Allow bidirectional. Add explicit source≠destination validation. |
| P4-7 | **Return Tracking Number** | P4 | **S** | Add `trackingNumber` field to RA model. Input on customer portal after approval. |
| P4-8 | **Scheduled Reorder Alerts** | P5 | **M** | Cron job or event-driven check for below-reorder-point items. Email or dashboard notification. |
| P4-9 | **Job Card Cancellation** | P3 | **M** | Add CANCELLED state. Cancel function with reservation release. Handle partially-completed scenarios. |
| P4-10 | **Manufacturing Lead Time Reporting** | P3 | **M** | Dashboard using `startedAt`/`completedAt` for lead time analysis, bottleneck identification, capacity planning. |
| P4-11 | **Duplicate PO Detection on Reorder** | P2, P5 | **M** | Before generating POs, check for existing open POs covering same supplier/products. Warn or block. |
| P4-12 | **REPLACE Resolution Follow-Through** | P4 | **M** | When RA resolution is REPLACE: auto-create or link replacement delivery note. Track replacement status on RA detail. |
| P4-13 | **Transfer Role Access Restriction** | P5 | **S** | Restrict ship/receive to ADMIN/MANAGER/WAREHOUSE. Currently any authenticated user can trigger these. |
| P4-14 | **Partial Job Card Completion** | P3 | **M** | Allow producing fewer units than planned. Quantity override at completion. Handle remaining as backorder. |

---

## SUMMARY STATISTICS

| Metric | Count |
|--------|-------|
| Safety nets audited | 36 |
| Safety nets PASS | 19 (53%) |
| Safety nets PARTIAL | 8 (22%) |
| Safety nets FAIL | 9 (25%) |
| Automation gaps | 11 |
| Critical blockers | 5 |
| Missing features | 17 |
| P0 items (blocks revenue) | 5 |
| P1 items (blocks operations) | 9 |
| P2 items (safety nets) | 10 |
| P3 items (UX improvements) | 10 |
| P4 items (nice to have) | 14 |
| **Total fix items** | **48** |

### Process Completion Estimates

| Process | Completion | Key Blocker |
|---------|-----------|-------------|
| P1: Quote-to-Cash | ~55% | No payment recording |
| P2: Procure-to-Pay | ~60% | `onOrder` never updated; no supplier invoicing |
| P3: Make-to-Order | ~65% | No BOM visibility for workers |
| P4: Returns & Credit | ~55% | No credit note system |
| P5: Inventory Ops | ~80% | Minor gaps only |

### Recommended Fix Sequence

**Phase 1 — Revenue Unblock (P0 items):**
1. P0-4: `onOrder` on PO send/cancel (S) — quick win, fixes inventory intelligence
2. P0-3: Quote accept → auto-create SO (S) — quick win, eliminates manual conversion
3. P0-1: Payment recording & gate (L) — critical, enables prepayment model
4. P0-2: Tax invoice (L) — legal requirement
5. P0-5: Credit note (L) — completes returns financial loop

**Phase 2 — Operations Unblock (P1 items):**
1. P1-1: Transfer check in READY_TO_SHIP (S) — bug fix
2. P1-6: PO rejection → DRAFT (S) — bug fix
3. P1-7: Warehouse workers create adjustments (S) — role fix
4. P1-8: Order warehouse auto-selection (S) — bug fix
5. P1-3: Raw material check on job start (S) — safety improvement
6. P1-4: Auto-generate proforma (S) — automation
7. P1-2: BOM display on job card (M) — critical for manufacturing
8. P1-5: Staff quotes for customers (M) — sales enablement
9. P1-9: Standalone transfer UI (M) — operations enablement

**Phase 3 — Safety & UX (P2 + P3 items):**
Tackle in order of data integrity risk, then UX friction.

---

*This is a report only. No code changes were made.*
