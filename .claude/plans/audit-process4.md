# PROCESS 4 AUDIT: Returns & Credit

**Date:** 2026-02-08
**Auditor:** Claude Code (comprehensive codebase trace)
**Scope:** End-to-end business process from customer return request through credit resolution

---

## EXECUTIVE SUMMARY

The Returns & Credit process is approximately 55% complete. The Return Authorization (RA) lifecycle — from customer request through warehouse receipt and stock disposition — is well-built and functional. However, the process is critically broken by:

1. **No Credit Note system at all** — the single most critical missing piece. No model, service, API, or UI exists.
2. **No server-side quantity validation against delivered quantity** — customer can return more than was delivered via API
3. **No duplicate return prevention** — same order line can be returned multiple times without cumulative check
4. **No order status validation at backend** — return can be created against a DRAFT or CONFIRMED order via API
5. **No notification system** — staff has no alert when customer submits a return; customer has no notification when RA is approved/rejected
6. **No photo/evidence upload** — customer cannot attach images of damaged goods
7. **Stock disposition is a 2-step manual process** (receive, then complete) — should be automatable upon inspection

**Severity Assessment:** The RA workflow works well in isolation but the "credit" half of "Returns & Credit" is entirely absent, and key safety nets are missing on the backend.

---

## STEP-BY-STEP AUDIT TABLE

