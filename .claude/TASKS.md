# Task Queue

## Current
(none - ready for new task)

## Up Next
- [TASK-008] Product detail modal
- [TASK-009] Admin pricing rules UI

## Completed
- [TASK-001] Project initialization and setup ✓
- [TASK-002] Database schema — Product tables (suppliers, categories, products) ✓
- [TASK-003] Authentication system (login, logout, sessions) ✓
- [TASK-004] Customer portal layout (sidebar, header, main content) ✓
- [TASK-005] Supplier price list import ✓
- [TASK-006] Pricing engine — Calculate prices per customer tier ✓
- [TASK-007] Product catalog — Display products with categories ✓

## Backlog
- [TASK-011] Quote creation flow
- [TASK-012] Order management
- [TASK-013] Inventory tracking
- [TASK-014] Modular chain configurator
- [TASK-015] Public website — Homepage
- [TASK-016] Public website — Product pages

## Blocked
(none)

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
