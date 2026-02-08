# PROCESS 1 AUDIT: Quote-to-Cash (Prepayment Model)

**Date:** 2026-02-08
**Auditor:** Claude Code (comprehensive codebase trace)
**Scope:** End-to-end business process from customer selection through delivery

---

## EXECUTIVE SUMMARY

The Quote-to-Cash process has significant structural gaps. While individual components (picking, job cards, transfers, delivery notes) work well in isolation, the end-to-end flow is broken by:

1. **No payment recording mechanism at all** — the single most critical missing piece
2. **No auto-conversion from quote acceptance to sales order** — manual multi-step process
3. **No auto-generation of proforma invoice** — manual button click required
4. **No fulfillment gating on payment** — orders can be fulfilled without payment
5. **No tax invoice** — only proforma exists, no SARS-compliant legal document
6. **No sales-person-on-behalf-of-customer quote creation** — customer self-service only
7. **Transfer requests not checked in READY_TO_SHIP gate** — premature status transition possible

**Severity Assessment:** This process is approximately 55% complete. The "happy path" works but requires too many manual steps that should be automated, and the critical payment gate is entirely absent.

---

## STEP-BY-STEP AUDIT TABLE

| # | Step | Status | UX | Automation | Safety Nets | Detail |
|---|------|--------|-----|------------|-------------|--------|
| 1 | Sales person selects a CUSTOMER | MISSING | NO_UI | N/A | UNPROTECTED | No UI or API for staff to select a customer company and create a quote on their behalf. `getOrCreateDraftQuote()` uses `authReq.user.companyId` — quotes can only be created for the authenticated user's own company. No "customer picker" exists. |
| 2 | Sales person creates a quote FOR that customer | EXISTS_NOT_CONNECTED | INCOMPLETE | MANUAL | PARTIAL | Quotes CAN be created via QuoteCart/browse. Customer tier IS snapshotted. Warehouse NOT pre-filled (defaults to JHB at finalization). Staff cannot create quotes for other companies. Customer self-service only. |
| 3 | Sales person adds line items with tier pricing | WORKS | CLEAR | AUTO | PROTECTED | `addQuoteItem()` → `calculateCustomerPrice(listPrice, customerTier)` auto-applies tier discounts (END_USER 30%, OEM_RESELLER 40%, DISTRIBUTOR 50%). No manual price override possible. Product dedup handled (same product → qty increment). |
| 4 | Quote finalized and sent to customer | EXISTS_NOT_CONNECTED | INCOMPLETE | MULTI_STEP | PARTIAL | Finalization: DRAFT→CREATED works. Creates soft reservations, sets 30-day validity. BUT: No PDF generation on finalize. No email sending. `pdfUrl` field exists on Quote but never populated. Customer can only see quote by logging in. No "Send to Customer" action. |
| 5 | Customer reviews quote on portal | WORKS | CLEAR | N/A | PROTECTED | Customer quote detail at `/my/quotes/[id]`. Shows items, quantities, unit prices, totals, validity countdown. Accept/Reject buttons visible for CREATED quotes. No internal data shown. |
| 6 | Customer accepts quote | WORKS | CLEAR | ONE_CLICK | PROTECTED | `acceptQuote()`: CREATED→ACCEPTED. Validates not expired (auto-sets to EXPIRED if past validUntil). One-click accept with confirmation dialog. Soft reservations remain active. |
| 7 | Quote→Sales Order conversion | EXISTS_NOT_CONNECTED | CONFUSING | MANUAL | PARTIAL | `acceptQuote()` does NOT auto-create an order. Customer sees "ACCEPTED" status but nothing happens automatically. Staff must: (1) navigate to portal quote detail, (2) click "Create Order" button, (3) fill optional fields in modal, (4) submit. `createOrderFromQuote()` correctly carries all data + converts SOFT→HARD reservations. Quote set to CONVERTED. |
| 8 | Proforma Invoice auto-generation | EXISTS_NOT_CONNECTED | INCOMPLETE | MANUAL | N/A | Proforma invoice model + service + PDF generation exist. But NOT auto-generated when SO is created. Staff must: (1) go to order detail, (2) click "Proforma Invoice" button. Button only shows when status=CONFIRMED. Professional PDF with "THIS IS NOT A TAX INVOICE" disclaimer. |
| 9 | Customer receives proforma for payment | EXISTS_NOT_CONNECTED | INCOMPLETE | MANUAL | N/A | Customer CAN see ACTIVE proformas on `/my/orders/[id]` and download PDF. But NO notification/email sent. Customer must proactively check portal. No payment instructions beyond generic text on PDF. |
| 10 | Staff records payment confirmation | MISSING | NO_UI | N/A | UNPROTECTED | **CRITICAL GAP.** No payment fields on SalesOrder schema (no paymentReceivedAt, paymentAmount, paymentReference, paymentMethod). No API endpoint. No UI. No backend service function. Payment recording is completely absent from the system. |
| 11 | SO status → CONFIRMED (payment received) | MISSING | NO_UI | N/A | UNPROTECTED | The CONFIRMED status (DRAFT→CONFIRMED) means "order confirmed by staff", NOT "payment received". `confirmOrder()` is a simple status toggle with no payment validation. The concept of payment-gated confirmation does not exist. |
| 12 | Fulfillment orchestration triggers | EXISTS_NOT_CONNECTED | CONFUSING | MULTI_STEP | UNPROTECTED | Orchestration engine exists and works (allocation, picking slips, job cards, transfers, POs — all in one transaction). But NOT auto-triggered. Staff must: (1) click "Fulfillment Plan", (2) review plan, (3) click "Execute". **CRITICAL: No payment gate — fulfillment can run on ANY CONFIRMED order.** |
| 12a | Stock check across warehouses | WORKS | CLEAR | AUTO | PROTECTED | `checkProductAvailability()` checks CT first for CT customers, spills to JHB. JHB-only for JHB customers. Reports backorders. Stock levels validated again at execution time (stale plan detection). |
| 12b | Picking slips created per warehouse | WORKS | CLEAR | AUTO | PROTECTED | Created per-warehouse within orchestration transaction. Links to order + order lines. Counter-based numbering (PS-YYYY-NNNNN). |
| 12c | Transfer requests for cross-warehouse | WORKS | CLEAR | AUTO | PROTECTED | JHB→CT transfers created when CT customer needs JHB stock. Also for assembly products finished at JHB destined for CT. |
| 12d | Job cards for manufacturing | WORKS | CLEAR | AUTO | PROTECTED | Created for ASSEMBLY_REQUIRED and MADE_TO_ORDER. BOM exploded. Component shortages generate draft POs. |
| 13 | Warehouse workers complete picking | WORKS | CLEAR | ONE_CLICK | PROTECTED | Picking slip detail page shows lines to pick. Start picking (PENDING→IN_PROGRESS), update line quantities, complete slip. `completePicking()` in single transaction: ISSUE movements, onHand decrease, reservation release, order status propagation. Status guard prevents double completion. |
| 14 | Manufacturing completes (job cards) | WORKS | CLEAR | ONE_CLICK | PROTECTED | `completeJobCard()`: MANUFACTURE_IN for finished product (+onHand), MANUFACTURE_OUT per BOM component (-onHand × quantity). All in transaction. Status guard prevents double completion. Propagates to order. |
| 15 | Transfers complete | WORKS | CLEAR | ONE_CLICK | PROTECTED | `shipTransfer()`: TRANSFER_OUT, source onHand decrease. `receiveTransfer()`: TRANSFER_IN, destination onHand increase (uses receivedQuantity). Status guards on both. |
| 16 | All complete → READY_TO_SHIP | EXISTS_NOT_CONNECTED | N/A | AUTO | PARTIAL | `completePicking()` checks all picking slips + job cards. **BUG: Does NOT check transfer request status.** If CT customer has JHB→CT transfer pending, order can move to READY_TO_SHIP prematurely while goods are still in transit. |
| 17 | Delivery note generated | WORKS | CLEAR | ONE_CLICK | PROTECTED | Button on order detail when READY_TO_SHIP/PARTIALLY_SHIPPED/SHIPPED. Creates DN with order lines. `dispatchDeliveryNote()` propagates to order SHIPPED/PARTIALLY_SHIPPED. |
| 18 | Tax Invoice generated | MISSING | NO_UI | N/A | N/A | **No tax invoice model, service, PDF, or UI exists.** Only proforma invoice exists (which explicitly states "THIS IS NOT A TAX INVOICE"). SARS requires a tax invoice for VAT-registered businesses. This is a legal compliance gap. |
| 19 | Goods dispatched to customer | WORKS | CLEAR | ONE_CLICK | PROTECTED | DN dispatch: DRAFT→DISPATCHED. Order status propagation automatic. Customer can see dispatched DNs on their order detail page. |
| 20 | Order marked DELIVERED | WORKS | CLEAR | AUTO | PROTECTED | DN confirmation (DISPATCHED→DELIVERED) by customer or staff. `confirmDelivery()` records received/damaged quantities. When all DNs delivered → order DELIVERED. Customer can confirm receipt at `/my/delivery-notes/[id]`. |

