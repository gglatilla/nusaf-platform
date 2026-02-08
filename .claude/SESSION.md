# Current Session

## Active Task
ERP Remediation — Execution Plan (38 tasks across 6 phases)

## Status
Phase 1A — Quick Wins: T1-T3 COMPLETE, T4 next

## Completed This Session
- [x] T1: onOrder update on PO send/cancel (2026-02-08)
- [x] T2: Quote accept → auto-create Sales Order (2026-02-08)
- [x] T3: Transfer request check in READY_TO_SHIP gate (2026-02-08)

## What Was Done

### T1: onOrder update on PO send/cancel
- Modified `sendToSupplier()` in purchase-order.service.ts — wraps in transaction, increments onOrder for each PO line
- Modified `cancelPurchaseOrder()` — decrements onOrder for unreceived quantities with Math.min safety
- Created `backend/src/scripts/fix-onorder.ts` standalone data fix script

### T2: Quote accept → auto-create Sales Order
- Modified `acceptQuote()` in quote.service.ts — auto-calls createOrderFromQuote() after acceptance (error-isolated)
- Modified `getQuoteById()` — queries converted order via SalesOrder.quoteId
- Updated API route, frontend types, hooks, customer quote detail, staff quote detail
- Added convertedOrder field to Quote interface, order-created banners with links

### T3: Transfer request check in READY_TO_SHIP gate
- Modified `completePicking()` in picking-slip.service.ts — added transfer check to READY_TO_SHIP gate
- Modified `completeJobCard()` in job-card.service.ts — same transfer check added
- Modified `receiveTransfer()` in transfer-request.service.ts — added READY_TO_SHIP propagation after receiving
- Note: Prisma enum only has PENDING|IN_TRANSIT|RECEIVED (no CANCELLED), so only checking for RECEIVED

## Decisions Made
- T2: Quote stays ACCEPTED if auto order creation fails (for manual retry)
- T2: Used existing SalesOrder.quoteId relation instead of adding new field to Quote model
- T3: Removed CANCELLED check from transfer done status since it doesn't exist in Prisma enum yet

## Files Modified
- `backend/src/services/purchase-order.service.ts` (T1)
- `backend/src/scripts/fix-onorder.ts` (T1 — new file)
- `backend/src/services/quote.service.ts` (T2)
- `backend/src/api/v1/quotes/route.ts` (T2)
- `frontend/src/lib/api.ts` (T2)
- `frontend/src/lib/api/types/orders.ts` (T2)
- `frontend/src/hooks/useQuotes.ts` (T2)
- `frontend/src/app/(customer)/my/quotes/[id]/page.tsx` (T2)
- `frontend/src/app/(portal)/quotes/[id]/page.tsx` (T2)
- `backend/src/services/picking-slip.service.ts` (T3)
- `backend/src/services/job-card.service.ts` (T3)
- `backend/src/services/transfer-request.service.ts` (T3)
- `.claude/plans/execution-progress.md` (tracking)

## Next Steps (Exact)
1. Start T4: PO rejection → DRAFT (not CANCELLED)
2. Read execution-plan.md for T4 full prompt
3. Execute T4 following task instructions

## Context for Next Session
- Execution plan: `.claude/plans/execution-plan.md`
- Progress tracker: `.claude/plans/execution-progress.md`
- Workflow: read progress → find first unchecked → read plan → execute → mark done → commit → push → STOP
- User says "go" to proceed to next task
- Git has NUL file issue — use specific file paths in git add, not -A
