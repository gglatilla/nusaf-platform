# NUSAF ERP — COMPLETE EXECUTION PLAN

## How to Use This Document

**Each task below is a standalone Claude Code prompt.** Paste one task, let it complete, verify the output, then close the chat and start a new one for the next task.

**Rules:**
1. One task per session — never combine tasks
2. After each task completes, verify it worked before moving on
3. If a task fails or is incomplete, re-paste the same prompt in a fresh session
4. Tasks within a phase are ordered — do them in sequence
5. Each task reads the progress tracker and updates it when done
6. Each task ends with SAVE (git commit)

**Progress is tracked in:** `.claude/plans/execution-progress.md`

---

## TASK 0: SETUP PROGRESS TRACKER

Paste this first to create the tracking file:

```
Create the file `.claude/plans/execution-progress.md` with this content:

# NUSAF ERP Execution Progress

## Phase 1A — Quick Wins
- [ ] T1: onOrder update on PO send/cancel
- [ ] T2: Quote accept → auto-create Sales Order
- [ ] T3: Transfer request check in READY_TO_SHIP gate
- [ ] T4: PO rejection → DRAFT (not CANCELLED)
- [ ] T5: Warehouse workers can create adjustments
- [ ] T6: Order warehouse auto-selection from company

## Phase 1B — Revenue Foundation
- [ ] T7: Payment recording schema + service + API
- [ ] T8: Payment recording UI + fulfillment gate
- [ ] T9: Tax invoice schema + service + PDF generation
- [ ] T10: Tax invoice API + staff UI
- [ ] T11: Tax invoice customer portal + order lifecycle completion

## Phase 2A — Manufacturing
- [ ] T12: BOM components display on job card (API)
- [ ] T13: BOM components display on job card (UI)
- [ ] T14: Raw material availability check on job start
- [ ] T15: BOM snapshot at job card creation + consume from snapshot

## Phase 2B — Data Integrity
- [ ] T16: Atomic increments in updateStockLevel
- [ ] T17: Reservation cleanup on order cancel (all reference types)
- [ ] T18: Double reservation deduplication
- [ ] T19: Soft reservation expiry background job

## Phase 2C — Remaining Operations
- [ ] T20: Auto-generate proforma on order creation
- [ ] T21: Staff-on-behalf-of-customer quotes (API)
- [ ] T22: Staff-on-behalf-of-customer quotes (UI)
- [ ] T23: Standalone transfer UI
- [ ] T24: Credit note schema + service + PDF
- [ ] T25: Credit note API + UI + auto-generate on RA completion

## Phase 3A — Safety Nets
- [ ] T26: Backend return quantity validation (cumulative check)
- [ ] T27: Return order status validation (DELIVERED only)
- [ ] T28: Overselling warning on quote line items
- [ ] T29: PO cancel with existing GRVs (block or reverse)
- [ ] T30: Concurrent edit protection (version field on PO)

## Phase 3B — UX Improvements
- [ ] T31: Order detail role-based action buttons
- [ ] T32: Cycle count reconcile + apply in one step
- [ ] T33: Confirmation dialog on adjustment approval
- [ ] T34: Reorder report PO generation confirmation modal
- [ ] T35: PO detail role-based action buttons
- [ ] T36: Customer link to order after quote acceptance
- [ ] T37: Reorder report cost price fallback
- [ ] T38: Job card reservation release on completion

## Notes
- Started: [date]
- Last updated: [date]
- Current phase: Not started

Then SAVE.
```

---

## PHASE 1A — QUICK WINS (6 tasks, all Small)

---

### TASK T1: onOrder Update on PO Send/Cancel

```
Read `.claude/plans/execution-progress.md` for context.
Read `.claude/plans/audit-process2.md` for the detailed finding.

TASK: Fix `onOrder` stock level updates when Purchase Orders are sent or cancelled.

THE PROBLEM:
- `sendToSupplier()` in `purchase-order.service.ts` does NOT increment `StockLevel.onOrder` when a PO is sent
- `cancelPurchaseOrder()` does NOT decrement `StockLevel.onOrder` when a PO is cancelled
- GRV receiving already decrements `onOrder` (with `Math.max(0,...)`), but since it was never incremented, the reorder report and inventory dashboard are blind to incoming goods
- This causes duplicate PO generation for the same shortage

THE FIX:
1. In `sendToSupplier()`, after setting status to SENT, loop through all PO lines and call `updateStockLevel()` to increment `onOrder` by each line's `quantityOrdered` at the PO's delivery location (warehouse). Do this inside the existing transaction.

2. In `cancelPurchaseOrder()`, before setting status to CANCELLED, check if PO status is SENT or ACKNOWLEDGED (meaning onOrder was already incremented). If so, loop through all PO lines and decrement `onOrder` by `quantityOrdered - quantityReceived` (only the unreceived portion). Use `Math.max(0, ...)` to prevent negative onOrder. Do this inside a transaction.

3. Write a migration script or seed adjustment to fix existing data: for all POs in SENT or ACKNOWLEDGED status, calculate and set the correct onOrder values. Save this as a standalone script in `backend/src/scripts/fix-onorder.ts` (don't run it, just create it).

IMPORTANT:
- Do NOT change how GRV handles onOrder — that already works correctly
- The delivery location for the PO is typically the warehouse field on the PO or defaults to JHB
- Each PO line has a `productId` and `quantityOrdered`
- Wrap everything in transactions to maintain atomicity

After completing:
1. Verify by reading back the modified functions
2. Update `.claude/plans/execution-progress.md` — mark T1 as [x] and add today's date
3. SAVE
```

---

### TASK T2: Quote Accept → Auto-Create Sales Order

```
Read `.claude/plans/execution-progress.md` for context.
Read `.claude/plans/audit-process1.md` for the detailed finding.

TASK: Auto-create a Sales Order when a customer accepts a quote.

THE PROBLEM:
- `acceptQuote()` in `quote.service.ts` sets status to ACCEPTED and stops
- Staff must manually navigate to quote detail, click "Create Order", fill a modal, and submit
- Customer sees ACCEPTED status but nothing happens — dead end on portal
- This is 3+ manual clicks that should be zero

THE FIX:
1. In `acceptQuote()`, after setting status to ACCEPTED, auto-call `createOrderFromQuote()` with the quote ID. Pass sensible defaults (no special notes, use existing warehouse from quote/company).

2. Store the created order ID on the quote (the `convertedOrderId` field may already exist — check schema). Set quote status to CONVERTED (this may already happen inside `createOrderFromQuote()` — verify and don't double-set).

3. Return the created order ID in the `acceptQuote()` response so the customer portal can redirect to it.

4. Update the customer portal quote acceptance handler (in the customer quote detail page) to redirect to `/my/orders/[orderId]` after successful acceptance, instead of staying on the quote page.

5. On the staff portal, update the quote detail page: if quote is ACCEPTED/CONVERTED, show a link to the created order. Remove or disable the "Create Order" button if an order already exists.

IMPORTANT:
- `createOrderFromQuote()` already handles: copying line items, releasing soft reservations, creating hard reservations, setting quote to CONVERTED
- Make sure the auto-creation happens inside the same transaction or error handling as the acceptance — if order creation fails, the quote acceptance should also fail (or at minimum, log the error and leave quote as ACCEPTED for manual retry)
- Do NOT remove the manual "Create Order" button entirely — keep it as a fallback for edge cases where auto-creation failed, but hide it when an order already exists

After completing:
1. Verify the flow: acceptQuote → createOrderFromQuote → return orderId
2. Update `.claude/plans/execution-progress.md` — mark T2 as [x] and add today's date
3. SAVE
```

---

### TASK T3: Transfer Request Check in READY_TO_SHIP Gate

```
Read `.claude/plans/execution-progress.md` for context.
Read `.claude/plans/audit-process1.md` and `.claude/plans/audit-process3.md` for the detailed finding.

TASK: Fix the READY_TO_SHIP status gate to include transfer request completion.

THE BUG:
- `completePicking()` in `picking-slip.service.ts` checks if all picking slips + all job cards are complete before setting order to READY_TO_SHIP
- `completeJobCard()` in `job-card.service.ts` does the same check
- NEITHER checks transfer request status
- For CT customers with JHB→CT transfers, the order can go READY_TO_SHIP while goods are still in transit from JHB to CT

THE FIX:
1. Find the READY_TO_SHIP gate logic in BOTH `completePicking()` and `completeJobCard()`. It will look something like:
   - Query all picking slips for the order → check all COMPLETE
   - Query all job cards for the order → check all COMPLETE
   - If both true → set order to READY_TO_SHIP

2. Add a third check: Query all transfer requests for the order → check all have status RECEIVED (or CANCELLED). Only set READY_TO_SHIP if ALL THREE conditions are met (picking slips complete AND job cards complete AND transfers received).

3. Also update the `receiveTransfer()` function in `transfer-request.service.ts` to trigger the same READY_TO_SHIP check when a transfer is received. After receiving, check if this was the last pending transfer for the order, and if all picking slips + job cards are also complete → set order READY_TO_SHIP.

IMPORTANT:
- Not all orders have transfers — only CT customer orders with cross-warehouse fulfillment. If an order has zero transfers, the check should pass (no transfers to wait for).
- Use the same query pattern already used for picking slips and job cards
- The order link is through `transferRequest.orderId`
- Transfer statuses to consider "done": RECEIVED and CANCELLED

After completing:
1. Verify all three locations check transfers: completePicking, completeJobCard, receiveTransfer
2. Update `.claude/plans/execution-progress.md` — mark T3 as [x] and add today's date
3. SAVE
```

---

### TASK T4: PO Rejection → DRAFT (not CANCELLED)

