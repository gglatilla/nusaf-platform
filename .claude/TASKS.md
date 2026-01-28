# Task Queue

## Current
- [TASK-007] Product catalog — Display products with categories (IN_PROGRESS)

## Up Next
- [TASK-008] Product detail modal
- [TASK-009] Admin pricing rules UI

## Completed
- [TASK-001] Project initialization and setup ✓
- [TASK-002] Database schema — Product tables (suppliers, categories, products) ✓
- [TASK-003] Authentication system (login, logout, sessions) ✓
- [TASK-004] Customer portal layout (sidebar, header, main content) ✓
- [TASK-005] Supplier price list import ✓
- [TASK-006] Pricing engine — Calculate prices per customer tier ✓

## Backlog
- [TASK-011] Quote creation flow
- [TASK-012] Order management
- [TASK-013] Inventory tracking
- [TASK-014] Modular chain configurator
- [TASK-015] Public website — Homepage
- [TASK-016] Public website — Product pages

## Blocked
(none)

---

## TASK-006 Summary (COMPLETED)

**What was added:**

Backend:
- GlobalSettings model with EUR/ZAR rate
- PricingRule model with supplier/category pricing parameters
- costPrice/listPrice fields on Product
- Pricing service with calculateListPrice(), calculateCustomerPrice()
- Settings service for EUR/ZAR rate management
- Admin APIs: settings, pricing-rules
- Product price API (GET /products/:id/price)
- Import service integration for automatic price calculation

Tests:
- 25 unit tests for pricing service

Pricing Formula:
```
Supplier Price (Gross/Net)
-> Apply discount % (if Gross)
-> x EUR/ZAR rate
-> x (1 + Freight %)
-> / Margin Divisor
-> x 1.40 (always)
= List Price (ZAR)
```

Customer Tier Discounts:
| Tier | Discount |
|------|----------|
| END_USER | 30% off list |
| OEM_RESELLER | 40% off list |
| DISTRIBUTOR | 50% off list |
