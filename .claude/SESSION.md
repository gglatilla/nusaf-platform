# Current Session

## Active Task
[TASK-006] Pricing Engine

## Status
COMPLETED | 100% complete

## Micro-tasks

### Phase 1: Database (3 tasks) - COMPLETE
- [x] MT-1: Create GlobalSettings migration + seed default EUR/ZAR rate
- [x] MT-2: Create PricingRule migration + relations
- [x] MT-3: Add costPrice/listPrice fields to Product

### Phase 2: Services (4 tasks) - COMPLETE
- [x] MT-4: Create pricing.service.ts with calculateListPrice() + unit tests
- [x] MT-5: Create settings.service.ts for EUR/ZAR rate
- [x] MT-6: Add getPricingRuleForProduct() with category fallback
- [x] MT-7: Add recalculateProductPrice() for batch operations

### Phase 3: APIs (4 tasks) - COMPLETE
- [x] MT-8: Settings API (GET/PATCH /admin/settings)
- [x] MT-9: Pricing rules CRUD API (/admin/pricing-rules)
- [x] MT-10: Product price API (GET /products/:id/price)
- [x] MT-11: Admin recalculate endpoint

### Phase 4: Import Integration (2 tasks) - COMPLETE
- [x] MT-12: Update import to store cost prices
- [x] MT-13: Update import to calculate list prices on import

## Completed Micro-tasks
- [x] MT-1: Create GlobalSettings migration + seed default EUR/ZAR rate
- [x] MT-2: Create PricingRule migration + relations
- [x] MT-3: Add costPrice/listPrice fields to Product
- [x] MT-4: Create pricing.service.ts with calculateListPrice() + unit tests
- [x] MT-5: Create settings.service.ts for EUR/ZAR rate
- [x] MT-6: Add getPricingRuleForProduct() with category fallback
- [x] MT-7: Add recalculateProductPrice() for batch operations
- [x] MT-8: Settings API (GET/PATCH /admin/settings)
- [x] MT-9: Pricing rules CRUD API (/admin/pricing-rules)
- [x] MT-10: Product price API (GET /products/:id/price)
- [x] MT-11: Admin recalculate endpoint
- [x] MT-12: Update import to store cost prices
- [x] MT-13: Update import to calculate list prices on import

## Files Modified
- backend/prisma/schema.prisma (added GlobalSettings, PricingRule, Product pricing fields)
- backend/prisma/migrations/20260128140000_add_pricing_engine/migration.sql (created)
- backend/src/services/pricing.service.ts (created)
- backend/src/services/settings.service.ts (created)
- backend/src/services/import.service.ts (updated for pricing integration)
- backend/src/api/v1/admin/settings/route.ts (created)
- backend/src/api/v1/admin/pricing-rules/route.ts (created)
- backend/src/api/v1/products/route.ts (created)
- backend/src/index.ts (added new routes)
- tests/unit/services/pricing.service.test.ts (created - 25 tests)

## Decisions Made
- Cost price stored on Product model (not separate table) - simpler, 1:1 with supplier
- Pricing rule fallback: subcategory -> category level
- Testing is CRITICAL - pricing directly impacts revenue
- List prices calculated during import for efficiency
- Graceful degradation: products import even without pricing rules

## Pricing Formula Reference
```
Supplier Price (Gross/Net)
-> Apply discount % (if Gross)
-> x EUR/ZAR rate
-> x (1 + Freight %)
-> / Margin Divisor
-> x 1.40 (always)
= List Price (ZAR)
```

## Customer Tier Discounts
| Tier | Discount |
|------|----------|
| END_USER | 30% off list |
| OEM_RESELLER | 40% off list |
| DISTRIBUTOR | 50% off list |

## API Endpoints Created
- GET /api/v1/admin/settings - Get EUR/ZAR rate and settings
- PATCH /api/v1/admin/settings - Update EUR/ZAR rate
- GET /api/v1/admin/pricing-rules - List pricing rules (filter by supplier/category)
- GET /api/v1/admin/pricing-rules/:id - Get single pricing rule
- POST /api/v1/admin/pricing-rules - Create pricing rule
- PATCH /api/v1/admin/pricing-rules/:id - Update pricing rule
- DELETE /api/v1/admin/pricing-rules/:id - Delete pricing rule
- GET /api/v1/products/:id/price - Get product price for authenticated user
- POST /api/v1/products/recalculate - Batch recalculate prices (admin)

## Next Steps
1. Deploy to Railway (automatic via push)
2. Seed pricing rules via API or admin UI
3. Re-run product import to populate prices
4. Continue with next task from TASKS.md

## Context for Next Session
- Pricing engine is fully implemented and tested
- EUR/ZAR rate seeded at 20.50
- Import service now calculates prices during import
- Pricing rules need to be created via API before prices can be calculated
