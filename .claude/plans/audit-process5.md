# PROCESS 5 AUDIT: Inventory Operations (Day-to-Day Warehouse Management)

**Date:** 2026-02-08
**Auditor:** Claude Code (comprehensive codebase trace)
**Scope:** End-to-end business processes for stock adjustments, warehouse transfers, cycle counts, and reorder reporting

---

## EXECUTIVE SUMMARY

The Inventory Operations process is the most complete of all audited processes. All four sub-processes (adjustments, transfers, cycle counts, reorder reporting) have full backend services, API routes, and frontend pages. The critical safety nets — negative stock prevention, approval workflows, status guards — are implemented and functional. Key gaps are:

1. **No confirmation dialog on stock adjustment approval** — one-click approval without "are you sure?"
2. **Warehouse workers cannot create adjustments** — only ADMIN/MANAGER can, contrary to business flow
3. **No standalone transfer UI** — backend API exists but no frontend page to create non-order-based transfers
4. **Read-then-write stock level updates** — not using atomic increments, concurrent edit risk under load
5. **No scheduled reorder alerts** — reorder detection is query-based only, no proactive notifications
6. **Cycle count reconciliation creates PENDING adjustment** — requires separate approval step (two-click, not one)

**Severity Assessment:** This process is approximately 80% complete. The "happy path" works end-to-end for all four sub-processes. The remaining gaps are primarily UX friction (missing confirmations, extra approval steps) and edge-case safety (concurrent edits, duplicate PO prevention).

---

## SUB-PROCESS 5A: STOCK ADJUSTMENTS

### Step-by-Step Audit Table

| # | Step | Status | UX | Automation | Safety Nets | Detail |
|---|------|--------|-----|------------|-------------|--------|
| 1 | Warehouse worker identifies discrepancy | N/A | N/A | N/A | N/A | Real-world step. System provides stock level visibility via inventory dashboard and item detail pages. WAREHOUSE role can view stock levels and movements. |
| 2 | Creates adjustment (product, location, new qty, reason) | EXISTS_NOT_CONNECTED | CLEAR | MANUAL | PARTIAL | **UI exists** at `/inventory/adjustments/new` with warehouse selector, reason dropdown (8 options), product search, line items. **BUT: Only ADMIN/MANAGER can create.** WAREHOUSE role is blocked by `requireRole('ADMIN', 'MANAGER')` on `POST /adjustments`. A warehouse worker discovering a discrepancy must ask a manager to create the adjustment, defeating the workflow. |
| 3 | Manager approves adjustment | WORKS | INCOMPLETE | ONE_CLICK | PARTIAL | `/inventory/adjustments/[id]` shows adjustment detail with Approve/Reject buttons (ADMIN/MANAGER only, PENDING status only). **BUG: No confirmation dialog on approval** — clicking Approve immediately fires the mutation. Rejection requires a reason (good). Approval should also have a `window.confirm()` gate. |
| 4 | Stock updated with ADJUSTMENT movement | WORKS | N/A | AUTO | PROTECTED | `approveStockAdjustment()` wraps everything in `prisma.$transaction`: (1) sets status=APPROVED with approvedAt/approvedBy, (2) per line: calls `updateStockLevel()` with delta, (3) per line: creates StockMovement (ADJUSTMENT_IN or ADJUSTMENT_OUT) with referenceType='StockAdjustment', referenceNumber=ADJ-YYYY-NNNNN, adjustmentReason. If any line fails negative stock check, entire transaction rolls back. |

### Adjustment-Specific Findings

| Finding | Status | Detail |
|---------|--------|--------|
| StockMovement created on every adjustment | **WORKS** | One movement per line, with full reference chain |
| Adjustment number generation | **WORKS** | ADJ-YYYY-NNNNN format, atomic counter in transaction |
| Negative stock prevention | **WORKS** | `updateStockLevel()` throws if `newOnHand < 0`, transaction rolls back |
| Status guards | **WORKS** | Only PENDING can be approved/rejected. Double-approval impossible. |
| Audit trail | **WORKS** | createdBy, approvedBy/At, rejectedBy/At/Reason all captured |
| `AdjustStockModal` on item detail | **WORKS** | Quick-adjust modal on `/inventory/items/[sku]` for ADMIN/MANAGER. Creates PENDING adjustment (same approval flow). |

