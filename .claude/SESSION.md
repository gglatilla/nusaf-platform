# Current Session

## Active Task
[TASK-027] Fix Customer Portal View Details Crash + isPublished Filter

## Status
COMPLETE (2026-02-10)

## Completed This Session

### Fix 1: ProductDetailModal crash for CUSTOMER role
- Root cause: `product.supplier.code` accessed unconditionally in `supplierBadgeClass` computation
- Backend strips `supplier` from response for CUSTOMER role (Golden Rule 4)
- Fix: optional chaining `product.supplier?.code` + conditional `supplierBadgeClass`
- File: `frontend/src/components/products/ProductDetailModal.tsx`

### Fix 2: isPublished param not sent in getProducts()
- Customer page passes `isPublished: 'true'` but `api.getProducts()` never added it to URL query string
- Customers saw ALL products (published + unpublished) instead of only published
- Fix: added `if (params.isPublished) searchParams.set('isPublished', params.isPublished)`
- File: `frontend/src/lib/api.ts`

## Remaining (Deployment — NOT code changes)
- Sales login (`sales@nusaf.co.za` / `sales123`) — needs Railway deployment steps:
  1. `npx prisma migrate deploy` — apply `add_company_is_internal` migration
  2. `npm run db:seed` — re-seed test user data
- This is NOT a code bug — the seed file and auth logic are correct

## Context for Next Session
- TASK-027 fixes pushed to remote
- Customer portal products page now correctly filters by isPublished
- ProductDetailModal safely handles missing supplier (CUSTOMER role)
- Railway still needs migrate + seed for sales login to work
