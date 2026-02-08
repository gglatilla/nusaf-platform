# NUSAF PLATFORM — COMPLETE BUSINESS PROCESS AUDIT
## Date: 2026-02-08

---

# PROCESS 1 — Quote-to-Cash (Prepayment Model)

| # | Step | Status | UX | Automation | Safety Nets | Detail |
|---|------|--------|-----|------------|-------------|--------|
| 1 | Sales person selects a CUSTOMER | WORKS | CLEAR | N/A | PROTECTED | Quote creation requires `companyId`. Company has tier + default warehouse. Excellent company isolation on all queries. |
| 2 | Create quote FOR customer, pre-fill tier + warehouse | WORKS | CLEAR | AUTO | PROTECTED | `createQuote()` snapshots `customerTier` from company. Warehouse inherited. Tier pricing auto-applied to line items. |
| 3 | Add line items with tier-based pricing | WORKS | CLEAR | AUTO | PARTIAL | `addQuoteItem()` calculates tier price automatically. **GAP: No overselling warning.** Can quote qty exceeding available stock with no warning. No discount approval workflow. |
| 4 | Finalize and send to customer | WORKS | CLEAR | ONE_CLICK | PROTECTED | `finalizeQuote()` sets status CREATED, creates SOFT reservations (30-day), sets validity date. **GAP: No PDF generation for email sending.** Quote visible on customer portal. |
| 5 | Customer reviews quote on portal | WORKS | CLEAR | N/A | PROTECTED | Customer portal `/my/quotes/[id]` shows quote with items, totals, validity timer. Internal data stripped. |
| 6 | Customer accepts quote | WORKS | CLEAR | ONE_CLICK | PROTECTED | `acceptQuote()` validates not expired, moves to ACCEPTED. Customer portal has Accept/Reject buttons. |
| 7 | System converts quote to Sales Order | WORKS | ONE_CLICK | ONE_CLICK | PROTECTED | `createOrderFromQuote()` copies all items, releases SOFT reservations, creates HARD reservations. Quote moves to CONVERTED. Staff clicks "Create Order" button. **Not fully automatic — requires one click.** |
| 8 | System auto-generates Proforma Invoice | EXISTS_NOT_CONNECTED | INCOMPLETE | MANUAL | UNPROTECTED | `createProformaInvoice()` EXISTS but is **NOT auto-triggered** on order confirmation. Requires separate manual API call. Staff must click "Create Proforma" on order detail. Should be zero-click. |
| 9 | Customer receives proforma, arranges payment | WORKS | CLEAR | N/A | N/A | Proforma visible in customer portal order detail. Shows totals, payment terms, validity. |
| 10 | Staff records payment confirmation | MISSING | NO_UI | N/A | UNPROTECTED | **COMPLETELY MISSING.** No Payment model, no `recordPayment()` function, no API endpoint, no UI. Cannot record that customer has paid. |
| 11 | Sales Order status moves to CONFIRMED (payment received) | MISSING | NO_UI | N/A | UNPROTECTED | Status transition DELIVERED→INVOICED exists in status machine but **no code path reaches it**. No payment gate between CONFIRMED and PROCESSING. |
| 12a | System checks stock availability | WORKS | CLEAR | AUTO | PROTECTED | Orchestration service `generateFulfillmentPlan()` checks available stock per warehouse, respects hard reservations. Two-step: preview plan then execute. Excellent design. |
| 12b | Picking slips created per warehouse | WORKS | CLEAR | AUTO | PARTIAL | Created atomically during `executeFulfillmentPlan()`. Grouped by warehouse. **GAP: No double-picking prevention** — race condition possible on concurrent plan execution. |
| 12c | Transfer requests for cross-warehouse movement | WORKS | CLEAR | AUTO | PROTECTED | Auto-created for CT customers when stock is at JHB. Ship/receive workflow with TRANSFER_OUT/IN stock movements. |
| 12d | Job cards for BOM products | WORKS | CLEAR | AUTO | PROTECTED | Auto-created for ASSEMBLY_REQUIRED/MADE_TO_ORDER products. BOM explosion identifies component needs. |
| 13 | Warehouse workers complete picking | WORKS | CLEAR | ONE_CLICK | PARTIAL | Picking slip detail page with per-line qty input. Start picking → pick lines → complete. **Creates ISSUE stock movements.** Releases hard reservations. **GAP: No idempotency guard on completion — possible double-click creating duplicate movements.** |
| 14 | Manufacturing completes (BOM) | WORKS | CLEAR | ONE_CLICK | PROTECTED | Job card completion: MANUFACTURE_IN for finished product, MANUFACTURE_OUT per BOM component. All in single transaction. Negative stock prevention on component consumption. |
| 15 | Transfers complete | WORKS | CLEAR | ONE_CLICK | PROTECTED | Ship: TRANSFER_OUT from JHB. Receive: TRANSFER_IN to CT. Per-line received qty tracking. Negative stock prevention on source warehouse. |
| 16 | All complete → READY_TO_SHIP | WORKS | CLEAR | AUTO | PROTECTED | **Automatic.** Picking slip completion + job card completion both check if ALL sibling documents complete. If yes → order status auto-updates to READY_TO_SHIP. |
| 17 | Delivery note generated | WORKS | CLEAR | ONE_CLICK | PROTECTED | `createDeliveryNote()` from order. Links to order + lines. Dispatch updates order to SHIPPED. Delivery confirmation records received/damaged qty. |
| 18 | Tax Invoice generated | MISSING | NO_UI | N/A | UNPROTECTED | **COMPLETELY MISSING.** No TaxInvoice model, no service, no API routes, no UI. Only proforma exists (which is NOT the legal document). |
| 19 | Goods dispatched to customer | WORKS | CLEAR | ONE_CLICK | PROTECTED | Delivery note dispatch workflow. Status propagation: DN DISPATCHED → order SHIPPED. DN DELIVERED → order DELIVERED. |
| 20 | Order marked DELIVERED | WORKS | CLEAR | AUTO | PROTECTED | Auto-propagated when all delivery notes confirmed delivered. **FLOW BREAKS HERE — cannot reach INVOICED or CLOSED.** |

