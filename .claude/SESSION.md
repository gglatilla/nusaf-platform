# Current Session

## Active Task
Fix Product Data Flow Issues (3 bugs)

## Status
COMPLETE | 100%

## Summary

Fixed three interconnected issues with product data flow:

### Issue 1: Landed Cost Formula Wrong
**Problem:** Formula was `EUR × Rate × (1 + Freight%)` - missing discount
**Fix:** Now applies discount FIRST if `isGross=true`:
```
Net Price = Cost × (1 - Discount%)
ZAR Value = Net Price × EUR/ZAR
Landed Cost = ZAR Value × (1 + Freight%)
```

### Issue 2: Supplier Dropdown Not Pre-selecting
**Problem:** Race condition - form initialized before suppliers loaded
**Fix:** Added `suppliersLoading` to useEffect dependency, delays form init until suppliers ready

### Issue 3: Weight Not Imported
**Problem:** Import pipeline completely lacked WEIGHT support (5 missing points)
**Fix:** Added WEIGHT to:
- Column mapping schema
- Excel parser interface + mapping
- Auto-detect patterns
- Validation result data
- Create/update operations

## Files Modified

1. `backend/src/api/v1/products/route.ts`
   - Fixed landed cost calculation to include discount from pricing rule

2. `frontend/src/components/products/ProductFormModal.tsx`
   - Added `isLoading` to useSuppliers hook
   - Added `suppliersLoading` to useEffect dependency

3. `backend/src/utils/validation/imports.ts`
   - Added WEIGHT to COLUMN_FIELDS
   - Added WEIGHT to columnMappingSchema
   - Added weight to RowValidationResult.data
   - Added weight to ImportRow

4. `backend/src/services/excel-parser.service.ts`
   - Added weight to ParsedRow.mapped interface
   - Added weight to default mapped values
   - Added weight to applyColumnMapping
   - Added weight patterns to autoDetectColumnMapping

5. `backend/src/services/import.service.ts`
   - Added weight to validateRow data output
   - Added weight to product create operation
   - Added weight to product update operation

## Verification Steps

After deployment:

1. **Landed Cost:** Go to product → Pricing tab
   - Landed Cost should be LOWER than List Price
   - Formula: (EUR × (1-Discount%) × Rate × (1+Freight%))

2. **Supplier Dropdown:** Edit any product
   - Supplier should pre-select (e.g., Tecom)

3. **Weight Import:** Re-import a price list with WEIGHT column
   - Edit product → Classification tab
   - Weight field should be populated

## Context for Next Session

- Landed cost now correctly applies discount from pricing rule
- Supplier dropdown race condition fixed by waiting for data
- Weight import requires RE-IMPORTING price lists to populate existing products
- TypeScript checks pass for both backend and frontend
