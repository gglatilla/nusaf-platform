# NUSAF ERP Gap Remediation — Execution Framework

**Date:** 2026-02-06
**Purpose:** Break the ERP Gap Analysis into bulletproof micro-tasks with enforced quality gates, session continuity, and golden rule compliance.

---

## HOW THIS FRAMEWORK WORKS

This document replaces ad-hoc prompting. It is designed so that:

1. **Claude Code cannot skip the golden rules** — they're embedded in the startup sequence, not referenced externally
2. **Every micro-task is self-contained** — you can close the terminal after each one and lose nothing
3. **Session continuity is file-based** — Claude Code reads state from files, not from memory
4. **Verification is mandatory** — every micro-task ends with a pass/fail check before marking complete

---

## SETUP INSTRUCTIONS (DO THIS ONCE)

### Step 1: Save these files to your project

Save the full gap analysis document:
```
.claude/plans/erp-gap-analysis-remediation.md
```

Save THIS execution framework:
```
.claude/plans/erp-execution-framework.md
```

### Step 2: Create the progress tracker

Create this file at `.claude/plans/erp-progress.md`:

```markdown
# ERP Remediation Progress Tracker

## Current Phase: Phase 0 — Integration Audit
## Current Micro-Task: 0.1
## Status: NOT STARTED

---

## Phase 0: Integration Audit (Foundation)
- [ ] 0.1 — Audit GRV → Stock flow
- [ ] 0.2 — Audit Picking Slip → Stock flow
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
- [ ] 3.9 — Multi-warehouse fulfillment orchestration (auto picking slip splitting + transfer requests)


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
```

### Step 3: Add this block to your CLAUDE.md file

Add this to the TOP of your existing CLAUDE.md, before everything else:

```markdown
## ⚠️ MANDATORY STARTUP SEQUENCE — READ BEFORE ANY WORK

When starting a new session or when user says "lets begin", "continue", "next task", or "go":

1. Read `.claude/plans/erp-progress.md` — find the current micro-task
2. Read `.claude/plans/erp-execution-framework.md` — find that micro-task's specification
3. Read the GOLDEN RULES section below (every single time, no exceptions)
4. Tell the user: current phase, current micro-task, what will be done, estimated scope
5. WAIT for user confirmation before writing any code

## ⚠️ GOLDEN RULES — READ BEFORE EVERY MICRO-TASK (NON-NEGOTIABLE)

These rules apply to ALL code written during ERP remediation. Violating any rule means the micro-task fails verification.

1. EVERY stock change MUST create a StockMovement record with a reference to the source document. No exceptions.

2. EVERY document must link to its parent document(s). A picking slip must reference its sales order. A GRV must reference its PO. A PO must reference its triggering demand.

3. View pages and Edit pages are SEPARATE. View is read-only, rich, and information-dense. Edit is a form. They are different pages with different URLs.

4. Customer-facing pages must NEVER show: cost prices, supplier information, BOMs, stock quantities (only availability badges), other customers' data, internal operational documents.

5. Staff-facing pages must show rich context: when viewing a product, show stock levels, pricing, suppliers, BOM, recent movements. When viewing an order, show all related documents and their statuses.

6. Status changes must propagate. When a child document is completed, the parent document must be updated accordingly. Build this as event-driven logic, not manual updates.

7. No feature is complete without:
   - Proper data loading (edit forms must populate from existing data)
   - Role-based visibility (different users see different things)
   - Linked navigation (every reference to another document is a clickable link)
   - Audit trail (who did what, when, with document reference)

8. Test every feature from the perspective of:
   - A warehouse worker processing incoming goods
   - A purchaser creating and managing POs
   - A sales person managing quotes and orders
   - A customer browsing products and tracking orders
   - A manager reviewing operations and approving actions
```

---

## SESSION STARTUP PROMPT

Every time you open a new terminal, paste this EXACT prompt:

```
Read these files in this exact order:
1. .claude/plans/erp-progress.md
2. .claude/plans/erp-execution-framework.md (find the current micro-task spec)
3. The GOLDEN RULES section in CLAUDE.md

Then tell me:
- What phase and micro-task we're on
- What was the last completed micro-task
- Exactly what this micro-task requires
- Recite all 8 golden rules (prove you read them)

Do NOT start any work until I say "go".
```

**Why "recite all 8 golden rules"?** This forces Claude Code to actually process them, not just claim it read the file. If it can't recite them, it didn't read them. Make it read again.

---