```
Read `.claude/plans/execution-progress.md` for context.
Read `.claude/plans/audit-process2.md` for the detailed finding.

TASK: Fix PO rejection to return to DRAFT status instead of CANCELLED.

THE BUG:
- `rejectPurchaseOrder()` in `purchase-order.service.ts` sets status to CANCELLED
- The frontend rejection modal says "The PO will return to DRAFT status for revision" — this is a lie
- Rejected POs are dead and cannot be revised, forcing purchasers to recreate from scratch
- The `PO_STATUS_TRANSITIONS` map may need updating to allow PENDING_APPROVAL → DRAFT

THE FIX:
1. In the `PO_STATUS_TRANSITIONS` map, add DRAFT as a valid transition from PENDING_APPROVAL (if not already present). Keep CANCELLED as well — both should be valid from PENDING_APPROVAL.

2. In `rejectPurchaseOrder()`, change the status from CANCELLED to DRAFT. Keep the rejection reason and rejectedBy/rejectedAt fields — they should still be recorded even though the PO goes back to DRAFT.

3. Verify the frontend PO detail page handles a DRAFT PO with a rejection reason. There should be a banner or indicator showing "This PO was rejected: [reason]. Please revise and resubmit." Check if this already exists (the audit mentions a `po.status === 'DRAFT' && po.rejectionReason` check that was previously unreachable — it should now work).

4. Verify that a DRAFT PO with a rejection reason can be edited and resubmitted for approval (the normal DRAFT → PENDING_APPROVAL flow should still work).

IMPORTANT:
- Do NOT change the ability to cancel POs — CANCELLED should still be reachable from other statuses
- The rejection reason should persist on the DRAFT PO so the purchaser knows what to fix
- This is a one-line status change + possibly one line in the transitions map

After completing:
1. Verify the transitions: PENDING_APPROVAL → DRAFT (reject) and PENDING_APPROVAL → CANCELLED (cancel) both work
2. Update `.claude/plans/execution-progress.md` — mark T4 as [x] and add today's date
3. SAVE
```

---

### TASK T5: Warehouse Workers Can Create Adjustments

```
Read `.claude/plans/execution-progress.md` for context.
Read `.claude/plans/audit-process5.md` for the detailed finding.

TASK: Allow WAREHOUSE role to create stock adjustments.

THE PROBLEM:
- `POST /adjustments` requires ADMIN or MANAGER role
- Warehouse workers — the people who discover discrepancies — cannot create adjustments
- They must verbally tell a manager, who then creates the adjustment
- The approval step (ADMIN/MANAGER only) already protects against unauthorized stock changes

THE FIX:
1. Find the route handler for `POST /adjustments` in the inventory API routes (likely `backend/src/api/v1/inventory/route.ts`).

2. Add WAREHOUSE to the allowed roles for creating adjustments. Change from `requireRole('ADMIN', 'MANAGER')` to `requireRole('ADMIN', 'MANAGER', 'WAREHOUSE')`.

3. Do NOT change the approval route — `POST /adjustments/:id/approve` should remain ADMIN/MANAGER only. Workers can create, managers approve.

4. Verify that the frontend adjustment creation page (`/inventory/adjustments/new`) is accessible to WAREHOUSE users. Check if there's a role-based route guard or navigation filter that hides this page from WAREHOUSE users — if so, update it.

5. Verify that the sidebar/navigation shows the adjustment creation link for WAREHOUSE users.

IMPORTANT:
- Only change the CREATE permission, not APPROVE
- Adjustments created by WAREHOUSE users will be PENDING status (same as any other adjustment)
- The approval workflow remains unchanged — ADMIN/MANAGER must approve before stock changes
- This should be a very small change — likely just adding one role string to one or two places

After completing:
1. Verify: WAREHOUSE can create (POST), but cannot approve (POST approve)
2. Update `.claude/plans/execution-progress.md` — mark T5 as [x] and add today's date
3. SAVE
```

---

### TASK T6: Order Warehouse Auto-Selection from Company

```
Read `.claude/plans/execution-progress.md` for context.
Read `.claude/plans/audit-process1.md` for the detailed finding.

TASK: Auto-select the correct warehouse when creating an order from a quote.

THE BUG:
- `createOrderFromQuote()` in `order.service.ts` defaults warehouse to JHB: `options?.warehouse ?? 'JHB'`
- It does NOT read the customer company's `primaryWarehouse` field
- CT-based customers get their orders fulfilled from JHB by default, requiring unnecessary transfers
- Staff must manually override the warehouse in the creation modal (which is being removed by T2's auto-creation)

THE FIX:
1. In `createOrderFromQuote()`, before defaulting to JHB, look up the company associated with the quote and read its `primaryWarehouse` field.

2. The priority should be: `options?.warehouse` (explicit override) → `company.primaryWarehouse` (company default) → `'JHB'` (system fallback).

3. The quote already has a `companyId` — use it to fetch the company's `primaryWarehouse`. This may require adding an include/select on the quote query or a separate company lookup.

4. Since T2 auto-creates the order (no manual modal), this becomes even more important — there's no opportunity for staff to manually set the warehouse.

IMPORTANT:
- Check the Company model for the primaryWarehouse field — verify it exists and what values it can have (likely 'JHB' or 'CT')
- If Company doesn't have a primaryWarehouse field, check for a related warehouse field or a default warehouse concept
- The quote may already carry a warehouse field — check the Quote model too
- Keep the JHB fallback as the final default for safety

After completing:
1. Verify the warehouse resolution order: explicit → company → JHB
2. Update `.claude/plans/execution-progress.md` — mark T6 as [x] and add today's date
3. SAVE
```

---

## PHASE 1B — REVENUE FOUNDATION (5 tasks, Large)

---

### TASK T7: Payment Recording — Schema + Service + API

```
Read `.claude/plans/execution-progress.md` for context.
Read `.claude/plans/audit-process1.md` and `.claude/plans/audit-summary.md` for the detailed finding.

TASK: Build the payment recording backend — schema, service, and API (no UI yet).

THE PROBLEM:
- No payment concept exists in the system
- The prepayment business model requires: quote → order → proforma → PAYMENT → fulfillment
- Without payment recording, fulfillment can proceed on any CONFIRMED order with no financial verification

SCHEMA CHANGES:
1. Add a new `Payment` model to the Prisma schema:
   - `id` (String, cuid)
   - `paymentNumber` (String, unique) — format: PAY-YYYY-NNNNN
   - `orderId` (String, relation to SalesOrder)
   - `companyId` (String, relation to Company)
   - `amount` (Decimal)
   - `currency` (String, default 'ZAR')
   - `paymentMethod` (enum: EFT, CREDIT_CARD, CASH, CHEQUE, OTHER)
   - `paymentReference` (String — bank reference, transaction ID, etc.)
   - `paymentDate` (DateTime)
   - `receivedAt` (DateTime, default now)
   - `receivedBy` (String, relation to User)
   - `receivedByName` (String)
   - `notes` (String, optional)
   - `status` (enum: PENDING, CONFIRMED, VOIDED)
   - Standard timestamps (createdAt, updatedAt)

2. Add `PaymentCounter` model for atomic number generation (same pattern as other counters).

3. Add a `payments` relation on SalesOrder (one-to-many).

4. Add a `paymentStatus` field on SalesOrder (enum: UNPAID, PARTIALLY_PAID, PAID). Default UNPAID.

SERVICE:
5. Create `backend/src/services/payment.service.ts` with:
   - `recordPayment(orderId, data, userId)` — creates Payment record, updates order paymentStatus based on total payments vs order total, generates payment number atomically
   - `getPaymentsByOrder(orderId)` — list payments for an order
   - `getPaymentById(id)` — single payment detail
   - `voidPayment(id, userId)` — sets payment to VOIDED, recalculates order paymentStatus
   - `calculatePaymentStatus(orderId)` — compares sum of CONFIRMED payments against order total, returns UNPAID/PARTIALLY_PAID/PAID

API:
6. Create API routes:
   - `POST /orders/:id/payments` — record payment (ADMIN, MANAGER, SALES roles)
   - `GET /orders/:id/payments` — list payments for order
   - `GET /payments/:id` — payment detail
   - `POST /payments/:id/void` — void a payment (ADMIN, MANAGER only)

7. Add Zod validation schemas for payment creation and void.

FULFILLMENT GATE:
8. In the orchestration service, modify `generateFulfillmentPlan()` to check `order.paymentStatus === 'PAID'` before allowing plan generation. Return a clear error if not paid: "Cannot generate fulfillment plan — payment not received."

9. Run `npx prisma db push` or create a migration to apply schema changes.

IMPORTANT:
- Use the same patterns as existing services (counter for numbering, transactions for atomicity, role checks on routes)
- The payment gate on fulfillment is the CRITICAL safety net — this is the whole point
- paymentStatus on SalesOrder is a computed/cached field — recalculate whenever a payment is added or voided
- Do NOT build UI in this task — that's T8

After completing:
1. Verify: schema changes applied, service created, API routes work, fulfillment gate blocks unpaid orders
2. Update `.claude/plans/execution-progress.md` — mark T7 as [x] and add today's date
3. SAVE
```

---

### TASK T8: Payment Recording — UI + Fulfillment Gate UX