---

## SAFETY NET AUDIT

| # | Safety Net | Status | Detail | Code Location |
|---|-----------|--------|--------|---------------|
| 1 | PREVENT OVERSELLING | **UNPROTECTED** | `addQuoteItem()` checks product exists, is active, and has a price. Does NOT check stock availability. A sales person (or customer) can quote 10,000 units when only 5 exist in stock. No warning, no soft block, no hard block. Soft reservations at finalization will exceed available stock without error. | `quote.service.ts:140-274` |
| 2 | PREVENT DOUBLE-PICKING | **PROTECTED** | Orchestration creates picking slips in a single transaction. Manual picking slip button only shows when `pickingSlips.length === 0`. However, individual manual picking slip/job card creation buttons remain visible on CONFIRMED/PROCESSING orders even after orchestration runs — staff could theoretically create duplicate documents. | `orchestration.service.ts:1083-1187`, `orders/[id]/page.tsx:122-124` |
| 3 | PREVENT SHIPPING WITHOUT PAYMENT | **UNPROTECTED** | **CRITICAL.** No payment recording exists. `confirmOrder()` moves DRAFT→CONFIRMED with zero payment validation. `generateFulfillmentPlan()` only requires status=CONFIRMED. Fulfillment → picking → delivery can proceed entirely without any payment. The entire prepayment model is not enforced. | `order.service.ts:379-411`, `orchestration.service.ts:391` |
| 4 | PREVENT DUPLICATE STOCK MOVEMENTS | **PROTECTED** | All completion functions check current status before proceeding: `completePicking` requires IN_PROGRESS, `completeJobCard` requires IN_PROGRESS, `shipTransfer` requires PENDING, `receiveTransfer` requires IN_TRANSIT. Status set atomically in transaction. Idempotent — second call returns error. | `picking-slip.service.ts:433`, `job-card.service.ts` status checks |
| 5 | PREVENT PRICE TAMPERING | **PROTECTED** (overly restrictive) | `addQuoteItem()` always computes price via `calculateCustomerPrice(listPrice, tier)`. No API parameter exists to override unit price. Staff cannot give ad-hoc discounts, volume discounts, or promotional pricing. No approval workflow exists because no override exists. This is safe but inflexible — real sales operations need occasional price flexibility. | `quote.service.ts:202-203` |
| 6 | PREVENT MISSING CUSTOMER | **PARTIAL** | Quote requires authenticated user (so companyId always exists). But no "select customer" flow for staff — quotes are only for the authenticated user's company. A CUSTOMER user always has their company. However, a SALES user creating a quote would be creating it for the Nusaf company, not a customer company. | `quote.service.ts:95-134` |
| 7 | PREVENT WRONG WAREHOUSE | **PARTIAL** | Orchestration uses `order.warehouse` for allocation. Company.primaryWarehouse determines CT-first allocation in `checkProductAvailability()`. BUT: `createOrderFromQuote()` defaults warehouse to JHB (`options?.warehouse ?? 'JHB'`). If staff doesn't explicitly set CT, a CT customer's order fulfills from JHB. No auto-selection from company.primaryWarehouse. | `order.service.ts:287`, `orchestration.service.ts:408` |
| 8 | STATUS REGRESSION | **PROTECTED** | `STATUS_TRANSITIONS` map defines valid transitions per status. `isValidTransition()` checked on every status change. CLOSED and CANCELLED are terminal (empty transition arrays). ON_HOLD can return to CONFIRMED/PROCESSING based on prior state. No arbitrary backwards movement possible. | `order.service.ts:17-29` |
| 9 | PREVENT NEGATIVE STOCK | **PARTIAL** | `updateStockLevel()` uses Prisma `increment` which allows negative values. `completePicking()` decrements onHand without checking if result < 0. `completeJobCard()` consumes BOM components without checking stock floor. Only GRV uses `Math.max(0,...)` for onOrder. Stock can theoretically go negative through picking or manufacturing. | `inventory.service.ts` updateStockLevel function |

