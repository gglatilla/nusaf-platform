# Current Session

## Active Task
ERP Remediation — Phase 2: Route Separation (ERP vs Customer Portal)

## Status
IN_PROGRESS | 33% complete (2.1-2.3 done, 2.4-2.9 remaining)

## Completed Micro-tasks
- [x] 2.1 — Customer route group + layout infrastructure
- [x] 2.2 — Login redirect + middleware + cross-guards
- [x] 2.3 — Customer dashboard at /my/dashboard
- [ ] 2.4 — Customer product catalog page
- [ ] 2.5 — Customer product detail page
- [ ] 2.6 — Customer quotes (list + detail)
- [ ] 2.7 — Customer orders (list + detail)
- [ ] 2.8 — Customer account page
- [ ] 2.9 — Data leak audit + verification

## Files Created
- `frontend/src/lib/customer-navigation.ts`
- `frontend/src/components/auth/CustomerAuthGuard.tsx`
- `frontend/src/components/layout/CustomerHeader.tsx`
- `frontend/src/components/layout/CustomerLayout.tsx`
- `frontend/src/app/(customer)/layout.tsx`
- `frontend/src/app/(customer)/my/dashboard/page.tsx`

## Files Modified
- `frontend/src/app/(auth)/login/page.tsx` — role-based redirect after login
- `frontend/src/middleware.ts` — added /my to portalRoutes
- `frontend/src/components/auth/AuthGuard.tsx` — blocks CUSTOMER from ERP routes
- `frontend/src/components/quotes/QuoteCart.tsx` — role-aware links

## Decisions Made
- Keep `(portal)` as-is for staff, create `(customer)` route group for customers
- Customer URLs use `/my/` prefix: /my/dashboard, /my/products, /my/quotes, /my/orders, /my/account
- Header-based layout (no sidebar) for customer portal
- Cross-guard enforcement: AuthGuard redirects CUSTOMER → /my/dashboard, CustomerAuthGuard redirects staff → /dashboard
- QuoteCart links are role-aware (customer vs staff paths)

## Next Steps (Exact)
1. Session 2: Implement 2.4-2.8 (products, product detail, quotes, orders, account)
2. Session 3: 2.9 audit — verify no data leaks to customer views

## Context for Next Session
- Plan file: `.claude/plans/zazzy-puzzling-dove.md` (full Phase 2 plan)
- Progress tracker: `.claude/plans/erp-progress.md`
- Customer portal route group: `frontend/src/app/(customer)/`
- Customer layout components: `frontend/src/components/layout/Customer*.tsx`
- Reuse existing hooks: `useQuotes()`, `useOrders()`, `useProducts()`, `useCategories()`
- Need to create: `CustomerProductCard`, `CustomerQuoteListTable`, `CustomerOrderListTable`, `CustomerOrderStatusTracker`