```
Read `.claude/plans/execution-progress.md` for context.
Read the Payment service created in T7.

TASK: Build the payment recording UI on the order detail page.

WHAT TO BUILD:

1. **Payments section on staff order detail page** (`/orders/[id]`):
   - New section below the existing order lines section: "Payments"
   - Shows table of payments: payment number, date, amount, method, reference, status badge, received by
   - Shows payment summary: order total, total paid, balance remaining
   - "Record Payment" button (visible to ADMIN/MANAGER/SALES when paymentStatus !== PAID)

2. **Record Payment modal**:
   - Fields: amount (pre-filled with balance remaining), payment method (dropdown), payment reference (text), payment date (date picker, default today), notes (optional textarea)
   - Validation: amount > 0, amount <= balance remaining, payment reference required, method required
   - On submit: calls `POST /orders/:id/payments`
   - On success: refresh order data, close modal, show success toast

3. **Payment status badge on order detail**:
   - Show paymentStatus (UNPAID/PARTIALLY_PAID/PAID) as a colored badge near the order status
   - UNPAID: red, PARTIALLY_PAID: amber, PAID: green

4. **Fulfillment plan button gating**:
   - The "Fulfillment Plan" button on order detail should be disabled when paymentStatus !== PAID
   - Show tooltip: "Payment must be received before fulfillment can begin"
   - The API already blocks it (from T7) — this is the UX layer

5. **Payment info on customer portal order detail** (`/my/orders/[id]`):
   - Show payment status badge (UNPAID/PARTIALLY_PAID/PAID)
   - Show "Payment received" confirmation when PAID
   - Do NOT show individual payment details, references, or internal notes to customers (Golden Rule 4)

6. Create React Query hooks in `frontend/src/hooks/usePayments.ts`:
   - `useOrderPayments(orderId)` — fetch payments for order
   - `useRecordPayment()` — mutation to record payment
   - `useVoidPayment()` — mutation to void payment

IMPORTANT:
- Follow existing UI patterns (modals, tables, badges, toasts)
- The payment section should be visible on all order statuses but the "Record Payment" button only when there's a balance
- Void payment button should be on individual payment rows (ADMIN/MANAGER only, with confirmation)
- Do NOT show cost prices, supplier info, or internal financial data to customers

After completing:
1. Verify: payment modal works, payments display, fulfillment button disabled when unpaid, customer portal shows status
2. Update `.claude/plans/execution-progress.md` — mark T8 as [x] and add today's date
3. SAVE
```

---

### TASK T9: Tax Invoice — Schema + Service + PDF Generation

```
Read `.claude/plans/execution-progress.md` for context.
Read `.claude/plans/audit-process1.md` and `.claude/plans/audit-summary.md` for the detailed finding.
Read the ProformaInvoice service for patterns to follow (similar structure).

TASK: Build the tax invoice backend — schema, service, and PDF generation.

THE PROBLEM:
- Only proforma invoices exist (explicitly labeled "THIS IS NOT A TAX INVOICE")
- No SARS-compliant tax invoice can be generated
- Orders get stuck at DELIVERED — cannot transition to INVOICED or CLOSED
- This is a legal compliance requirement for VAT-registered South African businesses

SCHEMA:
1. Add `TaxInvoice` model:
   - `id` (String, cuid)
   - `invoiceNumber` (String, unique) — format: INV-YYYY-NNNNN
   - `orderId` (String, relation to SalesOrder)
   - `companyId` (String, relation to Company)
   - `status` (enum: DRAFT, ISSUED, VOIDED)
   - `issueDate` (DateTime)
   - `dueDate` (DateTime, optional)
   - `subtotal` (Decimal)
   - `vatRate` (Decimal, default 0.15 for SA 15% VAT)
   - `vatAmount` (Decimal)
   - `total` (Decimal)
   - `pdfUrl` (String, optional)
   - `notes` (String, optional)
   - `issuedBy` (String)
   - `issuedByName` (String)
   - `voidedAt` (DateTime, optional)
   - `voidedBy` (String, optional)
   - `voidReason` (String, optional)
   - Standard timestamps

2. Add `TaxInvoiceLine` model:
   - `id`, `taxInvoiceId` (relation)
   - `orderLineId` (relation to SalesOrderLine)
   - `productId`, `sku`, `description`
   - `quantity`, `unitPrice`, `lineTotal`
   - `sortOrder`

3. Add `TaxInvoiceCounter` model.

4. Add `taxInvoices` relation on SalesOrder.

SERVICE:
5. Create `backend/src/services/tax-invoice.service.ts`:
   - `createTaxInvoice(orderId, userId)` — creates tax invoice from order lines, calculates VAT at 15%, generates PDF, sets ISSUED status
   - `getTaxInvoiceById(id)` — with lines
   - `getTaxInvoicesByOrder(orderId)`
   - `getTaxInvoicesByCompany(companyId)` — for customer portal
   - `voidTaxInvoice(id, reason, userId)` — sets VOIDED
   - `generateTaxInvoicePDF(taxInvoice)` — SARS-compliant PDF with:
     * Company name, registration number, VAT number
     * Customer company name, registration number, VAT number
     * Invoice number, issue date
     * Line items with quantities, unit prices, line totals
     * Subtotal, VAT amount (15%), Total
     * Payment terms, bank details
     * "TAX INVOICE" clearly labeled (contrast with proforma's disclaimer)
     * Order number reference
     * Delivery note number(s) reference

6. Add auto-generation trigger: when order status moves to DELIVERED, auto-create and issue tax invoice. Hook this into the delivery note confirmation flow or the order status propagation.

7. Run migration.

IMPORTANT:
- Follow the same PDF generation pattern as ProformaInvoice
- VAT rate is 15% in South Africa — store as a field for future flexibility
- The tax invoice is the LEGAL document — it must be accurate and complete
- Auto-generate on DELIVERED, not before (goods must be delivered before invoicing)
- One tax invoice per order (unless voided and reissued)
- Do NOT build UI in this task — that's T10

After completing:
1. Verify: schema applied, service works, PDF generates correctly, auto-triggers on DELIVERED
2. Update `.claude/plans/execution-progress.md` — mark T9 as [x] and add today's date
3. SAVE
```

---

### TASK T10: Tax Invoice — API + Staff UI

```
Read `.claude/plans/execution-progress.md` for context.
Read the TaxInvoice service created in T9.

TASK: Build tax invoice API routes and staff-facing UI.

API ROUTES:
1. Create routes (can be in existing order routes or new tax-invoices route file):
   - `GET /orders/:id/tax-invoices` — list tax invoices for order
   - `GET /tax-invoices/:id` — tax invoice detail
   - `GET /tax-invoices/:id/pdf` — download PDF
   - `POST /orders/:id/tax-invoices` — manually create tax invoice (ADMIN/MANAGER — fallback if auto-generation failed)
   - `POST /tax-invoices/:id/void` — void tax invoice (ADMIN only, requires reason)
   - `GET /tax-invoices` — list all tax invoices (with company, date range, status filters)

2. Add Zod validation schemas.

STAFF UI:
3. **Tax invoice section on order detail** (`/orders/[id]`):
   - New section: "Tax Invoices"
   - Table: invoice number (link), issue date, total, status badge, PDF download button
   - "Generate Tax Invoice" button (ADMIN/MANAGER, visible when no active invoice exists and order is DELIVERED+)
   - Show void button on ISSUED invoices (ADMIN only, with reason modal)

4. **Tax invoice list page** (`/tax-invoices`):
   - Table: invoice number, order number (link), customer company, issue date, total, status
   - Filters: status, date range, customer
   - Search by invoice number or order number

5. **Tax invoice detail page** (`/tax-invoices/[id]`):
   - Header: invoice number, status badge, issue date
   - Company details: seller (Nusaf) and buyer (customer)
   - Line items table: SKU, description, quantity, unit price, line total
   - Totals: subtotal, VAT (15%), grand total
   - Related documents: order link, delivery note link(s), proforma link
   - Void button (ADMIN, if ISSUED)
   - Download PDF button
   - Timeline sidebar

6. Create React Query hooks in `frontend/src/hooks/useTaxInvoices.ts`.

IMPORTANT:
- The tax invoice MUST display "TAX INVOICE" prominently
- Include both Nusaf and customer VAT numbers
- Follow existing page patterns (list → detail, sidebar, timeline)
- Staff can manually generate a tax invoice if auto-generation didn't fire
- Only one active (ISSUED) tax invoice per order — void first if reissue needed

After completing:
1. Verify: API routes work, staff can view/generate/void tax invoices, PDF downloads work
2. Update `.claude/plans/execution-progress.md` — mark T10 as [x] and add today's date
3. SAVE
```

---

### TASK T11: Tax Invoice — Customer Portal + Order Lifecycle Completion

```
Read `.claude/plans/execution-progress.md` for context.
Read the TaxInvoice service and API from T9/T10.

TASK: Add tax invoice to customer portal and complete the order status lifecycle.

CUSTOMER PORTAL:
1. **Tax invoice on customer order detail** (`/my/orders/[id]`):
   - New section: "Invoices" (show both proforma and tax invoices)
   - For each: invoice number, type (Proforma/Tax Invoice), date, total, PDF download button
   - Tax invoice should be prominent when it exists — this is the document the customer needs for their records and VAT claims

2. **Customer API route** for tax invoice PDF download:
   - `GET /my/orders/:id/tax-invoices` — list tax invoices (company-scoped)
   - `GET /my/tax-invoices/:id/pdf` — download PDF (company-scoped)
   - Verify company isolation — customer can only see their own invoices

ORDER LIFECYCLE COMPLETION:
3. Add INVOICED status to the SalesOrder status enum (if not already present). Add status transition: DELIVERED → INVOICED.

4. When a tax invoice is created and issued, auto-transition the order from DELIVERED to INVOICED.

5. Add CLOSED status to the SalesOrder status enum (if not already present). Add status transition: INVOICED → CLOSED.

6. Add a "Close Order" action (ADMIN/MANAGER) that transitions INVOICED → CLOSED. This is a manual step confirming everything is complete.

7. Update the order status badge colors and the fulfillment pipeline steps component to include INVOICED and CLOSED.

8. Update both staff and customer portal order detail pages to show the new statuses.

9. Verify the full lifecycle now works: DRAFT → CONFIRMED → PROCESSING → READY_TO_SHIP → SHIPPED → DELIVERED → INVOICED → CLOSED.

IMPORTANT:
- INVOICED means "tax invoice has been issued" — triggered by tax invoice creation
- CLOSED means "all done, nothing more to do" — manual step by manager
- Customer portal must NOT show internal fields, cost prices, or supplier data
- The tax invoice PDF must be downloadable by the customer
- Do NOT show void tax invoices to customers — only ISSUED ones

After completing:
1. Verify: customer can see and download tax invoices, order flows through all statuses to CLOSED
2. Update `.claude/plans/execution-progress.md` — mark T11 as [x] and add today's date
3. SAVE
```