---

## SUB-PROCESS 5B: WAREHOUSE TRANSFERS

### Step-by-Step Audit Table

| # | Step | Status | UX | Automation | Safety Nets | Detail |
|---|------|--------|-----|------------|-------------|--------|
| 1 | Staff creates transfer request | PARTIAL | CLEAR | MANUAL | PARTIAL | **Order-based:** `CreateTransferRequestModal` on order detail page (CONFIRMED/PROCESSING orders). Shows order lines with checkboxes, quantity input. Creates via `POST /transfer-requests/generate/:orderId`. **Standalone:** Backend API (`POST /transfer-requests`) and hook (`useCreateStandaloneTransferRequest`) exist but **NO frontend UI exists** — unreachable. Both paths hardcode JHB→CT (no reverse CT→JHB). No role check on create button visibility. |
| 2 | Source warehouse ships (TRANSFER_OUT) | WORKS | CLEAR | ONE_CLICK | PROTECTED | `/transfer-requests/[id]` has "Mark Shipped" button with `window.confirm()` dialog. `shipTransfer()`: status must be PENDING, wraps in transaction, per line: decreases source onHand via `updateStockLevel()` (negative stock check applies), creates TRANSFER_OUT movement with referenceType='TransferRequest'. Records shippedAt/By/ByName. |
| 3 | Destination warehouse receives (TRANSFER_IN) | WORKS | CLEAR | ONE_CLICK | PROTECTED | Same page has "Mark Received" button (only if all lines have received qty). `window.confirm()` dialog. Worker updates received quantities per line during IN_TRANSIT status. `receiveTransfer()`: status must be IN_TRANSIT, validates all lines have receivedQuantity > 0, wraps in transaction, per line: increases destination onHand, creates TRANSFER_IN movement. Supports partial receipt (receivedQuantity can differ from shipped quantity). |

### Transfer-Specific Findings

| Finding | Status | Detail |
|---------|--------|--------|
| StockMovement on ship | **WORKS** | TRANSFER_OUT per line, references transfer number |
| StockMovement on receive | **WORKS** | TRANSFER_IN per line, uses receivedQuantity (not original qty) |
| Negative stock on ship | **PROTECTED** | `updateStockLevel()` throws if source goes below 0 |
| Status guards (double ship) | **PROTECTED** | `shipTransfer()` requires status=PENDING, second call returns error |
| Status guards (double receive) | **PROTECTED** | `receiveTransfer()` requires status=IN_TRANSIT, second call returns error |
| Line received qty update guard | **PROTECTED** | `updateLineReceived()` explicitly checks status=IN_TRANSIT |
| Source = destination prevention | **PROTECTED (by design)** | Both order-based and standalone hardcode JHB→CT. No explicit validation exists — if refactored to accept dynamic locations, this check would be missing. |
| Reverse direction (CT→JHB) | **MISSING** | Hardcoded JHB→CT only. No CT→JHB transfer capability. |
| Standalone transfer UI | **MISSING** | Backend + hooks ready, but no page/modal for creating stock replenishment transfers without an order. |
| Completed transfer reversal | **NOT POSSIBLE** | RECEIVED has empty transition array. Corrections require manual stock adjustments. |
| Transfer notes | **WORKS** | Editable via PATCH endpoint on detail page. |

---

## SUB-PROCESS 5C: CYCLE COUNTS

### Step-by-Step Audit Table

