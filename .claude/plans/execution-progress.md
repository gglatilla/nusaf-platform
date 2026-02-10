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
- [x] T10: Tax invoice API + staff UI (2026-02-09)
- [x] T11: Tax invoice customer portal + order lifecycle completion (2026-02-09)

## Phase 2A — Manufacturing
- [x] T12: BOM components display on job card (API) (2026-02-09)
- [x] T13: BOM components display on job card (UI) (2026-02-09)
- [x] T14: Raw material availability check on job start (2026-02-09)
- [x] T15: BOM snapshot at job card creation + consume from snapshot (2026-02-09)

## Phase 2B — Data Integrity
- [x] T16: Atomic increments in updateStockLevel (2026-02-09)
- [x] T17: Reservation cleanup on order cancel (all reference types) (2026-02-09)
- [x] T18: Double reservation deduplication (2026-02-10)
- [x] T19: Soft reservation expiry background job (2026-02-10)

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
- Last updated: 2026-02-10
- Current phase: Phase 2C, next T20
- T1-T9 completed under old (incorrect) plan assuming all-prepay
- R1-R5 fix the business model to support account + prepay customers

## Last Session Notes (2026-02-10)
- Completed T18: Double reservation deduplication
  - In `executeFulfillmentPlan()`, releases SalesOrder-level reservations for orchestrated products
  - Created fix script for existing double reservations
- Completed T19: Soft reservation expiry background job
  - Created `reservation-cleanup.service.ts` with `releaseExpiredSoftReservations()` (batch processing, 100 at a time)
  - Added `POST /api/v1/admin/cleanup/expired-reservations` endpoint (ADMIN only)
  - Fixed quote EXPIRED path to release soft reservations (was missing)
  - Verified `rejectQuote()` already releases reservations
  - No `cancelQuote()` exists — quotes use EXPIRED/REJECTED statuses
  - Backend + frontend compile with zero TypeScript errors
- Next: T20 — Auto-generate proforma: verify and harden