---

## AUTOMATION GAPS (Required vs Actual)

### Must Be AUTOMATIC (Zero Clicks) — Per Requirements

| Automation | Required | Actual | Gap |
|-----------|----------|--------|-----|
| Quote accepted → SO created | AUTO | **MANUAL (3+ clicks)** | Staff must navigate to quote, click "Create Order", fill modal, submit. No auto-conversion on acceptance. |
| SO created → Proforma Invoice generated | AUTO | **MANUAL (2 clicks)** | Staff must navigate to order, click "Proforma Invoice". Not triggered on SO creation. |
| Payment confirmed → Fulfillment triggers | AUTO | **MISSING ENTIRELY** | No payment concept exists. Fulfillment requires manual plan generation + execution. |
| Picking slip all lines → COMPLETED | AUTO | **WORKS** | `completePicking()` auto-sets COMPLETE when all lines picked. |
| All PS + JC + TR complete → READY_TO_SHIP | AUTO | **PARTIAL (BUG)** | Checks PS + JC but NOT transfer requests. CT orders may go READY_TO_SHIP while transfers are in transit. |
| Job card completed → BOM consumed + FG added | AUTO | **WORKS** | `completeJobCard()` auto-handles stock in transaction. |

### Must Be ONE CLICK — Per Requirements

