# NUSAF ERP — EXECUTION PLAN v2 (CORRECTED)

## What Happened

T1-T9 were completed using a plan that assumed ALL customers are prepay. This is wrong:
- **Majority of customers are ON ACCOUNT** (NET 30/60/90 day terms) — fulfillment starts immediately, no payment gate
- **Some customers are PREPAY** — must pay before fulfillment

Tasks T2, T7, T8, and T9 need repairs. T1, T3-T6 are fine.

## How to Use

Same master prompt as before. Paste this every session:

```
Read `.claude/plans/execution-progress.md` to see what's been completed.
Read `.claude/plans/execution-plan.md` to get the full task details.

Find the FIRST unchecked task (marked `- [ ]`).
Read its full prompt from the execution plan.
Execute that task completely — follow every instruction in the task prompt.

When the task is done:
1. Mark it `[x]` in execution-progress.md with today's date
2. Run: git add -A && git commit -m "T[number]: [task description]"
3. Run: git push
4. Tell me what was completed and what the next task is
5. STOP and wait for my permission before starting the next task

Do NOT skip tasks. Do NOT combine tasks. Complete each one fully before starting the next.
If context is getting long, tell me to start a new session BEFORE starting the next task.
```

---

## REPAIR PHASE — Run These First

---

### TASK R1: Add Payment Terms to Company Model

```
Read `.claude/plans/execution-progress.md` for context.

TASK: Add paymentTerms field to the Company model and snapshot it onto SalesOrder.

BACKGROUND:
Nusaf has two types of customers:
- Account customers (majority): NET_30, NET_60, NET_90 — fulfillment starts immediately on order creation, no payment required upfront
- Prepay customers: PREPAY, COD — must pay before fulfillment begins

The system was built assuming all customers are prepay. We need to add the paymentTerms concept.

SCHEMA CHANGES:

1. Add `paymentTerms` field to the Company model:
   - Type: String (or enum if Prisma enums are used elsewhere)
   - Values: 'PREPAY', 'COD', 'NET_30', 'NET_60', 'NET_90'
   - Default: 'NET_30' (most customers are on account)
   - Add this field to the Company model in the Prisma schema

2. Add `paymentTerms` field to the SalesOrder model:
   - Same type and values as Company.paymentTerms
   - Default: 'NET_30'
   - This is a SNAPSHOT — copied from the company at order creation time so changing a company's terms later doesn't affect existing orders

3. Modify `createOrderFromQuote()` in `order.service.ts`:
   - When creating the order, fetch the company's `paymentTerms`
   - Copy it onto the SalesOrder record: `paymentTerms: company.paymentTerms ?? 'NET_30'`

4. Add `paymentStatus` value 'NOT_REQUIRED' to whatever enum/type is used for paymentStatus on SalesOrder.
   - When creating an order, set initial paymentStatus based on paymentTerms:
     * PREPAY or COD → 'UNPAID'
     * NET_30, NET_60, NET_90 → 'NOT_REQUIRED'

5. Add paymentTerms to the Company admin/edit UI:
   - On the company edit form, add a dropdown for paymentTerms
   - Options: Prepay, COD, Net 30, Net 60, Net 90
   - Default: Net 30

6. Update the Company list page to show paymentTerms column.

7. Run `npx prisma db push` or create a migration.

8. Create a data fix script `backend/src/scripts/fix-payment-terms.ts`:
   - Set all existing companies to paymentTerms = 'NET_30' (safe default since majority are on account)
   - Set all existing orders to paymentTerms = 'NET_30' and paymentStatus = 'NOT_REQUIRED'
   - Do NOT run it — just create the script. We'll review and run manually.

After completing:
1. Verify: Company model has paymentTerms, SalesOrder has paymentTerms snapshot, order creation copies from company
2. Update `.claude/plans/execution-progress.md` — mark R1 as [x] and add today's date
3. git add -A && git commit -m "R1: Add paymentTerms to Company and SalesOrder" && git push
4. Tell me what was completed and STOP
```

---

### TASK R2: Fix Fulfillment Gate — Conditional on Payment Terms

```
Read `.claude/plans/execution-progress.md` for context.

TASK: Make the fulfillment gate conditional — only block PREPAY/COD customers, not account customers.

WHAT WAS BUILT WRONG:
T7 added a hard gate in `generateFulfillmentPlan()` that checks `order.paymentStatus === 'PAID'` before allowing fulfillment for ALL orders. This blocks account customers who should never need to pay upfront.

THE FIX:

1. Find the fulfillment gate in the orchestration service (`generateFulfillmentPlan()` or wherever it was added in T7).

2. Change the gate logic from:
   ```
   if (order.paymentStatus !== 'PAID') {
     throw error "Cannot generate fulfillment plan — payment not received"
   }
   ```
   To:
   ```
   if ((order.paymentTerms === 'PREPAY' || order.paymentTerms === 'COD') && order.paymentStatus !== 'PAID') {
     throw error "Cannot generate fulfillment plan — payment not yet received for this prepay order"
   }
   // Account customers (NET_30/60/90) pass through — no payment check
   ```

3. If `order.paymentTerms` is not loaded in the orchestration query, add it to the include/select.

4. If `order.paymentTerms` is null or undefined (legacy orders created before R1), treat as NET_30 and allow through.

That's it. One conditional change.

After completing:
1. Verify: NET_30 orders can generate fulfillment plans without payment. PREPAY orders are blocked until PAID.
2. Update `.claude/plans/execution-progress.md` — mark R2 as [x] and add today's date
3. git add -A && git commit -m "R2: Make fulfillment gate conditional on payment terms" && git push
4. Tell me what was completed and STOP
```

