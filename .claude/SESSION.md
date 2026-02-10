# Current Session

## Active Task
ERP Remediation — Execution Plan (38 tasks across 6 phases)

## Status
Phase 2B — Data Integrity. T18 complete. Next: T19 (Soft reservation expiry background job)

## Completed This Session
- [x] T18: Double reservation deduplication (2026-02-10)

## What Was Done

### T18: Double Reservation Deduplication
- **Modified `executeFulfillmentPlan()`** (`backend/src/services/orchestration.service.ts`):
  - Added STEP 4 after creating all fulfillment documents (picking slips, job cards, transfers, POs)
  - Collects orchestrated productIds from picking slip lines + job card finished products
  - Finds active SalesOrder reservations for those products (partial orchestration safe — non-orchestrated lines keep their reservations)
  - Releases each duplicate reservation and decrements hardReserved via atomic updateStockLevel
  - All within the existing transaction — atomic with document creation
  - Added `updateStockLevel` import from inventory.service.ts
- **Created fix script** (`backend/src/scripts/fix-double-reservations.ts`):
  - Finds orders in PROCESSING/READY_TO_SHIP/SHIPPED/DELIVERED/INVOICED/CLOSED status
  - For each, finds active SalesOrder reservations where the product also has PickingSlip or JobCard reservations
  - Releases the duplicate SalesOrder reservation and decrements hardReserved
  - Supports `--dry-run` flag
  - NOT auto-run — manual review required

## Decisions Made
- Selective release: only release SalesOrder reservations for products that have fulfillment-level reservations
- Non-orchestrated lines (backordered → POs) keep their order-level reservations
- Release reason: "Transferred to fulfillment document reservation" for audit trail

## Files Modified This Session
- `backend/src/services/orchestration.service.ts` — added dedup logic + updateStockLevel import
- `backend/src/scripts/fix-double-reservations.ts` — NEW fix script
- `.claude/plans/execution-progress.md` — marked T18 complete
- `.claude/SESSION.md` — updated session state

## Next Steps (Exact)
1. Start T19: Soft reservation expiry background job
2. Read execution-plan.md for T19 full prompt
3. Create `reservation-cleanup.service.ts` with `releaseExpiredSoftReservations()`
4. Add API endpoint `POST /admin/cleanup/expired-reservations` (ADMIN only)
5. Verify rejectQuote/cancelQuote already release reservations

## Context for Next Session
- Execution plan: `.claude/plans/execution-plan.md`
- Progress tracker: `.claude/plans/execution-progress.md`
- Workflow: read progress → find first unchecked → read plan → execute → mark done → commit → push → STOP
- User says "go" to proceed to next task
- Phase 2B in progress, T19 next