| # | Step | Status | UX | Automation | Safety Nets | Detail |
|---|------|--------|-----|------------|-------------|--------|
| 1 | Manager creates count session | WORKS | CLEAR | MANUAL | PROTECTED | `/inventory/cycle-counts/new` — warehouse selector, notes field, product search with autocomplete. `createCycleCountSession()` snapshots `systemQuantity` per product at creation time. Generates CC-YYYY-NNNNN number. ADMIN/MANAGER/WAREHOUSE can create. |
| 2 | Workers count physical stock | WORKS | CLEAR | MANUAL | PROTECTED | `/inventory/cycle-counts/[id]` — input fields for counted quantities per line. **Blind counting implemented:** `systemQuantity` column is conditionally hidden when status is OPEN or IN_PROGRESS (`isCountingMode` flag). Workers cannot see expected quantities. Save Progress button submits partial counts. Auto-transitions OPEN→IN_PROGRESS on first submission. Records countedBy/countedAt per line. |
| 3 | System compares counted vs expected | WORKS | CLEAR | AUTO | PROTECTED | After "Complete Count" (requires all lines counted), system calculates `variance = countedQuantity - systemQuantity` per line. COMPLETED status reveals system quantities, variance column with visual indicators (green/red), and variance summary cards (Lines with Variance, Surplus, Shortage, Net Variance). |
| 4 | Discrepancies reviewed | WORKS | CLEAR | N/A | PROTECTED | Manager reviews variance summary on completed session page. Can see each line's system qty, counted qty, variance, and notes. |
| 5 | Adjustments created for confirmed differences | WORKS | MULTI_STEP | SEMI_AUTO | PARTIAL | "Reconcile" button (ADMIN/MANAGER only, with inline confirmation dialog). `reconcileCycleCountSession()`: if variances exist, calls `createStockAdjustment()` with reason=CYCLE_COUNT. Links adjustment back to session (adjustmentId/Number stored). If no variances, marks RECONCILED directly. **BUT: Adjustment is created as PENDING** — requires separate approval step before stock is actually updated. This is a two-step process (reconcile → approve) instead of one. |

### Cycle Count-Specific Findings

| Finding | Status | Detail |
|---------|--------|--------|
| Blind counting | **WORKS** | systemQuantity hidden during OPEN/IN_PROGRESS via conditional rendering |
| System qty snapshot | **WORKS** | Captured at session creation, immutable during counting |
| Variance calculation | **WORKS** | Auto-computed on line submission: `countedQuantity - systemQuantity` |
| Adjustment generation | **WORKS** | Auto-creates StockAdjustment with CYCLE_COUNT reason and session link |
| StockMovement creation | **DEFERRED** | Movements only created when generated adjustment is separately approved |
| Completion guard | **WORKS** | Cannot complete if any line has null countedQuantity |
| Reconcile guard | **WORKS** | Must be COMPLETED status, ADMIN/MANAGER only |
| Cancel guard | **WORKS** | Cannot cancel RECONCILED sessions. OPEN/IN_PROGRESS/COMPLETED cancellable. |
| Session-to-adjustment link | **WORKS** | CycleCountSession stores adjustmentId/adjustmentNumber. UI shows link. |
| Reconcile confirmation | **WORKS** | Inline toggle confirmation (not window.confirm, but explicit user action) |

---

## SUB-PROCESS 5D: REORDER REPORTING

### Step-by-Step Audit Table