## SESSION END PROMPT

Before closing the terminal, ALWAYS paste this:

```
SAVE — Update .claude/plans/erp-progress.md with:
1. Mark current micro-task as complete (or note where we stopped if incomplete)
2. Set "Current Micro-Task" to the next one
3. Add a "Last Session Notes" section with: what was done, any decisions made, any issues found, exact files modified

Then commit and push everything.
```

---

## MICRO-TASK SPECIFICATIONS

Each micro-task below contains everything Claude Code needs. No external context required.

---

### PHASE 0: INTEGRATION AUDIT

**Goal:** Verify and fix every document-to-stock flow. This is the foundation — nothing else matters until these work.

#### Micro-Task 0.1 — Audit GRV → Stock Flow

```
SCOPE: Trace the complete code path for GRV (Goods Received Voucher) creation.

FIND AND VERIFY:
1. When a GRV is created against a PO, does the code:
   a. Create a StockMovement record with type = RECEIPT?
   b. Include referenceType = 'GRV' and referenceId = grv.id?
   c. Increase StockLevel.onHand for the correct warehouse?
   d. Decrease StockLevel.onOrder?
   e. Update PurchaseOrderLine.quantityReceived?
   f. Update PurchaseOrder status (if all lines fully received → RECEIVED)?

2. Trace from: API endpoint → service function → Prisma transaction

OUTPUT:
- For each check (a-f): PASS with code location, or FAIL with what's missing
- If any FAIL: implement the fix within a Prisma transaction
- All stock changes in a single transaction (no partial updates)

GOLDEN RULE CHECK: Rule 1 (every stock change needs StockMovement), Rule 2 (GRV must link to PO)

VERIFICATION: After fixing, show me the complete code path from API to database.
```

#### Micro-Task 0.2 — Audit Picking Slip → Stock Flow

```
SCOPE: Trace the complete code path for Picking Slip completion.

FIND AND VERIFY:
1. When a picking slip status changes to COMPLETE, does the code:
   a. Create StockMovement records with type = ISSUE for each line item?
   b. Include referenceType = 'PICKING_SLIP' and referenceId?
   c. Decrease StockLevel.onHand for the correct warehouse?
   d. Release associated StockReservation records?
   e. Update the parent SalesOrder line status?

OUTPUT: Same format as 0.1 — PASS/FAIL each check, fix any failures.

GOLDEN RULE CHECK: Rule 1, Rule 2, Rule 6 (status must propagate to parent order)
```

#### Micro-Task 0.3 — Audit Job Card → Stock Flow

```
SCOPE: Trace the complete code path for Job Card completion.

FIND AND VERIFY:
1. When a job card status changes to COMPLETE, does the code:
   a. Create StockMovement with type = MANUFACTURE_IN for the finished product?
   b. Create StockMovement(s) with type = MANUFACTURE_OUT for each BOM component consumed?
   c. Increase StockLevel.onHand for the finished product?
   d. Decrease StockLevel.onHand for each consumed component?
   e. Link all movements to the job card (referenceType = 'JOB_CARD')?

OUTPUT: Same format. Note: if BOM model doesn't have component data, document this as a blocker.

GOLDEN RULE CHECK: Rule 1, Rule 2
```

#### Micro-Task 0.4 — Audit Transfer Request → Stock Flow

```
SCOPE: Trace the complete code path for Transfer Request completion.

FIND AND VERIFY:
1. When a transfer is dispatched, does the code:
   a. Create StockMovement with type = TRANSFER_OUT at source warehouse?
   b. Decrease StockLevel.onHand at source?

2. When a transfer is received, does the code:
   a. Create StockMovement with type = TRANSFER_IN at destination warehouse?
   b. Increase StockLevel.onHand at destination?
   c. Update TransferRequest status?

OUTPUT: Same format.

GOLDEN RULE CHECK: Rule 1, Rule 2
```

#### Micro-Task 0.5 — Audit Stock Adjustment → Stock Flow

```
SCOPE: Trace the code path for Stock Adjustment approval.

FIND AND VERIFY:
1. When a stock adjustment is approved, does the code:
   a. Create StockMovement with type = ADJUSTMENT_IN or ADJUSTMENT_OUT?
   b. Update StockLevel.onHand accordingly?
   c. Record who approved and when?

NOTE: If stock adjustment workflow doesn't exist yet, document this as missing (will be built in Phase 4).

GOLDEN RULE CHECK: Rule 1
```

