# NUSAF ERP Execution Progress

## Completed (Old Plan)
- [x] T1: onOrder update on PO send/cancel
- [x] T2: Quote accept → auto-create Sales Order ⚠️ NEEDS REPAIR (R4)
- [x] T3: Transfer request check in READY_TO_SHIP gate
- [x] T4: PO rejection → DRAFT (not CANCELLED)
- [x] T5: Warehouse workers can create adjustments
- [x] T6: Order warehouse auto-selection from company
- [x] T7: Payment recording schema + service + API ⚠️ NEEDS REPAIR (R1, R2)
- [x] T8: Payment recording UI + fulfillment gate ⚠️ NEEDS REPAIR (R3)
- [x] T9: Tax invoice schema + service + PDF ⚠️ NEEDS REPAIR (R5)

## Repair Phase — Fix Business Model (account vs prepay)
- [x] R1: Add paymentTerms to Company + SalesOrder models (2026-02-08)
- [x] R2: Fix fulfillment gate — conditional on payment terms (2026-02-08)
- [x] R3: Fix payment UI — conditional fulfillment gating (2026-02-08)
- [x] R4: Fix quote acceptance — auto-fulfillment for account customers (2026-02-08)
- [x] R5: Fix tax invoice — payment terms due date (2026-02-09)

## Phase 1B continued — Revenue Foundation
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
- [ ] T20: Auto-generate proforma — verify and harden
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

## Phase 4 — Automation Wiring
- [ ] T39: Prepay payment triggers fulfillment
- [ ] T40: End-to-end flow verification

## Notes
- Started: 2026-02-08
- Last updated: 2026-02-08
- Current phase: Repair Phase COMPLETE, next T10
- T1-T9 completed under old (incorrect) plan assuming all-prepay
- R1-R5 fix the business model to support account + prepay customers

## Last Session Notes (2026-02-09)
- Completed R5: Fixed tax invoice due date calculation from payment terms
  - Added `paymentTerms` field to TaxInvoice schema (snapshot from order)
  - Updated `createTaxInvoice()` to calculate dueDate based on order.paymentTerms (NET_30→+30d, NET_60→+60d, NET_90→+90d, PREPAY/COD→issueDate)
  - Added `paymentTerms` to TaxInvoiceData interface and mapToTaxInvoiceData
  - Updated PDF `drawTIInvoiceDetails()` to show Due Date and Payment Terms in a two-row details box
  - Changed banking details reference from order number to invoice number
  - Updated frontend TaxInvoice type with paymentTerms field
  - Ran prisma db push, both backend and frontend compile clean
- Repair Phase R1-R5 now COMPLETE
- Next: T10 — Tax invoice API + staff UI