---

# PROCESS 2 — Procure-to-Pay

| # | Step | Status | UX | Automation | Safety Nets | Detail |
|---|------|--------|-----|------------|-------------|--------|
| 1 | Reorder report flags products below reorder point | WORKS | INCOMPLETE | MANUAL | PARTIAL | `getLowStockProducts()` identifies low stock. Dashboard shows count. **GAP: Not grouped by supplier.** Flat list only. No "Create Draft PO" button from report. No automatic trigger. |
| 2 | Purchaser reviews, clicks "Create Draft PO" | EXISTS_NOT_CONNECTED | CONFUSING | MULTI_STEP | UNPROTECTED | Low stock report exists but has no direct "Create PO" action. Must manually create PO separately. Purchase Requisition exists as intermediate step but not connected to reorder report. |
| 3 | PO created with supplier, warehouse, line items | WORKS | CLEAR | ONE_CLICK | PARTIAL | `createPurchaseOrder()` creates DRAFT PO. Lines added individually. **CRITICAL GAP: Does NOT update StockLevel.onOrder.** Warehouse can't see goods in transit. |
| 4 | Purchaser submits for approval | WORKS | CLEAR | ONE_CLICK | PARTIAL | `submitForApproval()` moves DRAFT → PENDING_APPROVAL. **GAP: No threshold-based approval.** All POs same workflow regardless of amount. |
| 5 | Manager approves PO | WORKS | CLEAR | ONE_CLICK | PROTECTED | `approvePurchaseOrder()` validates self-approval prevention. Only ADMIN/MANAGER can approve. |
| 6 | PO sent to supplier | WORKS | CLEAR | ONE_CLICK | PARTIAL | `sendToSupplier()` generates PDF, sends email. **CRITICAL GAP: Does NOT update StockLevel.onOrder** when PO sent. Stock system blind to incoming goods. |
| 7 | Supplier confirms and ships | WORKS | CLEAR | ONE_CLICK | N/A | `acknowledgePurchaseOrder()` moves SENT → ACKNOWLEDGED. Manual step — staff records supplier confirmation. |
| 8 | Warehouse receives goods — GRV created | WORKS | CLEAR | ONE_CLICK | PROTECTED | `createGoodsReceipt()` in single atomic transaction. Records received + rejected qty. Over-receiving prevented (qty check vs PO line remaining). |
| 9 | GRV records quantities, discrepancies noted | WORKS | CLEAR | ONE_CLICK | PROTECTED | Per-line: quantityExpected, quantityReceived, quantityRejected, rejectionReason. Excellent tracking. |
| 10 | Stock levels auto-updated | WORKS | N/A | AUTO | PROTECTED | **Automatic in GRV transaction.** onHand increases, onOrder decreases (but onOrder was never incremented — see step 6). RECEIPT stock movement created with GRV reference. |
| 11 | PO status auto-updates | WORKS | N/A | AUTO | PROTECTED | **Automatic in GRV transaction.** Checks all PO lines: all received → RECEIVED, some → PARTIALLY_RECEIVED. |
| 12 | Supplier invoice matched (3-way match) | MISSING | NO_UI | N/A | UNPROTECTED | **COMPLETELY MISSING.** No SupplierInvoice model, no matching service, no API. Cannot verify invoice against PO + GRV. |
| 13 | Payment processed to supplier | MISSING | NO_UI | N/A | UNPROTECTED | **COMPLETELY MISSING.** No supplier payment tracking. |

