# Current Session

## Active Task
ERP Remediation — Phase 3: Document Chain + Status Propagation

## Status
IN_PROGRESS | 3.8 complete, next: 3.9

## Completed Micro-tasks
- [x] 3.1 — Enhance Sales Order detail page with fulfillment status panel
- [x] 3.2 — Picking slip → order status (Phase 0.8)
- [x] 3.3 — Job card → stock + order status (Phase 0.8)
- [x] 3.4 — Transfer → stock + order status (Phase 0.8)
- [x] 3.5 — GRV → PO status + stock (Phase 0.1)
- [x] 3.6 — Enhance PO detail page with GRV history + linked orders
- [x] 3.7 — Build Fulfillment Dashboard
- [x] 3.8 — Add timeline/activity log to Sales Order page
- [ ] 3.9 — Multi-warehouse fulfillment orchestration

## Files Created (3.8)
- `backend/src/services/order-timeline.service.ts`
- `frontend/src/components/orders/order-detail/OrderTimelineSection.tsx`

## Files Modified (3.8)
- `backend/src/api/v1/orders/route.ts` — added timeline endpoint
- `frontend/src/lib/api.ts` — added TimelineEvent types + getOrderTimeline()
- `frontend/src/hooks/useOrders.ts` — added useOrderTimeline() hook
- `frontend/src/components/orders/order-detail/index.ts` — exported OrderTimelineSection
- `frontend/src/app/(portal)/orders/[id]/page.tsx` — integrated timeline into sidebar

## Decisions Made
- Timeline aggregates events from order + picking slips + job cards + transfer requests
- Events sorted newest-first for sidebar display
- User names resolved via second-phase query (not embedded in document snapshots)
- Sidebar placement keeps main content for fulfillment documents

## Next Steps (Exact)
1. Micro-task 3.9 — Multi-warehouse fulfillment orchestration (auto picking slip splitting + transfer requests)

## Context for Next Session
- Timeline component at `components/orders/order-detail/OrderTimelineSection.tsx`
- Backend service at `services/order-timeline.service.ts`
- Hook: `useOrderTimeline()` in `hooks/useOrders.ts`
- Backend endpoint: `GET /api/v1/orders/:id/timeline`
- Progress tracker: `.claude/plans/erp-progress.md`
