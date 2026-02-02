# Current Session

## Active Task
Fix Product Data Flow Issues

## Status
COMPLETE | 100%

## Summary

Fixed multiple interconnected issues with product data flow:

1. **GlobalSettings not seeded** - Seed file now creates EUR/ZAR rate
2. **Import history not showing** - Wired up frontend to fetch from API
3. **Edit form dropdowns empty** - Removed `isActive` filter from supplier fetch
4. **Manual price recalculate** - Added new endpoint (already had existing one)

## Root Cause Analysis

The user reported:
- Suppliers (Tecom, Chiaravalli, Regina) not showing in edit form
- Prices showing "Not set" after import
- Import history showing empty

Investigation revealed:
1. **GlobalSettings (EUR/ZAR rate) was NOT seeded** - This caused pricing calculation to fail silently during import
2. **Import order matters** - Products imported BEFORE pricing rules = no prices calculated
3. **Edit form filtered suppliers by isActive: true** - Excluded valid suppliers from dropdown
4. **Import history hardcoded to empty array** - Frontend never fetched from API

## Fixes Applied

### 1. Seed File Updated
**File:** `backend/prisma/seed.ts`
- Added GlobalSettings creation with default EUR/ZAR rate of 20.5
- Will be applied when running `npx prisma db seed`

### 2. Import History Wired Up
**Files:**
- `frontend/src/lib/api.ts` - Added `ImportHistoryItem` type and `getImportHistory()` method
- `frontend/src/app/(portal)/imports/page.tsx` - Fetches and displays import history

### 3. Supplier Dropdown Fixed
**File:** `frontend/src/components/products/ProductFormModal.tsx`
- Removed `isActive: true` filter from `useSuppliers` call
- All suppliers now appear in dropdown when editing products

### 4. Manual Recalculate Endpoint
**File:** `backend/src/api/v1/admin/pricing-rules/route.ts`
- Added `POST /api/v1/admin/pricing-rules/recalculate` endpoint
- Note: `/api/v1/products/recalculate` already existed and is used by frontend

## Files Modified

- `backend/prisma/seed.ts` - Added GlobalSettings seeding
- `frontend/src/lib/api.ts` - Added ImportHistoryItem type and getImportHistory method
- `frontend/src/app/(portal)/imports/page.tsx` - Wired up import history fetch
- `frontend/src/components/products/ProductFormModal.tsx` - Fixed supplier dropdown
- `backend/src/api/v1/admin/pricing-rules/route.ts` - Added recalculate endpoint

## Verification Steps

After committing, user should:

1. **Re-seed database** (if GlobalSettings missing):
   ```bash
   cd backend && npx prisma db seed
   ```

2. **Verify import history**:
   - Go to `/imports`
   - Should show previous import batches

3. **Verify edit form**:
   - Go to `/products`
   - Click any product → Edit
   - Supplier dropdown should show Tecom/Chiaravalli/Regina

4. **Recalculate prices**:
   - Go to Admin → Settings → Exchange Rate tab
   - Click "Recalculate All Prices"
   - Products should now have List Prices calculated

## Context for Next Session

- These fixes address data flow issues, not missing data
- User may need to re-run seed to create GlobalSettings
- User may need to re-import products or recalculate prices
- TASKS.md should be reviewed for next priority task
