# Current Session

## Active Task
TASK-013C Product List Stock Badges (PLANNED, NOT STARTED)

## Status
PLANNED | Plan approved, ready to implement

## Previous Task Completed
TASK-013B Bug Fixes - Inventory Tab Issues (COMPLETE)
- Missing inventory tables migration
- API response shape alignment
- Warehouse breakdown always shows both locations
- Backend + frontend sort: JHB first

## TASK-013C Plan Summary
Add stock status badges to product listing page:

### Micro-tasks (7 total)
1. Extend API types - add `stockSummary` to CatalogProduct, extend ProductsQueryParams
2. Update useProducts hook - always include stockSummary
3. Add StockStatusBadge to ProductCard (top-right corner)
4. Create StockStatusFilter component (sidebar checkboxes)
5. Create ProductSort component (dropdown above grid)
6. Integrate in Products page (state, URL sync, wire up)
7. Export new components

### Files to Modify
- `frontend/src/lib/api.ts`
- `frontend/src/hooks/useProducts.ts`
- `frontend/src/components/products/ProductCard.tsx`
- `frontend/src/components/products/StockStatusFilter.tsx` (NEW)
- `frontend/src/components/products/ProductSort.tsx` (NEW)
- `frontend/src/app/(portal)/products/page.tsx`
- `frontend/src/components/products/index.ts`

## Full Plan Location
See: `C:\Users\Guido\.claude\plans\cryptic-cuddling-parnas.md`

## Next Steps (Exact)
1. Start with micro-task 1: Extend API types in `frontend/src/lib/api.ts`
2. Add `stockSummary` optional field to CatalogProduct interface
3. Add `include` and `stockStatus` to ProductsQueryParams

## Context for Next Session
TASK-013C is fully planned with 7 micro-tasks. Backend support already exists:
- `?include=stockSummary` returns stock data per product
- `?stockStatus=IN_STOCK,LOW_STOCK,...` filters by status
- `?sort=available:asc|desc` sorts by availability

Ready to start implementation with micro-task 1.
