# Task Queue

## Current
- [TASK-005] Supplier Price List Import (IN_PROGRESS)

## Up Next
- [TASK-006] Pricing engine — Calculate prices per customer tier
- [TASK-007] Product catalog — Display products with categories

## Completed
- [TASK-001] Project initialization and setup ✓
- [TASK-002] Database schema — Product tables (suppliers, categories, products) ✓
- [TASK-003] Authentication system (login, logout, sessions) ✓
- [TASK-004] Customer portal layout (sidebar, header, main content) ✓

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

## TASK-005 Summary

**What will be added:**

Backend:
- Import validation schemas (Zod)
- Excel parser service (xlsx package)
- Import service (validation, SKU conversion, batch operations)
- Import API routes (upload, validate, execute, history)
- ImportBatch and ImportRow database tables

Frontend:
- FileUpload component (drag & drop)
- ColumnMapper component (map Excel columns to fields)
- ValidationResults component (errors/warnings display)
- ImportReview component (preview before import)
- ImportHistory component (list past imports)
- Import wizard page (multi-step flow)
- Import history page

Tests:
- Import service unit tests (SKU conversion, validation rules)
