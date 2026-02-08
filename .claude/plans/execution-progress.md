# NUSAF ERP Execution Progress

## Phase 1A — Quick Wins
- [x] T1: onOrder update on PO send/cancel (2026-02-08)
- [x] T2: Quote accept → auto-create Sales Order (2026-02-08)
- [x] T3: Transfer request check in READY_TO_SHIP gate (2026-02-08)
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
- Started: 2026-02-08
- Last updated: 2026-02-08
- Current phase: Phase 1A
