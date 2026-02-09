# Current Session

## Active Task
ERP Remediation — Execution Plan (38 tasks across 6 phases)

## Status
Phase 2B — Data Integrity. T17 complete. Next: T18 (Double reservation deduplication)

## Completed This Session
- [x] T17: Reservation cleanup on order cancel (all reference types) (2026-02-09)

## What Was Done

### T17: Reservation Cleanup on Order Cancel
- **Schema** (`backend/prisma/schema.prisma`):
  - Added CANCELLED to PickingSlipStatus, JobCardStatus, TransferRequestStatus enums
- **New helper** (`backend/src/services/inventory.service.ts`):
  - Created `releaseReservationsInTransaction()` — releases all active reservations for a reference within an existing Prisma transaction
- **Rewrote cancelOrder()** (`backend/src/services/order.service.ts`):
  - Single `prisma.$transaction()` wrapping all cleanup:
    - Cancels non-completed picking slips + releases PickingSlip reservations
    - Cancels non-completed job cards + releases JobCard reservations
    - Cancels PENDING transfers (IN_TRANSIT left alone)
    - Releases SalesOrder-level reservations
- **Fixed READY_TO_SHIP propagation** in all 3 services:
  - `picking-slip.service.ts`, `job-card.service.ts`, `transfer-request.service.ts`
  - CANCELLED documents now treated as "done" (don't block transition)
- **Updated status transition maps** in all 3 services to allow CANCELLED transitions
- **Frontend updates**:
  - PickingSlipStatusBadge, JobCardStatusBadge, TransferRequestStatusBadge — added CANCELLED (red badge)
  - TransferRequestStatus type in api.ts — added CANCELLED
  - Shared types (shared/src/types/order.ts) — PickingSlipStatus, JobCardStatus updated

## Decisions Made
- CANCELLED is a terminal state (no transitions out)
- IN_TRANSIT transfers are NOT cancelled (goods already in motion)
- CANCELLED documents don't block READY_TO_SHIP propagation
- All cleanup is atomic (single transaction) — partial cleanup is worse than none

## Files Modified This Session
- `backend/prisma/schema.prisma`
- `backend/src/services/inventory.service.ts`
- `backend/src/services/order.service.ts`
- `backend/src/services/picking-slip.service.ts`
- `backend/src/services/job-card.service.ts`
- `backend/src/services/transfer-request.service.ts`
- `frontend/src/lib/api.ts`
- `frontend/src/components/picking-slips/PickingSlipStatusBadge.tsx`
- `frontend/src/components/job-cards/JobCardStatusBadge.tsx`
- `frontend/src/components/transfer-requests/TransferRequestStatusBadge.tsx`
- `shared/src/types/order.ts`
- `.claude/plans/execution-progress.md`

## Next Steps (Exact)
1. Start T18: Double reservation deduplication
2. Read execution-plan.md for T18 full prompt
3. In executeFulfillmentPlan(), after creating picking slip/job card reservations, release corresponding SalesOrder-level reservations for same products
4. Create fix script for existing double reservations

## Context for Next Session
- Execution plan: `.claude/plans/execution-plan.md`
- Progress tracker: `.claude/plans/execution-progress.md`
- Workflow: read progress → find first unchecked → read plan → execute → mark done → commit → push → STOP
- User says "go" to proceed to next task
- Phase 2B in progress, T18 next
- T17 introduced `releaseReservationsInTransaction()` — reusable for T18