#### Micro-Task 0.6 — Audit Quote → Reservation Flow

```
SCOPE: Trace the code path for Quote finalization.

FIND AND VERIFY:
1. When a quote status changes to CREATED (finalized), does the code:
   a. Create StockReservation records with type = SOFT?
   b. Increase StockLevel.reserved?
   c. Link reservations to the quote (referenceType = 'QUOTE')?

NOTE: If reservation doesn't happen at quote stage, document the current behavior.

GOLDEN RULE CHECK: Rule 1, Rule 2
```

#### Micro-Task 0.7 — Audit Sales Order → Reservation Flow

```
SCOPE: Trace the code path for Sales Order confirmation.

FIND AND VERIFY:
1. When a sales order is confirmed, does the code:
   a. Convert SOFT reservations to HARD reservations?
   b. Or create new HARD reservations if none existed?
   c. Update StockLevel.reserved?

NOTE: Document the current quote → order transition flow.

GOLDEN RULE CHECK: Rule 1, Rule 2
```

#### Micro-Task 0.8 — Fix All Broken/Missing Flows

```
SCOPE: Implement fixes for every FAIL identified in micro-tasks 0.1-0.7.

RULES:
- All stock changes must happen within Prisma transactions
- Every StockMovement must include: productId, warehouseId, movementType, quantity, referenceType, referenceId, performedBy
- If a flow is completely missing, implement the full integration
- If partially implemented, fix only what's broken (don't rewrite working code)

Read the FAIL items from erp-progress.md (they should be documented in the session notes from 0.1-0.7).

GOLDEN RULE CHECK: All 8 rules apply.
```

#### Micro-Task 0.9 — Create Integration Verification Script

```
SCOPE: Create a script/endpoint that can verify all 7 document-to-stock flows work correctly.

This can be:
- A test script that creates test data and verifies the chain
- OR an admin page that shows integration health status

The point is: after any future code change, you should be able to run this and confirm nothing is broken.

OUTPUT: Working verification that tests all flows from 0.1-0.7.
```

---

### PHASE 1A: FIX PRODUCT EDIT FORM

#### Micro-Task 1A.1 — Diagnose Dropdown Data Loading

```
SCOPE: Investigate why supplier, category, and UoM dropdowns show empty in the product edit form.

INVESTIGATE:
1. What API endpoint supplies the dropdown options?
2. Is it filtering by isActive: true and excluding valid options?
3. Does the edit form correctly load the CURRENT value (pre-select the existing supplier/category)?
4. Is there a mismatch between the text field (e.g., supplierName) and the relationship ID (supplierId)?

OUTPUT: Root cause analysis with exact file paths and line numbers. Do NOT fix yet — just diagnose.

GOLDEN RULE CHECK: Rule 7 (edit forms must populate from existing data)
```

#### Micro-Task 1A.2 — Fix Text Field vs Relationship ID Disconnect

```
SCOPE: Fix the core data model issue where imported products have text fields (supplierName) but empty relationship IDs (supplierId).

OPTIONS (choose the best):
A. Migration script: match text fields to existing records and populate relationship IDs
B. Fix the import process to create/link relationships at import time
C. Fix the edit form to handle both text-only and relationship-linked products

Implement the chosen fix. Ensure existing products are corrected, not just future imports.

GOLDEN RULE CHECK: Rule 7
```

#### Micro-Task 1A.3 — Verify All Edit Form Fields

```
SCOPE: Go through EVERY field on the product edit form and verify it loads correctly.

TEST: Pick 3 existing products (one from each supplier: Tecom, Chiaravalli, Regina).
For each product, verify:
- [ ] SKU loads
- [ ] Name loads
- [ ] Description loads
- [ ] Category dropdown shows current value
- [ ] Subcategory dropdown shows current value
- [ ] Supplier dropdown shows current value
- [ ] UoM dropdown shows current value
- [ ] Product type shows current value
- [ ] Status shows current value
- [ ] All pricing fields load
- [ ] All dimension/weight fields load

Fix any field that doesn't load.

GOLDEN RULE CHECK: Rule 7
```

#### Micro-Task 1A.4 — Test Save Round-Trip

```
SCOPE: Verify the complete edit cycle works.

TEST:
1. Load a product in edit mode — note all field values
2. Change one field (e.g., description)
3. Save
4. Reload the edit page
5. Verify: changed field has new value, ALL other fields still have their original values

This catches a common bug where saving overwrites fields with empty/null because they didn't load.

GOLDEN RULE CHECK: Rule 7
```

