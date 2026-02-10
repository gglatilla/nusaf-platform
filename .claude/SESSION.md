# Current Session

## Active Task
ERP Remediation — Execution Plan (38 tasks across 6 phases)

## Status
Phase 2B COMPLETE. Phase 2C starting. Next: T20 (Auto-generate proforma: verify and harden)

## Completed This Session
- [x] T18: Double reservation deduplication (2026-02-10)
- [x] T19: Soft reservation expiry background job (2026-02-10)

## What Was Done

### T18: Double Reservation Deduplication
- In `executeFulfillmentPlan()`, added STEP 4 that releases SalesOrder-level reservations for orchestrated products after creating fulfillment document (PickingSlip/JobCard) reservations
- Collects orchestrated productIds from picking slip lines + job card finished products
- Selective: non-orchestrated lines (backordered → POs) keep their order-level reservations
- All within existing transaction — atomic
- Created fix script `backend/src/scripts/fix-double-reservations.ts` (supports --dry-run, not auto-run)

### T19: Soft Reservation Expiry Background Job
- Created `reservation-cleanup.service.ts` with `releaseExpiredSoftReservations()` — batched (100), decrements softReserved
- Added `POST /api/v1/admin/cleanup/expired-reservations` endpoint (ADMIN only) in index.ts
- Fixed quote EXPIRED path in `acceptQuote()` to release soft reservations (was missing)
- Verified `rejectQuote()` already releases reservations; no `cancelQuote()` exists

## Decisions Made
- T18: Selective release by orchestrated productId (not blanket release of all SalesOrder reservations)
- T19: Batch size 100, stop on error (don't continue with partial state)
- T19: EXPIRED quote path now releases reservations immediately

## Files Modified This Session
- `backend/src/services/orchestration.service.ts` — T18 dedup logic + updateStockLevel import
- `backend/src/scripts/fix-double-reservations.ts` — NEW fix script (T18)
- `backend/src/services/reservation-cleanup.service.ts` — NEW cleanup service (T19)
- `backend/src/services/quote.service.ts` — EXPIRED path releases reservations (T19)
- `backend/src/index.ts` — cleanup endpoint + auth imports (T19)
- `.claude/plans/execution-progress.md` — T18+T19 marked complete

## Next Steps (Exact)
1. Start T20: Auto-generate proforma — verify and harden
2. Read execution-plan.md for T20 full prompt
3. Verify proforma is created for PREPAY orders with correct totals, PDF, bank details
4. Verify proforma is NOT created for account orders (NET_30/60/90)
5. Add fallback "Generate Proforma" button on staff order detail
6. Verify customer can see proforma on /my/orders/[id]

## Context for Next Session
- Execution plan: `.claude/plans/execution-plan.md`
- Progress tracker: `.claude/plans/execution-progress.md`
- Workflow: read progress → find first unchecked → read plan → execute → mark done → commit → push → STOP
- User says "go" to proceed to next task
- Phase 2B (Data Integrity) COMPLETE: T16, T17, T18, T19 all done
- Phase 2C (Remaining Operations) starts with T20
- T17 introduced `releaseReservationsInTransaction()` — reusable helper
- T18 introduced selective SalesOrder reservation release in executeFulfillmentPlan()
- T19 introduced `releaseExpiredSoftReservations()` + admin cleanup endpoint
