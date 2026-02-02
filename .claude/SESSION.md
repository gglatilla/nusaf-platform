# Current Session

## Active Task
[TASK-020A] Goods Receipt (GRV) [Procurement, Backend]

## Status
COMPLETE | 100%

## Completed Micro-tasks
- [x] MT-1: Add WAREHOUSE role to UserRole enum
- [x] MT-2: Add GRV schema to Prisma (GoodsReceivedVoucher, GrvLine, GrvCounter)
- [x] MT-3: Run database migration
- [x] MT-4: Create validation schemas
- [x] MT-5: Create GRV service — Core functions
- [x] MT-6: Create GRV service — Stock integration
- [x] MT-7: Create API routes
- [x] MT-8: Register routes in index.ts

## Files Created
- backend/prisma/migrations/20260202_add_grv_models/migration.sql
- backend/src/utils/validation/goods-receipts.ts
- backend/src/services/grv.service.ts
- backend/src/api/v1/goods-receipts/route.ts

## Files Modified
- backend/prisma/schema.prisma (WAREHOUSE role, GRV models)
- backend/src/api/v1/purchase-orders/route.ts (added GRV routes)
- backend/src/index.ts (registered goods-receipts routes)

## Decisions Made
- GRV Workflow: Single-step (create GRV → stock immediately updated)
- Rejections: Record only — rejected qty doesn't affect stock, PO line remains unfulfilled
- Partial Receipts: Multiple GRVs per PO line allowed
- Permissions: ADMIN + WAREHOUSE (new role) can create GRVs
- GRV Number Format: GRV-YYYY-NNNNN

## Next Steps
TASK-020A complete. Ready for:
- TASK-020B: Procurement UI — frontend for PO and GRV management

## Implementation Summary

### Database Models Added
- WAREHOUSE role added to UserRole enum
- GoodsReceivedVoucher: grvNumber, purchaseOrderId, location, receivedBy, notes
- GrvLine: poLineId, productId, quantityExpected, quantityReceived, quantityRejected
- GrvCounter: for GRV-YYYY-NNNNN number generation

### GRV Service (grv.service.ts)
- `generateGRVNumber()` — GRV-YYYY-NNNNN format
- `createGoodsReceipt()` — single-step: creates GRV, updates PO lines, updates stock
- `getGoodsReceiptById()`, `getGoodsReceipts()`, `getGoodsReceiptsForPO()`
- `getPOReceivingSummary()` — what's received vs outstanding

### Stock Integration
On GRV creation (in transaction):
1. Create GRV header and lines
2. For each line:
   - Update PurchaseOrderLine.quantityReceived
   - StockLevel.onHand += quantityReceived
   - StockLevel.onOrder -= quantityReceived
   - Create StockMovement.RECEIPT
3. Update PO status (PARTIALLY_RECEIVED or RECEIVED)

### API Endpoints
- POST /api/v1/goods-receipts — Create GRV (ADMIN, WAREHOUSE)
- GET /api/v1/goods-receipts — List with filters
- GET /api/v1/goods-receipts/:id — Get by ID
- GET /api/v1/goods-receipts/po/:purchaseOrderId — GRVs for a PO
- GET /api/v1/goods-receipts/po/:purchaseOrderId/summary — Receiving summary
- GET /api/v1/purchase-orders/:id/goods-receipts — GRVs for a PO (on PO route)
- GET /api/v1/purchase-orders/:id/receiving-summary — Receiving summary (on PO route)