| # | Step | Status | UX | Automation | Safety Nets | Detail |
|---|------|--------|-----|------------|-------------|--------|
| 1 | System flags products below reorder point | WORKS | CLEAR | QUERY_BASED | PROTECTED | `getLowStockProducts()` uses `computeStockStatus()`: `available = onHand - hardReserved`, LOW_STOCK when `available <= effectiveReorderPoint`. Reorder point resolution: StockLevel-specific override OR Product.defaultReorderPoint. `/inventory/reorder` page shows all below-reorder items. **NOT event-driven** — detection is on-demand query only, no scheduled alerts. |
| 2 | Grouped by supplier | WORKS | CLEAR | AUTO | N/A | Frontend `groupBySupplier()` groups items by `supplier.id`, sorted alphabetically. Toggle between grouped view (collapsible supplier sections) and flat table. Supplier header shows name, code, item count. |
| 3 | Purchaser reviews and creates Draft POs | WORKS | CLEAR | SEMI_AUTO | PARTIAL | `/inventory/reorder` — summary cards (Below Reorder Point, Out of Stock, Suppliers Affected, Total Shortfall). Filter by severity, warehouse, supplier. Checkboxes to select items. "Generate Draft PO(s)" button (ADMIN/MANAGER/PURCHASER). Creates one DRAFT PO per supplier with selected items. Quantity = `reorderQuantity ?? shortfall`. Unit cost from Product.costPrice. Auto-navigates to PO if single supplier. **BUT: No duplicate PO detection** — can generate multiple POs for same supplier/products. No check for existing open POs covering same items. |

### Reorder-Specific Findings

| Finding | Status | Detail |
|---------|--------|--------|
| Reorder point detection | **WORKS** | Location-specific overrides + product defaults |
| Shortfall calculation | **WORKS** | `Math.max(0, reorderPoint - available)` |
| Suggested quantity | **WORKS** | Uses `reorderQuantity` if set, falls back to shortfall |
| Supplier grouping | **WORKS** | Frontend grouping by supplier.id with bulk selection |
| Draft PO generation | **WORKS** | One PO per supplier, DRAFT status, proper line items |
| Duplicate product in PO | **PROTECTED** | `addPurchaseOrderLine()` rejects duplicate productId in same PO |
| Duplicate PO for supplier | **UNPROTECTED** | No check for existing open POs covering same supplier/products |
| Inactive supplier check | **PROTECTED** | `createPurchaseOrder()` validates supplier.isActive |
| PO approval workflow | **WORKS** | Generated POs are DRAFT, require PENDING_APPROVAL→APPROVED flow |
| Self-approval prevention | **PROTECTED** | PO creator cannot approve their own PO |
| Scheduled reorder alerts | **MISSING** | No cron job or event-driven notification for low stock |
| Low stock on dashboard | **WORKS** | Inventory dashboard shows low stock alerts section |

---

## SAFETY NET AUDIT

| # | Safety Net | Status | Detail | Code Location |
|---|-----------|--------|--------|---------------|
| 1 | PREVENT NEGATIVE STOCK | **PROTECTED** | `updateStockLevel()` validates `newOnHand >= 0`, `newSoftReserved >= 0`, `newHardReserved >= 0`, `newOnOrder >= 0` before write. Throws error if violated, transaction rolls back. Applies to ALL stock-changing operations: adjustments, transfers, picking, manufacturing, GRVs. | `inventory.service.ts:644-655` |
| 2 | PREVENT UNAPPROVED ADJUSTMENTS | **PROTECTED** | `POST /adjustments` requires ADMIN or MANAGER role. `POST /adjustments/:id/approve` also requires ADMIN/MANAGER. WAREHOUSE workers cannot create OR approve adjustments. Stock changes only occur inside `approveStockAdjustment()` which requires PENDING status. **Side effect:** Warehouse workers cannot self-report discrepancies — they must ask a manager. | `route.ts:382` (create), `route.ts:454` (approve) |
| 3 | PREVENT TRANSFER TO SAME WAREHOUSE | **PROTECTED (by design)** | Both `createTransferRequest()` and `createStandaloneTransferRequest()` hardcode `fromLocation: 'JHB'` and `toLocation: 'CT'`. No user input for warehouse selection. **Risk:** If code is refactored to accept dynamic locations, no explicit `from !== to` validation exists. | `transfer-request.service.ts:125-126, 183-184` |
| 4 | CONCURRENT EDIT PROTECTION | **PARTIAL** | `updateStockLevel()` uses **read-then-write** pattern (read current → compute new → write absolute) inside a Prisma transaction. Transaction isolation prevents raw corruption, but does NOT use Prisma atomic `{ increment: delta }` pattern. No optimistic locking (version fields) on any inventory model. Under high concurrency (two simultaneous adjustments on same product), last write wins without conflict detection. | `inventory.service.ts:619-666` |
| 5 | STATUS REGRESSION | **PROTECTED** | **Adjustments:** PENDING→APPROVED or PENDING→REJECTED only. No reverse transitions. **Transfers:** PENDING→IN_TRANSIT→RECEIVED, each status has explicit guard. RECEIVED has empty transition array. **Cycle Counts:** OPEN→IN_PROGRESS→COMPLETED→RECONCILED, with CANCELLED as terminal from OPEN/IN_PROGRESS/COMPLETED. RECONCILED cannot be cancelled. No status can go backwards. **Reversal:** None of the three document types can be "undone" — corrections require new stock adjustments. | Status transition maps in each service |
| 6 | PREVENT DUPLICATE TRANSFERS | **PROTECTED** | `shipTransfer()` requires status=PENDING (cannot re-ship). `receiveTransfer()` requires status=IN_TRANSIT (cannot re-receive). Status set atomically in transaction. Second call on same transfer returns error. `updateLineReceived()` requires IN_TRANSIT status. | `transfer-request.service.ts:413, 547` |