---

### TASK R3: Fix Payment UI — Conditional Fulfillment Gating

```
Read `.claude/plans/execution-progress.md` for context.

TASK: Update the payment recording UI to handle both account and prepay customer flows.

WHAT WAS BUILT WRONG:
T8 built the UI assuming ALL orders need payment before fulfillment. The fulfillment plan button is disabled for all unpaid orders. Account customers would be stuck.

THE FIX:

1. **Payment terms badge on order detail page** (`/orders/[id]`):
   - Add a visible badge showing the order's paymentTerms next to the order status
   - Account: "NET 30" / "NET 60" / "NET 90" — blue/neutral badge
   - Prepay: "PREPAY" or "COD" — amber badge
   - This immediately tells staff which flow applies

2. **Fix fulfillment plan button gating**:
   - Current (wrong): disabled when paymentStatus !== 'PAID'
   - Correct: disabled ONLY when `paymentTerms === 'PREPAY' || paymentTerms === 'COD'` AND `paymentStatus !== 'PAID'`
   - For account customers (NET_30/60/90): button is ALWAYS enabled regardless of paymentStatus
   - Update tooltip for prepay: "Payment must be received before fulfillment can begin"
   - No tooltip needed for account customers

3. **Fix payment status badge**:
   - Add 'NOT_REQUIRED' as a valid paymentStatus displayed as a grey/neutral badge
   - UNPAID (red) — only meaningful for prepay
   - PARTIALLY_PAID (amber)
   - PAID (green)
   - NOT_REQUIRED (grey) — account customers, payment tracked separately

4. **Payment section context**:
   - For prepay orders: show a banner in the payments section: "This is a prepay order. Payment must be recorded before fulfillment can begin."
   - For account orders: show: "This customer is on [NET 30/60/90] terms. Payment is tracked for reconciliation."

5. **Customer portal** (`/my/orders/[id]`):
   - For prepay: show "Payment Terms: Prepay — please arrange payment to proceed" + proforma download
   - For account: show "Payment Terms: Net 30 days from invoice date"
   - Do NOT show paymentStatus to account customers — it's not relevant to them

After completing:
1. Verify: account orders show enabled fulfillment button, prepay orders show disabled button until paid, badges correct
2. Update `.claude/plans/execution-progress.md` — mark R3 as [x] and add today's date
3. git add -A && git commit -m "R3: Fix payment UI for conditional fulfillment gating" && git push
4. Tell me what was completed and STOP
```

---

### TASK R4: Fix Quote Acceptance — Auto-Fulfillment for Account Customers

```
Read `.claude/plans/execution-progress.md` for context.

TASK: When an account customer accepts a quote, auto-trigger fulfillment immediately after order creation.

WHAT WAS BUILT:
T2 built: acceptQuote → createOrderFromQuote. The order is created but fulfillment is NOT triggered. Staff must manually generate the fulfillment plan.

WHAT IT SHOULD DO:
For account customers (NET_30/60/90): acceptQuote → createOrder → confirmOrder → generateFulfillmentPlan → executeFulfillmentPlan — all automatically, zero clicks.
For prepay customers (PREPAY/COD): acceptQuote → createOrder → confirmOrder → generateProforma → STOP (wait for payment).

THE FIX:

1. In `acceptQuote()` in `quote.service.ts` (or wherever the auto-order-creation was added in T2):

   After the order is created, read `order.paymentTerms`:

   a. **If NET_30, NET_60, or NET_90 (account customer):**
      - Auto-call `confirmOrder(orderId)` to move DRAFT → CONFIRMED (if not already done)
      - Auto-call `generateFulfillmentPlan(orderId)` to create the plan
      - Auto-call `executeFulfillmentPlan(planId)` to create picking slips, job cards, transfers
      - Order moves to PROCESSING
      - Wrap fulfillment in try/catch: if it fails, order stays CONFIRMED, staff can retry manually
      - Log the result: "Account order [orderNumber]: auto-fulfillment triggered — X picking slips, Y job cards, Z transfers"

   b. **If PREPAY or COD:**
      - Auto-call `confirmOrder(orderId)` to move DRAFT → CONFIRMED
      - Auto-call `createProformaInvoice(orderId)` to generate the proforma
      - STOP — do NOT trigger fulfillment
      - The proforma tells the customer how much to pay and where to send the EFT
      - Fulfillment will trigger later when staff records the payment (T39)

2. Update the `acceptQuote()` response to include:
   - `orderId` (already done in T2)
   - `fulfillmentTriggered: boolean` — true for account, false for prepay
   - `proformaGenerated: boolean` — true for prepay, false for account

3. Verify the customer portal redirect (from T2) still works correctly after these additions.

ERROR HANDLING:
- If `confirmOrder()` fails → order stays DRAFT, quote stays ACCEPTED (staff can retry)
- If `generateFulfillmentPlan()` fails → order stays CONFIRMED, no fulfillment documents (staff can manually trigger)
- If `executeFulfillmentPlan()` fails → order stays CONFIRMED, fulfillment plan exists but not executed (staff can retry)
- If `createProformaInvoice()` fails → order stays CONFIRMED, no proforma (staff can manually generate)
- NONE of these failures should prevent the order from being created. Order creation is the source of truth.

After completing:
1. Verify: account customer quote acceptance creates order AND triggers fulfillment. Prepay creates order AND proforma but NOT fulfillment.
2. Update `.claude/plans/execution-progress.md` — mark R4 as [x] and add today's date
3. git add -A && git commit -m "R4: Auto-fulfillment for account customers on quote acceptance" && git push
4. Tell me what was completed and STOP
```

