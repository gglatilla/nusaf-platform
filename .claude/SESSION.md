# Current Session

## Active Task
ERP Remediation — Phase 2: Route Separation (ERP vs Customer Portal)

## Status
IN_PROGRESS | 44% complete (2.1-2.4 done, 2.5-2.9 remaining)

## Completed Micro-tasks
- [x] 2.1 — Customer route group + layout infrastructure
- [x] 2.2 — Login redirect + middleware + cross-guards
- [x] 2.3 — Customer dashboard at /my/dashboard
- [x] 2.4 — Customer product catalog page at /my/products
- [ ] 2.5 — Customer product detail page
- [ ] 2.6 — Customer quotes (list + detail)
- [ ] 2.7 — Customer orders (list + detail)
- [ ] 2.8 — Customer account page
- [ ] 2.9 — Data leak audit + verification

## Files Created This Session
- `frontend/src/app/(customer)/my/products/page.tsx`

## Files Modified This Session
- `frontend/src/components/products/ProductCard.tsx` — added hideSupplier prop
- `frontend/src/components/products/ProductGrid.tsx` — added hideSupplier passthrough
- `frontend/src/components/products/ProductDetailModal.tsx` — added hideSupplier + detailLinkPrefix props

## Decisions Made
- Reused existing components with new props (hideSupplier, detailLinkPrefix) rather than duplicating
- Customer always sees isPublished: 'true' filter
- No warehouse selector for customers (aggregate availability)
- Grid-only view (no table toggle for customers)
- "View Full Details" link in modal → `/my/products/${sku}` (for micro-task 2.5)

## Next Steps (Exact)
1. Micro-task 2.5: Build customer product detail page at `/my/products/[sku]`
   - Read-only product info (no supplier info, no cost prices, no BOMs)
   - Availability badge, tier pricing, product images, description
   - Add-to-quote button
2. Then 2.6-2.8 (quotes, orders, account pages)
3. Then 2.9 (data leak audit)

## Context for Next Session
- Progress tracker: `.claude/plans/erp-progress.md`
- Customer portal route group: `frontend/src/app/(customer)/`
- Customer layout components: `frontend/src/components/layout/Customer*.tsx`
- hideSupplier/detailLinkPrefix props are now available on shared components
- Existing hooks to reuse: useProducts, useCategories, useQuotes, useOrders