---

## PHASE 2A — MANUFACTURING (4 tasks)

---

### TASK T12: BOM Components Display — API

```
Read `.claude/plans/execution-progress.md` for context.
Read `.claude/plans/audit-process3.md` for the detailed finding.

TASK: Modify the job card API to include BOM component data.

THE PROBLEM:
- Job card detail page shows product, quantity, order link, status — but NO BOM components
- `getJobCardById()` returns flat job card fields only, no BOM include
- Manufacturing workers cannot see what materials they need
- The BOM data exists in the database (BomItem model) but is never queried for the job card view

THE FIX:
1. Modify `getJobCardById()` in `job-card.service.ts` to include BOM data:
   - Query `BomItem` records where `parentProductId === jobCard.productId`
   - For each BOM component, include: component product details (id, sku, name, description), quantity per unit, isOptional flag
   - Calculate `requiredQuantity = bomItem.quantity × jobCard.quantity` (total needed for this job)
   - For each component, fetch current `StockLevel` at the job card's warehouse (JHB) — specifically `onHand` and `hardReserved` to show available stock
   - Calculate `available = onHand - hardReserved` per component
   - Calculate `shortfall = Math.max(0, requiredQuantity - available)` per component

2. Return this as a `bomComponents` array on the job card response:
   ```
   bomComponents: [
     {
       productId, sku, name, description,
       quantityPerUnit,      // BOM ratio
       requiredQuantity,     // total needed for this job
       availableStock,       // at warehouse
       shortfall,            // how much is missing
       isOptional,
       canFulfill            // boolean: available >= required
     }
   ]
   ```

3. Also add a summary field: `bomStatus: 'READY' | 'PARTIAL' | 'SHORTAGE'` based on whether all required (non-optional) components have sufficient stock.

4. Update the API response type/interface.

IMPORTANT:
- Only include non-deleted, active BOM items
- Stock levels are at the job card's warehouse (currently always JHB for manufacturing)
- This is a READ operation — do not modify any data
- The `checkBomStock()` function in `bom.service.ts` already does some of this logic — reuse it or its patterns
- Keep the response payload reasonable — don't include full product objects, just the fields needed for display

After completing:
1. Verify: `GET /job-cards/:id` now returns bomComponents array with stock levels
2. Update `.claude/plans/execution-progress.md` — mark T12 as [x] and add today's date
3. SAVE
```

---

### TASK T13: BOM Components Display — UI

```
Read `.claude/plans/execution-progress.md` for context.
Read the job card API changes from T12.

TASK: Build the BOM components section on the job card detail page.

WHAT TO BUILD:

1. **BOM Components section** on `/job-cards/[id]` page:
   - New section between the product details and notes sections
   - Header: "Bill of Materials" with overall status badge (READY green / PARTIAL amber / SHORTAGE red)
   - Table columns: Component (SKU + name, linked to product), Qty Per Unit, Required Qty, Available Stock, Shortfall, Status
   - Status per row: green check if canFulfill, red warning if shortfall > 0, grey if isOptional
   - Optional components should be visually distinct (lighter/italic) with "(Optional)" tag
   - Summary row at bottom: "X of Y required components ready"

2. **Shortfall warning banner**:
   - If `bomStatus === 'SHORTAGE'`, show a prominent amber/red banner at the top of the page:
     "⚠ Insufficient raw materials — X components have shortfalls. Review BOM before starting production."
   - This banner should be visible BEFORE the worker clicks "Start Job"

3. **Start Job button enhancement**:
   - If `bomStatus === 'SHORTAGE'`, the Start Job button should show a confirmation dialog:
     "Warning: The following components have insufficient stock: [list]. Starting this job may fail at completion. Continue anyway?"
   - If `bomStatus === 'READY'`, normal confirmation dialog

4. **BOM section visibility**:
   - Show for all job types (ASSEMBLY_REQUIRED, MADE_TO_ORDER)
   - If no BOM components found (empty array), show "No bill of materials defined for this product"
   - Hide the section entirely for non-manufacturing job types (if any exist)

IMPORTANT:
- Follow existing table patterns on the page
- Component SKU should link to the inventory item page
- Stock levels should refresh when the page loads (useQuery with appropriate stale time)
- Do NOT show cost prices of components — only quantities and availability
- The bomComponents data comes from the API response modified in T12

After completing:
1. Verify: BOM table displays with correct quantities and stock levels, shortfall warnings work, start job shows warning
2. Update `.claude/plans/execution-progress.md` — mark T13 as [x] and add today's date
3. SAVE
```

---

### TASK T14: Raw Material Availability Check on Job Start

```
Read `.claude/plans/execution-progress.md` for context.
Read `.claude/plans/audit-process3.md` for the detailed finding.

TASK: Add a raw material availability pre-check when starting a job card.

THE PROBLEM:
- `startJobCard()` performs NO stock check — just a status transition
- A worker can start production with zero components in stock
- They only discover the problem at completion time when `updateStockLevel` fails
- This wastes manufacturing time

THE FIX:
1. In `startJobCard()` in `job-card.service.ts`, before transitioning to IN_PROGRESS:
   - Call `checkBomStock()` from `bom.service.ts` (or equivalent logic) to check all required BOM components
   - The function should return: canFulfill (boolean), components with shortfalls

2. Behavior:
   - If ALL required components have sufficient stock: proceed normally (start job)
   - If ANY required component has insufficient stock: return a WARNING in the response (not a hard block)
   - The response should include: `{ success: true, warnings: [{componentSku, componentName, required, available, shortfall}] }`
   - The job still starts (soft warning, not hard block) — because:
     a. Stock might arrive before completion
     b. The worker might be doing prep work
     c. Hard blocks at start time are frustrating when stock is "almost there"

3. The hard block remains at COMPLETION time (existing behavior) — if components aren't available when `completeJobCard()` runs, the transaction fails and rolls back.

4. Add a `materialCheckPerformed` boolean and `materialCheckResult` JSON field to the JobCard model to record the pre-check result at start time. This provides an audit trail.

IMPORTANT:
- This is a SOFT warning, not a hard block
- The existing completion-time check is the real safety net — this is early warning
- Use the existing `checkBomStock()` function from `bom.service.ts` — don't duplicate logic
- The check should be at the job card's warehouse (JHB)
- Optional BOM components should not trigger warnings

After completing:
1. Verify: starting a job with insufficient materials returns warnings but still starts, starting with sufficient materials returns no warnings
2. Update `.claude/plans/execution-progress.md` — mark T14 as [x] and add today's date
3. SAVE
```

---

### TASK T15: BOM Snapshot at Job Card Creation

```
Read `.claude/plans/execution-progress.md` for context.
Read `.claude/plans/audit-process3.md` for the detailed finding.

TASK: Snapshot the BOM at job card creation time and consume from the snapshot at completion.

THE PROBLEM:
- `completeJobCard()` queries the LIVE BOM at completion time
- If the BOM was modified between order creation and job completion (components added/removed, quantities changed), the ACTUAL consumption differs from what was PLANNED
- This causes: cost reconciliation problems, unexpected stock consumption, worker confusion
- No `bomSnapshot` concept exists on the JobCard model

THE FIX:

SCHEMA:
1. Add a `JobCardBomLine` model (preferred over JSON for queryability):
   - `id` (String, cuid)
   - `jobCardId` (relation to JobCard)
   - `componentProductId` (String)
   - `componentSku` (String) — snapshot
   - `componentName` (String) — snapshot
   - `quantityPerUnit` (Decimal) — BOM ratio at snapshot time
   - `totalQuantityRequired` (Decimal) — quantityPerUnit × jobCard.quantity
   - `isOptional` (Boolean)
   - `sortOrder` (Int)

2. Add `bomLines` relation on JobCard.

3. Run migration.

SNAPSHOT AT CREATION:
4. Modify the job card creation flow (in orchestration service where `createJobCard()` is called, or in `createJobCard()` itself):
   - When creating a job card, query the current BOM for the product
   - Create `JobCardBomLine` records for each BOM component
   - This captures the BOM as it existed at plan/creation time

CONSUME FROM SNAPSHOT:
5. Modify `completeJobCard()`:
   - Instead of querying `tx.bomItem.findMany({where: {parentProductId: jobCard.productId}})` (live BOM)
   - Query `tx.jobCardBomLine.findMany({where: {jobCardId: jobCard.id, isOptional: false}})` (snapshot)
   - Use `totalQuantityRequired` for consumption amounts (instead of calculating from live BOM × quantity)
   - Everything else remains the same: MANUFACTURE_OUT per component, MANUFACTURE_IN for finished product, negative stock check, transaction

UPDATE BOM DISPLAY:
6. Update the job card detail API (from T12) to serve `JobCardBomLine` data instead of (or in addition to) live BOM data. The UI from T13 should show the snapshot with current stock levels.

IMPORTANT:
- Existing job cards (created before this change) won't have BOM snapshots. The completion function should fall back to live BOM if no `JobCardBomLine` records exist for backward compatibility.
- The snapshot is immutable — BOM changes after job creation don't affect the snapshot
- This is similar to how quotes snapshot prices — the BOM is "frozen" at order time
- Keep the live BOM check in `checkBomStock()` (used for stock availability) — that should always use current BOM

After completing:
1. Verify: new job cards get BOM snapshots, completion uses snapshot, old job cards fall back to live BOM
2. Update `.claude/plans/execution-progress.md` — mark T15 as [x] and add today's date
3. SAVE
```

---

## PHASE 2B — DATA INTEGRITY (4 tasks)

---

### TASK T16: Atomic Increments in updateStockLevel