| # | Step | Status | UX | Automation | Safety Nets | Detail |
|---|------|--------|-----|------------|-------------|--------|
| 1 | Customer initiates return request from portal | WORKS | CLEAR | ONE_CLICK | PARTIAL | Customer navigates to `/my/orders/[id]`, sees "Request Return" button when order is DELIVERED. Redirects to `/my/returns/new?orderId=...`. Selects lines to return, sets quantity (frontend caps at `quantityShipped \|\| quantityOrdered`), chooses reason from 6 options (DEFECTIVE, DAMAGED_IN_TRANSIT, WRONG_ITEM, NOT_AS_DESCRIBED, NO_LONGER_NEEDED, OTHER). Notes required for OTHER reason. **No photo upload capability.** Frontend max quantity check is client-side only — API has no such validation. |
| 2 | Staff receives return request notification | MISSING | NO_UI | N/A | N/A | **No notification system exists.** No email, no push, no dashboard alert. Staff must navigate to `/return-authorizations` and filter by REQUESTED status to discover pending return requests. No count badge on nav. Customer dashboard also has no returns link. |
| 3 | Staff reviews return request — approves or rejects | WORKS | CLEAR | ONE_CLICK | PROTECTED | Staff detail page at `/return-authorizations/[id]` shows: pipeline steps (REQUESTED→APPROVED→ITEMS_RECEIVED→COMPLETED), customer details, line items with reasons, timeline. **Approve**: one-click button, REQUESTED→APPROVED. **Reject**: button opens modal requiring reason text (1-500 chars), REQUESTED→REJECTED. Role-restricted to ADMIN/MANAGER only. Status guard prevents double-action. |
| 4 | Return Authorization created, linked to original SO | WORKS | CLEAR | AUTO | PROTECTED | RA created with auto-generated number (RA-YYYY-NNNNN). Links to parent via `orderId`/`orderNumber` and/or `deliveryNoteId`/`deliveryNoteNumber`. Lines link to `orderLineId` and `deliveryNoteLineId`. At least one parent document required (Zod validation). Customer-created RAs start as REQUESTED; staff-created RAs auto-set to APPROVED. Warehouse field set from parent document. |
| 5 | RA sent to customer with instructions | PARTIAL | INCOMPLETE | N/A | N/A | Customer can see approved RA on `/my/returns/[id]` with status message "Your return has been approved. Please ship the items back to us." **But:** No email notification sent. No shipping address provided. No RA number packing instructions. No PDF generation. No "return shipping label" concept. Customer must proactively check portal to discover approval. |
| 6 | Customer ships goods back | N/A | N/A | N/A | N/A | External physical process. No tracking number field exists on the RA model to record shipment tracking. |
| 7 | Warehouse receives returned goods — inspects condition | WORKS | CLEAR | ONE_CLICK | PROTECTED | "Receive Items" button (visible when APPROVED) opens modal. Each line shows SKU and max quantity (capped at `quantityReturned`). Warehouse enters actual `quantityReceived` per line. Can receive less than returned (partial receipt). Validation: `quantityReceived <= quantityReturned`. Status: APPROVED→ITEMS_RECEIVED. Role-restricted to ADMIN/MANAGER/WAREHOUSE. |
| 8 | Each line marked as restockable, damaged, or disposed | WORKS | CLEAR | ONE_CLICK | PROTECTED | "Complete" button (visible when ITEMS_RECEIVED) opens resolution modal. Per-line dropdown with: **Restock** (return to inventory), **Scrap** (write off), **Replace** (new delivery). All lines must have a resolution. Role-restricted to ADMIN/MANAGER. |
| 9 | Restockable items: stock increased (RETURN movement) | WORKS | N/A | AUTO | PROTECTED | On completion with RESTOCK resolution: `updateStockLevel()` increases `onHand` by `quantityReceived`. Creates `RETURN` StockMovement with `referenceType: 'ReturnAuthorization'`, `referenceId`, `referenceNumber`. `balanceAfter` recorded. Notes include RA number and return reason. All within a single Prisma transaction. **Golden Rule 1: COMPLIANT.** |
| 10 | Damaged/disposed items: written off (SCRAP movement) | WORKS | N/A | AUTO | PROTECTED | On completion with SCRAP resolution: Creates `SCRAP` StockMovement for audit trail. **Does NOT decrease onHand** — correct behavior since returned goods weren't yet in inventory. `balanceAfter` reflects current onHand (unchanged). Notes include RA number and reason. The enum uses `SCRAP`, not `WRITE_OFF` (which doesn't exist). **Golden Rule 1: COMPLIANT.** |
| 11 | Credit Note generated linked to RA and original SO/Invoice | MISSING | NO_UI | N/A | N/A | **CRITICAL GAP.** No `CreditNote` model in Prisma schema. No credit note service. No API endpoint. No UI. No PDF generation. RA completion only resolves stock — no financial document is created. Grep for "CreditNote" and "credit note" across entire codebase yields zero implementation code. |
| 12 | Credit applied to customer account or refund processed | MISSING | NO_UI | N/A | N/A | **No credit/refund mechanism.** No customer balance/account concept in the system. No refund tracking. No payment link-back. Entire financial side of returns is absent. |

---

## SAFETY NET AUDIT

