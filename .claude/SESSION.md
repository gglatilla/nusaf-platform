# Current Session

## Active Task
[TASK-024] Architecture Restructure: Inventory vs Product Catalog

## Status
IN_PROGRESS | Phase 1 COMPLETE - Starting Phase 2

## Overview
Separating the mixed Product/Catalog system into two distinct modules:
1. **INVENTORY** (`/inventory`) - Item Master with operational data
2. **CATALOG** (`/catalog`) - Marketing content for published finished goods

## Plan File
`.claude/plans/proud-finding-wren.md`

## Micro-Task Progress

### Phase 1: Restructure Navigation & Routes (7/7) ✓ COMPLETE
- [x] TASK-024-1A: Update navigation.ts with new structure (Inventory section with Items) ✓
- [x] TASK-024-1B: Create `/inventory/items` page (item list - all items) ✓
- [x] TASK-024-1C: Create `/inventory/items/[sku]` page (item detail - operational data) ✓
- [x] TASK-024-1D: Create `/inventory/items/new` page (create new item) ✓
- [x] TASK-024-1E: Update `/catalog` page header for marketing focus ✓
- [x] TASK-024-1F: Create ProductContentEditor for marketing-only editing ✓
- [x] TASK-024-1G: Test navigation flows and verify routing ✓ (build successful)

NOTE: Current `/inventory` page is stock dashboard (kept as-is under "Stock Levels")

### Phase 2: Inventory Item Master Page (5/7)
- [x] TASK-024-2A: Create InventoryItemForm component ✓
- [x] TASK-024-2B: Create BasicInfoSection (SKU, description, UOM, type) ✓ (integrated in form)
- [x] TASK-024-2C: Create SupplierSection (supplier, lead time, MOQ) ✓ (integrated in form)
- [x] TASK-024-2D: Create CostsSection (prices, costs - role-based) ✓ (integrated in form)
- [x] TASK-024-2E: Create StockSettingsSection (min/max, reorder) ✓ (integrated in form)
- [ ] TASK-024-2F: Create WarehouseAvailability section
- [x] TASK-024-2G: Create StockLevelsDisplay (read-only) ✓

### Phase 3: Product Catalog Page (0/5)
- [ ] TASK-024-3A: Create ProductContentForm component
- [ ] TASK-024-3B: Create InheritedFieldsDisplay (read-only from inventory)
- [ ] TASK-024-3C: Create MarketingSection (title, description)
- [ ] TASK-024-3D: Create SEOSection (meta title, description)
- [ ] TASK-024-3E: Wire up existing media components

### Phase 4: Customer Portal Adjustments (3/4)
- [x] TASK-024-4A: Update product cards to show tier pricing ✓ (backend-controlled via product.price)
- [x] TASK-024-4B: Remove list price from customer view ✓ (frontend never shows listPrice to customers)
- [ ] TASK-024-4C: Add "Your Price" label (backend needs to return priceLabel="Your Price" for customers)
- [x] TASK-024-4D: Ensure stock badges (not numbers) for customers ✓ (showQuantity=false for customers)

## Files To Modify

### Phase 1 Files
- `frontend/src/app/(portal)/catalog/` → rename to `inventory/`
- `frontend/src/components/layout/Sidebar.tsx` - update navigation
- `frontend/src/app/(portal)/catalog/` - create new for marketing

## Decisions Made
- Inventory = ALL items (finished goods, raw materials, components)
- Catalog = ONLY published finished goods (marketing focus)
- Customers see tier price labeled "Your Price", never list price
- Sales sees both list and tier prices
- No database changes needed - just UI reorganization

## Next Step
Backend check: Verify products API returns "Your Price" in priceLabel for customers

## Progress Summary
Phase 1 is nearly complete. Created:
- Inventory navigation section with Items and Stock Levels
- Item Master pages: list, detail, and create
- ProductContentEditor for marketing-focused editing
- Updated catalog edit page to use marketing-only editor

### TypeScript Fixes (Just Completed)
- Fixed ProductContentEditor: Added `productId` and `canEdit` props to ProductImageGallery and ProductDocumentsList
- Fixed inventory/items/new: Added supplier selector with validation (required field)
- Updated productType options to use correct enum values (STOCK_ONLY, ASSEMBLY_REQUIRED, etc.)
- All TypeScript errors resolved

## Backend Changes (SKU Support)
Updated backend to support both UUID and SKU lookup:
- GET /products/:id - now accepts SKU
- PATCH /products/:id - now accepts SKU
- POST /products/:id/publish - now accepts SKU
- POST /products/:id/unpublish - now accepts SKU

## Context
This restructure addresses the mixing of inventory management with marketing/SEO content. The goal is clean separation like proper ERP systems.
