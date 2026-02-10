# Current Session

## Active Task
[TASK-028] Fix Customer Portal Filter, Sales Quote UX, Fulfillment Dashboard

## Status
COMPLETE (2026-02-10)

## Completed This Session

### Fix 1: Remove isPublished from customer portal
- `isPublished` is for the public marketing website, NOT the authenticated customer portal
- Customer products page was filtering to published-only (1 product)
- Removed the filter — customers now see ALL active products
- File: `frontend/src/app/(customer)/my/products/page.tsx`

### Fix 2: Embed company picker in AddToQuoteModal
- Staff "Add to Quote" said "select a company" but gave no way to do it
- Embedded `CustomerCompanyPicker` directly in the modal when staff has no company selected
- Staff can now select a company without closing the modal
- File: `frontend/src/components/quotes/AddToQuoteModal.tsx`

### Fix 3: Fulfillment dashboard — missing database columns
- Root cause: schema drift — `job_cards.material_check_performed` and `sales_orders.closed_at` (plus more) existed in Prisma schema but had no migration
- Created migration `20260210120000_add_missing_schema_columns` adding:
  - `CreditNoteStatus` enum, `credit_notes`/`credit_note_lines`/`credit_note_counter` tables
  - `CANCELLED` variants to JobCard/PickingSlip/TransferRequest status enums
  - `material_check_performed`, `material_check_result` columns on job_cards
  - `version` column on purchase_orders
  - `closed_at`, `closed_by` columns on sales_orders
  - `job_card_bom_lines` table
- Applied migration to Railway production database

## Context for Next Session
- TASK-028 all pushed to remote
- Migration applied to Railway — fulfillment dashboard should work
- Railway backend service needs redeploy to pick up latest Prisma client
- isPublished filter is only for public website routes, NOT customer portal
