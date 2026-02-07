# Current Session

## Active Task
ERP Remediation — Phase 2: Route Separation (ERP vs Customer Portal)

## Status
IN_PROGRESS | 89% complete (2.1-2.8 done, 2.9 remaining)

## Completed Micro-tasks
- [x] 2.1 — Customer route group + layout infrastructure
- [x] 2.2 — Login redirect + middleware + cross-guards
- [x] 2.3 — Customer dashboard at /my/dashboard
- [x] 2.4 — Customer product catalog page at /my/products
- [x] 2.5 — Customer product detail page at /my/products/[sku]
- [x] 2.6 — Customer quotes (list + detail)
- [x] 2.7 — Customer orders (list + detail)
- [x] 2.8 — Customer account page
- [ ] 2.9 — Data leak audit + verification

## Files Created This Session
- `frontend/src/app/(customer)/my/orders/page.tsx`
- `frontend/src/app/(customer)/my/orders/[id]/page.tsx`
- `frontend/src/app/(customer)/my/account/page.tsx`

## Files Modified This Session
- `backend/src/api/v1/orders/route.ts` — per-route auth (GET open to all, write staff-only)
- `backend/src/api/v1/auth/route.ts` — added change-password endpoint
- `backend/src/utils/validation/auth.ts` — added changePasswordSchema
- `frontend/src/lib/api.ts` — added changePassword method
- `frontend/src/components/orders/OrderListTable.tsx` — added linkPrefix + quotesHref props
- `frontend/src/components/orders/OrderLineTable.tsx` — added hideOperationalColumns prop

## Next Steps (Exact)
1. Micro-task 2.9: Data leak audit + verification
   - Search ALL customer pages for any internal data exposure
   - Check shared components used in customer context
   - Verify no staff-only links in customer pages
   - Verify no cost prices, supplier info, BOMs, stock quantities (only badges)
   - Check backend endpoints accessible by CUSTOMER role return no internal data

## Context for Next Session
- Progress tracker: `.claude/plans/erp-progress.md`
- Customer portal route group: `frontend/src/app/(customer)/`
- All customer pages: dashboard, products, products/[sku], quotes, quotes/[id], orders, orders/[id], account
