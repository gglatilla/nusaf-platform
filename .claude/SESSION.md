# Current Session

## Active Task
[TASK-013A] Unified Product-Inventory API

## Status
COMPLETE | 100%

## Completed Micro-tasks
- [x] Database migration: Add 5 fields to Product, 2 fields to StockLevel
- [x] Add `computeStockStatus()` and `computeProductStockStatus()` functions
- [x] Add `getProductInventorySummary()` helper (returns unified inventory object)
- [x] Update GET `/products/:id` with `?include=inventory,movements` support
- [x] Update GET `/products` with `?include=stockSummary`, `?stockStatus`, `?sortBy=available`
- [x] Add PATCH `/products/:id` endpoint for inventory defaults
- [x] Add nested stock routes under `/products/:productId/stock/*`

## Files Created
(none - all modifications to existing files)

## Files Modified
- `backend/prisma/schema.prisma` — Added inventory fields to Product and StockLevel
- `backend/src/services/inventory.service.ts` — Added stock status functions, inventory summary helpers
- `backend/src/api/v1/products/route.ts` — Added all new endpoints and query params

## API Changes Implemented

### GET /api/v1/products/:id
New query params:
- `?include=inventory` — includes stock levels per warehouse
- `?include=movements` — includes recent stock movements
- `?include=inventory,movements` — both
- `?movementLimit=20` — controls how many movements to include (default 20)

### GET /api/v1/products
New query params:
- `?include=stockSummary` — adds stock summary per product
- `?stockStatus=IN_STOCK,LOW_STOCK` — filter by status (comma-separated)
- `?sort=available:asc` or `?sort=available:desc` — sort by available quantity

### PATCH /api/v1/products/:id (NEW)
Update inventory defaults:
```json
{
  "defaultReorderPoint": 50,
  "defaultReorderQty": 100,
  "defaultMinStock": 20,
  "defaultMaxStock": 500,
  "leadTimeDays": 14
}
```

### Nested Stock Routes (NEW)
- `GET /products/:productId/stock` — unified inventory view
- `GET /products/:productId/stock/movements` — movement history
- `GET /products/:productId/stock/reservations` — active reservations
- `GET /products/:productId/stock/adjustments` — list adjustments for product
- `POST /products/:productId/stock/adjustments` — create adjustment for product

## Database Schema Changes

### Product Model (new fields)
- `defaultReorderPoint` — when to trigger reorder
- `defaultReorderQty` — how many to order
- `defaultMinStock` — safety stock level
- `defaultMaxStock` — max storage capacity
- `leadTimeDays` — supplier lead time

### StockLevel Model (new fields)
- `reorderPoint` — location-specific override
- `minimumStock` — renamed from minimumLevel
- `maximumStock` — location-specific override

## Stock Status Values
- `IN_STOCK` — available > reorderPoint
- `LOW_STOCK` — 0 < available <= reorderPoint
- `OUT_OF_STOCK` — available <= 0, no onOrder
- `ON_ORDER` — available <= 0, has onOrder
- `OVERSTOCK` — onHand > maximumStock

## Key Design Decisions
1. Products with no StockLevel records return zero quantities (not errors)
2. Location-specific reorder settings override product defaults when set
3. Stock status calculated using `computeStockStatus()` per location, `computeProductStockStatus()` aggregate
4. `byLocation` array includes full reorder settings and per-location status

## Next Steps
TASK-013B: Product page Inventory tab (Frontend)

## Context for Next Session
TASK-013A is complete. The backend API now presents products and inventory as one unified entity. The existing `/api/v1/inventory/*` routes continue to work unchanged for operational inventory management.