---

### TASK R5: Fix Tax Invoice — Payment Terms Due Date

```
Read `.claude/plans/execution-progress.md` for context.

TASK: Update tax invoice to calculate due date from the order's payment terms.

WHAT NEEDS FIXING:
T9 built the tax invoice but the dueDate field is either null or not calculated from payment terms.

THE FIX:

1. In `createTaxInvoice()` in `tax-invoice.service.ts`, when creating the tax invoice:
   - Read `order.paymentTerms`
   - Calculate dueDate based on terms:
     * NET_30: issueDate + 30 days
     * NET_60: issueDate + 60 days
     * NET_90: issueDate + 90 days
     * PREPAY: issueDate (already paid, due immediately / already settled)
     * COD: issueDate

2. Include the dueDate in the tax invoice PDF:
   - Add "Due Date: [date]" and "Payment Terms: [NET 30 / NET 60 / etc.]" to the PDF
   - For prepay/COD: show "Payment Terms: Prepaid" or "Payment Terms: Cash on Delivery"

3. Include Nusaf bank details on the PDF for account customers who need to arrange payment:
   - Bank name, account number, branch code, reference (use invoice number)

4. If `order.paymentTerms` is null (legacy orders), default to NET_30.

This is a small change — just calculating a date and adding it to the PDF.

After completing:
1. Verify: tax invoice has correct dueDate based on payment terms, PDF shows terms and bank details
2. Update `.claude/plans/execution-progress.md` — mark R5 as [x] and add today's date
3. git add -A && git commit -m "R5: Tax invoice due date from payment terms" && git push
4. Tell me what was completed and STOP
```

---

## REMAINING TASKS (T10 onwards) — Continue After Repairs

After R1-R5 are complete, continue with T10 from the execution plan. Here are the tasks with corrections applied:

---

### TASK T10: Tax Invoice — API + Staff UI

```
Read `.claude/plans/execution-progress.md` for context.
Read the TaxInvoice service (created in T9, repaired in R5).

TASK: Build tax invoice API routes and staff-facing UI.

API ROUTES:
1. Create routes:
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
   - Table: invoice number (link), issue date, due date, total, status badge, PDF download button
   - Show payment terms and due date prominently
   - "Generate Tax Invoice" button (ADMIN/MANAGER, visible when no active invoice exists and order is DELIVERED+)
   - Show void button on ISSUED invoices (ADMIN only, with reason modal)

4. **Tax invoice list page** (`/tax-invoices`):
   - Table: invoice number, order number (link), customer company, issue date, due date, total, status, payment terms
   - Filters: status, date range, customer, payment terms, overdue (due date < today)
   - Search by invoice number or order number

5. **Tax invoice detail page** (`/tax-invoices/[id]`):
   - Header: invoice number, status badge, issue date, due date
   - Payment terms badge (NET 30 / NET 60 / PREPAID etc.)
   - Company details: seller (Nusaf) and buyer (customer)
   - Line items table: SKU, description, quantity, unit price, line total
   - Totals: subtotal, VAT (15%), grand total
   - Related documents: order link, delivery note link(s), proforma link (if prepay)
   - Payment status: for account customers show whether payment has been received against this invoice
   - Void button (ADMIN, if ISSUED)
   - Download PDF button
   - Timeline sidebar

6. Create React Query hooks in `frontend/src/hooks/useTaxInvoices.ts`.

IMPORTANT:
- The tax invoice MUST display "TAX INVOICE" prominently
- Include both Nusaf and customer VAT numbers
- Show due date and payment terms — this is what account customers use to know when to pay
- Follow existing page patterns (list → detail, sidebar, timeline)
- Only one active (ISSUED) tax invoice per order — void first if reissue needed

After completing:
1. Verify: API routes work, staff can view/generate/void tax invoices, PDF downloads, due dates show correctly
2. Update `.claude/plans/execution-progress.md` — mark T10 as [x] and add today's date
3. git add -A && git commit -m "T10: Tax invoice API and staff UI" && git push
4. Tell me what was completed and STOP
```

---

### TASK T11: Tax Invoice — Customer Portal + Order Lifecycle Completion

```
Read `.claude/plans/execution-progress.md` for context.
Read the TaxInvoice service and API from T9/T10/R5.

TASK: Add tax invoice to customer portal and complete the order status lifecycle.

CUSTOMER PORTAL:
1. **Invoices section on customer order detail** (`/my/orders/[id]`):
   - Show both proforma (if prepay) and tax invoices
   - For each: invoice number, type (Proforma/Tax Invoice), date, due date (for tax invoices), total, PDF download
   - Tax invoice should be prominent — this is what account customers need for their records and VAT claims
   - For account customers: show "Payment due by [dueDate]" prominently
   - For prepay customers: show "Paid" status since they already paid

2. **Customer API routes** for tax invoice PDF download:
   - `GET /my/orders/:id/tax-invoices` — list (company-scoped)
   - `GET /my/tax-invoices/:id/pdf` — download PDF (company-scoped)
   - Verify company isolation

ORDER LIFECYCLE COMPLETION:
3. Add INVOICED status to SalesOrder enum (if not already present). Transition: DELIVERED → INVOICED.

4. When a tax invoice is created and issued, auto-transition the order from DELIVERED to INVOICED.

5. Add CLOSED status to SalesOrder enum (if not already present). Transition: INVOICED → CLOSED.

6. Add a "Close Order" action (ADMIN/MANAGER) that transitions INVOICED → CLOSED.

7. Update order status badge colors and fulfillment pipeline to include INVOICED and CLOSED.

8. Update both portals to show the new statuses.

9. Verify full lifecycle: DRAFT → CONFIRMED → PROCESSING → READY_TO_SHIP → SHIPPED → DELIVERED → INVOICED → CLOSED.

IMPORTANT:
- INVOICED = tax invoice issued
- CLOSED = everything complete (manual step by manager)
- Customer portal must NOT show internal fields, cost prices, or supplier data
- Only show ISSUED tax invoices to customers (not voided ones)

After completing:
1. Verify: customer sees tax invoices with due dates, order flows through all statuses to CLOSED
2. Update `.claude/plans/execution-progress.md` — mark T11 as [x] and add today's date
3. git add -A && git commit -m "T11: Customer portal tax invoices and order lifecycle" && git push
4. Tell me what was completed and STOP
```

