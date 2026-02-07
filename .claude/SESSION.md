# Current Session

## Active Task
ERP Remediation — Phase 4: Inventory Module (4.1 Stock Movements Page)

## Status
COMPLETE | 4.1 done (3/3 micro-tasks), 4.2-4.4 remaining

## Completed Micro-tasks
- [x] 4.1.1 — Updated frontend StockMovementItem type to match backend response (product, location, movementType, referenceNumber, balanceAfter, adjustmentReason). Extracted REFERENCE_TYPE_ROUTES + WAREHOUSE_NAMES to shared constants. Expanded backend role to include WAREHOUSE.
- [x] 4.1.2 — Enhanced MovementLogTable: warehouse filter, product SKU/name as clickable links, referenceNumber as clickable document links, updated search to filter on SKU/description/referenceNumber
- [x] 4.1.3 — Created /inventory/movements page with PageHeader + MovementLogTable. Added "Movements" nav item (ADMIN, MANAGER, WAREHOUSE).

## Files Created
- `frontend/src/lib/constants/reference-routes.ts` — shared REFERENCE_TYPE_ROUTES + WAREHOUSE_NAMES
- `frontend/src/app/(portal)/inventory/movements/page.tsx` — dedicated stock movements page

## Files Modified
- `frontend/src/lib/api.ts` — updated StockMovementItem interface to match actual backend response
- `frontend/src/components/inventory/MovementLogTable.tsx` — complete rewrite with warehouse filter, product links, reference links
- `frontend/src/components/inventory/product-detail/AuditLogTab.tsx` — imports REFERENCE_TYPE_ROUTES from shared constant
- `frontend/src/lib/navigation.ts` — added ArrowRightLeft import, added "Movements" nav item
- `backend/src/api/v1/inventory/route.ts` — expanded movements endpoints to include WAREHOUSE role

## Key Decisions
- Backend response field names differ between `getStockMovements()` (raw: location, movementType) and `getProductMovementHistory()` (mapped: warehouseId, type). Left both as-is; frontend types now correctly match each endpoint.
- StockAdjustment reference route now points to `/inventory/adjustments` (will exist in 4.2) instead of `/inventory`
- Extracted REFERENCE_TYPE_ROUTES to shared constant for reuse across MovementLogTable, AuditLogTab, and future components

## Next Steps (Session 2)
1. 4.2.1 — Build standalone adjustment creation form
2. 4.2.2 — Build adjustments list page with status tabs
3. 4.2.3 — Build adjustment detail page
4. 4.2.4 — Create new adjustment page + nav item

## Context for Next Session
- Plan file: `.claude/plans/gleaming-bouncing-star.md`
- Progress tracker: `.claude/plans/erp-progress.md`
- Shared reference routes: `frontend/src/lib/constants/reference-routes.ts`
- Enhanced MovementLogTable accepts `initialLocation` prop for embedding
- Backend adjustments API already complete (create, list, get, approve, reject)
- Need new `createInventoryAdjustment()` method in frontend API client (calls POST /api/v1/inventory/adjustments)
