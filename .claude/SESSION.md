# Current Session

## Active Task
ERP Remediation — Execution Plan (38 tasks across 6 phases)

## Status
Phase 2B complete. Phase 2C starting. Next: T20 (Auto-generate proforma: verify and harden)

## Completed This Session
- [x] T18: Double reservation deduplication (2026-02-10)
- [x] T19: Soft reservation expiry background job (2026-02-10)

## What Was Done

### T18: Double Reservation Deduplication
- In `executeFulfillmentPlan()`, releases SalesOrder-level reservations for orchestrated products after creating fulfillment document reservations
- Created fix script `backend/src/scripts/fix-double-reservations.ts`

### T19: Soft Reservation Expiry Background Job
- Created `reservation-cleanup.service.ts` with `releaseExpiredSoftReservations()` — processes expired SOFT reservations in batches of 100
- Added `POST /api/v1/admin/cleanup/expired-reservations` endpoint (ADMIN only) in index.ts
- Fixed quote EXPIRED path in `acceptQuote()` to release soft reservations (was missing)
- Verified `rejectQuote()` already releases reservations correctly
- No `cancelQuote()` function exists — quotes use EXPIRED/REJECTED statuses

## Decisions Made
- Batch size of 100 for reservation cleanup to avoid long-running transactions
- On batch error, stop processing (don't continue with partial state)
- EXPIRED quote path now releases reservations immediately (previously left to background cleanup)

## Files Modified This Session
- `backend/src/services/orchestration.service.ts` — T18 dedup logic
- `backend/src/scripts/fix-double-reservations.ts` — NEW fix script
- `backend/src/services/reservation-cleanup.service.ts` — NEW cleanup service
- `backend/src/services/quote.service.ts` — EXPIRED path releases reservations
- `backend/src/index.ts` — added cleanup endpoint + auth imports

## Next Steps (Exact)
1. Start T20: Auto-generate proforma — verify and harden
2. Read execution-plan.md for T20 full prompt
3. Verify proforma is created for PREPAY orders, NOT for account orders
4. Add fallback "Generate Proforma" button on staff order detail
5. Verify PDF includes bank details and payment reference

## Context for Next Session
- Execution plan: `.claude/plans/execution-plan.md`
- Progress tracker: `.claude/plans/execution-progress.md`
- Phase 2B (Data Integrity) is COMPLETE (T16-T19 all done)
- Phase 2C (Remaining Operations) starting with T20