```
Read `.claude/plans/execution-progress.md` for context.
Read `.claude/plans/audit-process5.md` for the detailed finding on concurrent edit risk.

TASK: Switch `updateStockLevel()` from read-then-write to atomic increments.

THE PROBLEM:
- `updateStockLevel()` in `inventory.service.ts` reads current stock, computes new values in JavaScript, writes absolute values
- Under concurrent execution (two simultaneous approvals on same product), the second write overwrites the first
- Both StockMovements would be recorded, but final onHand would only reflect one change

THE FIX:
1. Modify `updateStockLevel()` to use Prisma's atomic `{ increment: value }` / `{ decrement: value }` operations instead of computing absolute values.

2. The function currently accepts deltas (like `{onHand: -5}` or `{onHand: 10}`). Change the update to:
   ```typescript
   // Instead of:
   // const newOnHand = currentLevel.onHand + changes.onHand
   // prisma.stockLevel.update({ data: { onHand: newOnHand } })
   
   // Use:
   // prisma.stockLevel.update({ data: { onHand: { increment: changes.onHand } } })
   // (increment with negative value = decrement)
   ```

3. The negative stock prevention check needs to be preserved. Since atomic increments don't let you pre-check the result, use one of these approaches:
   a. Read current values first, validate `current + delta >= 0`, then do atomic increment. The transaction isolation prevents interleaving.
   b. Or add a database constraint (CHECK constraint on StockLevel: `onHand >= 0`). This is safer but requires a migration.
   c. Or do the atomic increment and then immediately read back to verify >= 0. If negative, throw and roll back.

   Approach (a) is simplest and matches existing pattern. Approach (b) is most robust. Choose one and implement it.

4. Verify ALL callers of `updateStockLevel()` pass delta values (not absolute values) — this should already be the case.

IMPORTANT:
- This change affects EVERY stock-changing operation across all 5 processes
- Test carefully — any mistake here corrupts inventory
- The function signature should NOT change — callers should not need modification
- Keep the StockMovement creation as-is — it already records the delta
- If using approach (b), ensure the CHECK constraint is in the migration

After completing:
1. Verify: stock updates use atomic operations, negative stock still prevented, all existing callers still work
2. Update `.claude/plans/execution-progress.md` — mark T16 as [x] and add today's date
3. SAVE
```

---

### TASK T17: Reservation Cleanup on Order Cancel

```
Read `.claude/plans/execution-progress.md` for context.
Read `.claude/plans/audit-process1.md` data integrity section.

TASK: Fix reservation cleanup when orders are cancelled.

THE PROBLEM:
- `cancelOrder()` releases reservations with `referenceType: 'SalesOrder'`
- But orchestration creates reservations with `referenceType: 'PickingSlip'` and `referenceType: 'JobCard'`
- Those orchestration-created reservations are NEVER released on cancellation
- This permanently inflates `hardReserved` counts, making stock appear unavailable

THE FIX:
1. In `cancelOrder()` in `order.service.ts`, after releasing SalesOrder reservations, also release:
   - All reservations with `referenceType: 'PickingSlip'` where the picking slip belongs to this order
   - All reservations with `referenceType: 'JobCard'` where the job card belongs to this order

2. To find related picking slips and job cards:
   - Query picking slips where `orderId === order.id`
   - Query job cards where `orderId === order.id`
   - Release reservations for each by their IDs

3. Also cancel or void related documents:
   - Picking slips: set to CANCELLED (if not already COMPLETE)
   - Job cards: set to CANCELLED if the status exists, or ON_HOLD if CANCELLED doesn't exist (check T15/audit findings — job card cancellation may not exist yet, in which case just release reservations)
   - Transfer requests: set to CANCELLED (if PENDING) or leave if IN_TRANSIT (can't cancel goods in transit)

4. Recalculate `hardReserved` and `softReserved` on affected stock levels after releasing all reservations. Use `updateStockLevel()` with the appropriate decrements.

IMPORTANT:
- Wrap everything in a transaction — partial cleanup is worse than no cleanup
- Only release reservations for non-completed documents (completed picking slips have already consumed stock)
- For completed picking slips, stock is already decremented — reservations were already released by `completePicking()`
- Order cancellation should work from any pre-delivery status: DRAFT, CONFIRMED, PROCESSING, READY_TO_SHIP
- Do NOT reverse stock movements from completed documents — that's a different process (returns)

After completing:
1. Verify: cancelling an order after orchestration releases all reservation types, hardReserved decrements correctly
2. Update `.claude/plans/execution-progress.md` — mark T17 as [x] and add today's date
3. SAVE
```

---

### TASK T18: Double Reservation Deduplication

```
Read `.claude/plans/execution-progress.md` for context.
Read `.claude/plans/audit-process1.md` data integrity section.

TASK: Fix the double reservation problem between order-level and orchestration-level reservations.

THE PROBLEM:
- `createOrderFromQuote()` creates HARD reservations for the SalesOrder (one per order line)
- `executeFulfillmentPlan()` creates ADDITIONAL HARD reservations for each PickingSlip and JobCard
- This means the same stock is reserved TWICE — once for the order and again for the picking slip
- `hardReserved` is inflated, making stock appear unavailable to other orders

THE FIX:
1. Choose ONE reservation strategy (not both):

   **Option A (Recommended): Release order reservations when orchestration creates document reservations.**
   - In `executeFulfillmentPlan()`, after creating picking slip/job card reservations, release the corresponding SalesOrder reservations for the same products
   - This transfers the reservation from the order level to the document level
   - On completion, document-level reservations are released (this already works)
   - On cancellation, document-level reservations are released (fixed in T17)

   **Option B: Don't create document-level reservations in orchestration.**
   - Modify orchestration to NOT create PickingSlip/JobCard reservations
   - Keep only order-level reservations
   - On completion (picking/manufacturing), release the order-level reservations
   - Simpler but requires modifying completion functions

2. Implement the chosen option. Option A is recommended because it preserves the existing completion logic (which already releases document-level reservations).

3. Write a data fix script (`backend/src/scripts/fix-double-reservations.ts`) that:
   - Finds all orders with both SalesOrder AND PickingSlip/JobCard reservations for the same product
   - Releases the SalesOrder-level duplicates
   - Recalculates `hardReserved` on affected stock levels
   - Do NOT run it — just create the script for manual execution

IMPORTANT:
- This must be done AFTER T17 (reservation cleanup on cancel) is complete
- The fix must be backward-compatible — existing orders in various states should not break
- Test with: new order → orchestrate → verify only ONE set of reservations exists
- Edge case: partial orchestration (some lines have picking slips, some don't) — order-level reservations should remain for non-orchestrated lines

After completing:
1. Verify: new orchestrations create single-layer reservations, hardReserved is not inflated
2. Update `.claude/plans/execution-progress.md` — mark T18 as [x] and add today's date
3. SAVE
```

---

### TASK T19: Soft Reservation Expiry Background Job

```
Read `.claude/plans/execution-progress.md` for context.
Read `.claude/plans/audit-process1.md` data integrity section.

TASK: Create a background job to release expired soft reservations.

THE PROBLEM:
- Quote finalization creates soft reservations with an `expiresAt` field (30-day validity)
- No background process reads `expiresAt` — expired reservations persist forever
- `softReserved` counts are inflated by abandoned/expired quotes
- This makes stock appear less available than it actually is

THE FIX:
1. Create `backend/src/services/reservation-cleanup.service.ts`:
   - `releaseExpiredSoftReservations()` function:
     a. Query all StockReservations where `type === 'SOFT'` and `expiresAt < new Date()` and `status === 'ACTIVE'` (or equivalent active status)
     b. For each expired reservation: decrement `softReserved` on the corresponding StockLevel, set reservation status to EXPIRED (or delete it)
     c. Wrap in a transaction per batch (process 100 at a time to avoid long-running transactions)
     d. Log results: how many reservations released, which products affected
     e. Return summary: `{ released: number, products: string[] }`

2. Create an API endpoint to trigger this manually:
   - `POST /admin/cleanup/expired-reservations` — ADMIN only
   - Calls `releaseExpiredSoftReservations()` and returns the summary
   - This allows manual trigger while a cron solution is set up later

3. Also check: when a quote expires (validUntil passes) or is rejected/cancelled, are its soft reservations released? If not, add reservation release to:
   - `rejectQuote()` — release soft reservations
   - `cancelQuote()` — release soft reservations (if this function exists)
   - Quote expiry check (if there's an expiry mechanism)

IMPORTANT:
- Use batch processing to avoid locking the entire reservations table
- Log everything — this is a cleanup operation and audit trail matters
- Do NOT release HARD reservations — only SOFT
- The actual cron scheduling (running this every hour/day) can be set up separately — this task just builds the function and manual trigger
- Check the StockReservation model for the actual field names — it may use different column names than assumed

After completing:
1. Verify: API endpoint releases expired soft reservations, softReserved decrements correctly
2. Update `.claude/plans/execution-progress.md` — mark T19 as [x] and add today's date
3. SAVE
```

---

## PHASE 2C — REMAINING OPERATIONS (6 tasks)

---

### TASK T20: Auto-Generate Proforma on Order Creation

```
Read `.claude/plans/execution-progress.md` for context.
Read the proforma invoice service for existing patterns.

TASK: Auto-generate a proforma invoice when a sales order is created from a quote.

THE FIX:
1. In the flow modified by T2 (acceptQuote → createOrderFromQuote), after the order is created, auto-call the proforma invoice creation:
   - `createProformaInvoice(orderId, userId)` or equivalent function
   - This should happen inside or immediately after `createOrderFromQuote()`

2. Verify the proforma invoice service already handles: generating PDF, setting pdfUrl, creating the document number, linking to the order.

3. If the proforma generation fails, it should NOT block the order creation. Wrap in try/catch — log the error but let the order proceed. Staff can manually generate the proforma later.

4. Verify the customer can see the proforma on their order detail page (`/my/orders/[id]`).

IMPORTANT:
- Proforma generation is nice-to-have automation, not critical path
- If it fails, the order still exists and staff can manually create it
- The proforma should be visible to the customer immediately on their order page
- Check if the proforma service requires the order to be in a specific status — it may need CONFIRMED, but with T2's auto-creation the order might start as DRAFT

After completing:
1. Verify: accepting a quote creates an order AND a proforma invoice automatically
2. Update `.claude/plans/execution-progress.md` — mark T20 as [x] and add today's date
3. SAVE
```

