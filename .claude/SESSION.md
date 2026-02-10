# Current Session

## Active Task
ERP Remediation — Execution Plan (38 tasks across 6 phases)

## Status
Phase 2C — Remaining Operations. T20 complete. Next: T21 (Staff-on-behalf-of-customer quotes API)

## Completed This Session
- [x] T18: Double reservation deduplication (2026-02-10)
- [x] T19: Soft reservation expiry background job (2026-02-10)
- [x] T20: Auto-generate proforma — verify and harden (2026-02-10)

## What Was Done

### T18: Double Reservation Deduplication
- In `executeFulfillmentPlan()`, added STEP 4 that releases SalesOrder-level reservations for orchestrated products
- Created fix script `backend/src/scripts/fix-double-reservations.ts`

### T19: Soft Reservation Expiry Background Job
- Created `reservation-cleanup.service.ts` with `releaseExpiredSoftReservations()`
- Added `POST /api/v1/admin/cleanup/expired-reservations` endpoint (ADMIN only)
- Fixed quote EXPIRED path to release soft reservations

### T20: Auto-Generate Proforma — Verify and Harden
- Verified: PREPAY/COD auto-proforma works, account orders don't generate proformas
- Verified: PDF has bank details (placeholders), order reference, disclaimer
- Verified: customer portal shows ACTIVE proformas with PDF download
- Fixed: "Proforma Invoice" button visibility — now only PREPAY/COD + no active proforma

## Files Modified This Session
- `backend/src/services/orchestration.service.ts` — T18 dedup logic
- `backend/src/scripts/fix-double-reservations.ts` — NEW (T18)
- `backend/src/services/reservation-cleanup.service.ts` — NEW (T19)
- `backend/src/services/quote.service.ts` — EXPIRED path fix (T19)
- `backend/src/index.ts` — cleanup endpoint (T19)
- `frontend/src/app/(portal)/orders/[id]/page.tsx` — proforma button fix (T20)

## Next Steps (Exact)
1. Start T21: Staff-on-behalf-of-customer quotes (API)
2. Read execution-plan.md for T21 full prompt
3. Modify quote creation to accept optional companyId for staff (ADMIN/MANAGER/SALES)
4. CUSTOMER role: always own company, no override
5. Use selected company's customerTier for pricing and primaryWarehouse
6. Track that quote was staff-created

## Context for Next Session
- Execution plan: `.claude/plans/execution-plan.md`
- Progress tracker: `.claude/plans/execution-progress.md`
- Workflow: read progress → find first unchecked → read plan → execute → mark done → commit → push → STOP
- User says "go" to proceed to next task
- Phase 2C in progress, T21 next
