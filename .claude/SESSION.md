# Current Session

## Active Task
ERP Remediation — Phase 3: Document Chain + Status Propagation

## Status
IN_PROGRESS | 3.1 complete, 3.2-3.5 already done, next: 3.6

## Completed Micro-tasks
- [x] 3.1 — Enhance Sales Order detail page with fulfillment status panel
- [x] 3.2 — Picking slip → order status (Phase 0.8)
- [x] 3.3 — Job card → stock + order status (Phase 0.8)
- [x] 3.4 — Transfer → stock + order status (Phase 0.8)
- [x] 3.5 — GRV → PO status + stock (Phase 0.1)
- [ ] 3.6 — Build PO detail page with GRV history + linked orders
- [ ] 3.7 — Build Fulfillment Dashboard
- [ ] 3.8 — Add timeline/activity log to Sales Order page
- [ ] 3.9 — Multi-warehouse fulfillment orchestration

## Files Created
- `frontend/src/components/orders/order-detail/FulfillmentPipelineSteps.tsx`
- `frontend/src/components/orders/order-detail/FulfillmentStatsBar.tsx`
- `frontend/src/components/orders/order-detail/FulfillmentProgressBar.tsx`
- `frontend/src/components/orders/order-detail/PickingSlipsSection.tsx`
- `frontend/src/components/orders/order-detail/JobCardsSection.tsx`
- `frontend/src/components/orders/order-detail/TransferRequestsSection.tsx`
- `frontend/src/components/orders/order-detail/OrderNotesSection.tsx`
- `frontend/src/components/orders/order-detail/index.ts`

## Files Modified
- `backend/src/services/picking-slip.service.ts` — enriched getPickingSlipsForOrder
- `backend/src/services/job-card.service.ts` — enriched getJobCardsForOrder
- `backend/src/services/transfer-request.service.ts` — enriched getTransferRequestsForOrder
- `frontend/src/lib/api/types/orders.ts` — updated summary interfaces
- `frontend/src/lib/api.ts` — updated duplicate summary interfaces
- `frontend/src/app/(portal)/orders/[id]/page.tsx` — restructured with fulfillment panel

## Decisions Made
- Kept flat layout (no tabs) — orders don't have 8+ distinct sections like products
- Enriched existing endpoints instead of creating new composite endpoint
- Client-side fulfillment stats computed from order.lines (no backend needed)
- Pipeline steps derived from order.status (not document states) since Phase 0.8 ensures propagation

## Next Steps (Exact)
1. Micro-task 3.6 — Build PO detail page with GRV history + linked orders
2. Micro-task 3.7 — Build Fulfillment Dashboard
3. Micro-task 3.8 — Add timeline/activity log to Sales Order page
4. Micro-task 3.9 — Multi-warehouse fulfillment orchestration

## Context for Next Session
- Order detail page now has fulfillment pipeline steps, stats bar, progress bar
- 8 new components in `components/orders/order-detail/`
- Backend enriched to return assignee, dates, locations on fulfillment document summaries
- Progress tracker: `.claude/plans/erp-progress.md`