---

# PROCESS 3 — Make-to-Order

| # | Step | Status | UX | Automation | Safety Nets | Detail |
|---|------|--------|-----|------------|-------------|--------|
| 1 | Sales Order contains BOM product | WORKS | CLEAR | AUTO | PROTECTED | Product.productType = ASSEMBLY_REQUIRED or MADE_TO_ORDER detected automatically by orchestration. |
| 2 | Orchestration detects BOM → creates Job Card | WORKS | CLEAR | AUTO | PROTECTED | `executeFulfillmentPlan()` auto-creates job cards for BOM products. Loads BOM components, checks component availability, flags shortages. |
| 3 | Job Card shows finished product + BOM components | WORKS | INCOMPLETE | N/A | N/A | Job card detail page shows product, qty, job type, assignment. **GAP: BOM components NOT shown on frontend job card page.** Worker can't see what components they need. Backend has the data but UI doesn't render it. |
| 4 | Manufacturing worker views job card dashboard | WORKS | CLEAR | N/A | N/A | Fulfillment dashboard route exists. Job cards filterable by status. |
| 5 | Worker confirms raw material availability | MANUAL | INCOMPLETE | MANUAL | UNPROTECTED | **No explicit component availability check UI on job card.** Worker must check inventory separately. Should show BOM component stock inline. |
| 6 | Worker starts production | WORKS | CLEAR | ONE_CLICK | PROTECTED | `startJobCard()` moves PENDING → IN_PROGRESS. Records startedAt. |
| 7 | Production completes — worker marks COMPLETED | WORKS | CLEAR | ONE_CLICK | PROTECTED | `completeJobCard()` — single transaction. |
| 8 | System auto-consumes BOM + adds finished goods | WORKS | N/A | AUTO | PROTECTED | **Automatic in completion transaction.** MANUFACTURE_IN for finished product (+qty at JHB). MANUFACTURE_OUT per BOM component (-qty at JHB). Negative stock prevention on all component decrements. All movements reference JobCard. |
| 9 | Job card triggers SO status check | WORKS | N/A | AUTO | PROTECTED | **Automatic.** Checks all picking slips + job cards for order. If all complete → order READY_TO_SHIP. |
| 10 | Finished product available for picking | WORKS | N/A | AUTO | N/A | Stock now in JHB warehouse. If CT customer, transfer request handles JHB→CT movement. |

---

# PROCESS 4 — Returns & Credit

