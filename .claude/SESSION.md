# Current Session

## Active Task
[TASK-020B] Procurement UI [Procurement, UI]

## Status
IN_PROGRESS | 0%

## Plan Reference
See: `~/.claude/plans/witty-wibbling-valley.md`

## Micro-tasks
### Phase 1: API Layer & Hooks (Foundation)
- [ ] MT-1: Create API client functions for PO endpoints
- [ ] MT-2: Create API client functions for GRV endpoints
- [ ] MT-3: Create React Query hooks (usePurchaseOrders, usePurchaseOrder, useGRVs, etc.)

### Phase 2: Purchase Order List Page
- [ ] MT-4: Create POStatusBadge component
- [ ] MT-5: Create POListTable component
- [ ] MT-6: Create /purchase-orders list page with filters

### Phase 3: Purchase Order Detail Page
- [ ] MT-7: Create PO detail page layout
- [ ] MT-8: Create POLineTable component (read-only)
- [ ] MT-9: Create PO workflow action buttons (submit, approve, reject, send, acknowledge)

### Phase 4: Create/Edit Purchase Order
- [ ] MT-10: Create AddPOLineModal (product search + quantity + cost)
- [ ] MT-11: Create CreatePOModal or page (supplier select, delivery location, add lines)
- [ ] MT-12: Wire up PO editing (add/update/remove lines on DRAFT POs)

### Phase 5: GRV Management
- [ ] MT-13: Create GRVStatusBadge component (if needed)
- [ ] MT-14: Create ReceiveGoodsModal (select lines, enter quantities received/rejected)
- [ ] MT-15: Create GRVListTable component
- [ ] MT-16: Create /goods-receipts list page
- [ ] MT-17: Create GRV detail page

### Phase 6: Integration & Polish
- [ ] MT-18: Add Procurement section to sidebar navigation
- [ ] MT-19: Add "Receive Goods" button on PO detail page
- [ ] MT-20: Test end-to-end flow

## Decisions Made
1. **Sidebar**: New collapsible "Procurement" section (separate from Operations)
2. **Skip approval**: ADMIN/MANAGER can send PO directly; PURCHASER needs approval first
3. **Email**: Always required when sending PO to supplier
4. **GRV access**: "Receive Goods" button on PO detail opens modal

## Files to Create
- frontend/src/lib/api/purchase-orders.ts
- frontend/src/lib/api/goods-receipts.ts
- frontend/src/hooks/usePurchaseOrders.ts
- frontend/src/hooks/useGoodsReceipts.ts
- frontend/src/components/purchase-orders/*.tsx
- frontend/src/components/goods-receipts/*.tsx
- frontend/src/app/(portal)/purchase-orders/page.tsx
- frontend/src/app/(portal)/purchase-orders/[id]/page.tsx
- frontend/src/app/(portal)/goods-receipts/page.tsx
- frontend/src/app/(portal)/goods-receipts/[id]/page.tsx

## Next Steps
Starting MT-1: Create API client functions for PO endpoints
