# Current Session

## Active Task
Fix Warehouse User Company Scoping — COMPLETE

## Plan
See `.claude/plans/nifty-sprouting-metcalfe.md`

## Completed Micro-tasks

### Fix: Company Scoping for All Fulfillment Documents (1eef2d2)
- **Root cause**: All fulfillment document routes passed `req.user!.companyId` directly. Staff belong to internal company, documents have customer companyId — mismatch caused "not found"
- Created shared `getEffectiveCompanyId()` in `backend/src/utils/company-scope.ts` — returns undefined for staff (no filter), companyId for customers
- Applied to all 13 route files + 10 service files (picking-slips, job-cards, packing-lists, delivery-notes, transfer-requests, issues, purchase-requisitions, documents, return-authorizations, proforma-invoices, orders, quotes)
- Added WAREHOUSE to PO navigation + GET list/detail/PDF API endpoints
- Fixed notification recipients: warehouse always gets ORDER_RECEIVED even when customer has assigned sales rep
- Updated notification tests for new behavior
- All 151 tests pass, both frontend + backend compile clean

## Context for Next Session
- Migrations pending on Railway: `20260214100000_add_order_received_notification`
- Pre-existing test issue: `import.service.test.ts` fails due to missing `@nusaf/shared` module (unrelated)
- Full end-to-end sales flow verified: product browse → quote → checkout → fulfillment → picking → dispatch → invoice → close
- User wants unified picking slip view showing items awaiting stock (with PO/JC references) — future enhancement
