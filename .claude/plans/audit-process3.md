# PROCESS 3 AUDIT: Make-to-Order (Manufacturing)

**Date:** 2026-02-08
**Auditor:** Claude Code (comprehensive codebase trace)
**Scope:** End-to-end manufacturing flow from BOM detection through finished goods into stock

---

## EXECUTIVE SUMMARY

The Make-to-Order manufacturing process has a **solid backend engine** but a **deficient frontend experience**. The core transaction logic — BOM consumption, finished goods production, and order status propagation — is well-built, atomic, and safe. However, the manufacturing worker is flying blind:

1. **No BOM components shown on job card** — the worker cannot see what raw materials are needed
2. **No raw material availability check before starting production** — worker can start with zero components
3. **No BOM snapshot at order time** — uses live BOM, which may have changed since the order was placed
4. **Transfer requests not checked in READY_TO_SHIP gate** — same bug as Process 1
5. **No dedicated manufacturing queue** — workers must navigate to generic job cards list

**Severity Assessment:** This process is approximately 65% complete. The transactional safety (stock movements, duplicate prevention, negative stock prevention) is excellent, but the human layer (worker UX, pre-checks, BOM visibility) is severely lacking. A manufacturing worker cannot effectively use this system without external reference documents.

---

## STEP-BY-STEP AUDIT TABLE