| # | Safety Net | Status | Detail | Code Location |
|---|-----------|--------|--------|---------------|
| 1 | PREVENT RETURNING MORE THAN DELIVERED | **UNPROTECTED** | `createReturnAuthorization()` does NOT check the original order's `quantityShipped` or `quantityDelivered` against `quantityReturned`. The backend Zod schema only validates `quantityReturned >= 1` with no upper bound against the order. Frontend caps at `line.quantityShipped \|\| line.quantityOrdered` but this is client-side only and trivially bypassable via direct API call. A customer could request return of 1000 units when only 5 were shipped. | `return-authorization.service.ts:143-237`, `validation/return-authorizations.ts:37` |
| 2 | PREVENT DUPLICATE RETURNS | **UNPROTECTED** | No check for existing RAs against the same order line. No cumulative quantity check. A customer could submit 5 separate return requests for the same order line, each requesting the full shipped quantity. `createReturnAuthorization()` only validates parent document exists — never queries existing RAs for that order. Total `quantityReturned` across all RAs could vastly exceed `quantityDelivered`. | `return-authorization.service.ts:143-237` (no existing RA query) |
| 3 | PREVENT NEGATIVE STOCK | **PROTECTED** | `updateStockLevel()` at line 644 explicitly checks `if (newOnHand < 0)` and throws an error. RESTOCK resolution only increases onHand. SCRAP resolution doesn't change onHand. The `RETURN` movement type only adds stock. Negative stock from the returns process is impossible. | `inventory.service.ts:644-645` |
| 4 | PREVENT ORPHANED CREDITS (cancel after partial receipt) | **PARTIAL** | `cancelReturnAuthorization()` only allows cancellation in REQUESTED or APPROVED status. Once ITEMS_RECEIVED, cancellation is blocked by status guard. So stock movements from completion can't be orphaned by cancellation. **However:** There is no reversal mechanism if a COMPLETED RA needs to be undone. No "reopen" or "reverse" function exists. If stock was incorrectly restocked, the only remedy is a manual stock adjustment — no automated reversal linked back to the RA. | `return-authorization.service.ts:652-681` |
| 5 | STATUS REGRESSION | **PROTECTED** | Each transition function checks exact current status before proceeding. COMPLETED, REJECTED, and CANCELLED are terminal — no function transitions from these states. The only transitions are: REQUESTED→APPROVED, REQUESTED→REJECTED, APPROVED→ITEMS_RECEIVED, ITEMS_RECEIVED→COMPLETED, REQUESTED/APPROVED→CANCELLED. A completed RA cannot be reopened. | `return-authorization.service.ts` (all status checks) |
| 6 | PREVENT RETURN WITHOUT ORDER | **PARTIAL** | Zod validation requires at least one of `orderId` or `deliveryNoteId` (line 63-64). The customer frontend only shows DELIVERED orders (filtered at query level, line 51-52 of customer new return page). **But:** Backend `createReturnAuthorization()` does NOT check order status. It only checks the order exists and belongs to the company. A direct API call could create an RA against a DRAFT, CONFIRMED, or CANCELLED order. Staff new RA page also accepts any order ID without status filtering. | `validation/return-authorizations.ts:62-64`, `return-authorization.service.ts:155-165` |

---

## AUTOMATION GAPS (Required vs Actual)

### Must Be AUTOMATIC (Zero Clicks) — Per Requirements

| Automation | Required | Actual | Gap |
|-----------|----------|--------|-----|
| Return received + inspected → Stock movements created based on disposition | AUTO | **MANUAL (2 steps)** | Requires: (1) "Receive Items" click + modal, (2) "Complete Return" click + resolution modal. Two separate manual actions with separate API calls. Should auto-create stock movements once inspection/disposition is recorded. |
| RA completed → Credit Note auto-generated | AUTO | **MISSING ENTIRELY** | No credit note system exists. `completeReturnAuthorization()` resolves stock but generates no financial document. |
| Notification to staff on new return request | AUTO | **MISSING** | No notification system. Staff must poll the RA list page manually. |
| Notification to customer on RA status change | AUTO | **MISSING** | No email or push notification. Customer must check portal proactively. |

### Must Be ONE CLICK — Per Requirements

| Action | Required | Actual | Gap |
|--------|----------|--------|-----|
| Approve return request | ONE_CLICK | **WORKS** | Single button click, REQUESTED→APPROVED. Confirmation implicit (button is clearly labeled). |
| Reject return request | ONE_CLICK | **WORKS** | Button opens modal for reason text, then confirm. Two clicks total but appropriate UX. |
| Mark each return line disposition | ONE_CLICK | **WORKS** | "Complete" modal shows per-line dropdown (RESTOCK/SCRAP/REPLACE). Select all, click "Complete Return". |
| Receive returned items | ONE_CLICK | **WORKS** | "Receive Items" modal pre-populates quantities. Adjust if needed, click "Confirm Receipt". |

---

## FRONTEND UX EVALUATION