| # | Step | Status | UX | Automation | Safety Nets | Detail |
|---|------|--------|-----|------------|-------------|--------|
| 1 | Customer initiates return from portal | WORKS | CLEAR | ONE_CLICK | PROTECTED | Customer portal `/my/returns/new?orderId=X` with order/line selection, reason per line, qty. Staff-created RAs auto-approve; customer-created require approval. |
| 2 | Staff receives notification | MANUAL | INCOMPLETE | MANUAL | N/A | **No push notification system.** Staff must check RA list manually. No email alert when customer submits return. |
| 3 | Staff reviews — approves or rejects | WORKS | CLEAR | ONE_CLICK | PROTECTED | `approveReturnAuthorization()` / `rejectReturnAuthorization()`. Only ADMIN/MANAGER can approve. Rejection requires reason. |
| 4 | Return Authorization created, linked to SO | WORKS | CLEAR | AUTO | PROTECTED | RA links to orderId + orderNumber + deliveryNoteId. Full parent document chain. |
| 5 | RA sent to customer with instructions | MANUAL | INCOMPLETE | MANUAL | N/A | **No automated email with return instructions.** Customer sees APPROVED status on portal but no shipping instructions or RA number prominently displayed. |
| 6 | Customer ships goods back | N/A | N/A | N/A | N/A | External process. |
| 7 | Warehouse receives returned goods | WORKS | CLEAR | ONE_CLICK | PROTECTED | `receiveItems()` records per-line quantityReceived. Cannot exceed quantityReturned. Moves RA to ITEMS_RECEIVED. |
| 8 | Per-line disposition: restockable / damaged / disposed | WORKS | CLEAR | ONE_CLICK | PROTECTED | `completeReturnAuthorization()` requires resolution per line: RESTOCK, SCRAP, REPLACE. |
| 9 | Restockable: stock increased (RETURN movement) | WORKS | N/A | AUTO | PROTECTED | **Automatic.** RESTOCK → `updateStockLevel()` increases onHand + creates RETURN stock movement with RA reference. |
| 10 | Damaged/disposed: write-off (SCRAP movement) | WORKS | N/A | AUTO | PROTECTED | **Automatic.** SCRAP → creates SCRAP stock movement (audit record). Does NOT reduce onHand (item was already out of inventory). |
| 11 | Credit Note generated | MISSING | NO_UI | N/A | UNPROTECTED | **COMPLETELY MISSING.** No CreditNote model, no service, no API, no UI. Customer receives no financial compensation for approved return. |
| 12 | Credit applied to customer account | MISSING | NO_UI | N/A | UNPROTECTED | **COMPLETELY MISSING.** No customer credit tracking. No ability to apply credit to future orders. |

---

# PROCESS 5 — Inventory Operations

| # | Step | Status | UX | Automation | Safety Nets | Detail |
|---|------|--------|-----|------------|-------------|--------|
| **Stock Adjustments** | | | | | | |
| 5.1a | Worker identifies discrepancy | N/A | N/A | N/A | N/A | External observation. |
| 5.1b | Creates adjustment (product, location, new qty, reason) | WORKS | CLEAR | ONE_CLICK | PROTECTED | `createStockAdjustment()` with reason enum (INITIAL_COUNT, CYCLE_COUNT, DAMAGED, etc.). Snapshots current qty. Status: PENDING. |
| 5.1c | Manager approves | WORKS | CLEAR | ONE_CLICK | PROTECTED | `approveStockAdjustment()` applies all line changes in transaction. Creates ADJUSTMENT_IN or ADJUSTMENT_OUT movements. **Negative stock prevention on all decreases.** |
| 5.1d | Stock updated with movement | WORKS | N/A | AUTO | PROTECTED | **Automatic in approval transaction.** Movement references StockAdjustment. |
| **Warehouse Transfers** | | | | | | |
| 5.2a | Staff creates transfer request | WORKS | CLEAR | ONE_CLICK | PARTIAL | Both order-linked and standalone transfers. **GAP: Hardcoded JHB→CT only.** No CT→JHB or other warehouse combinations. |
| 5.2b | Source warehouse ships (TRANSFER_OUT) | WORKS | CLEAR | ONE_CLICK | PROTECTED | `shipTransfer()` decreases JHB onHand, creates TRANSFER_OUT movement. Negative stock prevention. |
| 5.2c | Destination receives (TRANSFER_IN) | WORKS | CLEAR | ONE_CLICK | PROTECTED | `receiveTransfer()` increases CT onHand by receivedQuantity, creates TRANSFER_IN movement. Per-line received qty tracking. |
| **Cycle Counts** | | | | | | |
| 5.3a | Manager creates count session | WORKS | CLEAR | ONE_CLICK | PROTECTED | `createCycleCountSession()` snapshots systemQuantity per product at creation time. |
| 5.3b | Workers count physical stock | WORKS | CLEAR | ONE_CLICK | PARTIAL | `submitCycleCountLines()` records counted qty, calculates variance. **GAP: No per-product locking — two workers can count same product.** |
| 5.3c | System compares to expected | WORKS | N/A | AUTO | PROTECTED | Variance = countedQty - systemQty. Calculated automatically on submission. |
| 5.3d | Discrepancies reviewed, adjustments created | WORKS | CLEAR | AUTO | PROTECTED | `reconcileCycleCountSession()` auto-creates StockAdjustment (PENDING) for non-zero variances. Bidirectional link between cycle count and adjustment. **Adjustment still requires manager approval.** |
| **Reorder Reporting** | | | | | | |
| 5.4a | System flags below reorder point | WORKS | INCOMPLETE | MANUAL | PARTIAL | `getLowStockProducts()` detects low stock using effective reorder point (location override or product default). **GAP: No automatic trigger.** Manual check only. Not grouped by supplier. |
| 5.4b | Grouped by supplier → feeds Process 2 | EXISTS_NOT_CONNECTED | CONFUSING | MANUAL | UNPROTECTED | Data exists (product → supplier relationship) but **no grouped report endpoint**. No "Create PO for Supplier X" button. Requires manual PO creation. |