---

### TASK T21: Staff-on-Behalf-of-Customer Quotes — API

```
Read `.claude/plans/execution-progress.md` for context.
Read `.claude/plans/audit-process1.md` for the finding about staff quote creation.

TASK: Allow staff to create quotes on behalf of customer companies.

THE PROBLEM:
- `getOrCreateDraftQuote()` uses `authReq.user.companyId` — quotes can only be created for the authenticated user's own company
- A SALES user creating a quote creates it for the Nusaf company, not a customer
- No customer picker exists

API FIX:
1. Modify the quote creation to accept an optional `companyId` parameter (for staff creating on behalf of customers).

2. Logic:
   - If the user is CUSTOMER role: always use their own `companyId` (no override allowed)
   - If the user is ADMIN/MANAGER/SALES role AND provides a `companyId`: create quote for that company, using that company's pricing tier
   - If the user is ADMIN/MANAGER/SALES role WITHOUT a `companyId`: reject with error "Customer company must be selected"

3. Validate the `companyId` refers to an active customer company (not the Nusaf company itself).

4. The quote should use the selected company's:
   - `customerTier` for pricing
   - `primaryWarehouse` for default warehouse
   - Company details for display

5. Add a `createdOnBehalfOf` or similar field concept — the quote should track that it was staff-created (the `userId` on the quote will be the staff user, the `companyId` will be the customer company).

6. Update the API endpoint validation to accept the optional `companyId` parameter.

IMPORTANT:
- Customer users must NEVER be able to specify a different companyId
- Staff users MUST specify a companyId — don't let them accidentally create quotes for the Nusaf company
- The pricing must use the CUSTOMER's tier, not the staff user's company tier
- This is API only — UI is T22

After completing:
1. Verify: SALES user can create a quote with a customer companyId, pricing uses customer tier, CUSTOMER user cannot override companyId
2. Update `.claude/plans/execution-progress.md` — mark T21 as [x] and add today's date
3. SAVE
```

---

### TASK T22: Staff-on-Behalf-of-Customer Quotes — UI

```
Read `.claude/plans/execution-progress.md` for context.
Read the API changes from T21.

TASK: Build the customer company picker for staff quote creation.

WHAT TO BUILD:
1. **Company picker on staff product browsing / quote cart**:
   - When a staff user (ADMIN/MANAGER/SALES) is on the product catalog, show a customer company selector at the top of the page or in the quote cart
   - Searchable dropdown: search by company name or code
   - Only show active customer companies (not Nusaf, not inactive)
   - Once selected, display the company name and pricing tier prominently
   - All product prices shown should reflect the selected company's tier pricing

2. **Quote cart header**:
   - Show "Creating quote for: [Company Name] ([Tier])" prominently
   - Allow changing the customer (clears the current cart if items already added — with confirmation)
   - Block "Finalize Quote" if no customer is selected

3. **Prevent accidental staff self-quotes**:
   - If a SALES/ADMIN/MANAGER user tries to add items without selecting a customer first, prompt them to select a customer
   - Do NOT allow proceeding without a customer selection

4. Create a `useCompanySearch` hook (or similar) to search customer companies.

IMPORTANT:
- The company picker is the FIRST step in the staff quote workflow — before browsing products
- Product prices must dynamically reflect the selected company's tier
- The customer company selection must persist across page navigations during the quote session
- Follow existing dropdown/search patterns in the UI

After completing:
1. Verify: staff can select a customer company, prices update to their tier, quote is created for the customer company
2. Update `.claude/plans/execution-progress.md` — mark T22 as [x] and add today's date
3. SAVE
```

---

### TASK T23: Standalone Transfer UI

```
Read `.claude/plans/execution-progress.md` for context.
Read `.claude/plans/audit-process5.md` for the finding.

TASK: Build a UI for creating non-order-based warehouse transfers.

THE PROBLEM:
- Backend API (`POST /transfer-requests`) and frontend hook (`useCreateStandaloneTransferRequest`) exist
- But NO frontend page or modal allows users to create stock replenishment transfers without an order
- Also, transfers are hardcoded JHB→CT only — need bidirectional support

THE FIX:
1. **Remove hardcoded direction** in `createStandaloneTransferRequest()`:
   - Accept `fromLocation` and `toLocation` as parameters
   - Validate `fromLocation !== toLocation`
   - Currently hardcodes `fromLocation: 'JHB'`, `toLocation: 'CT'` — make dynamic

2. **Build standalone transfer creation page or modal** (`/transfer-requests/new` or modal on transfer list page):
   - From warehouse dropdown (JHB / CT)
   - To warehouse dropdown (JHB / CT)
   - Validation: from !== to
   - Product search with autocomplete
   - Line items: product, quantity, current stock at source warehouse
   - Notes field
   - Submit button creates the transfer request

3. **Add "New Transfer" button** on the transfer requests list page (`/transfer-requests`). Visible to ADMIN/MANAGER/WAREHOUSE.

4. **Update the order-based transfer creation** to also support CT→JHB direction (in case JHB needs stock from CT for an order).

IMPORTANT:
- Use existing transfer request flow for the created transfer (ship → receive lifecycle unchanged)
- Show available stock at the source warehouse for each product to prevent impossible transfers
- The negative stock check at ship time will catch any overcommitment, but showing available stock upfront is better UX
- Keep order-based transfers working as before — this is an additional capability, not a replacement

After completing:
1. Verify: standalone transfer can be created JHB→CT and CT→JHB, existing order-based transfers still work
2. Update `.claude/plans/execution-progress.md` — mark T23 as [x] and add today's date
3. SAVE
```

---

### TASK T24: Credit Note — Schema + Service + PDF

```
Read `.claude/plans/execution-progress.md` for context.
Read `.claude/plans/audit-process4.md` and `.claude/plans/audit-summary.md`.
Read the TaxInvoice service (T9) for patterns — credit note follows similar structure.

TASK: Build the credit note backend — schema, service, and PDF generation.

SCHEMA:
1. Add `CreditNote` model:
   - `id`, `creditNoteNumber` (CN-YYYY-NNNNN, unique)
   - `returnAuthorizationId` (relation to ReturnAuthorization)
   - `orderId` (relation to SalesOrder)
   - `companyId` (relation to Company)
   - `status` (enum: DRAFT, ISSUED, VOIDED)
   - `issueDate`, `subtotal`, `vatRate` (0.15), `vatAmount`, `total`
   - `pdfUrl`, `notes`
   - `issuedBy`, `issuedByName`, `voidedAt`, `voidedBy`, `voidReason`
   - Standard timestamps

2. Add `CreditNoteLine` model:
   - `id`, `creditNoteId`, `returnAuthorizationLineId`
   - `productId`, `sku`, `description`
   - `quantity`, `unitPrice` (from original order line), `lineTotal`
   - `resolution` (RESTOCK/SCRAP/REPLACE — from RA resolution)

3. Add `CreditNoteCounter` model.
4. Add relations: CreditNote→ReturnAuthorization, CreditNote→SalesOrder.

SERVICE:
5. Create `backend/src/services/credit-note.service.ts`:
   - `createCreditNote(returnAuthorizationId, userId)` — generates from completed RA:
     * Pulls RA lines with resolutions
     * Pulls original order line pricing for each returned item
     * Calculates: quantity × original unit price per line
     * Calculates VAT at 15%
     * Generates PDF
     * Sets status ISSUED
   - `getCreditNoteById(id)`, `getCreditNotesByCompany(companyId)`, `getCreditNotesByOrder(orderId)`
   - `voidCreditNote(id, reason, userId)`
   - `generateCreditNotePDF(creditNote)` — similar to tax invoice but labeled "CREDIT NOTE", references RA number and original invoice/order

6. AUTO-GENERATE: In `completeReturnAuthorization()` in `return-authorization.service.ts`, after stock disposition is processed, auto-call `createCreditNote()`. Wrap in try/catch — if credit note generation fails, RA completion should still succeed (log error, staff can manually generate later).

7. Run migration.

IMPORTANT:
- Credit note amount is based on ORIGINAL order line prices, not current prices
- Include ALL resolved lines (RESTOCK, SCRAP, REPLACE) — the credit applies regardless of stock disposition
- Follow tax invoice PDF patterns for consistency
- The credit note is a financial document — it must be accurate

After completing:
1. Verify: schema applied, completing an RA auto-generates a credit note, PDF generates correctly
2. Update `.claude/plans/execution-progress.md` — mark T24 as [x] and add today's date
3. SAVE
```

---

### TASK T25: Credit Note — API + UI