### Customer Portal — Return Request (`/my/returns/new`)
- **FLOW LOGIC:** CLEAR — Step 1: select delivered order (only DELIVERED shown). Step 2: check items to return, set quantity + reason. Submit.
- **FIELD COMPLETENESS:** Product SKU, description, max quantity, reason dropdown, notes field. **Missing:** photo upload, order totals, previously returned quantities.
- **FIELD ORDER:** Logical — order selection → line selection → submit.
- **ROLE CLARITY:** CLEAR — customer understands what they're doing.
- **STATUS VISIBILITY:** Selected items count shown. Clear submit button state.
- **NAVIGATION:** "Request Return" button on order detail (DELIVERED only). Back link to returns list.

### Customer Portal — Return Detail (`/my/returns/[id]`)
- **FLOW LOGIC:** CLEAR — Status message explains current state. Cancel button visible for REQUESTED. Sidebar links to parent order.
- **FIELD COMPLETENESS:** RA number, status badge, submitted date, item table (product, qty, reason), order link. **No internal data shown (Golden Rule 4 compliant).**
- **ROLE CLARITY:** CLEAR — customer sees their return status.
- **NAVIGATION:** Links to parent order. Back to returns list.

### Customer Portal — Returns List (`/my/returns`)
- **FLOW LOGIC:** CLEAR — Table with RA#, order link, status badge, item count, date. Status filter tabs.
- **FIELD COMPLETENESS:** Good summary view.
- **NAVIGATION:** Link to create new return. Links to individual return details.

### Staff Portal — RA Detail (`/return-authorizations/[id]`)
- **FLOW LOGIC:** CLEAR — Pipeline steps show progress. Action buttons context-sensitive (only show for valid transitions). Reject modal requires reason. Receive modal for quantity entry. Complete modal for disposition.
- **FIELD COMPLETENESS:** Full details grid: RA#, status, order link (clickable), DN link (clickable), customer name, warehouse, requested by (with role indicator), created date. Lines table: line#, product SKU (links to inventory item), UoM, qty returned, qty received, reason, resolution.
- **FIELD ORDER:** Header → Pipeline → Details grid → Lines table → Sidebar (notes + timeline).
- **ROLE CLARITY:** GOOD — ADMIN/MANAGER see approve/reject/complete buttons. WAREHOUSE sees receive button. Actions are role-gated at API layer.
- **STATUS VISIBILITY:** Pipeline steps with color coding. Status badges. Timeline shows full audit trail.
- **NAVIGATION:** GOOD — Links to parent order, delivery note, inventory items. Back to list.

### Staff Portal — RA List (`/return-authorizations`)
- **FLOW LOGIC:** CLEAR — Table with status tabs (All, Requested, Approved, Items Received, Completed, Rejected, Cancelled). Search by RA#, order#, customer name.
- **FIELD COMPLETENESS:** RA#, order link, customer, status, line count, qty, warehouse, date.
- **NAVIGATION:** "New Return" button. Links to individual RA detail.

### Staff Portal — New RA (`/return-authorizations/new`)
- **FLOW LOGIC:** CLEAR — Search for order ID or delivery note ID. Auto-populates lines from selected document. Check items, set quantities, reasons. Notes field. Warehouse selection.
- **FIELD COMPLETENESS:** Order search, DN search, line selection, warehouse override, notes. **Missing:** order status filter (accepts any order status), photo upload.
- **NAVIGATION:** Back to list. Redirects to created RA on success.

---

## CRITICAL MISSING PIECES (Priority Order)

### P0 — Business-Breaking Gaps

1. **Credit Note System** — The entire financial resolution of returns is absent. Need:
   - `CreditNote` Prisma model with fields: `creditNoteNumber` (CN-YYYY-NNNNN), `companyId`, `returnAuthorizationId`, `orderId`, `status` (DRAFT, ISSUED, VOIDED), `subtotal`, `vatRate`, `vatAmount`, `total`, `lines[]`
   - `CreditNoteLine` model linked to `ReturnAuthorizationLine` and `SalesOrderLine` (pricing snapshot)
   - Service: `generateCreditNote()` — auto-called when `completeReturnAuthorization()` finishes
   - PDF generation (similar to ProformaInvoice)
   - API endpoints for list, detail, PDF download
   - Staff UI: view credit note from RA detail, credit notes list page
   - Customer UI: view credit note on return detail, download PDF
   - Consider: should credit be auto-applied to next order, or require manual refund?