---

### TASK T12: BOM Components Display — API

```
Read `.claude/plans/execution-progress.md` for context.
Read `.claude/plans/audit-process3.md` for the detailed finding.

TASK: Modify the job card API to include BOM component data.

THE PROBLEM:
- Job card detail page shows product, quantity, order link, status — but NO BOM components
- Manufacturing workers cannot see what materials they need

THE FIX:
1. Modify `getJobCardById()` in `job-card.service.ts` to include BOM data:
   - Query `BomItem` records where `parentProductId === jobCard.productId`
   - For each component, include: product details (id, sku, name), quantity per unit, isOptional
   - Calculate `requiredQuantity = bomItem.quantity × jobCard.quantity`
   - For each component, fetch current `StockLevel` at the job card's warehouse (JHB)
   - Calculate `available = onHand - hardReserved` and `shortfall = Math.max(0, required - available)`

2. Return as `bomComponents` array:
   ```
   bomComponents: [
     { productId, sku, name, quantityPerUnit, requiredQuantity, availableStock, shortfall, isOptional, canFulfill }
   ]
   ```

3. Add summary: `bomStatus: 'READY' | 'PARTIAL' | 'SHORTAGE'`

IMPORTANT:
- Only active BOM items
- Stock at job card's warehouse
- READ only — no data modification
- Reuse existing `checkBomStock()` patterns from `bom.service.ts`

After completing:
1. Verify: `GET /job-cards/:id` returns bomComponents with stock levels
2. Update `.claude/plans/execution-progress.md` — mark T12 as [x] and add today's date
3. git add -A && git commit -m "T12: BOM components on job card API" && git push
4. Tell me what was completed and STOP
```

---

### TASK T13: BOM Components Display — UI

```
Read `.claude/plans/execution-progress.md` for context.
Read the job card API changes from T12.

TASK: Build the BOM components section on the job card detail page.

WHAT TO BUILD:
1. **BOM Components table** on `/job-cards/[id]`:
   - Header: "Bill of Materials" with overall status badge (READY/PARTIAL/SHORTAGE)
   - Columns: Component (SKU + name, linked), Qty Per Unit, Required Qty, Available Stock, Shortfall, Status
   - Green check if canFulfill, red warning if shortfall > 0, grey if optional
   - Summary row: "X of Y required components ready"

2. **Shortfall warning banner** if `bomStatus === 'SHORTAGE'`:
   "⚠ Insufficient raw materials — review BOM before starting production."

3. **Start Job button**: if SHORTAGE, show confirmation "Warning: insufficient materials. Continue anyway?"

4. If no BOM: show "No bill of materials defined for this product"

IMPORTANT:
- Follow existing table patterns
- Component SKU links to inventory item
- Do NOT show cost prices of components

After completing:
1. Verify: BOM table displays, shortfall warnings work, start job shows warning
2. Update `.claude/plans/execution-progress.md` — mark T13 as [x] and add today's date
3. git add -A && git commit -m "T13: BOM components on job card UI" && git push
4. Tell me what was completed and STOP
```

---

### TASK T14: Raw Material Availability Check on Job Start

```
Read `.claude/plans/execution-progress.md` for context.
Read `.claude/plans/audit-process3.md`.

TASK: Add raw material pre-check when starting a job card.

In `startJobCard()`:
1. Before transitioning to IN_PROGRESS, call `checkBomStock()` for all required components
2. Return WARNING (not block) if materials insufficient: `{ success: true, warnings: [{componentSku, required, available, shortfall}] }`
3. Job still starts — this is a soft warning. Hard block remains at completion time.
4. Add `materialCheckPerformed` (Boolean) and `materialCheckResult` (Json) fields to JobCard model.
5. Run migration.

IMPORTANT:
- Soft warning only — don't block
- Optional BOM components don't trigger warnings
- Use existing `checkBomStock()` — don't duplicate

After completing:
1. Verify: insufficient materials returns warnings, job still starts
2. Update `.claude/plans/execution-progress.md` — mark T14 as [x] and add today's date
3. git add -A && git commit -m "T14: Material availability check on job start" && git push
4. Tell me what was completed and STOP
```

---

### TASK T15: BOM Snapshot at Job Card Creation

```
Read `.claude/plans/execution-progress.md` for context.
Read `.claude/plans/audit-process3.md`.

TASK: Snapshot BOM at job card creation, consume from snapshot at completion.

SCHEMA:
1. Add `JobCardBomLine` model:
   - id, jobCardId, componentProductId, componentSku, componentName
   - quantityPerUnit (Decimal), totalQuantityRequired (Decimal)
   - isOptional (Boolean), sortOrder (Int)
2. Add `bomLines` relation on JobCard
3. Run migration

SNAPSHOT:
4. In job card creation (orchestration), create `JobCardBomLine` records from current BOM

CONSUME:
5. In `completeJobCard()`, use `JobCardBomLine` instead of live BOM for consumption
6. Fall back to live BOM if no snapshot exists (backward compat for old job cards)

UPDATE DISPLAY:
7. Update T12's API to serve `JobCardBomLine` data instead of live BOM when snapshot exists

After completing:
1. Verify: new job cards get snapshots, completion uses snapshot, old cards fall back
2. Update `.claude/plans/execution-progress.md` — mark T15 as [x] and add today's date
3. git add -A && git commit -m "T15: BOM snapshot at job card creation" && git push
4. Tell me what was completed and STOP
```