```
Read `.claude/plans/execution-progress.md` for context.
Read the credit note service from T24.

TASK: Build credit note API routes and UI (staff + customer).

API:
1. Routes:
   - `GET /credit-notes` — list all (staff, with filters)
   - `GET /credit-notes/:id` — detail
   - `GET /credit-notes/:id/pdf` — download PDF
   - `POST /credit-notes/:id/void` — void (ADMIN only)
   - `GET /my/credit-notes` — customer's credit notes (company-scoped)
   - `GET /my/credit-notes/:id/pdf` — customer PDF download

STAFF UI:
2. **Credit note section on RA detail** (`/return-authorizations/[id]`):
   - When RA is COMPLETED, show linked credit note: number, date, total, status, PDF download
   - If no credit note (generation failed), show "Generate Credit Note" button (ADMIN/MANAGER)

3. **Credit notes list page** (`/credit-notes`):
   - Table: CN number, RA number (link), order number (link), customer, date, total, status
   - Filters: status, date range, customer

4. **Credit note detail page** (`/credit-notes/[id]`):
   - Header: CN number, status badge, issue date
   - Customer details
   - Line items: product, quantity returned, unit price (original), line total, resolution
   - Totals: subtotal, VAT, grand total
   - Related documents: RA link, order link, tax invoice link
   - Void button (ADMIN)

CUSTOMER PORTAL:
5. **Credit note on customer return detail** (`/my/returns/[id]`):
   - When return is COMPLETED, show credit note: number, total, PDF download
   - Status message: "A credit of R[amount] has been issued for this return"

6. **Credit notes section on customer order detail** (`/my/orders/[id]`):
   - Show any credit notes linked to this order

7. Create React Query hooks in `frontend/src/hooks/useCreditNotes.ts`.

IMPORTANT:
- Follow existing page patterns (list → detail)
- Customer portal shows only their own credit notes (company isolation)
- Do NOT show voided credit notes to customers
- PDF download should work for both staff and customers

After completing:
1. Verify: credit notes visible on staff and customer portals, PDFs downloadable, void works
2. Update `.claude/plans/execution-progress.md` — mark T25 as [x] and add today's date
3. SAVE
```

---

## PHASE 3A — SAFETY NETS (5 tasks)

---

### TASK T26: Backend Return Quantity Validation

```
Read `.claude/plans/execution-progress.md` for context.
Read `.claude/plans/audit-process4.md` safety net section.

TASK: Add server-side validation to prevent over-returning and duplicate returns.

THE PROBLEM:
- Backend only validates `quantityReturned >= 1` — no upper bound
- No cumulative check across existing RAs for the same order line
- Customer can return more than was delivered, or return the same items multiple times

THE FIX:
1. In `createReturnAuthorization()` in `return-authorization.service.ts`, for each line in the request:
   a. Fetch the original order line to get `quantityShipped` (or `quantityOrdered` if shipped doesn't exist)
   b. Query ALL existing ReturnAuthorization lines for the same `orderLineId` where the RA status is NOT REJECTED or CANCELLED
   c. Sum `quantityReturned` across all existing active RAs for that order line
   d. Validate: `existingTotal + newRequestedQuantity <= quantityShipped`
   e. If exceeded: return error "Cannot return X units of [product] — Y already returned of Z shipped"

2. This single check prevents BOTH safety net failures:
   - Over-return: new request can't exceed shipped quantity
   - Duplicate returns: cumulative total across all RAs can't exceed shipped quantity

IMPORTANT:
- Only count RAs that are active (exclude REJECTED and CANCELLED statuses)
- Use `quantityShipped` if available, fall back to `quantityOrdered`
- Return a clear per-line error message so the customer knows which items are the problem
- The frontend already caps at shipped quantity — this is the backend safety net

After completing:
1. Verify: API rejects returns exceeding shipped quantity, API rejects duplicate returns for same line
2. Update `.claude/plans/execution-progress.md` — mark T26 as [x] and add today's date
3. SAVE
```

---

### TASK T27: Return Order Status Validation

```
Read `.claude/plans/execution-progress.md` for context.
Read `.claude/plans/audit-process4.md` safety net section.

TASK: Validate parent order status when creating a return authorization.

THE FIX:
1. In `createReturnAuthorization()`, after validating the order exists and belongs to the company:
   - Check `order.status` is one of: DELIVERED, SHIPPED, INVOICED, CLOSED (post-delivery statuses)
   - If order is DRAFT, CONFIRMED, PROCESSING, READY_TO_SHIP, or CANCELLED: reject with error "Returns can only be created for delivered orders"

2. This is a simple status check — add it near the existing order validation.

IMPORTANT:
- Allow returns from SHIPPED (goods are in transit — customer might receive damaged goods)
- Allow returns from INVOICED and CLOSED (standard post-delivery returns)
- The primary filter is DELIVERED but being slightly permissive with SHIPPED is practical
- Customer frontend already only shows DELIVERED orders — this is the backend safety net

After completing:
1. Verify: API rejects returns against DRAFT/CONFIRMED/CANCELLED orders, accepts DELIVERED/SHIPPED
2. Update `.claude/plans/execution-progress.md` — mark T27 as [x] and add today's date
3. SAVE
```

---

### TASK T28: Overselling Warning on Quote Line Items

```
Read `.claude/plans/execution-progress.md` for context.
Read `.claude/plans/audit-process1.md` safety net section.

TASK: Add a stock availability warning when adding items to a quote.

THE FIX:
1. In `addQuoteItem()` in `quote.service.ts`, after successfully adding the item:
   - Check available stock for the product at the quote's warehouse (or default JHB)
   - Available = onHand - hardReserved
   - If requested quantity > available: include a warning in the response

2. Response structure:
   ```
   {
     success: true,
     quoteItem: {...},
     stockWarning: {
       available: 5,
       requested: 10,
       message: "Only 5 units available in stock. Quote may not be fully fulfillable."
     } // or null if no warning
   }
   ```

3. On the frontend (both staff and customer quote cart), display the warning:
   - Amber indicator next to the line item
   - Tooltip or inline message showing available vs requested
   - Do NOT block the addition — this is a SOFT warning

4. Also show available stock in the product catalog when adding to cart.

IMPORTANT:
- SOFT warning only — do not prevent adding items above available stock
- Quotes are forward-looking — stock may arrive before the quote is fulfilled
- Check stock at the quote's warehouse or the company's default warehouse
- Do NOT show stock quantities to CUSTOMER users on the portal — only show a generic "limited availability" warning. Exact stock numbers are internal data (Golden Rule 4).
- Staff users CAN see exact numbers

After completing:
1. Verify: adding items above available stock shows warning, items are still added, customers see generic warning, staff see exact numbers
2. Update `.claude/plans/execution-progress.md` — mark T28 as [x] and add today's date
3. SAVE
```

---

### TASK T29: PO Cancel with Existing GRVs

```
Read `.claude/plans/execution-progress.md` for context.
Read `.claude/plans/audit-process2.md` safety net and data integrity sections.

TASK: Prevent cancelling POs that have existing goods receipts with received quantities.

THE FIX:
1. In `cancelPurchaseOrder()` in `purchase-order.service.ts`:
   - Before cancelling, query for existing GRVs linked to this PO
   - If ANY GRV exists with received quantities > 0: BLOCK cancellation
   - Return error: "Cannot cancel — goods have been received against this PO. Use the receiving process to manage discrepancies."

2. Update the status transitions if needed:
   - PARTIALLY_RECEIVED → CANCELLED should be REMOVED from `PO_STATUS_TRANSITIONS`
   - A PO that has received ANY goods should not be cancellable
   - If they want to stop receiving: just don't create more GRVs. The PO stays at PARTIALLY_RECEIVED.

3. Keep SENT → CANCELLED and ACKNOWLEDGED → CANCELLED (before any goods received).

4. Also handle the `onOrder` decrement (from T1): when cancelling a SENT/ACKNOWLEDGED PO (no GRVs), decrement `onOrder` for unreceived quantities.

IMPORTANT:
- The check is: "do any GRVs exist with received quantities?" not "is the PO partially received?"
- There could be a timing gap where a GRV exists but PO status hasn't updated yet
- This is a simple block — no complex reversal logic needed
- The frontend "Cancel" button should be hidden or disabled when GRVs exist

After completing:
1. Verify: PO with GRVs cannot be cancelled, PO without GRVs can be cancelled, onOrder adjusts correctly
2. Update `.claude/plans/execution-progress.md` — mark T29 as [x] and add today's date
3. SAVE
```

---

### TASK T30: Concurrent Edit Protection (Version Field on PO)

```
Read `.claude/plans/execution-progress.md` for context.
Read `.claude/plans/audit-process2.md` safety net section.

TASK: Add optimistic locking to Purchase Orders via a version field.

THE FIX:
1. Add `version` field (Int, default 1) to the PurchaseOrder model in Prisma schema.

2. Run migration.

3. In `updatePurchaseOrder()` and all PO modification functions:
   - Accept `version` in the request body
   - Before updating, check `WHERE id = :id AND version = :version`
   - If no match (version mismatch): return 409 Conflict with message "This purchase order was modified by another user. Please refresh and try again."
   - If match: update AND increment version: `version: { increment: 1 }`

4. Include `version` in all PO API responses so the frontend has it.

5. Update frontend PO hooks to:
   - Store version from GET responses
   - Send version with PATCH/PUT requests
   - Handle 409 responses: show "This record was modified by another user" error and refresh the page

IMPORTANT:
- Start with PO only — can extend to other models later
- The version check + increment must be atomic (single query with WHERE clause)
- This prevents: two users editing same PO, last write silently wins
- Don't apply to status transitions (approve, send, etc.) — those are already guarded by status checks

After completing:
1. Verify: simultaneous edits are detected and rejected, version increments on every update
2. Update `.claude/plans/execution-progress.md` — mark T30 as [x] and add today's date
3. SAVE
```

---

## PHASE 3B — UX IMPROVEMENTS (8 tasks)

---

### TASK T31: Order Detail Role-Based Action Buttons

```
Read `.claude/plans/execution-progress.md` for context.
Read `.claude/plans/audit-process1.md` UX section.

TASK: Show contextual, role-appropriate action buttons on the order detail page instead of all 8+ buttons simultaneously.

THE FIX:
1. On the order detail page (`/orders/[id]`):
   - Get current user's role
   - Filter visible actions based on role AND order status AND logical "next step"

2. Role-based visibility:
   - SALES: Record Payment, Proforma Invoice, basic status info
   - WAREHOUSE: Picking Slips, Job Cards, Transfers, Delivery Notes (operational actions)
   - MANAGER/ADMIN: All actions
   - CUSTOMER: Should never see this page (they use /my/orders/)

3. Status-based "next step" guidance:
   - CONFIRMED + UNPAID: Highlight "Record Payment" as primary action
   - CONFIRMED + PAID: Highlight "Fulfillment Plan" as primary action
   - PROCESSING: Show fulfillment progress, highlight operational actions
   - READY_TO_SHIP: Highlight "Create Delivery Note"
   - SHIPPED: Highlight delivery tracking
   - DELIVERED: Highlight "Tax Invoice" if not yet generated

4. Add a "Next Step" banner or prominent CTA showing the recommended action for the current state.

IMPORTANT:
- Don't REMOVE buttons — hide non-applicable ones or move to a "More Actions" dropdown
- The API still enforces roles — this is UX improvement only
- Keep all actions accessible to ADMIN/MANAGER
- Follow existing UI patterns

After completing:
1. Verify: different roles see different primary actions, next step guidance shows correctly per status
2. Update `.claude/plans/execution-progress.md` — mark T31 as [x] and add today's date
3. SAVE
```