2. **Backend Quantity Validation Against Delivered** — `createReturnAuthorization()` must:
   - Fetch original order lines with `quantityShipped`
   - Sum `quantityReturned` from ALL existing RAs for each `orderLineId` (exclude REJECTED/CANCELLED)
   - Validate: `existing_total + new_request <= quantityShipped`
   - This prevents both over-returning AND duplicate returns (Safety Nets 1 & 2)

3. **Order Status Validation** — `createReturnAuthorization()` must validate parent order status is DELIVERED (or at minimum SHIPPED/DELIVERED). Reject returns against DRAFT/CONFIRMED/CANCELLED orders.

### P1 — Operational Gaps

4. **Notification System for Returns** — At minimum:
   - Customer submits RA → notify ADMIN/MANAGER/SALES staff
   - Staff approves RA → notify customer (with instructions)
   - Staff rejects RA → notify customer (with reason)
   - Staff completes RA → notify customer (with resolution summary)
   - Return request count on staff dashboard

5. **Return Shipping Instructions** — When RA is approved:
   - Include warehouse address in approval message (JHB or CT based on `ra.warehouse`)
   - Include RA number to reference on package
   - Consider: auto-generate return shipping label PDF

6. **Photo/Evidence Upload** — Customer should be able to attach photos when requesting a return (especially for DEFECTIVE, DAMAGED_IN_TRANSIT). Need:
   - `DocumentType.RETURN_EVIDENCE` enum value
   - File upload on return request form
   - R2 storage integration (already exists for other document types)
   - Display photos on staff RA detail page during review

7. **Return Tracking Number** — Add `trackingNumber` field to RA model so customer can record their return shipment tracking.

### P2 — Quality Gaps

8. **Merge Receive + Complete Into Single Step** — The current 2-step process (Receive Items → Complete with Resolutions) could be streamlined:
   - Single "Receive & Inspect" action where warehouse enters quantity + disposition per line simultaneously
   - Auto-triggers stock movements in one transaction
   - Reduces the manual step count from 2 to 1