---

## AUTOMATION GAPS (Required vs Actual)

### Must Be AUTOMATIC (Zero Clicks) — Per Requirements

| Automation | Required | Actual | Gap |
|-----------|----------|--------|-----|
| Adjustment approved → stock updated with movement | AUTO | **WORKS** | Stock + movement created atomically in same transaction on approval. |
| Transfer shipped → source stock decreased with TRANSFER_OUT | AUTO | **WORKS** | `shipTransfer()` creates movements per line in transaction. |
| Transfer received → destination stock increased with TRANSFER_IN | AUTO | **WORKS** | `receiveTransfer()` creates movements per line in transaction. |
| Cycle count discrepancies → adjustment pre-created | AUTO | **PARTIAL** | Reconciliation creates PENDING adjustment. But that adjustment then requires **separate approval** before stock is actually updated. Two-step instead of one. |
| Products below reorder → flagged for review | AUTO | **QUERY-BASED** | `getLowStockProducts()` returns flagged items on demand. No proactive notification, scheduled alert, or dashboard badge update. |

### Must Be ONE CLICK with Confirmation — Per Requirements

| Action | Required | Actual | Gap |
|--------|----------|--------|-----|
| Approve adjustment | ONE_CLICK | **ONE_CLICK (no confirm)** | Approve button fires immediately. **Missing `window.confirm()` dialog.** Rejection has reason form (good). |
| Ship transfer | ONE_CLICK | **WORKS** | "Mark Shipped" with `window.confirm()` dialog. |
| Receive transfer | ONE_CLICK | **WORKS** | "Mark Received" with `window.confirm()` dialog. Pre-validates all lines have received qty. |
| Confirm cycle count discrepancy | ONE_CLICK | **TWO_CLICK** | Reconcile (with confirmation) creates PENDING adjustment. Then must separately navigate to adjustment and approve it. Should be reconcile+approve in one action. |

---

## FRONTEND UX EVALUATION

### Staff Portal — Inventory Dashboard (`/inventory`)
- **FLOW LOGIC:** CLEAR — Role-based section ordering (WAREHOUSE sees different order than MANAGER). Summary bar with key metrics. Sections for low stock, pending adjustments, active cycle counts, recent movements.
- **FIELD COMPLETENESS:** Good — SKU counts, stock values, warehouse breakdowns (JHB/CT), low stock alerts with product links.
- **ROLE CLARITY:** GOOD — Different section ordering per role. CUSTOMER blocked entirely.
- **STATUS VISIBILITY:** Pending adjustments count, active cycle count count visible.
- **NAVIGATION:** Links to low stock items, pending adjustments, cycle count sessions.