---

### PHASE 1B: REBUILD PRODUCT DETAIL PAGE

**Reference:** Read Phase 1 specification in `.claude/plans/erp-gap-analysis-remediation.md` for the complete tab-by-tab specification.

#### Micro-Task 1B.1 — Product Detail Header + Quick Stats

```
SCOPE: Build the always-visible header section of the product detail page.

BUILD:
- Product image (or placeholder)
- SKU (prominent), product name, description
- Category breadcrumb
- Product Type badge, Status badge
- "Edit" button (ADMIN/MANAGER only)
- Quick Stats Bar: Total Stock, Available, Reserved, On Order, Reorder Point, status indicator

This is a NEW page at a different route from the edit page.
View: /products/[id] (read-only detail)
Edit: /products/[id]/edit (form)

GOLDEN RULE CHECK: Rule 3 (view and edit are separate), Rule 5 (staff sees rich context)
```

#### Micro-Tasks 1B.2 through 1B.9

Each builds one tab of the product detail page. Follow the specification in the gap analysis document. Each tab should:
- Fetch its own data via a dedicated API endpoint (or tRPC query)
- Respect role-based visibility (Pricing, Purchasing, BOM, Sales History, Audit Log = staff only)
- Include clickable links to related documents (Rule 7)
- Handle empty states gracefully (no data yet? show helpful message, not a blank page)

#### Micro-Task 1B.10 — Separate View and Edit Routes

```
SCOPE: Ensure the product detail (view) and product edit (form) are at different URLs.

VERIFY:
- /products/[id] → read-only detail page with all tabs
- /products/[id]/edit → editable form (restricted to ADMIN/MANAGER)
- "Edit" button on view page links to edit page
- "Cancel" on edit page returns to view page
- After saving edit, redirect to view page

GOLDEN RULE CHECK: Rule 3
```

---

### PHASES 2-6: SPECIFICATIONS

For Phases 2 through 6, each micro-task follows the same pattern:

1. Read the phase specification from `.claude/plans/erp-gap-analysis-remediation.md`
2. Read the GOLDEN RULES
3. Implement the specific micro-task
4. Verify against the golden rules
5. Update progress tracker

The micro-task numbers in the progress tracker map directly to the specifications in the gap analysis document. When you reach Phase 2, start each session with the standard startup prompt and Claude Code will know exactly where to pick up.

---

## VERIFICATION CHECKLIST (USE AFTER EVERY MICRO-TASK)

Before marking any micro-task complete, Claude Code must verify:

```
□ Rule 1: Any stock changes in this task create StockMovement records? (N/A if no stock changes)
□ Rule 2: Any documents created link to their parent documents? (N/A if no documents)
□ Rule 3: Did I create separate view/edit pages? (N/A if no UI)
□ Rule 4: Can customers see any internal data from this change? (Must be NO)
□ Rule 5: Does staff see rich context where applicable?
□ Rule 6: Do status changes propagate to parent documents? (N/A if no status changes)
□ Rule 7: Do forms load existing data? Are references clickable links? Is there an audit trail?
□ Rule 8: Would this work for warehouse staff? Purchaser? Sales? Customer? Manager?
□ Code compiles without errors
□ No TypeScript type errors introduced
□ Progress tracker updated
```

---

## EMERGENCY RECOVERY

If Claude Code seems confused, lost, or starts doing things not related to the current micro-task:

```
STOP. You've gone off track.

Read these files NOW:
1. .claude/plans/erp-progress.md — what micro-task are we on?
2. .claude/plans/erp-execution-framework.md — what does that micro-task require?
3. CLAUDE.md GOLDEN RULES section

Tell me what you SHOULD be doing. Do not write any code until I confirm.
```

---

## KEY PRINCIPLES

1. **One micro-task per terminal session.** Close and reopen between tasks. This is your insurance against compacting.

2. **Never skip the startup prompt.** Even if you think Claude Code "remembers" — it doesn't. The files are the memory.

3. **The progress tracker is the source of truth.** If it says micro-task 0.3 is current, that's what we do. No jumping ahead.

4. **Golden rules are non-negotiable.** If a micro-task would violate a golden rule, the micro-task spec is wrong — come back to me (Claude Chat) to discuss before proceeding.

5. **Verification before completion.** Run the checklist. If any applicable rule fails, the task isn't done.

6. **Commit after every micro-task.** Code + progress tracker + session notes. All pushed to Git.
