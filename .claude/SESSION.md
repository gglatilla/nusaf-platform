# Current Session

## Active Task
Order-to-Fulfillment Workflow — Customer Management Restructure (Phase 1.4–1.11)

## Plan
See `.claude/plans/nested-sprouting-lake.md` for Phase 1.8 plan.

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

### Phase 1.7: Frontend — Rename Companies → Customers + List Page Update (3c8eec1)
- Moved route from `/admin/companies` to `/admin/customers`
- Updated navigation, renamed all user-facing text
- Expanded API types, added address/contact CRUD methods
- Created placeholder detail page

### Phase 1.8: Frontend — Customer Detail Page — COMPLETE
- **1.8A** (f8e1053): Hook (`useCustomers.ts`), page shell with tabs, `CustomerDetailHeader`, shared `constants.ts`
- **1.8B** (f2c02b4): `OverviewTab` (company info, logistics, sales rep, notes) + `FinancialTab` (credit, email, B-BBEE, users table)
- **1.8C** (3673c83): `AddressesTab` (card layout, shipping/billing groups) + `AddressFormModal` (SA provinces, delivery instructions)
- **1.8D** (e5eda2c): `ContactsTab` (table with role badges, primary star) + `ContactFormModal` (role dropdown, primary/active toggles)

### Phase 1.11: Cleanup + Link Audit — COMPLETE
- Audited all frontend routes, navigation, links, and cross-references
- Fixed "Search companies..." → "Search customers..." in CustomerCompanyPicker
- Fixed "No companies found"/"No active companies" → "No customers found"/"No active customers"
- Verified: sidebar nav, detail back link, list row links all point to `/admin/customers`
- API client paths correctly use `/admin/companies` (backend API route, unchanged)
- TypeScript build clean, no errors

## Pending Micro-tasks
- [x] Phase 1.9–1.10: MERGED INTO 1.8 — address + contact management delivered in Phase 1.8C/D
- [x] Phase 1.11: Cleanup + link audit
- [ ] Phase 2.1–2.2: Customer Checkout Flow
- [ ] Phase 3.1–3.3: Backorder Visibility
- [ ] Phase 4.1–4.5: Notification System

## Context for Next Session
- Phase 1 (Customer Management Restructure) is fully COMPLETE
- Next: Phase 2 (Customer Checkout Flow)
- CompanyCounter table needs to be created on local DB
- Migrations pending on Railway: 20260211100000, 20260211120000, 20260211140000
