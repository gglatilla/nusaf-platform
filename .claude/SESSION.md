# Current Session

## Active Task
Phase 2: Customer Checkout Flow — COMPLETE

## Plan
See `.claude/plans/linear-wibbling-manatee.md`

## Completed Micro-tasks

### Phase 2.1: DB Migration — Shipping Address on SalesOrder (fa93d40)
- Added `shippingAddressId` (FK → CompanyAddress) and `shippingAddressSnapshot` (JSON) to SalesOrder model

### Phase 2.2: Backend — Checkout Endpoint + Service (83c7f67)
- `POST /api/v1/quotes/:id/checkout` — unified checkout for staff and customers
- `checkoutQuote()` service: validates, accepts quote, creates order with checkout data, triggers fulfillment/proforma
- `createOrderFromQuote()` enhanced to accept `shippingAddressId` and create address snapshot
- PO number required for all customers (Zod validation)

### Phase 2.3: Backend Tests (31a53e2)
- 12 unit tests for `checkoutQuote()`: validation, company isolation, all/minimal fields, payment terms flow, error handling

### Phase 2.4: Frontend — Shared Checkout Components (72ddb04)
- `CheckoutPage`: single-page form with items review, address selector, PO input + file upload, delivery date + notes, order summary sidebar
- `AddressSelector`: radio card picker for shipping addresses
- `OrderSummary`: subtotal/VAT/total with payment terms badge
- `useCheckout` hook + API client `checkoutQuote()` method

### Phase 2.5: Frontend — Portal Route Pages + Wiring (6aa2ad7)
- Staff checkout route: `/quotes/[id]/checkout`
- Customer checkout route: `/my/quotes/[id]/checkout`
- Both quote detail pages updated: "Proceed to Checkout" replaces old Accept/Create Order flow

### Phase 2.6: Cleanup (this commit)
- Deleted `CreateOrderModal.tsx` (replaced by checkout page)
- Removed unused imports and dead code

## Pending Micro-tasks
- [ ] Phase 3.1–3.3: Backorder Visibility
- [ ] Phase 4.1–4.5: Notification System

## Context for Next Session
- Phase 2 (Customer Checkout Flow) is COMPLETE
- Unified checkout: both staff and customers use same CheckoutPage component
- PO number is required for ALL customers at checkout
- PO document upload supported (PDF/JPG/PNG, attached to order after creation)
- Shipping address selection from company address book, with snapshot stored on order
- PREPAY/COD customers see payment instructions after checkout
- NET_30/60/90 customers get auto-fulfillment triggered
- Old `CreateOrderModal` deleted, old accept flow replaced
- Backend `/accept` endpoint still exists as legacy, but UI now uses `/checkout`
- Migration pending on Railway: 20260212100000_add_shipping_address_to_sales_order
