# Task Queue

## Current
- [TASK-011] Quote creation flow [UI/Frontend, Orders/Quotes, API/Backend] (IN_PROGRESS)

## Up Next
- [TASK-012] Order management [Orders/Quotes, API/Backend]

## Completed
- [TASK-001] Project initialization and setup ✓
- [TASK-002] Database schema — Product tables (suppliers, categories, products) ✓
- [TASK-003] Authentication system (login, logout, sessions) ✓
- [TASK-004] Customer portal layout (sidebar, header, main content) ✓
- [TASK-005] Supplier price list import ✓
- [TASK-006] Pricing engine — Calculate prices per customer tier ✓
- [TASK-007] Product catalog — Display products with categories ✓
- [TASK-008] Product detail modal ✓
- [TASK-009] Admin pricing rules UI ✓ (already implemented - two tabs in Settings: Exchange Rate + Pricing Rules)

## Backlog
- [TASK-012] Order management [Orders/Quotes, API/Backend]
- [TASK-013] Inventory tracking [Inventory, API/Backend]
- [TASK-014] Modular chain configurator [Configurator, UI/Frontend]
- [TASK-015] Public website — Homepage [Public Website]
- [TASK-016] Public website — Product pages [Public Website, UI/Frontend]

## Blocked
(none)

---

## TASK-011 Implementation Plan

### Phase 1: Database (3 tasks)
1. [ ] Create migration for Quote and QuoteItem models
2. [ ] Create QuoteRequest model for guest flow
3. [ ] Implement quote number generator (QUO-YYYY-NNNNN)

### Phase 2: Backend Core (7 tasks)
4. [ ] Create Zod validation schemas for quotes
5. [ ] Create quote.service.ts (CRUD, totals calculation)
6. [ ] Create routes: POST /quotes, GET /quotes, GET /quotes/:id
7. [ ] Create item routes: POST/PATCH/DELETE items
8. [ ] Create action routes: finalize, accept, reject
9. [ ] Add company isolation middleware
10. [ ] Write unit tests for quote totals calculation

### Phase 3: Frontend - Quote Management (8 tasks)
11. [ ] Create useQuotes.ts React Query hooks
12. [ ] Add quote API methods to lib/api.ts
13. [ ] Create QuoteStatusBadge component
14. [ ] Create QuoteTotals component
15. [ ] Create QuoteListTable component
16. [ ] Create /quotes page
17. [ ] Create QuoteItemsTable component
18. [ ] Create /quotes/[id] page

### Phase 4: Frontend - Add to Quote (6 tasks)
19. [ ] Create AddToQuoteModal component
20. [ ] Create QuoteCart component
21. [ ] Create QuoteCartDropdown component
22. [ ] Update Header.tsx to include QuoteCart
23. [ ] Update ProductDetailModal (replace TODO)
24. [ ] Add quotes navigation to sidebar

### Phase 5: Testing (3 tasks)
25. [ ] Write integration tests for quote API
26. [ ] Test full flow end-to-end
27. [ ] Add loading states and error handling

---

## TASK-008 Summary (COMPLETED)

**What was added:**

Components:
- Dialog component (`/components/ui/dialog.tsx`) - Radix-based modal with Nusaf styling
- ProductDetailModal (`/components/products/ProductDetailModal.tsx`) - Full product details view

Features:
- Click "View Details" on ProductCard to open modal
- Displays: Nusaf SKU, Supplier SKU, Description, Supplier (with color badge), Category/Subcategory, Unit of Measure, Price
- Close via X button, clicking overlay, or pressing Escape
- "Add to Quote" button (placeholder for TASK-011)

Dependencies added:
- @radix-ui/react-dialog

---

## TASK-007 Summary (COMPLETED)

**What was added:**

Backend:
- GET /api/v1/categories - List categories with subcategories and product counts
- GET /api/v1/products - List products with filtering, search, pagination
- GET /api/v1/products/:id - Get product detail with pricing

Frontend:
- ProductCard component with supplier badge, SKU, description, price
- ProductGrid component with loading skeletons
- CategoryFilter component with collapsible tree
- ProductSearch component with debounced input
- Pagination component with page numbers
- Products page at /products with full filtering

Features:
- Role-based pricing (customers see tier price, staff see list price)
- URL-based filter state (categoryId, subCategoryId, search, page)
- Search by SKU or description
- Category/subcategory filtering
- Pagination with 20 items per page
