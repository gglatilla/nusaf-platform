# Task Queue

## Current
(none - ready for new task)

## Up Next
- [TASK-011] Quote creation flow [UI/Frontend, Orders/Quotes, API/Backend]

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
- [TASK-011] Quote creation flow [UI/Frontend, Orders/Quotes, API/Backend]
- [TASK-012] Order management [Orders/Quotes, API/Backend]
- [TASK-013] Inventory tracking [Inventory, API/Backend]
- [TASK-014] Modular chain configurator [Configurator, UI/Frontend]
- [TASK-015] Public website — Homepage [Public Website]
- [TASK-016] Public website — Product pages [Public Website, UI/Frontend]

## Blocked
(none)

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
