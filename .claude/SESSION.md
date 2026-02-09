# Current Session

## Active Task
ERP Remediation — Execution Plan (38 tasks across 6 phases)

## Status
Repair Phase R1-R5 COMPLETE. Next: T10 (Tax invoice API + staff UI)

## Completed This Session
- [x] R5: Fix tax invoice — payment terms due date (2026-02-09)

## What Was Done

### R5: Fix Tax Invoice — Payment Terms Due Date
- **Schema** (`backend/prisma/schema.prisma`):
  - Added `paymentTerms` String field to TaxInvoice model (default 'NET_30', snapshot from order)
- **Service** (`backend/src/services/tax-invoice.service.ts`):
  - Updated `createTaxInvoice()` to read `order.paymentTerms` and calculate dueDate dynamically
  - NET_30 → +30 days, NET_60 → +60 days, NET_90 → +90 days, PREPAY/COD → issueDate
  - Stores paymentTerms snapshot on TaxInvoice record
  - Added `paymentTerms` to `TaxInvoiceData` interface and `mapToTaxInvoiceData()`
- **PDF** (`backend/src/services/pdf.service.ts`):
  - Expanded `drawTIInvoiceDetails()` to two-row layout showing Payment Terms and Due Date
  - Added `formatPaymentTermsLabel()` helper
  - Changed banking details reference from order number to invoice number
- **Frontend** (`frontend/src/lib/api.ts`):
  - Added `paymentTerms` to `TaxInvoice` interface
- Both backend and frontend compile clean (tsc --noEmit passes)

## Decisions Made
- paymentTerms stored as snapshot on TaxInvoice (not joined from order) — consistent with existing snapshot pattern
- PREPAY/COD due date = issueDate (already paid / due immediately)
- Banking details reference changed to invoice number (more useful for payment tracking)

## Files Modified This Session
- `backend/prisma/schema.prisma` (added paymentTerms to TaxInvoice)
- `backend/src/services/tax-invoice.service.ts` (dueDate calculation, paymentTerms snapshot)
- `backend/src/services/pdf.service.ts` (PDF shows due date + payment terms)
- `frontend/src/lib/api.ts` (TaxInvoice type updated)
- `.claude/plans/execution-progress.md` (R5 marked complete)

## Next Steps (Exact)
1. Start T10: Tax invoice API routes + staff UI
2. Read execution-plan.md for T10 full prompt
3. Build: API routes (list, detail, PDF download, create, void), Zod validation, staff UI (tax invoice section on order detail, list page, detail page), React Query hooks

## Context for Next Session
- Execution plan: `.claude/plans/execution-plan.md`
- Progress tracker: `.claude/plans/execution-progress.md`
- Workflow: read progress → find first unchecked → read plan → execute → mark done → commit → push → STOP
- User says "go" to proceed to next task
- Git has NUL file issue — use specific file paths in git add, not -A
- Repair Phase R1-R5 all complete, now continuing with T10+