| Action | Required | Actual | Gap |
|--------|----------|--------|-----|
| Finalize quote → send to customer | ONE_CLICK | **ONE_CLICK (no send)** | Finalize works in one click. But no send mechanism (no email, no notification). |
| Record payment received | ONE_CLICK | **MISSING** | No payment recording mechanism at all. |
| Start picking / complete picking line | ONE_CLICK | **WORKS** | Start picking, update quantity, complete — all one action. |
| Start manufacturing / complete job card | ONE_CLICK | **WORKS** | Status transitions are one-click with confirmation. |
| Generate delivery note | ONE_CLICK | **WORKS** | One click on order detail page. |
| Generate tax invoice | ONE_CLICK | **MISSING** | Tax invoice doesn't exist. |

---

## FRONTEND UX EVALUATION

### Staff Portal — Quote Detail (`/quotes/[id]`)
- **FLOW LOGIC:** CONFUSING — After customer accepts, staff sees ACCEPTED status with "Create Order" button. No guidance that this is the next required step. No alert/notification.
- **FIELD COMPLETENESS:** Items, totals, validity visible. Missing: customer company details, pricing tier display.
- **FIELD ORDER:** Acceptable. Header → Items → Notes → Sidebar.
- **ROLE CLARITY:** INCOMPLETE — Sales person must know to check for ACCEPTED quotes and manually convert. No dashboard alert or task queue.
- **STATUS VISIBILITY:** Quote status badge visible. No process-level "where am I" indicator.
- **NAVIGATION:** Can link to created order. But no automatic redirect after order creation.

### Staff Portal — Order Detail (`/orders/[id]`)
- **FLOW LOGIC:** CONFUSING — Too many action buttons (up to 8 simultaneously). No clear "next step" guidance. A CONFIRMED order shows: Proforma Invoice, Fulfillment Plan, Picking Slips, Job Card, Transfer, and status change buttons. User must know the business process to pick the right action.
- **FIELD COMPLETENESS:** Good — order lines, totals, fulfillment type, warehouse, dates, notes all visible.
- **FIELD ORDER:** Acceptable. Header → Pipeline → Lines → Documents → Sidebar (timeline).
- **ROLE CLARITY:** INCOMPLETE — Warehouse worker, sales person, and manager all see the same page with the same buttons. No role-specific action prioritization.
- **STATUS VISIBILITY:** FulfillmentPipelineSteps shows progress. FulfillmentStatsBar shows picked/shipped counts. Good.
- **NAVIGATION:** Good — picking slips, job cards, transfers, delivery notes all linked. Timeline shows document history.

### Staff Portal — Picking Slip Detail
- **FLOW LOGIC:** CLEAR — Shows lines to pick, quantities, status. Start picking, update quantities, complete.
- **FIELD COMPLETENESS:** Product SKU, description, quantity to pick, quantity picked, bin location.
- **ROLE CLARITY:** CLEAR for warehouse workers.
- **STATUS VISIBILITY:** Pipeline steps (Pending → In Progress → Complete).

