# Current Session

## Active Task
Phase 3: Backorder Visibility — COMPLETE

## Plan
See `.claude/plans/bubbly-fluttering-matsumoto.md`

## Completed Micro-tasks

### Phase 3.1: DB Schema + Backend Services (a8c4f83)
- Added `quantityBackorder` field to `SalesOrderLine` model (Int, default 0)
- Added Prisma relation `PurchaseOrderLine → SalesOrderLine` (existing `salesOrderLineId` column)
- Added index on `purchase_order_lines.sales_order_line_id`
- `executeFulfillmentPlan()` now persists backorder quantities on order lines and populates `salesOrderLineId` on PO lines
- `getOrderById()` includes `quantityBackorder` in response
- Frontend `SalesOrderLine` types updated in both `api.ts` and `api/types/orders.ts`
- 5 unit tests for backorder persistence logic

### Phase 3.2: Staff Portal UI (70e82f5)
- `OrderLineTable`: "On Backorder" status badge when PENDING + quantityBackorder > 0; conditional Backorder column with amber "X on B/O" badges
- `FulfillmentStatsBar`: conditional 5th "Backordered" card (amber) when backorders exist; grid adjusts to 5 columns
- New `BackorderSummarySection`: amber-bordered card listing backordered lines with SKU, description, qty ordered/backordered
- Wired into staff order detail page after TransferRequestsSection

### Phase 3.3: Customer Portal UI (14cccc2)
- Amber backorder banner on customer order detail ("Some items are on backorder")
- Inline "X unit(s) on backorder" text on affected lines in OrderLineTable customer view

## Pending Micro-tasks
- [ ] Phase 4.1–4.5: Notification System

## Context for Next Session
- Phase 3 (Backorder Visibility) is COMPLETE
- Backorder data is persisted at fulfillment execution time (orchestration service)
- Both staff and customer portals show backorder visibility
- Migration pending on Railway: 20260212120000_add_backorder_tracking (+ previous 20260212100000_add_shipping_address_to_sales_order)
- No new endpoint was created — backorder data rides on existing order response via `quantityBackorder` field
- The `salesOrderLineId` FK on `PurchaseOrderLine` is now populated, enabling future features (e.g., backorder resolution when PO is received)