### Staff Portal — Stock Adjustment Create (`/inventory/adjustments/new`)
- **FLOW LOGIC:** CLEAR — Select warehouse, reason, search products, set quantities, submit.
- **FIELD COMPLETENESS:** Warehouse selector, reason dropdown (8 options), notes, product search with autocomplete, line items table.
- **VALIDATION:** Quantities must be >= 0. Duplicate products prevented. At least one line required.
- **ROLE CLARITY:** ADMIN/MANAGER only. WAREHOUSE workers cannot access.
- **PAIN POINT:** Warehouse workers — the people who discover discrepancies — cannot create adjustments.

### Staff Portal — Stock Adjustment Detail (`/inventory/adjustments/[id]`)
- **FLOW LOGIC:** INCOMPLETE — Approve/Reject buttons for PENDING status. Status banner for APPROVED/REJECTED. **Approve has no confirmation dialog.**
- **FIELD COMPLETENESS:** Adjustment #, location, reason, created date/by, line items with current/adjusted/change, net change footer.
- **ROLE CLARITY:** ADMIN/MANAGER see action buttons. Others see read-only.
- **NAVIGATION:** Product links in line items.

### Staff Portal — Cycle Count Detail (`/inventory/cycle-counts/[id]`)
- **FLOW LOGIC:** CLEAR — Well-designed multi-phase UI. OPEN/IN_PROGRESS: counting mode with blind counting. COMPLETED: review variances. RECONCILED: shows linked adjustment.
- **FIELD COMPLETENESS:** Excellent — session info, progress bar, counting inputs, variance summary cards, system qty (revealed after counting), notes per line.
- **ROLE CLARITY:** GOOD — WAREHOUSE can count, ADMIN/MANAGER can reconcile.
- **STATUS VISIBILITY:** Clear status banner, progress bar for counting completion.
- **NAVIGATION:** Link to generated stock adjustment after reconciliation.

### Staff Portal — Reorder Report (`/inventory/reorder`)
- **FLOW LOGIC:** CLEAR — Summary cards → filter → select → generate POs. Grouped and flat view modes.
- **FIELD COMPLETENESS:** Excellent — SKU, description, supplier, warehouse, on hand, available, on order, reorder point, shortfall, suggested qty, lead time, status.
- **ROLE CLARITY:** GOOD — Generate button restricted to ADMIN/MANAGER/PURCHASER.
- **STATUS VISIBILITY:** Severity tabs (All, Out of Stock, Low Stock). Status badges per item.
- **NAVIGATION:** Success banner shows created PO numbers. Auto-redirect for single PO.

### Staff Portal — Transfer Request Detail (`/transfer-requests/[id]`)
- **FLOW LOGIC:** CLEAR — Status-dependent actions. PENDING: ship button. IN_TRANSIT: update received qty + receive button. RECEIVED: read-only.
- **FIELD COMPLETENESS:** Transfer #, status, route visualization (JHB→CT), lines table, notes, sidebar with details/timeline.
- **ROLE CLARITY:** PARTIAL — No role restriction on action buttons. Any authenticated user can ship/receive.
- **CONFIRMATION:** Both ship and receive have `window.confirm()` dialogs.
- **NAVIGATION:** Link to parent order if order-based transfer.

---

## CRITICAL MISSING PIECES (Priority Order)

### P0 — Business-Breaking Gaps

*None identified for this process.* All core sub-processes function end-to-end.

### P1 — Operational Gaps

1. **Warehouse Workers Cannot Create Adjustments** — The intended business flow (worker discovers discrepancy → creates adjustment → manager approves) is broken because `POST /adjustments` requires ADMIN/MANAGER. WAREHOUSE role should be able to create adjustments (PENDING status, no stock change until approved). This forces managers to both discover AND record discrepancies, or requires out-of-band communication.

2. **No Standalone Transfer UI** — Backend API and frontend hook exist for creating stock replenishment transfers (not linked to orders), but no page or modal allows users to create them. Only order-based transfers can be created from the UI. Stock balancing between warehouses requires manual workaround.