---

# SAFETY NETS SCORECARD

| # | Safety Net | Verdict | Detail |
|---|-----------|---------|--------|
| 1 | **Prevent Overselling** | **FAIL** | No warning or block when quoting qty > available stock. Only caught at hard reservation creation (order confirmation), by which time customer expects the goods. |
| 2 | **Prevent Double-Picking** | **FAIL** | No unique constraint or guard prevents creating duplicate picking slips for same order line. Race condition possible. |
| 3 | **Prevent Shipping Without Payment** | **FAIL** | No payment model exists. No payment gate before fulfillment. Orders can go CONFIRMED → PROCESSING → SHIPPED with zero payment verification. **CRITICAL.** |
| 4 | **Prevent Duplicate Stock Movements** | **FAIL** | Status check before transaction but no optimistic locking. Fast double-click on "Complete Picking" could create duplicate ISSUE movements. |
| 5 | **Prevent Over-Receiving** | **PASS** | GRV validates `received + rejected ≤ PO line remaining`. Excellent protection. |
| 6 | **Prevent Negative Stock** | **PASS** | `updateStockLevel()` throws error if any field would go below 0. Transaction rolls back. Used in ALL stock decrease operations. |
| 7 | **Prevent Orphaned Documents** | **PASS** | Cascade delete on schema (QuoteItems, OrderLines, etc.). Status propagation from child → parent on completion. |
| 8 | **Prevent Price Tampering** | **FAIL** | No price freeze when quote finalized. No discount approval workflow. No manager approval for price overrides. Unit price can be changed without audit. |
| 9 | **Prevent Missing Customer Context** | **PASS** | `companyId` required on all document creation. Company isolation enforced on all queries. |
| 10 | **Prevent Shipping to Wrong Warehouse** | **PASS** | Orchestration reads `SalesOrder.warehouse` (from company default). Auto-creates transfers for cross-warehouse fulfillment. |
| 11 | **Status Regression Prevention** | **PASS** | All services define explicit status transition matrices. Invalid transitions rejected with error. Forward-only except ON_HOLD release. |
| 12 | **Concurrent Edit Protection** | **FAIL** | No optimistic locking (no version field). No `updatedAt` check. Last write wins silently. |

**Score: 6 PASS / 6 FAIL**

---

# AUTOMATION GAPS

Every transition below SHOULD be automatic (zero clicks) but is NOT:

| # | Transition | Current State | Impact |
|---|-----------|---------------|--------|
| 1 | **Quote accepted → Sales Order created** | ONE_CLICK (staff clicks "Create Order") | Minor — reasonable to keep as one-click for review |
| 2 | **Sales Order confirmed → Proforma Invoice generated** | MANUAL (separate API call + button click) | **HIGH** — extra manual step delays payment collection |
| 3 | **Payment confirmed → Fulfillment orchestration triggers** | **MISSING ENTIRELY** — no payment model exists | **CRITICAL** — entire payment→fulfillment chain broken |
| 4 | **GRV completed → PO onOrder decremented** | AUTO (works) but onOrder was **never incremented** when PO sent | **CRITICAL** — stock visibility completely broken for incoming goods |
| 5 | **PO sent → StockLevel.onOrder incremented** | MISSING | **CRITICAL** — warehouse can't see goods in transit, leads to over-ordering |
| 6 | **PO cancelled → StockLevel.onOrder decremented** | MISSING | **HIGH** — cancelled PO leaves phantom "on order" quantities |
| 7 | **RA completed (RESTOCK) → Credit Note generated** | MISSING | **HIGH** — customer receives no financial compensation |
| 8 | **Low stock detected → Purchase Requisition auto-created** | MISSING | **MEDIUM** — manual reorder process, risk of stockouts |
| 9 | **All picking + jobs + transfers complete → READY_TO_SHIP** | AUTO (works) | Already implemented correctly |
| 10 | **Job card completed → BOM consumed + finished goods added** | AUTO (works) | Already implemented correctly |
| 11 | **GRV all lines received → PO status RECEIVED** | AUTO (works) | Already implemented correctly |