---

### TASK T16: Atomic Increments in updateStockLevel

```
Read `.claude/plans/execution-progress.md` for context.

TASK: Switch `updateStockLevel()` from read-then-write to atomic increments.

1. Use Prisma's `{ increment: value }` instead of computing absolute values
2. Preserve negative stock prevention: read current, validate `current + delta >= 0`, then atomic increment inside transaction
3. Verify ALL callers pass delta values
4. Function signature should NOT change — callers don't need modification

After completing:
1. Verify: stock updates use atomic operations, negative stock prevented, all callers work
2. Update `.claude/plans/execution-progress.md` — mark T16 as [x] and add today's date
3. git add -A && git commit -m "T16: Atomic increments in updateStockLevel" && git push
4. Tell me what was completed and STOP
```

---

### TASK T17: Reservation Cleanup on Order Cancel

```
Read `.claude/plans/execution-progress.md` for context.

TASK: Fix reservation cleanup when orders are cancelled.

1. In `cancelOrder()`, also release reservations with referenceType 'PickingSlip' and 'JobCard' (not just 'SalesOrder')
2. Query picking slips and job cards for the order, release their reservations
3. Cancel related documents: picking slips → CANCELLED, job cards → CANCELLED/ON_HOLD, transfers → CANCELLED (if PENDING)
4. Recalculate hardReserved/softReserved on affected stock levels
5. Wrap in transaction — partial cleanup is worse than none
6. Only release for non-completed documents

After completing:
1. Verify: cancelling order releases all reservation types
2. Update `.claude/plans/execution-progress.md` — mark T17 as [x] and add today's date
3. git add -A && git commit -m "T17: Reservation cleanup on order cancel" && git push
4. Tell me what was completed and STOP
```

---

### TASK T18: Double Reservation Deduplication

```
Read `.claude/plans/execution-progress.md` for context.

TASK: Fix double reservations between order-level and orchestration-level.

PROBLEM: createOrderFromQuote creates HARD reservations, then executeFulfillmentPlan creates MORE reservations for the same stock.

FIX (Option A — recommended):
1. In `executeFulfillmentPlan()`, after creating picking slip/job card reservations, release the corresponding SalesOrder-level reservations for the same products
2. This transfers reservation from order level to document level
3. Create fix script `backend/src/scripts/fix-double-reservations.ts` (don't run it)

Edge case: partial orchestration — keep order-level reservations for non-orchestrated lines.

MUST be done AFTER T17.

After completing:
1. Verify: new orchestrations have single-layer reservations
2. Update `.claude/plans/execution-progress.md` — mark T18 as [x] and add today's date
3. git add -A && git commit -m "T18: Double reservation deduplication" && git push
4. Tell me what was completed and STOP
```

---

### TASK T19: Soft Reservation Expiry Background Job

```
Read `.claude/plans/execution-progress.md` for context.

TASK: Create cleanup for expired soft reservations.

1. Create `backend/src/services/reservation-cleanup.service.ts`:
   - `releaseExpiredSoftReservations()`: query SOFT reservations past expiresAt, release in batches of 100, decrement softReserved
2. API endpoint: `POST /admin/cleanup/expired-reservations` (ADMIN only)
3. Also add reservation release to `rejectQuote()` and `cancelQuote()` if not already present

After completing:
1. Verify: API releases expired soft reservations
2. Update `.claude/plans/execution-progress.md` — mark T19 as [x] and add today's date
3. git add -A && git commit -m "T19: Soft reservation expiry job" && git push
4. Tell me what was completed and STOP
```

---

### TASK T20: Auto-Generate Proforma — Verify and Harden

```
Read `.claude/plans/execution-progress.md` for context.

TASK: Verify proforma auto-generation works for prepay customers and add fallback.

R4 added proforma generation inside quote acceptance for PREPAY/COD customers.

1. Verify proforma is created for PREPAY orders with correct totals, PDF, and bank details
2. Verify proforma is NOT created for account orders (NET_30/60/90)
3. Add fallback "Generate Proforma" button on staff order detail (visible when: PREPAY/COD + no active proforma)
4. Verify proforma PDF includes: bank details, payment reference instructions, order number
5. Verify customer can see proforma on `/my/orders/[id]`

After completing:
1. Verify: prepay gets proformas, account doesn't, fallback button exists
2. Update `.claude/plans/execution-progress.md` — mark T20 as [x] and add today's date
3. git add -A && git commit -m "T20: Proforma verification and hardening" && git push
4. Tell me what was completed and STOP
```

---

### TASK T21: Staff-on-Behalf-of-Customer Quotes — API

```
Read `.claude/plans/execution-progress.md` for context.

TASK: Allow staff to create quotes on behalf of customer companies.

1. Modify quote creation to accept optional `companyId` for staff (ADMIN/MANAGER/SALES)
2. CUSTOMER role: always own company, no override
3. Staff WITHOUT companyId: reject "Customer company must be selected"
4. Use selected company's customerTier for pricing and primaryWarehouse
5. Track that quote was staff-created (userId = staff, companyId = customer)

After completing:
1. Verify: SALES can create quote for customer, pricing uses customer tier
2. Update `.claude/plans/execution-progress.md` — mark T21 as [x] and add today's date
3. git add -A && git commit -m "T21: Staff quotes for customers API" && git push
4. Tell me what was completed and STOP
```