### Customer Portal — Quote Detail (`/my/quotes/[id]`)
- **FLOW LOGIC:** CLEAR — DRAFT: edit items. CREATED: accept or reject. ACCEPTED: waiting for order.
- **FIELD COMPLETENESS:** Items, quantities, prices, totals, validity. No internal data.
- **ROLE CLARITY:** CLEAR — Customer understands their options.
- **NAVIGATION:** After accepting, customer has NO link to the resulting order (since it hasn't been created yet). Dead end.

### Customer Portal — Order Detail (`/my/orders/[id]`)
- **FLOW LOGIC:** CLEAR — Shows order status, items, delivery notes, proforma invoices.
- **FIELD COMPLETENESS:** Good — hides internal operational data.
- **ROLE CLARITY:** CLEAR — Customer sees what they need.
- **NAVIGATION:** Links to delivery notes, proforma PDFs. Can confirm receipt.

---

## CRITICAL MISSING PIECES (Priority Order)

### P0 — Business-Breaking Gaps

1. **Payment Recording & Gate** — No payment concept in the entire system. The prepayment model cannot work without:
   - Schema: Add `paymentReceivedAt`, `paymentAmount`, `paymentReference`, `paymentMethod` to SalesOrder
   - Service: `recordPayment()` function
   - API: `POST /orders/:id/record-payment` endpoint
   - UI: "Record Payment" button/modal on order detail
   - Gate: Fulfillment orchestration must require payment recorded before execution
   - Status: Consider adding AWAITING_PAYMENT between DRAFT and CONFIRMED, or repurposing CONFIRMED to mean "payment received"

2. **Quote Accepted → Auto-Create SO** — The acceptance-to-order gap loses deals. When customer accepts:
   - Auto-call `createOrderFromQuote()` inside `acceptQuote()`
   - Auto-set order to DRAFT (or directly to AWAITING_PAYMENT)
   - Return order ID to customer so they can track it immediately

3. **Tax Invoice** — Legal requirement for South African VAT-registered businesses. Need:
   - TaxInvoice model (similar to ProformaInvoice but SARS-compliant)
   - VAT number, company registration on invoice
   - Proper numbering (INV-YYYY-NNNNN)
   - PDF generation
   - Should auto-generate when order status reaches DELIVERED or INVOICED

### P1 — Operational Gaps

4. **SO Created → Auto-Generate Proforma** — Should trigger automatically when order is created, not require manual staff action.

5. **Staff-on-Behalf-of-Customer Quotes** — Sales team cannot create quotes for customers. Need customer company picker in quote creation flow.

6. **Transfer Request Check in READY_TO_SHIP Gate** — `completePicking()` at `picking-slip.service.ts:519-551` only checks picking slips and job cards. Must also check `allTransfers.every(tr => tr.status === 'RECEIVED')` before setting READY_TO_SHIP.

7. **Payment Confirmed → Auto-Trigger Fulfillment** — After payment recorded, auto-generate and execute fulfillment plan (or at minimum auto-generate plan and present for one-click execution).

8. **Order Warehouse Auto-Selection** — `createOrderFromQuote()` defaults warehouse to JHB. Should auto-select from `company.primaryWarehouse`.

### P2 — Quality Gaps

9. **Quote PDF Generation** — `pdfUrl` field exists but is never populated. No PDF generated on finalization.

10. **Overselling Warning** — `addQuoteItem()` should check stock availability and warn (not block) when quoted quantity exceeds available.

11. **Negative Stock Prevention** — `updateStockLevel()` should enforce `onHand >= 0` floor or at minimum log a warning.

12. **Notification System** — No email/push notifications anywhere:
    - Quote finalized → notify customer
    - Quote accepted → notify sales team
    - Payment received → notify warehouse
    - Order shipped → notify customer
    - Delivery confirmed → notify sales

13. **Staff Quote Creation for Customers** — Need API that accepts a `companyId` parameter (with ADMIN/MANAGER/SALES authorization) to create quotes on behalf of customer companies.

---

## ROLE-BASED EXPERIENCE EVALUATION

### Sales Person Experience
- **Pain Points:** Cannot create quotes for customers. Must wait for customer to self-serve. No notification when quote is accepted. Must manually convert to order. Must manually generate proforma. No payment tracking.
- **Missing Tools:** Customer picker, quote PDF send, payment recording, order dashboard with "needs action" alerts.
- **Rating:** 3/10 — Can browse products and see orders, but core sales workflow is broken.

### Warehouse Worker Experience
- **Pain Points:** No dedicated picking queue view (must navigate to picking slips page). No barcode/scan interface.
- **Working Well:** Picking slip detail is clear. Line-by-line picking works. Completion triggers stock correctly.
- **Rating:** 6/10 — Core picking works but finding work and optimizing routes isn't supported.

### Manufacturing Worker Experience
- **Pain Points:** No dedicated job queue. Must navigate to job cards page.
- **Working Well:** Job card detail shows product, quantity, notes. Completion triggers BOM consumption correctly.
- **Rating:** 6/10 — Functional but not optimized for shop floor.

### Manager Experience
- **Pain Points:** No payment overview. No aging report. No "orders awaiting payment" dashboard. Fulfillment dashboard exists but doesn't show payment status.
- **Working Well:** Can see all orders, picking slips, job cards, transfers. Timeline on orders is informative.
- **Rating:** 5/10 — Visibility exists but no payment/financial controls.

### Customer Experience
- **Pain Points:** After accepting a quote, sees ACCEPTED status but no order is created (dead end). Must wait for staff to convert. No notification when order is created. No notification when shipped.
- **Working Well:** Product browsing, quote creation, quote acceptance, order tracking (once order exists), delivery confirmation, proforma download.
- **Rating:** 5/10 — Self-service works but handoff to staff is invisible and confusing.

---

## DATA INTEGRITY RISKS

1. **Soft reservations not auto-released on expiry** — No background job to release expired soft reservations. `expiresAt` field exists but nothing reads it periodically.

2. **Quote→Order→Reservation conversion gap** — `createOrderFromQuote()` releases soft reservations and creates hard reservations in separate database operations (not in the same transaction). Failure between these steps could orphan reservations.

3. **Orchestration creates reservations for picking slips** (in addition to the order-level hard reservations). This creates DOUBLE reservations — one from `createOrderFromQuote()` for the SalesOrder, and another from `executeFulfillmentPlan()` for each PickingSlip. The hard reserved count may be inflated.

4. **No cascade cleanup** — If an order is cancelled after fulfillment plan execution, `cancelOrder()` releases reservations by reference type 'SalesOrder', but the orchestration created reservations with reference type 'PickingSlip' and 'JobCard'. Those orphaned reservations would inflate hardReserved counts permanently.

---

## FILES EXAMINED

### Backend Services
- `backend/src/services/quote.service.ts` — Quote CRUD, finalize, accept, reject
- `backend/src/services/order.service.ts` — Order CRUD, confirm, hold, cancel, status transitions
- `backend/src/services/orchestration.service.ts` — Fulfillment plan generation and execution
- `backend/src/services/picking-slip.service.ts` — Picking slip lifecycle, completePicking with stock
- `backend/src/services/job-card.service.ts` — Job card lifecycle, completeJobCard with BOM
- `backend/src/services/transfer-request.service.ts` — Transfer ship/receive with stock
- `backend/src/services/delivery-note.service.ts` — DN create, dispatch, confirm delivery
- `backend/src/services/proforma-invoice.service.ts` — Proforma generation
- `backend/src/services/pricing.service.ts` — Tier-based pricing calculation
- `backend/src/services/inventory.service.ts` — Stock levels, movements, reservations
- `backend/src/services/allocation.service.ts` — Multi-warehouse stock allocation

### Backend API Routes
- `backend/src/api/v1/quotes/route.ts`
- `backend/src/api/v1/orders/route.ts`
- `backend/src/api/v1/picking-slips/route.ts`
- `backend/src/api/v1/delivery-notes/route.ts`
- `backend/src/api/v1/proforma-invoices/route.ts`

### Frontend Pages
- `frontend/src/app/(portal)/quotes/[id]/page.tsx` — Staff quote detail
- `frontend/src/app/(portal)/orders/[id]/page.tsx` — Staff order detail
- `frontend/src/app/(customer)/my/quotes/[id]/page.tsx` — Customer quote detail
- `frontend/src/app/(customer)/my/orders/[id]/page.tsx` — Customer order detail

### Schema
- `backend/prisma/schema.prisma` — Full data model review

---

*This audit is a report only. No code changes were made.*
