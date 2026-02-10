# Current Session

## Active Task
Order-to-Fulfillment Workflow — Customer Management Restructure (Phase 1.4–1.11)

## Plan
See `.claude/plans/serialized-mixing-reef.md` for customer management plan.
See `.claude/plans/ticklish-yawning-pretzel.md` for original 4-phase plan (Phases 2–4 after this).

## Completed Micro-tasks

### Phase 1.1–1.3: Sales Rep Assignment — COMPLETE
- DB migration, backend API, staff user management page, sales rep UI on companies page

### Phase 1.4: DB Migration — Customer Management Fields (2bdfc7d)
- New enums: CreditStatus, AccountStatus, ShippingMethod, ContactRole
- Company: accountNumber, creditLimit, creditStatus, discountOverride, statementEmail, invoiceEmail, accountStatus, territory, internalNotes, defaultShippingMethod, bbbeeLevel, bbbeeExpiryDate
- CompanyAddress: label, suburb, deliveryInstructions, contactName, contactPhone
- CompanyContact: jobTitle, contactRole, isActive
- Auto-generated NUS-NNNN account numbers for existing companies

### Phase 1.5: Backend — Expanded Company CRUD (649cfd7)
- CompanyCounter model + generateAccountNumber() for NUS-NNNN format
- Create/update schemas expanded with all customer management fields
- GET detail returns addresses + contacts
- Address sub-routes: POST/PATCH/DELETE /companies/:id/addresses/:addressId
- Contact sub-routes: POST/PATCH/DELETE /companies/:id/contacts/:contactId
- Default management (isDefault/isPrimary auto-unsets)

### Phase 1.6: Staff User Auto-Assign to Internal Company (f380414)
- companyId now optional in createUserSchema (backend + frontend API client)
- When omitted, auto-resolves to Company where isInternal=true
- Removed company dropdown from staff user create form
- 4 unit tests (auto-assign, explicit companyId, no internal company error, invalid companyId error)

### Phase 1.7: Frontend — Rename Companies → Customers + List Page Update
- Moved route from `/admin/companies` to `/admin/customers`
- Updated navigation.ts: "Companies" → "Customers"
- Renamed all user-facing text (page title, buttons, search, empty states, modal)
- Added `accountNumber`, `accountStatus`, `territory` to CompanyListItem type
- Expanded CompanyDetail type with all Phase 1.4 fields (credit, addresses, contacts, etc.)
- Added new types: CreditStatusType, AccountStatusType, ShippingMethodType, ContactRoleType, CompanyAddress, CompanyContact
- Added API methods: createCompanyAddress, updateCompanyAddress, deleteCompanyAddress, createCompanyContact, updateCompanyContact, deleteCompanyContact
- Updated createCompany/updateCompany to accept all new fields
- Added Account # column and AccountStatus badge to list table
- Made customer name clickable (links to `/admin/customers/[id]`)
- Replaced Users column with territory display
- Created placeholder detail page for Phase 1.8

## Pending Micro-tasks
- [ ] Phase 1.8: Frontend — Customer detail page (overview + financial + sales + logistics)
- [ ] Phase 1.9: Frontend — Address management on detail page
- [ ] Phase 1.10: Frontend — Contact management on detail page
- [ ] Phase 1.11: Cleanup + link audit
- [ ] Phase 2.1–2.2: Customer Checkout Flow
- [ ] Phase 3.1–3.3: Backorder Visibility
- [ ] Phase 4.1–4.5: Notification System

## Commits This Session
- 641d8e0: Phase 1.2b — Staff user management frontend
- a7ccfd1: Phase 1.3 — Sales rep assignment UI
- 85348e8: SESSION.md update
- 2bdfc7d: Phase 1.4 — DB migration (customer management fields)
- 649cfd7: Phase 1.5 — Expanded Company CRUD + address/contact routes
- f380414: Phase 1.6 — Staff user auto-assign to internal company

## Context for Next Session
- Plan files: see above
- Phase 1.8 next: Customer detail page with tabs (Overview, Financial, Addresses, Contacts)
- Backend API paths stay as /admin/companies (no breaking change)
- Placeholder detail page exists at `/admin/customers/[id]` — ready to build out
- API types for CompanyDetail, CompanyAddress, CompanyContact are complete
- API methods for address/contact CRUD are wired up
- CompanyCounter table needs to be created on local DB
- Migrations pending on Railway: 20260211100000, 20260211120000, 20260211140000