---

# CRITICAL BLOCKERS

Issues that **completely prevent** a process from being used end-to-end:

| # | Blocker | Process Affected | Detail |
|---|---------|-----------------|--------|
| 1 | **No Payment Recording** | Process 1 (Quote-to-Cash) | Cannot record customer payment. Cannot gate fulfillment on payment. Orders flow from CONFIRMED → SHIPPED with no financial verification. In a prepayment model, this is **the most fundamental missing feature**. |
| 2 | **No Tax Invoice** | Process 1 (Quote-to-Cash) | No legal invoicing document. Proforma is NOT a tax invoice. Cannot comply with SARS requirements. Cannot bill customers. Orders stuck at DELIVERED — cannot reach INVOICED or CLOSED. |
| 3 | **No Credit Note** | Process 4 (Returns) | Return can be completed and items restocked, but customer gets no financial compensation. Return process is operationally complete but financially incomplete. |
| 4 | **No Supplier Invoice / 3-Way Match** | Process 2 (Procure-to-Pay) | Cannot match supplier invoices to POs and GRVs. No fraud prevention. No payment control on supplier side. POs stuck at RECEIVED — cannot reach CLOSED. |
| 5 | **StockLevel.onOrder never incremented** | Process 2 (Procure-to-Pay) | When PO is sent to supplier, stock system doesn't know goods are coming. Warehouse has no visibility into incoming inventory. Leads to over-ordering and poor planning. |

---

# PRIORITY FIX ORDER

Ranked by business impact (revenue-blocking first):

| Priority | Fix | Effort | Processes Fixed | Why This Order |
|----------|-----|--------|-----------------|----------------|
| **P0-1** | **Payment Model + Recording** | Large | Process 1 | **Revenue-blocking.** Cannot collect money. In a prepayment model, this gates the entire fulfillment chain. Need: Payment schema, recordPayment() service, API route, UI on order detail, payment gate before fulfillment. |
| **P0-2** | **Tax Invoice Generation** | Large | Process 1 | **Legal requirement.** SARS compliance requires tax invoices. Need: TaxInvoice schema, service, API, PDF generation, customer portal visibility. Order can then transition DELIVERED → INVOICED → CLOSED. |
| **P0-3** | **Auto-create Proforma on Order Confirmation** | Small | Process 1 | Quick win. Hook `createProformaInvoice()` into `confirmOrder()`. Removes manual step, speeds up payment collection. |
| **P0-4** | **StockLevel.onOrder updates on PO send/cancel** | Small | Process 2 | **Visibility-blocking.** Add onOrder increment in `sendToSupplier()` and decrement in `cancelPurchaseOrder()`. Fixes warehouse planning. |
| **P1-1** | **Double-picking prevention** | Small | Process 1 | Add unique constraint or guard: one picking slip per order line per warehouse. Prevents inventory errors. |
| **P1-2** | **Idempotency on completion actions** | Medium | Process 1, 3 | Add optimistic locking (version field) or idempotency key to completePicking(), completeJobCard(), etc. Prevents duplicate stock movements. |
| **P1-3** | **Credit Note model + auto-generation** | Medium | Process 4 | Financially completes the return process. Auto-create on RA completion with RESTOCK disposition. |
| **P1-4** | **Overselling warning on quotes** | Small | Process 1 | Show available stock when adding quote items. Soft warning (not hard block) when qty > available. |
| **P1-5** | **Price freeze on quote finalization** | Small | Process 1 | Lock unit prices when quote moves DRAFT → CREATED. Prevent price drift. |
| **P2-1** | **Supplier Invoice + 3-Way Match** | Large | Process 2 | SupplierInvoice model, matching logic, discrepancy detection. Completes P2P cycle. |
| **P2-2** | **Reorder report grouped by supplier** | Small | Process 2, 5 | New endpoint that groups low-stock products by supplier with "Create PO" action. |
| **P2-3** | **BOM components visible on Job Card UI** | Small | Process 3 | Frontend gap — backend has data. Show component list with stock levels on job card detail page. |
| **P2-4** | **Concurrent edit protection** | Medium | All | Add version field to mutable entities. Check version on update. Reject stale writes. |
| **P2-5** | **Transfer request flexibility (any warehouse)** | Small | Process 5 | Remove JHB→CT hardcoding. Allow any→any with same-location validation. |
| **P3-1** | **Notification system** | Large | All | Email/push notifications for: new return request, PO approved, stock below reorder, delivery confirmed. |
| **P3-2** | **Auto-create PR from low stock** | Medium | Process 2, 5 | Scheduled job or trigger when stock drops below reorder point. Groups by supplier. |
| **P3-3** | **Cycle count double-count prevention** | Small | Process 5 | Per-product locking within count session. Track which worker counted which product. |

