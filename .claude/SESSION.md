# Current Session

## Active Task
(none) — All tasks complete

## Completed This Session

### 1. Enable SKU Editing (commit d15cc35)
- Backend: `nusafSku` added to update schema with regex validation + uniqueness check + SkuMapping cascade
- Frontend: SKU field editable for ADMIN users with ConfirmDialog, URL redirect on change
- 4 unit tests for SKU change logic

### 2. Fix Pricing for Local Products (commit 2cb2410)
- Backend: exposed `supplier.isLocal` and `currency` in all product API responses
- Frontend edit page: cost/list price now editable (was read-only), with contextual help text
- PricingTab: shows correct formula — ZAR for local, EUR for imported
- Catalog detail page: same conditional formula fix

### 3. Fix Railway Build (commit 3d78f88)
- Moved all `@types/*` packages + `typescript` from devDependencies to dependencies
- Railway sets NODE_ENV=production during npm ci, skipping devDependencies
- tsc build needs type declarations, so they must be in dependencies

## Context for Next Session
- SKU editing is ADMIN-only (MANAGER can edit other fields but not SKU)
- Cost/list price editing is available for all products (local and imported)
- Pricing formula displays correctly based on `supplier.isLocal`
- Railway build should now succeed with @types in dependencies
- Pre-existing: `import.service.test.ts` fails due to missing `@nusaf/shared` module (unrelated)