---

### TASK T22: Staff-on-Behalf-of-Customer Quotes — UI

```
Read `.claude/plans/execution-progress.md` for context.

TASK: Build customer company picker for staff quote creation.

1. Searchable company dropdown at top of product catalog (for staff roles)
2. Shows: company name, tier, payment terms
3. All prices reflect selected company's tier
4. "Creating quote for: [Company Name] ([Tier])" banner in cart
5. Block finalize if no customer selected
6. Company selection persists across navigations during session

After completing:
1. Verify: staff selects company, prices update, quote created for that company
2. Update `.claude/plans/execution-progress.md` — mark T22 as [x] and add today's date
3. git add -A && git commit -m "T22: Staff quotes for customers UI" && git push
4. Tell me what was completed and STOP
```

---

### TASK T23: Standalone Transfer UI

```
Read `.claude/plans/execution-progress.md` for context.

TASK: Build UI for non-order warehouse transfers.

1. Remove hardcoded JHB→CT direction — accept fromLocation and toLocation params
2. Build transfer creation page/modal: from/to warehouse dropdowns, product search, line items with available stock at source, notes
3. Add "New Transfer" button on transfer list page (ADMIN/MANAGER/WAREHOUSE)
4. Support both directions: JHB→CT and CT→JHB

After completing:
1. Verify: standalone transfer works both directions
2. Update `.claude/plans/execution-progress.md` — mark T23 as [x] and add today's date
3. git add -A && git commit -m "T23: Standalone transfer UI" && git push
4. Tell me what was completed and STOP
```

---

### TASK T24: Credit Note — Schema + Service + PDF

```
Read `.claude/plans/execution-progress.md` for context.
Read the TaxInvoice service for patterns.

TASK: Build credit note backend.

SCHEMA: CreditNote model (id, creditNoteNumber CN-YYYY-NNNNN, returnAuthorizationId, orderId, companyId, status DRAFT/ISSUED/VOIDED, issueDate, subtotal, vatRate 0.15, vatAmount, total, pdfUrl, notes, issuedBy, timestamps), CreditNoteLine model (id, creditNoteId, returnAuthorizationLineId, productId, sku, description, quantity, unitPrice from original order, lineTotal, resolution), CreditNoteCounter.

SERVICE: createCreditNote(raId, userId), getCreditNoteById, getCreditNotesByCompany, voidCreditNote, generateCreditNotePDF.

AUTO-GENERATE: In completeReturnAuthorization(), auto-call createCreditNote(). Try/catch — RA completion succeeds even if credit note fails.

Run migration.

After completing:
1. Verify: completing RA auto-generates credit note, PDF correct
2. Update `.claude/plans/execution-progress.md` — mark T24 as [x] and add today's date
3. git add -A && git commit -m "T24: Credit note schema service PDF" && git push
4. Tell me what was completed and STOP
```

---

### TASK T25: Credit Note — API + UI

```
Read `.claude/plans/execution-progress.md` for context.

TASK: Build credit note API routes and UI.

API: GET /credit-notes (list), GET /credit-notes/:id (detail), GET /credit-notes/:id/pdf, POST /credit-notes/:id/void (ADMIN), GET /my/credit-notes (customer).

STAFF UI: credit note section on RA detail, credit notes list page, credit note detail page.
CUSTOMER PORTAL: credit note on return detail, credit notes on order detail.

After completing:
1. Verify: credit notes visible on both portals, PDFs downloadable
2. Update `.claude/plans/execution-progress.md` — mark T25 as [x] and add today's date
3. git add -A && git commit -m "T25: Credit note API and UI" && git push
4. Tell me what was completed and STOP
```

---

### TASK T26: Backend Return Quantity Validation

```
Read `.claude/plans/execution-progress.md` for context.

TASK: Prevent over-returning and duplicate returns.

In `createReturnAuthorization()`, for each line:
1. Fetch original order line's quantityShipped
2. Sum quantityReturned across ALL existing active RAs for that orderLineId
3. Validate: existingTotal + newQuantity <= quantityShipped
4. Error: "Cannot return X units — Y already returned of Z shipped"

After completing:
1. Verify: over-returns and duplicate returns rejected
2. Update `.claude/plans/execution-progress.md` — mark T26 as [x] and add today's date
3. git add -A && git commit -m "T26: Return quantity validation" && git push
4. Tell me what was completed and STOP
```

---

### TASK T27: Return Order Status Validation

```
Read `.claude/plans/execution-progress.md` for context.

TASK: Validate parent order status when creating returns.

In `createReturnAuthorization()`: check order.status is DELIVERED, SHIPPED, INVOICED, or CLOSED. Reject DRAFT/CONFIRMED/PROCESSING/READY_TO_SHIP/CANCELLED.

After completing:
1. Verify: returns rejected for non-delivered orders
2. Update `.claude/plans/execution-progress.md` — mark T27 as [x] and add today's date
3. git add -A && git commit -m "T27: Return order status validation" && git push
4. Tell me what was completed and STOP
```

---

### TASK T28: Overselling Warning on Quote Line Items

