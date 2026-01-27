# Task Queue

## Current
(none - ready for new task)

## Up Next
- [TASK-006] Pricing engine — Calculate prices per customer tier
- [TASK-007] Product catalog — Display products with categories

## Completed
- [TASK-001] Project initialization and setup ✓
- [TASK-002] Database schema — Product tables (suppliers, categories, products) ✓
- [TASK-003] Authentication system (login, logout, sessions) ✓
- [TASK-004] Customer portal layout (sidebar, header, main content) ✓
- [TASK-005] Supplier price list import ✓

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

## TASK-005 Summary (COMPLETED)

**What was added:**

Backend:
- Import validation schemas (Zod)
- Excel parser service (xlsx package)
- Import service (validation, SKU conversion, batch operations)
- Import API routes (upload, validate, execute, suppliers, categories)
- ImportBatch and ImportRow database tables

Frontend:
- FileUpload component (drag & drop)
- ColumnMapper component (map Excel columns to fields)
- ValidationResults component (errors/warnings display)
- ImportReview component (preview before import)
- ImportHistory component (list past imports)
- Import wizard page (multi-step flow at /imports/new)
- Import history page (at /imports)
- Admin navigation section (role-based visibility)

Tests:
- Import service unit tests (Tecom SKU conversion, validation rules)

Category Codes Updated:
- Categories: C, L, B, T, M, P, S, V, D, W, G
- Subcategories: C-001, B-001, etc.
