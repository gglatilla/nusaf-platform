# Task Queue

## Current
(none - ready for new task)

## Up Next
- [TASK-003] Authentication system (login, logout, sessions)
- [TASK-004] Customer portal layout (sidebar, header, main content)
- [TASK-005] Product catalog — Display products with categories
- [TASK-006] Pricing engine — Calculate prices per customer tier

## Completed
- [TASK-001] Project initialization and setup ✓
- [TASK-002] Database schema — Product tables (suppliers, categories, products) ✓

## Backlog
- [TASK-010] Supplier price list import
- [TASK-011] Quote creation flow
- [TASK-012] Order management
- [TASK-013] Inventory tracking
- [TASK-014] Modular chain configurator
- [TASK-015] Public website — Homepage
- [TASK-016] Public website — Product pages

## Blocked
(none)

---

## TASK-002 Summary

**What was added:**

Prisma Models (6):
- Supplier (TECOM, CHIARAVALLI, REGINA, NUSAF)
- Category (11 product categories)
- SubCategory (86 subcategories)
- Product (SKUs, descriptions, categorization)
- CompetitorCrossReference (for SEO)
- SkuMapping (Tecom SKU conversion overrides)

Enums (3):
- SupplierCurrency (EUR, ZAR)
- SkuHandling (DIRECT, TECOM_CONVERSION, NUSAF_INTERNAL)
- UnitOfMeasure (EA, M, KG, BOX, SET, PAIR, ROLL)

TypeScript Types (5 files in shared/src/types/):
- supplier.ts
- category.ts
- product.ts
- competitor.ts
- sku-mapping.ts

Seed Data:
- 4 suppliers
- 11 categories
- 86 subcategories

**To apply changes:**
```bash
cd backend
# Create .env with DATABASE_URL
npx prisma migrate dev --name add_product_tables
npm run db:seed
```