```
Read `.claude/plans/execution-progress.md` for context.

TASK: Soft stock warning when adding items to quote above available stock.

1. In addQuoteItem(), check available stock after adding
2. Return stockWarning in response if requested > available
3. Frontend: amber indicator on line item. Staff sees exact numbers. Customers see "limited availability" only (Golden Rule 4).
4. SOFT warning — do NOT block

After completing:
1. Verify: warning shows, items still added
2. Update `.claude/plans/execution-progress.md` — mark T28 as [x] and add today's date
3. git add -A && git commit -m "T28: Overselling warning on quotes" && git push
4. Tell me what was completed and STOP
```

---

### TASK T29: PO Cancel with Existing GRVs

```
Read `.claude/plans/execution-progress.md` for context.

TASK: Block PO cancellation when GRVs with received quantities exist.

1. In cancelPurchaseOrder(), check for GRVs with received quantities > 0
2. If any exist: block cancellation with clear error
3. Remove PARTIALLY_RECEIVED → CANCELLED from status transitions
4. Keep SENT → CANCELLED and ACKNOWLEDGED → CANCELLED (before any goods received)

After completing:
1. Verify: POs with GRVs can't be cancelled, POs without GRVs can
2. Update `.claude/plans/execution-progress.md` — mark T29 as [x] and add today's date
3. git add -A && git commit -m "T29: Block PO cancel with GRVs" && git push
4. Tell me what was completed and STOP
```

---

### TASK T30: Concurrent Edit Protection on PO

```
Read `.claude/plans/execution-progress.md` for context.

TASK: Add optimistic locking via version field on PurchaseOrder.

1. Add `version` (Int, default 1) to PurchaseOrder model. Run migration.
2. All PO updates: check WHERE id AND version, increment version on success
3. 409 Conflict on mismatch: "Modified by another user. Please refresh."
4. Frontend: store version from GET, send with PATCH, handle 409 with refresh

After completing:
1. Verify: simultaneous edits detected, version increments
2. Update `.claude/plans/execution-progress.md` — mark T30 as [x] and add today's date
3. git add -A && git commit -m "T30: Optimistic locking on PO" && git push
4. Tell me what was completed and STOP
```

---

### TASK T31: Order Detail Role-Based Action Buttons

```
Read `.claude/plans/execution-progress.md` for context.

TASK: Show contextual, role-appropriate actions on order detail.

1. Filter buttons by role: SALES sees payment/proforma, WAREHOUSE sees picking/jobs/transfers, ADMIN sees all
2. Filter by status: show "next step" as primary action
3. CONFIRMED + UNPAID (prepay): highlight "Record Payment"
4. CONFIRMED + account: highlight "Fulfillment Plan" (or show auto-triggered status)
5. PROCESSING: show fulfillment progress
6. READY_TO_SHIP: highlight "Create Delivery Note"
7. DELIVERED: highlight tax invoice status

After completing:
1. Verify: different roles see correct actions per status
2. Update `.claude/plans/execution-progress.md` — mark T31 as [x] and add today's date
3. git add -A && git commit -m "T31: Role-based order actions" && git push
4. Tell me what was completed and STOP
```

---

### TASK T32: Cycle Count Reconcile + Apply

```
Read `.claude/plans/execution-progress.md` for context.

TASK: Add one-step "Reconcile & Apply" that auto-approves the adjustment.

1. New function `reconcileAndApply(sessionId, userId)`: calls reconcile then approve
2. API: `POST /cycle-counts/:id/reconcile-and-apply` (ADMIN/MANAGER)
3. Two buttons on UI: "Reconcile" (existing) and "Reconcile & Apply" (new fast path)

After completing:
1. Verify: one-step works, regular reconcile still works
2. Update `.claude/plans/execution-progress.md` — mark T32 as [x] and add today's date
3. git add -A && git commit -m "T32: Reconcile and apply in one step" && git push
4. Tell me what was completed and STOP
```

---

### TASK T33: Confirmation Dialog on Adjustment Approval

```
Read `.claude/plans/execution-progress.md` for context.

TASK: Add window.confirm() before approving stock adjustments. One-line change.

After completing:
1. Update `.claude/plans/execution-progress.md` — mark T33 as [x] and add today's date
2. git add -A && git commit -m "T33: Adjustment approval confirmation" && git push
3. Tell me what was completed and STOP
```

---

### TASK T34: Reorder Report PO Generation Confirmation

```
Read `.claude/plans/execution-progress.md` for context.

TASK: Preview modal before generating POs from reorder report.

1. Show preview: one section per supplier, lines with product/qty/cost, totals
2. Flag items with costPrice null as "Cost TBD" in amber
3. Confirm → proceed. Cancel → abort.

After completing:
1. Verify: preview shows before PO creation
2. Update `.claude/plans/execution-progress.md` — mark T34 as [x] and add today's date
3. git add -A && git commit -m "T34: Reorder report PO confirmation" && git push
4. Tell me what was completed and STOP
```

---

### TASK T35: PO Detail Role-Based Buttons

```
Read `.claude/plans/execution-progress.md` for context.

TASK: WAREHOUSE sees Receive only. PURCHASER sees Submit/edit but not Approve. ADMIN sees all.

After completing:
1. Update `.claude/plans/execution-progress.md` — mark T35 as [x] and add today's date
2. git add -A && git commit -m "T35: PO role-based buttons" && git push
3. Tell me what was completed and STOP
```

---

### TASK T36: Customer Link to Order After Quote Acceptance

```
Read `.claude/plans/execution-progress.md` for context.

TASK: On customer quote detail, when quote is CONVERTED, show "View Order →" link to /my/orders/[orderId].

After completing:
1. Update `.claude/plans/execution-progress.md` — mark T36 as [x] and add today's date
2. git add -A && git commit -m "T36: Quote to order link on portal" && git push
3. Tell me what was completed and STOP
```

---

### TASK T37: Reorder Report Cost Price Fallback

