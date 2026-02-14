# Current Session

## Active Task
Enable SKU (nusafSku) Editing on Inventory Items — COMPLETE

## Completed Micro-tasks
- [x] Backend: Added `nusafSku` to `updateProductSchema` with regex validation
- [x] Backend: Added `nusafSku` to `UpdateProductInput` interface
- [x] Backend: Added uniqueness check + structured log + SkuMapping cascade in `updateProduct()`
- [x] Frontend: Added `nusafSku` to `UpdateProductData` in both `api.ts` and `api/types/products.ts`
- [x] Frontend: SKU field editable for ADMIN users, disabled for MANAGER with helper text
- [x] Frontend: ConfirmDialog on SKU change with warning variant
- [x] Frontend: URL redirect to new SKU after successful save
- [x] Unit tests: 4 tests for SKU change logic (unique, duplicate, same-SKU no-op, backward-compatible)
- [x] Type checks pass (backend + frontend)

## Context for Next Session
- SKU editing is ADMIN-only (MANAGER can edit other fields but not SKU)
- Import matching uses `(supplierId, supplierSku)` — changing nusafSku does NOT break imports
- Historical document line items retain the original SKU (audit compliance)
- SkuMapping records are cascaded when SKU changes
- SKU format validation: `/^[A-Za-z0-9\-_.\/]+$/`