9. **Dashboard Integration** — No returns data on any dashboard:
   - Staff dashboard should show "X pending return requests" card
   - Customer dashboard should show recent return status
   - Order detail should show return summary (ReturnAuthorizationsSection exists but need to verify it's wired in)

10. **RA Reversal Mechanism** — No way to undo a completed RA:
    - If items were incorrectly restocked, need "Reverse RA" function
    - Should create opposite stock movements (ISSUE for reversed RETURN, etc.)
    - Should void the associated credit note

11. **REPLACE Resolution Follow-Through** — When resolution is REPLACE:
    - Currently: "staff creates a new DN separately" with no link
    - Should: auto-create or prompt for a replacement delivery note linked to the RA
    - Track replacement status on the RA detail page

---

## ROLE-BASED EXPERIENCE EVALUATION

### Customer Experience
- **Pain Points:** No notification when return is approved/rejected. Must check portal manually. No photo upload for evidence. No shipping instructions provided. No credit note or refund tracking. Dead end after COMPLETED — no financial resolution visible.
- **Working Well:** Clear return request flow. Can select from DELIVERED orders. Per-line return with reason. Can cancel pending requests. Status tracking with clear messages.
- **Rating:** 5/10 — Request flow works, but no closure (no credit/refund) and no proactive communication.

### Warehouse Worker Experience
- **Pain Points:** Must navigate to /return-authorizations to find work. No dedicated "returns to receive" queue. No barcode scanning. Must complete a 2-step process (receive then complete separately).
- **Working Well:** Receive modal pre-populates quantities. Can adjust per line. Clear status indication.
- **Rating:** 5/10 — Functional but not optimized for warehouse workflow.

### Manager Experience
- **Pain Points:** No dashboard alert for pending returns. No financial impact visibility (no credit notes). Cannot see total returns value. No returns analytics/reporting. Cannot reverse a completed RA.
- **Working Well:** Approve/reject workflow is clean. Full audit trail in timeline. Role-restricted actions.
- **Rating:** 5/10 — Approval workflow works but no financial oversight.

### Sales Person Experience
- **Pain Points:** Cannot see returns on their customer accounts. No visibility into return reasons/trends. No credit note to send to customer. Cannot create returns on behalf of customers (well, they can via staff RA creation page).
- **Working Well:** Can create RA from staff portal. Links between orders and RAs exist.
- **Rating:** 4/10 — Limited involvement in the returns process. No customer relationship tools.

---

## DATA INTEGRITY RISKS

1. **Over-return via API** — Without server-side quantity validation, direct API calls can create RAs with `quantityReturned` exceeding shipped quantity. This inflates stock when restocked and creates phantom credit obligations.

2. **Duplicate returns** — Same order line can appear in multiple RAs. Without cumulative quantity tracking, the system will blindly restock the same items multiple times, inflating onHand counts.

3. **Returns against undelivered orders** — API accepts any order (regardless of status) as parent. An RA against a DRAFT order is semantically nonsensical and could lead to stock being "returned" that was never dispatched.

4. **No financial reconciliation** — Without credit notes, there's no financial record of the return's monetary impact. Stock changes happen (RETURN/SCRAP movements) but no matching financial entry exists. This creates a gap between physical inventory and financial records.

5. **SCRAP movement quantity discrepancy** — SCRAP movements record `quantity` (what was received) but don't change `onHand`. This is correct behavior, but the movement's `balanceAfter` equals current `onHand`, which may confuse auditors expecting the quantity to affect the balance.

---

## FILES EXAMINED

### Backend Services
- `backend/src/services/return-authorization.service.ts` — Full RA lifecycle (682 lines)
- `backend/src/services/inventory.service.ts` — Stock level management, movement creation, negative stock prevention
- `backend/src/utils/validation/return-authorizations.ts` — Zod schemas for all RA operations (125 lines)

### Backend API Routes
- `backend/src/api/v1/return-authorizations/route.ts` — All RA endpoints (455 lines)

### Frontend — Customer Portal
- `frontend/src/app/(customer)/my/returns/page.tsx` — Customer returns list
- `frontend/src/app/(customer)/my/returns/new/page.tsx` — Customer new return request
- `frontend/src/app/(customer)/my/returns/[id]/page.tsx` — Customer return detail
- `frontend/src/app/(customer)/my/orders/[id]/page.tsx` — Order detail with "Request Return" button
- `frontend/src/app/(customer)/my/dashboard/page.tsx` — No returns integration

### Frontend — Staff Portal
- `frontend/src/app/(portal)/return-authorizations/page.tsx` — Staff RA list with status tabs
- `frontend/src/app/(portal)/return-authorizations/[id]/page.tsx` — Staff RA detail with actions
- `frontend/src/app/(portal)/return-authorizations/new/page.tsx` — Staff new RA creation

### Frontend — Shared Components
- `frontend/src/components/return-authorizations/ReturnAuthorizationStatusBadge.tsx` — Status badge
- `frontend/src/components/orders/order-detail/ReturnAuthorizationsSection.tsx` — Returns summary on order detail

### Frontend — Hooks & API
- `frontend/src/hooks/useReturnAuthorizations.ts` — React Query hooks (167 lines)
- `frontend/src/lib/api.ts` — API client methods and types

### Schema
- `backend/prisma/schema.prisma` — ReturnAuthorization, ReturnAuthorizationLine, ReturnAuthorizationCounter models; ReturnAuthorizationStatus, ReturnReason, ReturnResolution, StockMovementType enums

---

*This audit is a report only. No code changes were made.*
