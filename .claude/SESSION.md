# Current Session

## Active Task
ERP Remediation — Phase 0: Integration Audit

## Status
IN_PROGRESS | 2 of 9 micro-tasks complete (0.1, 0.2)

## Completed Micro-tasks
- [x] 0.1 — Audit GRV → Stock flow (ALL 6 CHECKS PASS)
- [x] 0.2 — Audit Picking Slip → Stock flow (ALL 5 CHECKS FAIL)
- [ ] 0.3 — Audit Job Card → Stock flow
- [ ] 0.4 — Audit Transfer Request → Stock flow
- [ ] 0.5 — Audit Stock Adjustment → Stock flow
- [ ] 0.6 — Audit Quote → Reservation flow
- [ ] 0.7 — Audit Sales Order → Reservation flow
- [ ] 0.8 — Fix all broken/missing flows identified in 0.1-0.7
- [ ] 0.9 — Create integration test script that verifies all 7 flows

## Files Modified
- `.claude/plans/erp-progress.md` — Updated with audit results for 0.1 and 0.2

## Decisions Made
- GRV flow is solid — no changes needed
- Picking slip `completePicking()` needs full rewrite in 0.8 (status-only, no stock integration)

## Key Findings So Far
### 0.1 GRV → Stock: CLEAN
- Full Prisma transaction, StockMovement RECEIPT, onHand increase, onOrder decrease, PO status propagation
- Key file: `backend/src/services/grv.service.ts:127-343`

### 0.2 Picking Slip → Stock: BROKEN
- `completePicking()` at `backend/src/services/picking-slip.service.ts:409-450` is status-only
- Missing: StockMovement ISSUE, onHand decrease, reservation release, SalesOrder propagation
- Fix scope: ~100-150 lines of transaction logic

## Next Steps (Exact)
1. Start micro-task 0.3 — Audit Job Card → Stock flow
2. Read `backend/src/services/job-card.service.ts` (or equivalent)
3. Find the job card completion function
4. Verify MANUFACTURE_IN/MANUFACTURE_OUT movements, BOM component consumption, onHand updates
5. Continue through 0.4-0.7, then fix everything in 0.8

## Context for Next Session
- Framework files: `.claude/plans/erp-execution-framework.md` and `.claude/plans/erp-progress.md`
- Each audit micro-task requires reciting 8 golden rules before starting
- User wants explicit gate: recite rules, state what's being checked, wait for "go"
