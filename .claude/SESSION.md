# Current Session

## Active Task
None — session saved (2026-02-10)

## Completed This Session

### Bug Fix: Sales role company picker (e89f1f5)
- `/api/v1/admin/companies` had router-level `requireRole('ADMIN', 'MANAGER')` blocking SALES users
- Changed to per-route: GET allows SALES, POST stays ADMIN, PATCH stays ADMIN/MANAGER

### Seed: Stock levels for all products (6f86d42)
- Added stock level seeding to `backend/prisma/seed.ts`
- Creates JHB + CT StockLevel records for every existing product
- Distribution: ~20% out of stock, ~15% low, ~15% single-warehouse, ~50% normal
- Uses seeded random (deterministic) — safe to re-run via `npm run db:seed`
- **To remove**: delete the "STOCK LEVELS" section from seed.ts, then run SQL: `DELETE FROM stock_levels WHERE ...` or truncate

## Next Steps
- Run `npm run db:seed` on Railway to populate stock levels
- Test quoting flow as sales user with stocked/out-of-stock products
- Check TASKS.md backlog for next feature work

## Context for Next Session
- Stock level seed data is in `backend/prisma/seed.ts` (after global settings section) — user may ask to remove it later
- TASK-027 cash customer migration still needs `npx prisma migrate deploy` on Railway