---

### TASK T32: Cycle Count Reconcile + Apply in One Step

```
Read `.claude/plans/execution-progress.md` for context.

TASK: Add a "Reconcile & Apply" option that auto-approves the generated adjustment.

THE FIX:
1. Add a new function `reconcileAndApply(sessionId, userId)` in `cycle-count.service.ts`:
   - Calls existing `reconcileCycleCountSession()` to create the PENDING adjustment
   - Then immediately calls `approveStockAdjustment()` on the generated adjustment
   - Both in sequence (adjustment must be created before it can be approved)

2. Add an API endpoint: `POST /cycle-counts/:id/reconcile-and-apply` (ADMIN/MANAGER only)

3. On the cycle count detail page, show TWO buttons for COMPLETED sessions:
   - "Reconcile" (existing) — creates PENDING adjustment for separate approval
   - "Reconcile & Apply" (new) — creates and immediately approves the adjustment
   - Both with confirmation dialogs explaining what they do

IMPORTANT:
- Keep the existing "Reconcile" button for cases where managers want a separate approval step
- The "Reconcile & Apply" button is the fast path for trusted managers
- ADMIN/MANAGER only for both actions
- If the approval step fails (e.g., negative stock), the reconciliation should still succeed (adjustment stays PENDING)

After completing:
1. Verify: "Reconcile & Apply" creates and approves adjustment in one action, regular "Reconcile" still works
2. Update `.claude/plans/execution-progress.md` — mark T32 as [x] and add today's date
3. SAVE
```

---

### TASK T33: Confirmation Dialog on Adjustment Approval

```
Read `.claude/plans/execution-progress.md` for context.

TASK: Add `window.confirm()` dialog before approving stock adjustments.

THE FIX:
1. On the adjustment detail page (`/inventory/adjustments/[id]`), find the Approve button handler.
2. Add `window.confirm('Are you sure you want to approve this stock adjustment? This will immediately update stock levels.')` before firing the mutation.
3. If user cancels the confirm, do nothing.

This is a one-line change. Consistent with transfer ship/receive which both have confirmations.

After completing:
1. Verify: clicking Approve shows confirmation before proceeding
2. Update `.claude/plans/execution-progress.md` — mark T33 as [x] and add today's date
3. SAVE
```

---

### TASK T34: Reorder Report PO Generation Confirmation

```
Read `.claude/plans/execution-progress.md` for context.

TASK: Show a preview modal before generating draft POs from the reorder report.

THE FIX:
1. When staff clicks "Generate Draft PO(s)" on the reorder report, instead of immediately creating POs:
   - Show a preview modal listing:
     * One section per supplier (PO to be created)
     * Lines: product SKU, name, suggested quantity, estimated unit cost, line total
     * PO estimated total per supplier
     * Grand total across all POs
   - "Confirm" and "Cancel" buttons

2. On Confirm: proceed with existing PO generation logic.
3. On Cancel: close modal, no POs created.

4. Also handle the cost price issue: if any product has `costPrice === null`, show it in the preview as "Cost TBD" in amber, and note that the PO line may need manual cost entry.

IMPORTANT:
- The preview data comes from what's already selected in the reorder report — no new API call needed
- This is a frontend-only change (same API call on confirm)
- Addresses both the "no confirmation" issue and the "costPrice: 0" Zod validation failure by making it visible before submission

After completing:
1. Verify: clicking Generate shows preview, Confirm creates POs, Cancel aborts, cost TBD items are flagged
2. Update `.claude/plans/execution-progress.md` — mark T34 as [x] and add today's date
3. SAVE
```

---

### TASK T35: PO Detail Role-Based Action Buttons

```
Read `.claude/plans/execution-progress.md` for context.

TASK: Filter PO action buttons by user role.

THE FIX:
1. On PO detail page (`/purchase-orders/[id]`):
   - WAREHOUSE: Show "Receive Goods" only. Hide Submit, Approve, Send, Acknowledge.
   - PURCHASER: Show Submit, edit lines, Receive Goods. Hide Approve.
   - MANAGER/ADMIN: Show all actions.

2. Get current user role and conditionally render buttons.

IMPORTANT:
- API routes already enforce roles — this is UI consistency
- Keep existing status-based visibility (buttons only show for valid statuses)
- This is layering role checks ON TOP of status checks

After completing:
1. Verify: WAREHOUSE sees only Receive, PURCHASER sees Submit but not Approve
2. Update `.claude/plans/execution-progress.md` — mark T35 as [x] and add today's date
3. SAVE
```

---

### TASK T36: Customer Link to Order After Quote Acceptance

```
Read `.claude/plans/execution-progress.md` for context.

TASK: After T2's auto-creation, ensure the customer can navigate to their order from the quote.

THE FIX:
1. On customer quote detail (`/my/quotes/[id]`):
   - When quote status is CONVERTED (or ACCEPTED with a linked order):
     * Show "Your order has been created" message
     * Show link: "View Order →" pointing to `/my/orders/[orderId]`
   - The `convertedOrderId` should be on the quote response (verify from T2)

2. After accepting a quote (T2 redirects to order page), but if customer navigates back to the quote, they should still see the link.

IMPORTANT:
- Simple UI addition — check if quote has a converted order and show a link
- The order ID comes from the quote's `convertedOrderId` field

After completing:
1. Verify: accepted/converted quote shows link to the created order on customer portal
2. Update `.claude/plans/execution-progress.md` — mark T36 as [x] and add today's date
3. SAVE
```

---

### TASK T37: Reorder Report Cost Price Fallback

```
Read `.claude/plans/execution-progress.md` for context.

TASK: Handle products without cost prices in the reorder report PO generation.

THE PROBLEM:
- `handleGeneratePOs` passes `item.costPrice ?? 0` to `addLine`
- Zod schema requires `unitCost > 0` (positive)
- Items with no cost price silently fail

THE FIX:
1. In the reorder report PO generation logic:
   - Before generating POs, filter out items with `costPrice === null || costPrice === 0`
   - Show a warning: "X items skipped — no cost price set: [list of SKUs]"
   - Only include items with valid cost prices in the generated POs

2. Alternatively (if the preview modal from T34 is built): flag items with no cost price in the preview as "Cannot include — no cost price" and let the user see them but exclude them from generation.

3. The skipped items should be clearly communicated — staff needs to set cost prices on those products before they can be ordered.

IMPORTANT:
- Do NOT allow `unitCost: 0` to reach the API — it will fail
- The fix is filtering, not changing the Zod validation (0 cost is genuinely invalid for a PO)
- Show which items were skipped so staff can fix the data

After completing:
1. Verify: items without cost prices are skipped with clear warning, valid items generate POs correctly
2. Update `.claude/plans/execution-progress.md` — mark T37 as [x] and add today's date
3. SAVE
```

---

### TASK T38: Job Card Reservation Release on Completion

```
Read `.claude/plans/execution-progress.md` for context.
Read `.claude/plans/audit-process3.md` data integrity section.

TASK: Release BOM component reservations when a job card is completed.

THE PROBLEM:
- Orchestration creates hard reservations for BOM components when planning job cards
- `completeJobCard()` decrements onHand (consuming components) but does NOT release these reservations
- `completePicking()` DOES release reservations — this is inconsistent
- After job completion, `hardReserved` stays inflated for BOM components permanently

THE FIX:
1. In `completeJobCard()` in `job-card.service.ts`, after consuming BOM components and adding finished goods:
   - Release all reservations with `referenceType: 'JobCard'` and `referenceId: jobCard.id`
   - Decrement `hardReserved` on the corresponding StockLevel records
   - Do this inside the existing transaction

2. Follow the same pattern used in `completePicking()` for reservation release.

IMPORTANT:
- Release reservations for the COMPONENT products (what was reserved for manufacturing), not the finished product
- This must be inside the same transaction as the stock movements
- If no reservations exist for this job card (edge case), the release should be a no-op

After completing:
1. Verify: completing a job card releases BOM component reservations, hardReserved decrements correctly
2. Update `.claude/plans/execution-progress.md` — mark T38 as [x] and add today's date
3. SAVE
```

---

## COMPLETION

After all 38 tasks are done, run one final session:

```
Read `.claude/plans/execution-progress.md`.

Review the progress tracker. List any incomplete tasks.

If all tasks are marked [x], update the file:
- Set "Current phase: COMPLETE"
- Add completion date
- Add a summary: "All 38 tasks across 6 phases completed."

Then read `.claude/plans/audit-summary.md` and compare against what was fixed.
Note any items from the audit that were NOT addressed (P4 nice-to-haves).

SAVE.
```

---

## REFERENCE: Task Count by Phase

| Phase | Tasks | Complexity | Description |
|-------|-------|-----------|-------------|
| 1A | T1-T6 | All S | Quick wins |
| 1B | T7-T11 | L | Revenue foundation (payment + tax invoice) |
| 2A | T12-T15 | S-M | Manufacturing fixes |
| 2B | T16-T19 | S-M | Data integrity |
| 2C | T20-T25 | S-L | Remaining operations |
| 3A | T26-T30 | S-M | Safety nets |
| 3B | T31-T38 | S-M | UX improvements |
| **Total** | **38** | | |