```
Read `.claude/plans/execution-progress.md` for context.

TASK: Filter out items with null/zero costPrice before PO generation. Show warning listing skipped SKUs.

After completing:
1. Update `.claude/plans/execution-progress.md` — mark T37 as [x] and add today's date
2. git add -A && git commit -m "T37: Cost price fallback in reorder" && git push
3. Tell me what was completed and STOP
```

---

### TASK T38: Job Card Reservation Release on Completion

```
Read `.claude/plans/execution-progress.md` for context.

TASK: In completeJobCard(), release reservations with referenceType 'JobCard' and referenceId jobCard.id. Decrement hardReserved. Inside same transaction. Follow completePicking() pattern.

After completing:
1. Update `.claude/plans/execution-progress.md` — mark T38 as [x] and add today's date
2. git add -A && git commit -m "T38: Job card reservation release" && git push
3. Tell me what was completed and STOP
```

---

### TASK T39: Prepay Payment Triggers Fulfillment

```
Read `.claude/plans/execution-progress.md` for context.

TASK: When a prepay customer's payment reaches PAID, auto-trigger fulfillment.

Account customers already get auto-fulfillment in R4 (on quote acceptance). This handles prepay.

1. In `recordPayment()` in `payment.service.ts`:
   - After updating paymentStatus, check: NEW status is PAID AND order.paymentTerms is PREPAY/COD
   - If both: auto-call generateFulfillmentPlan + executeFulfillmentPlan
   - Order moves to PROCESSING

2. Error handling: payment MUST succeed even if fulfillment fails. Try/catch fulfillment.
3. Only trigger on the payment that tips status to PAID (not on subsequent payments)
4. Don't trigger if order is already PROCESSING or beyond

5. UI: success toast "Payment recorded. Fulfillment initiated — X picking slips, Y job cards." or warning if fulfillment failed.

After completing:
1. Verify: prepay PAID triggers fulfillment, account orders not affected
2. Update `.claude/plans/execution-progress.md` — mark T39 as [x] and add today's date
3. git add -A && git commit -m "T39: Prepay payment triggers fulfillment" && git push
4. Tell me what was completed and STOP
```

---

### TASK T40: End-to-End Flow Verification

```
Read `.claude/plans/execution-progress.md` for context.

TASK: Trace both flows through the code. Do NOT run against live data.

FLOW A — ACCOUNT CUSTOMER (NET_30):
1. Customer accepts quote → acceptQuote()
2. → createOrderFromQuote() with paymentTerms=NET_30, paymentStatus=NOT_REQUIRED
3. → confirmOrder()
4. → generateFulfillmentPlan() — passes gate (NET_30, no payment check)
5. → executeFulfillmentPlan() — creates picking slips, job cards, transfers
6. Workers complete tasks → completePicking(), completeJobCard()
7. All done → READY_TO_SHIP (checks PS + JC + TR)
8. Delivery note → SHIPPED → DELIVERED
9. → createTaxInvoice() auto-triggers with dueDate = issueDate + 30
10. → INVOICED → CLOSED

FLOW B — PREPAY CUSTOMER (PREPAY):
1. Customer accepts quote → acceptQuote()
2. → createOrderFromQuote() with paymentTerms=PREPAY, paymentStatus=UNPAID
3. → confirmOrder()
4. → createProformaInvoice() — customer sees proforma with bank details
5. STOP — no fulfillment
6. Customer pays EFT → staff records payment via recordPayment()
7. paymentStatus → PAID → auto-triggers fulfillment (T39)
8-10. Same as Flow A steps 6-10

Document in `.claude/plans/flow-verification.md`: each function in the chain, whether auto or manual, any breaks found.

After completing:
1. Update `.claude/plans/execution-progress.md` — mark T40 as [x] and add today's date
2. git add -A && git commit -m "T40: End-to-end flow verification" && git push
3. Tell me what was completed and STOP
```

---

## COMPLETION

After all tasks done:

```
Read `.claude/plans/execution-progress.md`.
If all marked [x], set "Current phase: COMPLETE" with date.
Read `.claude/plans/flow-verification.md` and note any remaining breaks.
SAVE.
```

---

## REFERENCE: Execution Order

```
REPAIRS (fix what T1-T9 built wrong):
  R1 → R2 → R3 → R4 → R5

CONTINUE (T10 onwards, all correct):
  T10 → T11 → T12 → T13 → T14 → T15
  T16 → T17 → T18 → T19
  T20 → T21 → T22 → T23 → T24 → T25
  T26 → T27 → T28 → T29 → T30
  T31 → T32 → T33 → T34 → T35 → T36 → T37 → T38
  T39 → T40
```

## REFERENCE: The Two Customer Flows

### Account Customer (NET_30/60/90) — Zero Manual Steps After Quote
```
Customer accepts quote
  → Order created automatically
  → Fulfillment triggered automatically (picking slips, job cards, transfers)
  → Workers complete tasks
  → READY_TO_SHIP automatically
  → Staff ships + delivers
  → Tax invoice auto-generated with NET terms due date
  → Customer pays within terms
  → Staff records payment (reconciliation)
  → Order closed
```

### Prepay Customer (PREPAY/COD) — One Manual Step (record payment)
```
Customer accepts quote
  → Order created automatically
  → Proforma generated automatically (with bank details)
  → Customer pays via EFT
  → Staff records payment (ONE manual step)
  → Fulfillment triggered automatically (picking slips, job cards, transfers)
  → Workers complete tasks
  → READY_TO_SHIP automatically
  → Staff ships + delivers
  → Tax invoice auto-generated
  → Order closed
```