3. **No Reverse Transfer (CT→JHB)** — Both order-based and standalone transfer paths hardcode `fromLocation: 'JHB'` and `toLocation: 'CT'`. There is no mechanism to transfer stock from Cape Town back to Johannesburg. This is a real operational need (overstock at CT, shortage at JHB).

4. **Cycle Count Reconciliation Creates PENDING Adjustment** — Reconciliation should optionally auto-approve the adjustment (one-click reconcile+apply) instead of requiring a separate approval step. Current flow: reconcile → navigate to adjustment → approve → stock updated. Expected flow: reconcile → stock updated.

### P2 — Quality Gaps

5. **Missing Confirmation on Adjustment Approval** — `handleApprove()` fires immediately on button click. Should have `window.confirm('Apply these stock changes?')` gate. This is inconsistent with transfer ship/receive which both have confirmations.

6. **No Duplicate PO Detection on Reorder** — `handleGeneratePOs()` creates new DRAFT POs without checking for existing open POs covering the same supplier/products. Staff can accidentally generate duplicate POs by clicking the button twice or running the report on consecutive days.

7. **Read-Then-Write Stock Updates** — `updateStockLevel()` reads current value, computes in JavaScript, writes absolute. Should use Prisma atomic `{ increment: delta }` for race condition safety. Current transaction isolation mitigates most risk, but not all concurrent scenarios.

8. **No Scheduled Reorder Notifications** — Reorder detection is query-based only (staff must visit the reorder page). No cron job, email alert, or dashboard notification proactively warns about low stock. Products can stay below reorder point indefinitely without anyone noticing.

9. **Transfer Role Access Too Broad** — All transfer request endpoints accept "any authenticated user." Ship and receive actions should be restricted to ADMIN/MANAGER/WAREHOUSE roles. Currently SALES and CUSTOMER (if they could reach the page) could theoretically ship/receive transfers.

10. **No Source≠Destination Validation** — While hardcoding prevents same-warehouse transfers today, no explicit business rule validation exists. If transfers are later refactored to accept dynamic locations, this safety net is missing.

---

## ROLE-BASED EXPERIENCE EVALUATION

### Warehouse Worker Experience
- **Pain Points:** Cannot create stock adjustments (must ask manager). No standalone transfer creation UI. No dedicated "my tasks" view for counting sessions assigned to them.
- **Working Well:** Cycle count counting mode is excellent (blind counting, save progress, line notes). Transfer receive workflow is clear with per-line quantities. Stock movement log visible.
- **Rating:** 6/10 — Core workflows work but key self-service capabilities are missing.

### Purchaser Experience
- **Pain Points:** Reorder page has no duplicate PO detection. No proactive low-stock alerts. Must remember to check reorder page regularly.
- **Working Well:** Reorder report is comprehensive with grouping, filtering, and one-click PO generation. PO approval workflow feeds into Process 2.
- **Rating:** 7/10 — Good tooling but reactive rather than proactive.

### Manager Experience
- **Pain Points:** Must manually create adjustments that warehouse workers discover. Cycle count reconciliation requires two steps (reconcile + approve). No approval queue across adjustment types.
- **Working Well:** Dashboard shows pending adjustments and active cycle counts. Adjustment approval detail page is informative (current vs adjusted, net change). Full movement audit trail.
- **Rating:** 7/10 — Good oversight but too much manual involvement in routine tasks.

### Admin Experience
- **Working Well:** Full access to all inventory operations. Reorder settings configurable per product/location. Movement log provides complete audit trail.
- **Rating:** 8/10 — Most complete experience of any role.

---

## DATA INTEGRITY RISKS

1. **Concurrent stock adjustments on same product** — Two managers approve adjustments for the same product simultaneously. `updateStockLevel()` reads current onHand, adds delta, writes new value. Under concurrent execution within separate transactions, the second write could overwrite the first. Both movements would be recorded, but the final onHand might not reflect both changes. Prisma atomic `{ increment }` would eliminate this risk.

