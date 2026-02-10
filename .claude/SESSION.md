# Current Session

## Active Task
ERP Remediation — Execution Plan (38 tasks across 6 phases)

## Status
Phase 2C — Remaining Operations. T22 complete. Next: T23 (Standalone transfer UI)

## Completed This Session
- [x] T22: Staff-on-behalf-of-customer quotes — UI (2026-02-10)

## What Was Done

### T22: Staff-on-Behalf-of-Customer Quotes — UI
- **Backend**: `GET /products` accepts optional `customerTier` query param — staff sees tier-adjusted prices (labeled "Customer Price")
- **Zustand store** `useQuoteCompanyStore`: holds selected company {id, name, tier, paymentTerms} in sessionStorage
- **CustomerCompanyPicker** component: searchable dropdown with company name, tier badge, payment terms
- **Catalog page**: company picker in page header, passes `customerTier` to product query
- **QuoteCart**: "Creating quote for: [Company] ([Tier])" banner, warning when staff has no company selected
- **AddToQuoteModal**: blocks "Add to Quote" with message if staff hasn't selected company
- **useCreateQuote**: passes selected company ID to POST /quotes
- **useActiveQuote**: passes company ID for staff, returns null if no company selected
- **API client**: `createQuote(companyId?)`, `getActiveQuote(companyId?)`, `getProducts({customerTier?})`

## Files Modified This Session
- `backend/src/api/v1/products/route.ts` — customerTier query param for tier-adjusted prices
- `frontend/src/stores/quote-company-store.ts` — NEW (Zustand store for selected company)
- `frontend/src/components/quotes/CustomerCompanyPicker.tsx` — NEW (company picker dropdown)
- `frontend/src/components/quotes/index.ts` — export CustomerCompanyPicker
- `frontend/src/components/quotes/QuoteCart.tsx` — company banner + empty state warning
- `frontend/src/components/quotes/AddToQuoteModal.tsx` — block if no company selected
- `frontend/src/hooks/useQuotes.ts` — useActiveQuote and useCreateQuote pass companyId for staff
- `frontend/src/lib/api.ts` — createQuote(companyId?), getActiveQuote(companyId?), customerTier param
- `frontend/src/app/(portal)/catalog/page.tsx` — company picker + customerTier in product query

## Next Steps (Exact)
1. Start T23: Standalone transfer UI
2. Read execution-plan.md for T23 full prompt

## Context for Next Session
- Execution plan: `.claude/plans/execution-plan.md`
- Progress tracker: `.claude/plans/execution-progress.md`
- Workflow: read progress → find first unchecked → read plan → execute → mark done → commit → push → STOP
- User says "go" to proceed to next task
- Phase 2C in progress, T23 next
