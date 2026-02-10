# Current Session

## Active Task
ERP Remediation — Execution Plan (38 tasks across 6 phases)

## Status
Phase 2C — Remaining Operations. T21 complete. Next: T22 (Staff-on-behalf-of-customer quotes UI)

## Completed This Session
- [x] T18: Double reservation deduplication (2026-02-10)
- [x] T19: Soft reservation expiry background job (2026-02-10)
- [x] T20: Auto-generate proforma — verify and harden (2026-02-10)
- [x] T21: Staff-on-behalf-of-customer quotes — API (2026-02-10)

## What Was Done

### T21: Staff-on-Behalf-of-Customer Quotes — API
- Modified `POST /api/v1/quotes` to accept optional `companyId` in body for staff roles (ADMIN/MANAGER/SALES)
- CUSTOMER role always uses own company; staff must provide companyId or get 400 COMPANY_REQUIRED
- Uses target company's `customerTier` for pricing (snapshotted on quote)
- Staff-created quotes tracked via userId=staff, companyId=customer
- Company isolation bypass for staff on ALL quote operations:
  - `getEffectiveCompanyId()` returns undefined for staff → skips company filter
  - Applies to: GET /:id, PATCH /:id, DELETE /:id, POST /:id/items, PATCH /:id/items, DELETE /:id/items, finalize, accept, reject
- `GET /quotes` for staff: filters by userId (own created quotes), optional companyId query param
- `GET /quotes/active` for staff: requires ?companyId= query param
- Service layer changes: `getQuoteById`, `getQuotes`, `deleteQuote` all accept optional companyId

## Files Modified This Session
- `backend/src/api/v1/quotes/route.ts` — staff quote creation + company isolation bypass (T21)
- `backend/src/services/quote.service.ts` — optional companyId in getQuoteById, getQuotes, deleteQuote (T21)
- `backend/src/services/orchestration.service.ts` — T18 dedup logic
- `backend/src/scripts/fix-double-reservations.ts` — NEW (T18)
- `backend/src/services/reservation-cleanup.service.ts` — NEW (T19)
- `backend/src/services/quote.service.ts` — EXPIRED path fix (T19)
- `backend/src/index.ts` — cleanup endpoint (T19)
- `frontend/src/app/(portal)/orders/[id]/page.tsx` — proforma button fix (T20)

## Next Steps (Exact)
1. Start T22: Staff-on-behalf-of-customer quotes (UI)
2. Read execution-plan.md for T22 full prompt
3. Searchable company dropdown at top of product catalog (for staff roles)
4. "Creating quote for: [Company Name] ([Tier])" banner in cart
5. Block finalize if no customer selected

## Context for Next Session
- Execution plan: `.claude/plans/execution-plan.md`
- Progress tracker: `.claude/plans/execution-progress.md`
- Workflow: read progress → find first unchecked → read plan → execute → mark done → commit → push → STOP
- User says "go" to proceed to next task
- Phase 2C in progress, T22 next