---

# APPENDIX: Per-Process Flow Completeness

## Process 1 Flow Diagram (What Works vs Gaps)

```
QUOTE (DRAFT) ─── finalize ──→ QUOTE (CREATED) ─── accept ──→ QUOTE (ACCEPTED)
     ✅                              ✅                            ✅
                                                                    │
                                                           [1-click] │ "Create Order"
                                                                    ▼
                                                        ORDER (DRAFT) ── confirm ──→ ORDER (CONFIRMED)
                                                             ✅                          ✅
                                                                                          │
                                                                        ┌─────────────────┤
                                                                        │ ❌ SHOULD AUTO   │
                                                                        ▼                  ▼
                                                               Proforma Invoice    ❌ PAYMENT CHECK
                                                               (exists, manual)    (MISSING ENTIRELY)
                                                                                          │
                                                                    ┌─────────────────────┤ (no gate)
                                                                    ▼
                                                        Fulfillment Plan (2-step: preview + execute)
                                                                    ✅
                                                                    │
                                              ┌─────────┬───────────┼───────────┐
                                              ▼         ▼           ▼           ▼
                                         Picking    Job Cards   Transfers    Draft POs
                                         Slips        ✅          ✅       (backorders)
                                           ✅                                  ✅
                                              │         │           │
                                              ▼         ▼           ▼
                                         COMPLETE   COMPLETE    RECEIVED
                                         (ISSUE)   (MFG IN/OUT) (XFER IN/OUT)
                                           ✅         ✅          ✅
                                              │         │           │
                                              └─────────┴───────────┘
                                                        │
                                                        ▼ (auto)
                                              ORDER (READY_TO_SHIP)
                                                        ✅
                                                        │
                                                        ▼
                                              Delivery Note → DISPATCHED → DELIVERED
                                                        ✅
                                                        │
                                                        ▼ (auto)
                                              ORDER (DELIVERED)
                                                        ✅
                                                        │
                                              ╔═════════╧══════════╗
                                              ║   ❌ STUCK HERE    ║
                                              ║                    ║
                                              ║  No Tax Invoice    ║
                                              ║  No Payment Record ║
                                              ║  No INVOICED state ║
                                              ║  No CLOSED state   ║
                                              ╚════════════════════╝
```

## Process 2 Flow Diagram (What Works vs Gaps)

```
Low Stock Detected ──→ ❌ No grouped report ──→ ❌ No auto-PR creation
        ✅ (detection)

Manual PO Creation ──→ Add Lines ──→ Submit for Approval ──→ Approve ──→ Send to Supplier
        ✅                 ✅              ✅                    ✅           ✅
                                                                              │
                                                                   ❌ onOrder NOT updated
                                                                              │
                                                                              ▼
                                                                    Supplier Ships
                                                                              │
                                                                              ▼
                                                            GRV Created (atomic transaction)
                                                                    ✅
                                                                    │
                                                    ┌───────────────┼──────────────┐
                                                    ▼               ▼              ▼
                                              PO Lines Updated  Stock Updated  Movement Created
                                              (qty received)    (onHand ↑)     (RECEIPT)
                                                    ✅              ✅             ✅
                                                    │
                                                    ▼ (auto)
                                              PO Status → PARTIALLY_RECEIVED / RECEIVED
                                                    ✅
                                                    │
                                              ╔═════╧══════════════╗
                                              ║   ❌ STUCK HERE    ║
                                              ║                    ║
                                              ║  No Supplier Invoice║
                                              ║  No 3-Way Match    ║
                                              ║  No CLOSED state   ║
                                              ╚════════════════════╝
```

---

# END OF AUDIT

**Prepared by:** Claude Code (automated codebase analysis)
**Files analyzed:** 80+ source files across backend services, API routes, and frontend pages
**Schema models:** 40+ Prisma models reviewed
**Business processes:** 5 complete flows traced end-to-end
