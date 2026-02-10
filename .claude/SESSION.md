# Current Session

## Active Task
[TASK-026] Bug Fixes (6 Issues) + Internal Company Cleanup

## Status
COMPLETE (2026-02-10)

## Completed This Session

### Issue 6: Fix order creation company mismatch
- Staff's 'nusaf-internal' companyId was passed to createOrderFromQuote instead of the quote's companyId
- Added getEffectiveCompanyId() pattern — staff gets undefined (no isolation), customers get their companyId
- Updated all order service functions + timeline service to accept optional companyId
- Commit: ff8f525

### Issue 4: Fix hardcoded import suppliers list
- Replaced hardcoded 3-supplier array with prisma.supplier.findMany({ isActive: true })
- New suppliers now appear in import dropdown automatically
- Commit: 9b39ed3

### Issue 7: Internal company cleanup
- Added isInternal Boolean field to Company model
- Created migration + updated seed to mark 'nusaf-internal' as internal
- Admin companies list now filters out internal companies
- Staff pricing already correctly showed list prices (no change needed)
- Commit: 64288f3

### Issue 3: Fix customer portal View Details + Add to Quote
- Customer detail page now uses authenticated API instead of public API (which required isPublished)
- Removed nested Radix Dialog — AddToQuoteModal rendered as sibling at page level
- ProductDetailModal uses onAddToQuote callback prop
- Updated both customer products page and catalog page
- Added images/documents/crossReferences to ProductWithInventory type
- Commit: 92e15a2

### Issue 2: Fix backend inventory SKU lookup
- Restructured Promise.all to fetch product first, then use resolved UUID for inventory/movement queries
- Commit: ffa5084

### Issue 5: Add company creation feature
- POST /api/v1/admin/companies endpoint (ADMIN only)
- createCompany() API method on frontend
- "Add Company" button + CreateCompanyModal form on admin companies page
- Commit: 21b80e5

## Remaining
- Issue 1 (login): Re-run db:seed on Railway after deployment — no code change needed

## Next Steps
- Push all commits to remote
- Deploy to Railway
- Run npm run db:seed on Railway to apply migration + re-seed test data
- Test all 6 fixes in deployed environment
- Check TASKS.md for backlog items (TASK-027 for cash customer quoting)

## Context for Next Session
- TASK-026 is 6 commits ahead of remote, covering all 6 bug fixes
- Migration `20260210100000_add_company_is_internal` needs to be applied on Railway
- The order route now uses getEffectiveCompanyId() — same pattern as quotes route
- ProductDetailModal no longer nests AddToQuoteModal — parent pages handle it
- Customer detail page uses authenticated API (no isPublished requirement)
