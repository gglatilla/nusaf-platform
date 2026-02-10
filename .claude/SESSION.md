# Current Session

## Active Task
[TASK-027] Cash Customer Quoting — COMPLETE (2026-02-10)

## Completed This Session

### TASK-027: Cash Customer Quoting (7 micro-tasks)
- **Database**: isCashAccount on Company, 6 cash customer fields on Quote + SalesOrder, 2 cash companies (JHB, CT)
- **Backend services**: quote + order services handle cash fields, validation at finalize, resolveCustomerName helper
- **Backend API**: POST/PATCH cash customer endpoints, companies return isCashAccount
- **Document services**: delivery note, proforma, tax invoice, packing list use resolveCustomerName
- **Frontend**: CashCustomerForm component, Zustand store, company picker with cash badge
- **Quote/order detail pages**: display cash customer info blocks
- **Tests**: 12 unit tests for cash customer utilities, all 114 existing tests pass

## Commits
- d15bc66: Backend (schema, services, API, documents)
- 59726fd: Frontend (types, store, components)
- 3191111: Tests

## Next Steps
- Deploy: `npx prisma migrate deploy` on Railway (adds cash companies)
- Test in browser: select "Cash Sales - Johannesburg", fill in customer form, create/finalize quote
- Verify proforma shows cash customer name instead of "Cash Sales - JHB"
- Check TASKS.md for backlog items

## Context for Next Session
- Migration `20260211100000_add_cash_customer_support` needs to be applied on Railway
- Cash companies have well-known IDs: `cash-sales-jhb`, `cash-sales-ct`
- Cash customer name is required at finalization (not at draft creation)
- CashCustomerForm is rendered inside CustomerCompanyPicker when isCashAccount company is selected
