# Current Session

## Active Task
ERP Remediation — Phase 0: Integration Audit

## Status
IN_PROGRESS | 8 of 9 micro-tasks complete (0.1-0.8)

## Completed Micro-tasks
- [x] 0.1 — Audit GRV → Stock flow (ALL 6 CHECKS PASS)
- [x] 0.2 — Audit Picking Slip → Stock flow (ALL 5 CHECKS FAIL)
- [x] 0.3 — Audit Job Card → Stock flow (ALL 5 CHECKS FAIL)
- [x] 0.4 — Audit Transfer Request → Stock flow (4/5 FAIL)
- [x] 0.5 — Audit Stock Adjustment → Stock flow (ALL 3 CHECKS PASS)
- [x] 0.6 — Audit Quote → Reservation flow (ALL 3 CHECKS PASS)
- [x] 0.7 — Audit Sales Order → Reservation flow (ALL 3 CHECKS PASS)
- [x] 0.8 — Fix all broken/missing flows (3 services fixed, TypeScript clean)
- [ ] 0.9 — Create integration test script that verifies all 7 flows

## Files Modified (0.8)
- `backend/src/services/inventory.service.ts` — exported updateStockLevel + createStockMovement helpers
- `backend/src/services/picking-slip.service.ts` — rewrote completePicking() with full stock integration
- `backend/src/services/job-card.service.ts` — rewrote completeJobCard() with BOM consumption + stock integration
- `backend/src/services/transfer-request.service.ts` — rewrote shipTransfer() + receiveTransfer() with stock integration

## Decisions Made
- Exported `updateStockLevel` and `createStockMovement` from inventory.service.ts for cross-service reuse
- Manufacturing always happens at JHB (only manufacturing location)
- BOM component consumption uses Math.ceil() for fractional quantities
- SalesOrder status propagation: CONFIRMED→PROCESSING (partial), PROCESSING→READY_TO_SHIP (all done)
- Hard reservation release happens per-product per-location matching the SalesOrder

## Next Steps (Exact)
1. Start micro-task 0.9 — Create integration test script
2. Create test file at `backend/tests/integration/` or similar
3. Test all 7 document-to-stock flows programmatically
4. This completes Phase 0 — Foundation

## Context for Next Session
- All 7 flows now have proper stock integration
- 4 were already working (GRV, stock adjustment, quote reservation, sales order reservation)
- 3 were fixed in 0.8 (picking slip, job card, transfer request)
- Progress tracker: `.claude/plans/erp-progress.md`
