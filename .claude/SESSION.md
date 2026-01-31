# Current Session

## Active Task
[TASK-013B] Product Page Inventory Tab

## Status
IN_PROGRESS | 0%

## Exploration Findings

### Product Detail Implementation
- **ProductDetailModal.tsx** is a MODAL, not a full page
- NO tabs exist — modal shows basic product info + Add to Quote button
- Modal uses Radix UI Dialog component

### UI Components Available
- Radix UI primitives (Dialog, etc.) + Tailwind CSS
- NO generic Tab component — need to create or use Radix Tabs
- NO Badge component — need to create StockStatusBadge
- Table styling exists in quotes/orders tables

### API Patterns
- React Query hooks in `frontend/src/hooks/` (useProducts.ts, useQuotes.ts)
- API client in `frontend/src/lib/api.ts` with Bearer token auth
- Zustand auth store in `frontend/src/stores/auth-store.ts`

### Missing Prerequisite
- User/Customer models do NOT have `primaryWarehouseId` field yet
- Will implement as part of Phase 1

---

## Approved Plan Summary

### Approach
- **Option C** for modal: Add simple inventory summary + link to full page
- Create new product detail PAGE at `/products/[id]` with tabs (Details, Inventory)

### Four Distinct Views
1. **VIEW A** - Admin/Manager (no primary): Combined totals + warehouse table
2. **VIEW B** - Admin/Manager (with primary): Their warehouse + table highlighted
3. **VIEW C** - Sales (with primary): Their warehouse + subdued cards + table
4. **VIEW D** - Customer (with primary): Simplified friendly view, NO table

### Critical UX Rules
- Warehouse table is NOT optional for internal users
- Available column FIRST and bold, On Hand muted
- Customer sees "Also available from Johannesburg: X units · Est. 2–4 working days"
- Customer primary warehouse unnamed ("Available" not "Available at Cape Town")

---

## Micro-tasks

### Phase 1: Prerequisites & Foundation
- [ ] 1.1 Database migration — add primaryWarehouseId to User, Customer
- [ ] 1.2 Create StockStatusBadge component
- [ ] 1.3 Create useProductInventory hook

### Phase 2: Product Detail Page with Tabs
- [ ] 2.1 Create product detail page route with tab system
- [ ] 2.2 Create StockOverviewCards component (4 views)
- [ ] 2.3 Create WarehouseStockTable component
- [ ] 2.4 Create StockMovementsTable component
- [ ] 2.5 Create AdjustStockModal component
- [ ] 2.6 Create InventorySettings component
- [ ] 2.7 Assemble ProductInventoryTab component

### Phase 3: Update Modal
- [ ] 3.1 Add inventory summary to ProductDetailModal

---

## Files to Create
- `frontend/src/components/inventory/StockStatusBadge.tsx`
- `frontend/src/components/inventory/StockOverviewCards.tsx`
- `frontend/src/components/inventory/WarehouseStockTable.tsx`
- `frontend/src/components/inventory/StockMovementsTable.tsx`
- `frontend/src/components/inventory/AdjustStockModal.tsx`
- `frontend/src/components/inventory/InventorySettings.tsx`
- `frontend/src/components/inventory/ProductInventoryTab.tsx`
- `frontend/src/app/(portal)/products/[id]/page.tsx`
- `frontend/src/hooks/useProductInventory.ts`

## Files to Modify
- `backend/prisma/schema.prisma`
- `frontend/src/components/products/ProductDetailModal.tsx`
- `frontend/src/lib/api.ts`

---

## Context for Next Session
TASK-013B plan approved. Starting Phase 1: Prerequisites & Foundation. First micro-task is database migration to add primaryWarehouseId to User and Customer models.
