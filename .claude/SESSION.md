# Current Session

## Active Task
ERP Remediation — Phase 2: Route Separation (ERP vs Customer Portal)

## Status
IN_PROGRESS | 78% complete (2.1-2.7 done, 2.8-2.9 remaining)

## Completed Micro-tasks
- [x] 2.1 — Customer route group + layout infrastructure
- [x] 2.2 — Login redirect + middleware + cross-guards
- [x] 2.3 — Customer dashboard at /my/dashboard
- [x] 2.4 — Customer product catalog page at /my/products
- [x] 2.5 — Customer product detail page at /my/products/[sku]
- [x] 2.6 — Customer quotes (list + detail)
- [x] 2.7 — Customer orders (list + detail)
- [ ] 2.8 — Customer account page
- [ ] 2.9 — Data leak audit + verification

## Files Created This Session
- `frontend/src/app/(customer)/my/orders/page.tsx`
- `frontend/src/app/(customer)/my/orders/[id]/page.tsx`

## Files Modified This Session
- `backend/src/api/v1/orders/route.ts` — per-route auth (GET open to all, write staff-only)
- `frontend/src/components/orders/OrderListTable.tsx` — added linkPrefix + quotesHref props
- `frontend/src/components/orders/OrderLineTable.tsx` — added hideOperationalColumns prop

## Decisions Made
- Backend: Removed global `requireRole('ADMIN', 'MANAGER', 'SALES')`, added `staffOnly` per-route to write operations
- GET routes open to all authenticated users (company isolation via companyId already exists)
- Allocation-plan GET route kept staff-only (internal operational data)
- Customer order detail: shows pipeline steps but hides fulfillment stats/progress, operational documents
- Hold/cancel banners show generic messages (not internal reasons)
- OrderLineTable: Status and Picked columns hidden for customers (operational detail)

## Next Steps (Exact)
1. Micro-task 2.8: Build customer account page at `/my/account`
   - Display user profile info, company info
   - Change password functionality
   - No admin controls
2. Then 2.9 (data leak audit)

## Context for Next Session
- Progress tracker: `.claude/plans/erp-progress.md`
- Customer portal route group: `frontend/src/app/(customer)/`
- Customer layout components: `frontend/src/components/layout/Customer*.tsx`
- All shared components now have customer-safe props (hideSupplier, linkPrefix, hideOperationalColumns, etc.)
- Existing hooks to reuse: useProducts, useCategories, useQuotes, useOrders