2. **Stale system quantity in cycle counts** — `systemQuantity` is snapshotted at session creation. If stock changes occur between session creation and reconciliation (e.g., goods received, items picked), the variance calculation will be based on stale data. The generated adjustment will apply the counted quantity as the new absolute, potentially undoing legitimate stock changes that occurred during counting. **Mitigation:** Short cycle count windows, or re-snapshot at reconciliation time.

3. **Orphaned cycle count adjustments** — If `reconcileCycleCountSession()` is called, it creates a PENDING StockAdjustment. If that adjustment is never approved (forgotten), stock discrepancies persist. The cycle count session shows RECONCILED but stock is not actually corrected. No aging alert for unapproved adjustments.

4. **Reorder report generates POs without checking existing POs** — Running the reorder report on consecutive days and generating POs both times creates duplicate orders for the same supplier. The per-line duplicate check only prevents the same product appearing twice in one PO, not across POs.

---

## FILES EXAMINED

### Backend Services
- `backend/src/services/inventory.service.ts` — Stock levels, movements, adjustments, reservations (1,810 lines)
- `backend/src/services/cycle-count.service.ts` — Cycle count lifecycle (494 lines)
- `backend/src/services/transfer-request.service.ts` — Transfer ship/receive with stock movements
- `backend/src/services/purchase-order.service.ts` — PO creation from reorder report

### Backend API Routes
- `backend/src/api/v1/inventory/route.ts` — Stock levels, movements, adjustments, reservations, cycle counts (1,008 lines)
- `backend/src/api/v1/transfer-requests/route.ts` — Transfer request endpoints

### Frontend Pages
- `frontend/src/app/(portal)/inventory/page.tsx` — Inventory dashboard
- `frontend/src/app/(portal)/inventory/adjustments/page.tsx` — Adjustments list
- `frontend/src/app/(portal)/inventory/adjustments/new/page.tsx` — Create adjustment
- `frontend/src/app/(portal)/inventory/adjustments/[id]/page.tsx` — Adjustment detail/approve
- `frontend/src/app/(portal)/inventory/cycle-counts/page.tsx` — Cycle counts list
- `frontend/src/app/(portal)/inventory/cycle-counts/new/page.tsx` — Create cycle count
- `frontend/src/app/(portal)/inventory/cycle-counts/[id]/page.tsx` — Cycle count detail
- `frontend/src/app/(portal)/inventory/reorder/page.tsx` — Reorder report + PO generation
- `frontend/src/app/(portal)/inventory/items/page.tsx` — Item master list
- `frontend/src/app/(portal)/inventory/items/[sku]/page.tsx` — Item detail
- `frontend/src/app/(portal)/inventory/movements/page.tsx` — Movement log
- `frontend/src/app/(portal)/transfer-requests/page.tsx` — Transfer list
- `frontend/src/app/(portal)/transfer-requests/[id]/page.tsx` — Transfer detail

### Frontend Components
- `frontend/src/components/inventory/AdjustStockModal.tsx` — Quick adjust from item detail
- `frontend/src/components/inventory/AdjustmentApproveModal.tsx` — Approval modal
- `frontend/src/components/inventory/WarehouseStockTable.tsx` — Per-warehouse stock table
- `frontend/src/components/inventory/StockOverviewCards.tsx` — Summary cards
- `frontend/src/components/inventory/MovementLogTable.tsx` — Movement audit table
- `frontend/src/components/transfer-requests/CreateTransferRequestModal.tsx` — Order-based transfer creation

### Schema
- `backend/prisma/schema.prisma` — StockLevel, StockMovement, StockAdjustment, StockAdjustmentLine, StockReservation, CycleCountSession, CycleCountLine, TransferRequest, TransferRequestLine, and related enums

---

*This audit is a report only. No code changes were made.*
