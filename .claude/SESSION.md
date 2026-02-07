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

## Files Created This Session (2.7 + 2.8)
- `frontend/src/app/(customer)/my/orders/page.tsx`
- `frontend/src/app/(customer)/my/orders/[id]/page.tsx`
- `frontend/src/app/(customer)/my/account/page.tsx`

## Files Modified This Session (2.7 + 2.8)
- `backend/src/api/v1/orders/route.ts` — per-route auth (GET open to all, write staff-only)
- `backend/src/api/v1/auth/route.ts` — added change-password endpoint
- `backend/src/utils/validation/auth.ts` — added changePasswordSchema
- `frontend/src/lib/api.ts` — added changePassword method
- `frontend/src/components/orders/OrderListTable.tsx` — added linkPrefix + quotesHref props
- `frontend/src/components/orders/OrderLineTable.tsx` — added hideOperationalColumns prop

## Decisions Made
- Backend orders: Removed global requireRole, added staffOnly per-route to write operations
- GET routes open to all authenticated users (company isolation via companyId already exists)
- Allocation-plan GET route kept staff-only (internal operational data)
- Customer order detail: shows pipeline steps but hides fulfillment stats, operational documents
- Hold/cancel banners show generic messages (not internal reasons)
- OrderLineTable: Status and Picked columns hidden for customers
- Change password revokes all sessions for security

## Data Leak Audit Findings (pre-work for 2.9)
Audit agent completed a preliminary scan. Key findings:
- **P0 (FAIL)**: GET /api/v1/products/:id returns `costPrice` and `landedCost` to all authenticated users — must filter by role
- **P1 (WARN)**: GET /api/v1/products list returns `supplier.name` — frontend hides via hideSupplier but API still exposes
- **PASS**: All customer frontend pages correctly use /my/ prefix, no staff route links
- **PASS**: hideSupplier, showQuantity, hideOperationalColumns all work correctly
- **PASS**: Company isolation enforced at API level (companyId filtering)
- **PASS**: No BOM exposure, no internal notes, no picking slips/job cards/transfers in customer views

## Next Steps (Exact)
1. Micro-task 2.9: Fix the P0/P1 backend data leaks found in audit
   - Filter costPrice/landedCost from GET /products/:id for CUSTOMER role
   - Filter supplier name from GET /products list for CUSTOMER role
   - Verify all other endpoints are clean
   - Final comprehensive check

## Context for Next Session
- Progress tracker: `.claude/plans/erp-progress.md`
- Customer portal route group: `frontend/src/app/(customer)/`
- All customer pages: dashboard, products, products/[sku], quotes, quotes/[id], orders, orders/[id], account
- Backend products route: `backend/src/api/v1/products/route.ts` — needs role-based filtering