| # | Step | Status | UX | Automation | Safety Nets | Detail |
|---|------|--------|-----|------------|-------------|--------|
| 1 | Sales Order contains a BOM product | WORKS | N/A | N/A | PROTECTED | Product has `productType` field (ASSEMBLY_REQUIRED or MADE_TO_ORDER). BOM stored in `BomItem` model with `parentProductId`→`componentProductId` relationships, enforced unique per pair. Circular reference prevention via BFS validation inside serializable transaction. |
| 2 | Fulfillment orchestration detects BOM → creates Job Card | EXISTS_NOT_CONNECTED | INCOMPLETE | MULTI_STEP | PARTIAL | `isAssemblyProduct()` correctly detects ASSEMBLY_REQUIRED/MADE_TO_ORDER. `processAssemblyLine()` explodes BOM via `checkBomStock()`, builds `JobCardPlan` with component details + shortfall analysis. BUT: **Not auto-triggered.** Staff must (1) click "Fulfillment Plan", (2) review plan, (3) click "Execute". Should be automatic after payment confirmation (which itself doesn't exist — see Process 1 audit). Orchestration IS a single transaction. |
| 3 | Job Card shows finished product, quantity, BOM components, location | PARTIAL | INCOMPLETE | N/A | N/A | Job card detail page (`/job-cards/[id]`) shows: product SKU, description, quantity, order link, warehouse (JHB), status timeline, notes, assigned user, issues. **MISSING: BOM components list, component quantities, component stock levels.** The `getJobCardById()` API returns flat job card fields only — no BOM include. Worker has no visibility into what materials are needed. |
| 4 | Manufacturing worker views job card on dashboard | PARTIAL | INCOMPLETE | N/A | N/A | Fulfillment dashboard (`/fulfillment`) has `JobsInProgressSection` showing recent job cards with status, SKU, quantity, order link. Dedicated `/job-cards` list page with status/type filters. BUT: **No dedicated manufacturing queue view** — same page for all roles. No priority sorting, no urgency indicators, no "assigned to me" filter, no grouping by order. |
| 5 | Worker confirms raw material availability | MISSING | NO_UI | N/A | UNPROTECTED | **CRITICAL GAP.** No UI exists to check raw material availability on the job card detail page. The `checkBomStock()` function exists in `bom.service.ts` (checks all components, calculates shortfalls, separates optional from required) — but it is only called during fulfillment plan generation, NOT accessible from the job card UI. Worker has no way to verify materials are ready before starting production. |
| 6 | Worker starts production (PENDING → IN_PROGRESS) | WORKS | CLEAR | ONE_CLICK | UNPROTECTED | `startJobCard()`: Validates status is PENDING, sets IN_PROGRESS + `startedAt` timestamp. One-click with `window.confirm()` dialog. **BUT: No pre-check on raw material availability.** Worker can start a job with zero components in stock. The `startJobCard()` function at `job-card.service.ts:355-384` does NO stock check — just a status transition. |
| 7 | Worker marks job card COMPLETED (IN_PROGRESS → COMPLETE) | WORKS | CLEAR | ONE_CLICK | PROTECTED | `completeJobCard()` at `job-card.service.ts:467-601`: One-click with `window.confirm()` dialog. Button disabled while mutation is pending. Entire completion is a single Prisma `$transaction`. If any step fails (including negative stock), everything rolls back. |
| 8a | System consumes BOM components (MANUFACTURE_OUT) | WORKS | N/A | AUTO | PROTECTED | Inside transaction: queries live BOM (`isOptional: false` only), calculates `Math.ceil(bom.quantity × jobCard.quantity)` per component. For each: `updateStockLevel(tx, componentId, 'JHB', {onHand: -consumedQty})` + `createStockMovement(tx, {movementType: 'MANUFACTURE_OUT', referenceType: 'JobCard', ...})`. **Golden Rule 1 compliance: Every stock change has a StockMovement record with job card reference.** |
| 8b | System adds finished product to stock (MANUFACTURE_IN) | WORKS | N/A | AUTO | PROTECTED | Inside same transaction: `updateStockLevel(tx, productId, 'JHB', {onHand: +quantity})` + `createStockMovement(tx, {movementType: 'MANUFACTURE_IN', referenceType: 'JobCard', ...})`. Finished product added BEFORE components consumed (steps 8b before 8a in code). |
| 9 | Job card completion triggers Sales Order status check | WORKS | N/A | AUTO | PARTIAL | Inside same transaction: Queries all job cards + all picking slips for the order. If `allJobsComplete && allPickingComplete` → order status set to READY_TO_SHIP. If partial → CONFIRMED moves to PROCESSING. **BUG: Does NOT check transfer request status** (same as Process 1 step 16). CT customer orders can go READY_TO_SHIP while JHB→CT transfer is still in transit. |
| 10 | Finished product available for picking | WORKS | N/A | AUTO | PROTECTED | After job card completion, finished product `onHand` is incremented at JHB. If a picking slip exists for the same product, it can now be picked. If CT customer, a transfer request handles JHB→CT move. Natural flow back into Process 1 step 13. |

---

## SAFETY NET AUDIT

| # | Safety Net | Status | Detail | Code Location |
|---|-----------|--------|--------|---------------|
| 1 | PREVENT DUPLICATE STOCK MOVEMENTS | **PROTECTED** | `completeJobCard()` checks `jobCard.status !== 'IN_PROGRESS'` before proceeding. `JOB_CARD_STATUS_TRANSITIONS` defines COMPLETE as terminal (empty array — no valid outgoing transitions). Second click returns `{success: false, error: 'Cannot complete a job card with status COMPLETE'}`. Transaction ensures all-or-nothing. | `job-card.service.ts:8-13, 483-484` |
| 2 | PREVENT NEGATIVE STOCK | **PROTECTED** | `updateStockLevel()` validates `newOnHand >= 0` BEFORE committing. If ANY component would go negative, throws error, transaction rolls back entirely — job card status reverted to IN_PROGRESS, no movements created. All four stock fields (onHand, softReserved, hardReserved, onOrder) validated. | `inventory.service.ts:643-655` |
| 3 | PREVENT MANUFACTURING WITHOUT RAW MATERIALS | **UNPROTECTED** | **CRITICAL.** `startJobCard()` performs NO stock check. Worker can start production (PENDING→IN_PROGRESS) without any raw materials in stock. The check only happens at COMPLETION time when `updateStockLevel` would fail if components are insufficient. This means: worker spends time manufacturing, then discovers at completion that components are insufficient. The BOM stock check function (`checkBomStock`) exists but is NOT called on job start. | `job-card.service.ts:355-384` (no stock check), `bom.service.ts:544-661` (check exists, unused here) |
| 4 | STATUS REGRESSION | **PROTECTED** | `JOB_CARD_STATUS_TRANSITIONS` enforces: COMPLETE→[] (terminal, no transitions). ON_HOLD can only go to IN_PROGRESS. IN_PROGRESS can go to ON_HOLD or COMPLETE. Every status change validates against this map. A completed job card cannot be reopened. | `job-card.service.ts:8-13` |
| 5 | BOM ACCURACY (Snapshot vs Live) | **UNPROTECTED** | **Job card does NOT snapshot BOM at creation time.** At completion, `completeJobCard()` queries LIVE BOM: `tx.bomItem.findMany({where: {parentProductId: jobCard.productId, isOptional: false}})`. If BOM was modified between order creation and job completion (new component added, quantity changed, component removed), the ACTUAL consumption differs from what was PLANNED at orchestration time. No `bomSnapshot` field exists on JobCard model. This creates: (a) cost reconciliation problems, (b) unexpected component consumption, (c) potential negative stock if new components don't have sufficient stock. | `job-card.service.ts:524-529` (live query), `orchestration.service.ts:574` (plan-time check uses `checkBomStock` but result not stored on job card) |
| 6 | TRANSFER REQUEST CHECK IN READY_TO_SHIP | **UNPROTECTED** | **Same bug as Process 1.** Both `completeJobCard()` and `completePicking()` check only job cards + picking slips. Neither checks transfer request status. For CT customers with JHB assembly + JHB→CT transfer, order can go READY_TO_SHIP while transfer is still PENDING or IN_TRANSIT. | `job-card.service.ts:558-590`, `picking-slip.service.ts:519-550` |
| 7 | CONCURRENT JOB CARD COMPLETION | **PARTIAL** | Default transaction isolation (READ_COMMITTED) used for `completeJobCard()`. Two concurrent job cards for different orders consuming the same component could both read sufficient stock, both proceed, and one could fail at commit time. This is mitigated by the negative stock check in `updateStockLevel`, but the error would be opaque ("Cannot reduce onHand below 0") rather than a meaningful "insufficient raw materials" message. | `job-card.service.ts:491` (no isolation level specified) |

---

## AUTOMATION GAPS (Required vs Actual)

### Must Be AUTOMATIC (Zero Clicks) — Per Requirements

| Automation | Required | Actual | Gap |
|-----------|----------|--------|-----|
| Fulfillment detects BOM → Job Card created | AUTO | **MANUAL (3 clicks)** | Staff must: (1) click "Fulfillment Plan", (2) review plan, (3) click "Execute". Job card creation is part of orchestration execution but orchestration itself is not auto-triggered. |
| Job card completed → BOM consumed + FG added | AUTO | **WORKS** | `completeJobCard()` handles all stock movements atomically in a single transaction. No manual steps. |
| Job card completed → SO status check & propagation | AUTO | **PARTIAL (BUG)** | Status propagation IS automatic. But does NOT check transfer requests — only checks job cards + picking slips. CT customer orders may transition prematurely. |

### Must Be ONE CLICK with Confirmation — Per Requirements

| Action | Required | Actual | Gap |
|--------|----------|--------|-----|
| Start production | ONE_CLICK | **WORKS (no pre-check)** | "Start Job" button with `window.confirm()`. One-click works. BUT: No raw material pre-check. Worker starts blind. |
| Complete job card | ONE_CLICK | **WORKS** | "Complete Job" button with `window.confirm()`. One-click triggers entire manufacturing transaction. |

---

## FRONTEND UX EVALUATION

### Staff Portal — Job Card Detail (`/job-cards/[id]`)

- **FLOW LOGIC:** INCOMPLETE — Product info shown (SKU, description, quantity). Order link works. Status timeline (Created → In Progress → On Hold → Complete) is clear. Action buttons correctly gated by status (Start when PENDING, Hold/Complete when IN_PROGRESS, Resume when ON_HOLD). BUT: **No BOM components section. No raw material status. No stock availability check.**
- **FIELD COMPLETENESS:** Shows: job card number, status badge, job type badge, product SKU, description, quantity, order link, warehouse (JHB), assigned user, timestamps, notes (editable), issues. **MISSING: BOM components table with required quantities, available stock per component, shortfall indicators, product links for components.**
- **FIELD ORDER:** Header → Product Details → Notes → Sidebar (Details, Status Timeline, Issues). Acceptable but incomplete.
- **ROLE CLARITY:** Same page for all roles (ADMIN, MANAGER, SALES, WAREHOUSE). No role-specific views. A manufacturing worker sees the same page as a sales person.
- **STATUS VISIBILITY:** Status timeline component with colored dots (green=complete, blue=current, amber=on hold). Clear for status. No BOM progress indicator.
- **NAVIGATION:** Link to parent order works. No link to product detail for BOM management. No link to stock levels for components.

### Staff Portal — Job Cards List (`/job-cards`)

- **FLOW LOGIC:** ADEQUATE — List with status and job type filters. Pagination. Links to detail pages.
- **FIELD COMPLETENESS:** Shows: job card number, order number, SKU, description, quantity, job type, status, assigned user, dates. Adequate for list view.
- **ROLE CLARITY:** INCOMPLETE — No "Assigned to me" filter. No priority/urgency indicators. No overdue markers. Manufacturing worker must manually scan list for their assignments.
- **NAVIGATION:** Links to job card detail and parent order. Good.

### Fulfillment Dashboard — Jobs Section (`/fulfillment`)

- **FLOW LOGIC:** CLEAR — Shows counts (pending, in progress, on hold) and recent items with status badges. Link to full list.
- **FIELD COMPLETENESS:** Summary level only. Shows: job card number, status, type, SKU, quantity, assigned user, order link, date. Appropriate for dashboard.
- **ROLE CLARITY:** PARTIAL — Dashboard is for all internal staff. No manufacturing-specific view.

---

## CRITICAL MISSING PIECES (Priority Order)

### P0 — Manufacturing Process Gaps

1. **BOM Components Display on Job Card** — Manufacturing worker MUST see:
   - List of required components (from BOM)
   - Quantity needed per component (BOM qty × job qty)
   - Current stock level per component at JHB
   - Shortfall indicator (red if insufficient)
   - Links to component products
   - This requires: (a) `getJobCardById()` to include BOM data, or (b) separate API call to `getBom(productId)` + stock levels, (c) new UI section on job card detail page

2. **Raw Material Availability Pre-Check on Start** — `startJobCard()` must:
   - Call `checkBomStock(productId, quantity, 'JHB')` before allowing start
   - If `canFulfill === false`: warn user with shortfall details, optionally block
   - At minimum: soft warning ("Components X, Y have insufficient stock — proceed anyway?")
   - At maximum: hard block (cannot start without all components available)

3. **BOM Snapshot at Order/Plan Time** — When orchestration creates a job card:
   - Snapshot the BOM as it exists at that moment (store in a `JobCardBomSnapshot` model or JSON field)
   - At completion, consume from the SNAPSHOT, not the live BOM
   - This prevents: (a) unexpected consumption of newly-added components, (b) cost reconciliation issues, (c) worker confusion about what changed

### P1 — Operational Gaps

4. **Transfer Request Check in READY_TO_SHIP Gate** — Both `completeJobCard()` and `completePicking()` must also check `allTransfers.every(tr => tr.status === 'RECEIVED')` before setting READY_TO_SHIP. Same fix as Process 1 P1 item 6.

5. **Manufacturing Queue View** — Dedicated view for manufacturing workers:
   - Filter by "Assigned to me"
   - Priority/urgency sorting (order date, due date)
   - Grouping by order
   - Component availability status per job card (green/amber/red)
   - Quick-start button from list view

6. **Fulfillment Orchestration Auto-Trigger** — Should be automatic after payment confirmation (depends on payment recording from Process 1 P0 item 1 being built first).

### P2 — Quality Gaps

7. **Component Reservation at Job Start** — Currently, BOM component reservations are created at orchestration execution time (if available). But there's a gap: between orchestration and job start, other orders' picking slips could consume the reserved components. Consider creating `HARD` reservations for BOM components when job starts, not just at orchestration.

8. **Job Card Cancellation** — No cancel function exists. If a job card needs to be abandoned (e.g., product defect, order cancelled), there's no way to cancel it and release associated reservations. Status machine has no CANCELLED state.

9. **Partial Completion** — No concept of producing fewer units than planned. If ordered 100 but only 80 can be made (component shortage), worker must either complete the full 100 (impossible if components insufficient) or leave the job IN_PROGRESS indefinitely. No partial completion or quantity override.

10. **Manufacturing Lead Time Tracking** — `startedAt` and `completedAt` exist but no reporting/dashboard uses them. No lead time analysis, no bottleneck identification, no capacity planning.

---

## ROLE-BASED EXPERIENCE EVALUATION

### Manufacturing Worker Experience
- **Pain Points:** Cannot see BOM components on job card. Cannot check raw material availability. No "my jobs" queue. Must navigate to generic list page. No priority indicators. Can start a job with zero materials available — discovers the problem only at completion time (transaction failure).
- **Missing Tools:** BOM component display with stock levels, raw material availability check, "assigned to me" filter, priority sorting, partial completion, component pick-list printout.
- **Rating:** 3/10 — Status transitions work but worker has no visibility into WHAT to build or WHETHER they can build it.

### Warehouse Manager Experience
- **Pain Points:** No manufacturing capacity overview. No lead time reporting. No bottleneck alerts. No component shortfall early warning. Cannot see which jobs are blocked by material shortages.
- **Working Well:** Fulfillment dashboard shows job counts. Job card list with filters. Status timeline on detail page.
- **Rating:** 4/10 — Can see job cards exist but lacks operational intelligence.

### Sales Person Experience
- **Pain Points:** Cannot see manufacturing status from order detail in a meaningful way (job cards listed but no BOM progress). Cannot estimate manufacturing completion time. No notification when manufacturing completes.
- **Working Well:** Order detail shows linked job cards with status badges. Can navigate to job card detail.
- **Rating:** 5/10 — Visibility exists but lacks actionable information.

### Customer Experience
- **Pain Points:** No visibility into manufacturing progress. Customer sees order status but not "your custom product is being manufactured." No estimated completion date.
- **Working Well:** Customer cannot see internal manufacturing details (Golden Rule 4 compliance). Order status eventually reflects completion.
- **Rating:** N/A — Customers correctly see no manufacturing details (by design). But lack of estimated delivery date is a gap.

---

## DATA INTEGRITY RISKS

1. **Live BOM Mutation During Active Jobs** — A product manager can modify a BOM (add/remove/change quantities) while an active job card exists for that product. The job card was planned with BOM version A but will consume BOM version B. No warning, no lock, no snapshot. This is the highest data integrity risk in this process.

2. **Component Reservation Integrity** — Orchestration creates component reservations for job cards at plan execution time. But `completeJobCard()` does NOT release these reservations — it only decrements `onHand`. The `hardReserved` count for components may remain inflated after job completion. Compare with `completePicking()` which DOES release reservations (lines 487-516). This creates permanently orphaned hard reservations for BOM components.

3. **No Job Card → StockMovement Back-Link** — While `StockMovement.referenceId` links movements TO job cards, the `JobCard` model has no field listing its generated stock movements. To audit what a job card consumed, you must query StockMovement by referenceId — functional but not a direct relationship.

4. **Concurrent BOM Modification During Completion** — If two users simultaneously: (a) modify a BOM and (b) complete a job card for that product, the completion transaction reads the BOM inside a default READ_COMMITTED transaction. The modification could commit between the BOM read and the stock updates, leading to inconsistent consumption. Serializable isolation on `completeJobCard()` would prevent this but isn't currently used.

---

## FILES EXAMINED

### Backend Services
- `backend/src/services/job-card.service.ts` — Job card lifecycle, createJobCard, startJobCard, completeJobCard (with BOM consumption + stock movements + order propagation)
- `backend/src/services/bom.service.ts` — BOM CRUD, circular reference prevention, explodeBom, checkBomStock
- `backend/src/services/orchestration.service.ts` — Fulfillment plan generation (BOM detection via isAssemblyProduct), plan execution (createJobCardFromPlan), component shortage → PO generation
- `backend/src/services/inventory.service.ts` — updateStockLevel (with negative stock validation), createStockMovement
- `backend/src/services/picking-slip.service.ts` — completePicking (parallel READY_TO_SHIP gate check, same bug)

### Backend API Routes
- `backend/src/api/v1/job-cards/route.ts` — 8 endpoints (list, get, create, assign, start, hold, resume, complete, notes)

### Frontend Pages
- `frontend/src/app/(portal)/job-cards/page.tsx` — Job cards list with status/type filters
- `frontend/src/app/(portal)/job-cards/[id]/page.tsx` — Job card detail (NO BOM display)
- `frontend/src/app/(portal)/fulfillment/page.tsx` — Fulfillment dashboard

### Frontend Components
- `frontend/src/components/fulfillment/dashboard/JobsInProgressSection.tsx` — Dashboard jobs section
- `frontend/src/components/job-cards/JobCardListTable.tsx` — Reusable list table
- `frontend/src/components/job-cards/JobCardStatusBadge.tsx` — Status indicator
- `frontend/src/components/job-cards/JobTypeBadge.tsx` — Job type indicator

### Frontend Hooks
- `frontend/src/hooks/useJobCards.ts` — All job card mutations and queries

### Schema
- `backend/prisma/schema.prisma` — JobCard model (lines 986-1026), BomItem model (lines 1464-1487), StockMovement model (lines 1243-1267), StockLevel model (lines 1215-1241)

### Tests
- `tests/integration/stock-flows.test.ts` — Manufacturing flow tests (MANUFACTURE_IN/OUT verification)

---

*This audit is a report only. No code changes were made.*
