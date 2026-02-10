# Current Session

## Active Task
None — session saved (2026-02-10)

## Completed This Session

### Bug Fix: Sales role company picker (e89f1f5)
- `/api/v1/admin/companies` had router-level `requireRole('ADMIN', 'MANAGER')` blocking SALES users
- Changed to per-route: GET allows SALES, POST stays ADMIN, PATCH stays ADMIN/MANAGER

### Seed: Stock levels for all products (6f86d42, optimized in 6e0d04e)
- Added stock level seeding to `backend/prisma/seed.ts` using batch `createMany`
- Seeded 7,132 stock levels for 3,566 products (JHB + CT per product)
- Distribution: ~20% out of stock (728), ~15% low (531), rest normal
- Ran seed against Railway production DB via public proxy
- **To remove**: delete the "STOCK LEVELS" section from seed.ts, truncate `stock_levels` table

### Customer stock visibility (e89c47d, 8bce934, 525e6c9)
- **Backend**: Removed Golden Rule 4 restriction — customers now get `totalOnHand`, `totalAvailable`, and `byLocation` data (reserved/onOrder still hidden as 0)
- **Backend**: Always return supplier in product API (was omitting for customers, causing frontend crash)
- **Staff catalog** (`/catalog`): `showQuantity=true` for all users, `hideSupplier` for non-internal
- **Customer catalog** (`/my/products`): Changed `showQuantity={false}` → `true` and `showStockQuantity={false}` → `true`
- **StockOverviewCards VIEW D**: Shows warehouse name ("15 Available at Johannesburg")
- **ProductCard**: Added null-safe `product.supplier &&` check

## Commits
- e89f1f5: Fix sales role company picker
- 6f86d42: Add stock level seeding
- 6e0d04e: Optimize seed with batch createMany
- e89c47d: Show stock quantities to customers (backend + staff catalog)
- 8bce934: Fix customer catalog crash — always send supplier, add hideSupplier
- 525e6c9: Show stock quantities on customer product page /my/products

## Next Steps
- Verify on deployed site: customer sees "15 available" on /my/products
- Check TASKS.md backlog for next feature work

## Context for Next Session
- Stock level seed data in `backend/prisma/seed.ts` — user may ask to remove later
- Customer portal is `(customer)/my/products/page.tsx`, staff portal is `(portal)/catalog/page.tsx` — different pages!
- TASK-027 cash customer migration still needs `npx prisma migrate deploy` on Railway
