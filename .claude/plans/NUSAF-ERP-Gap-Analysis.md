# NUSAF Platform: Comprehensive ERP Gap Analysis & Remediation Brief

**Date:** 2026-02-06  
**Purpose:** Identify every gap between what was built and what a functional ERP/B2B platform requires, and provide Claude Code with clear, actionable remediation instructions.

---

## PART 1: THE CORE PROBLEM — AN HONEST ASSESSMENT

The NUSAF platform was designed as three interconnected systems:

1. **ERP/MRP System** (app.nusaf.net, staff side) — inventory management, purchasing, manufacturing, order fulfillment, supplier relationships, customer management
2. **B2B Customer Portal** (app.nusaf.net, customer side) — product browsing with pricing, quote requests, order tracking, self-service
3. **Marketing Website** (www.nusaf.net) — public product catalog without pricing, lead generation, brand presence

What was actually built is a collection of database tables and API endpoints that represent ERP *concepts* (stock levels, POs, GRVs, picking slips, job cards, transfer requests, BOMs, quotes, sales orders) — but they don't behave like a real ERP system. The modules were built as isolated tasks rather than as an integrated system where data flows naturally from one module to the next.

If a warehouse manager, purchaser, or sales person sat down to use this system today, they would not be able to complete basic daily workflows.

---

## PART 2: WHAT A REAL ERP DOES THAT THIS SYSTEM DOESN'T

### 2.1 The Item Master — Single Source of Truth

In every real ERP system (SAP, NetSuite, Odoo, SYSPRO, Epicor), the **Item Master** is the central record. One product, many facets — all visible and manageable from a single place.

**What the Item Master should show:**

| Facet | What a User Sees | NUSAF Current State |
|-------|------------------|---------------------|
| **Master Data** | SKU, description, UoM, category, weight, dimensions, product type | ❌ Partially built. Data exists but edit forms don't load data correctly (known bug: dropdowns empty, text fields vs relationship IDs disconnect) |
| **Inventory** | On-hand qty per warehouse, reserved, on-order, available qty, reorder point, min/max levels, last count date | ⚠️ Backend models exist (StockLevel, StockMovement). TASK-013B added an Inventory tab. But the presentation is fragmented — you can't see a quick snapshot |
| **Purchasing** | Preferred suppliers per product, supplier part numbers, lead times, last purchase price, open POs for this item | ❌ Supplier model exists but there's no "purchasing facet" on the product. No way to see which suppliers carry a product or what the last purchase price was |
| **Sales** | Selling price per customer tier, sales history, margin calculation, quote frequency | ❌ Pricing rules exist as a separate module but aren't shown on the product. No way to see "this product sells for X to End Users, Y to OEM, Z to Distributors" from the product page |
| **Manufacturing** | Bill of Materials, assembly complexity, components needed, manufacturing lead time | ⚠️ BOM model exists (TASK-019) but viewing a product doesn't show its BOM inline. You have to navigate elsewhere |
| **Documents** | Datasheets, CAD drawings, images, certificates | ❌ Schema added in TASK-016-PREP but NO admin UI was ever built to upload or manage these |
| **Cross-References** | Competitor part numbers, alternate SKUs | ❌ Schema exists but NO management UI |
| **Audit Trail** | Who changed what, when, full stock movement history with document references | ⚠️ StockMovement model exists but no UI to view movement history per product |

**The fundamental failure:** In a real ERP, you open a product and you know EVERYTHING about it. In NUSAF, you have to visit 5+ different pages to piece together what should be a single, comprehensive view.

### 2.2 Document Chain — The Backbone of Any ERP

Every real ERP operates on a document chain where each document creates the next, and you can trace the full history from any point:

```
QUOTE REQUEST (website visitor or customer)
    ↓
QUOTE (staff creates with pricing)
    ↓ (customer accepts)
SALES ORDER
    ↓ (fulfillment orchestration)
    ├── PICKING SLIP(S) — per warehouse
    ├── JOB CARD(S) — for manufactured items
    ├── TRANSFER REQUEST(S) — for inter-warehouse moves
    └── PURCHASE ORDER(S) — for items not in stock
            ↓
        GRV (Goods Received Voucher) — when PO items arrive
            ↓
        Stock increases, PO status updates

PICKING SLIP → DELIVERY NOTE → INVOICE (not yet built)
TRANSFER REQUEST → TRANSFER RECEIPT (receiving warehouse confirms)
JOB CARD → FINISHED GOODS RECEIPT (manufactured item enters stock)
```

**What's broken:**

1. **No traceability.** You cannot look at a GRV and trace it back to which sales orders ultimately caused that purchase. You cannot look at a sales order and see all its associated picking slips, job cards, POs, and delivery status in one view.

2. **The orchestration engine is a one-shot action, not a living workflow.** TASK-022A built a "Generate Fulfillment Plan" button that creates documents in bulk. But after generation, those documents live independently. There's no dashboard showing "Sales Order #1234: Picking Slip — Complete, Job Card — In Progress, Transfer — Pending, PO — Awaiting Delivery."

3. **No status propagation.** When a picking slip is marked complete, that status should flow back up to the sales order. When all picking slips, job cards, and transfers for an order are done, the order should automatically move to "Ready to Ship." None of this happens.

4. **Missing documents entirely.** There is no Delivery Note, no Invoice/Proforma, no Credit Note, no Packing List. These are fundamental B2B distribution documents.

### 2.3 Stock Movements — Every Change Needs a Document Reference

In a real ERP, stock NEVER changes without a reason tied to a source document:

| Movement Type | Source Document | Stock Effect |
|---------------|----------------|--------------|
| RECEIPT | GRV (linked to PO) | +onHand, -onOrder |
| ISSUE | Picking Slip (linked to Sales Order) | -onHand, -reserved |
| TRANSFER_OUT | Transfer Request | -onHand (source warehouse) |
| TRANSFER_IN | Transfer Receipt | +onHand (destination warehouse) |
| MANUFACTURE_IN | Job Card completion | +onHand (finished goods) |
| MANUFACTURE_OUT | Job Card start | -onHand (components consumed) |
| ADJUSTMENT | Stock Adjustment (with approval) | ±onHand |
| SCRAP | Scrap Record | -onHand |
| RETURN | Return Authorization | +onHand or scrap |

**What's broken:** The StockMovement model exists with these types defined, but the actual enforcement is inconsistent. When a GRV is created, does it actually create a RECEIPT movement? When a picking slip is completed, does it create an ISSUE movement and reduce stock? These integrations may exist in backend code but there's no way to verify or see them working through the UI.

### 2.4 The View vs Edit Redundancy Problem

You correctly identified that viewing and editing an inventory item is the same thing. This is a UX anti-pattern that reveals the system wasn't designed with role-based workflows in mind.

**How it should work:**

| Context | What the User Sees | Who |
|---------|-------------------|-----|
| **View Product** (read-only) | Complete product card with all facets. Stock levels, pricing summary, BOM summary, recent movements, linked documents. A rich information display. | Everyone |
| **Edit Product** (write mode) | Tabbed form with editable fields: Master Data tab, Pricing tab, Suppliers tab, BOM tab, Documents tab, Settings tab. Field-level permissions based on role. | Admin, Manager |
| **Quick Stock View** | Product + warehouse stock levels + last 10 movements. Focused on inventory context. | Warehouse staff |
| **Customer Product View** | Product details + their tier price + spec sheet download + "Add to Quote" button. NO internal data (stock levels, supplier info, cost prices, BOMs). | Customers |

**What exists instead:** One page that tries to do everything and does nothing well. The view page shows the same form as the edit page, which means warehouse staff see editing controls they shouldn't touch, customers would see internal data, and nobody gets an optimized view for their actual workflow.

---

## PART 3: THE B2B PORTAL vs ERP DISTINCTION

This is one of the most critical failures. The system doesn't properly separate what STAFF see from what CUSTOMERS see.

### 3.1 What Staff (ERP) Should See

Staff log into app.nusaf.net and see an internal operations platform:

**Sidebar Navigation (Staff):**
```
📊 Dashboard (role-specific KPIs)
📦 Products
    → Product List (with stock badges, cost prices, margins)
    → Add Product
    → Import Products
    → Categories
🏭 Inventory
    → Stock Overview (multi-warehouse)
    → Stock Adjustments (with approval workflow)
    → Stock Movements (audit log)
    → Reorder Alerts
    → Cycle Counts
🛒 Sales
    → Quotes (all customers, with margin visibility)
    → Sales Orders (full pipeline)
    → Delivery Notes
    → Returns
💰 Purchasing
    → Purchase Orders
    → Goods Received (GRVs)
    → Supplier Management
    → Purchase Requisitions
🔧 Manufacturing
    → Job Cards
    → BOMs
    → Work Orders
🚚 Logistics
    → Picking Slips
    → Transfer Requests
    → Delivery Schedule
👥 Customers
    → Company Management
    → Customer Users
    → Pricing Tiers
📊 Reports
    → Sales Analytics
    → Inventory Reports
    → Purchasing Reports
⚙️ Settings
    → Users & Roles
    → Warehouses
    → System Config
```

### 3.2 What Customers (Portal) Should See

Customers log into the same app.nusaf.net but see a COMPLETELY DIFFERENT interface:

**Sidebar Navigation (Customer):**
```
🏠 Dashboard (their orders, their quotes, their account)
📦 Products
    → Browse Catalog (THEIR prices, not cost prices)
    → Search by Part Number / Cross-Reference
📋 Quotes
    → My Quotes (draft, submitted, accepted, expired)
    → Quote Cart
📦 Orders
    → My Orders (with status tracking)
    → Order History
📄 Documents
    → My Invoices
    → My Delivery Notes
    → My Statements
📎 Upload
    → Submit Drawing for Quote (PDF/DXF upload)
👤 My Account
    → Company Details
    → Manage Users (if Admin role)
    → Preferences
```

**Critical differences:**

| Data Point | Staff Sees | Customer Sees |
|------------|-----------|---------------|
| Product price | Cost price, margin, all tier prices | ONLY their tier price |
| Stock level | Exact quantities per warehouse | "In Stock" / "Limited" / "Out of Stock" or nothing |
| Supplier info | Supplier name, supplier part number, cost | NOTHING — completely hidden |
| BOM | Full component breakdown | NOTHING — completely hidden |
| Other customers' data | All quotes, all orders | ONLY their own |
| Internal documents | Picking slips, job cards, transfer requests | NOTHING |
| Customer documents | Invoices, delivery notes, statements | Their own only |

**What exists instead:** The current system has role-based access on API endpoints (fixed in the P0-2 security audit), but the UI doesn't present different interfaces for different roles. There's no "customer portal" that shows a clean, commercial interface. The customer essentially sees a stripped-down version of the staff interface rather than a purpose-built commercial experience.

---

## PART 4: SPECIFIC FAILURES BY MODULE

### 4.1 Product/Inventory Management

**Problems:**
1. Edit form doesn't load existing data properly (dropdowns empty, text field vs ID disconnect)
2. View and Edit are the same page — no rich read-only product view
3. No inline display of stock levels, pricing, BOM, supplier info on the product page
4. No product images or documents management UI (backend schema exists, no frontend)
5. No cross-reference management UI
6. Product list doesn't show enough context (stock status badges were added in 013C but are they working?)
7. No bulk operations (bulk price update, bulk category assignment, bulk publish/unpublish)
8. No product duplication (copy an existing product as a starting point)
9. No product import validation/preview screen

### 4.2 Purchasing (POs and GRVs)

**Problems:**
1. PO creation works but there's no automatic PO suggestion based on low stock or sales demand
2. GRV creation exists (receive against PO) but does it ACTUALLY update stock levels via StockMovement?
3. No way to see purchase history per product (what have we bought, from whom, at what price, when)
4. No supplier performance tracking (on-time delivery, quality, lead time accuracy)
5. No purchase requisition workflow (warehouse requests a purchase, purchaser approves and creates PO)
6. PO doesn't track landed cost (freight, customs, duties)
7. No partial receiving progress visible on the PO detail page
8. No supplier price comparison when creating a PO

### 4.3 Sales (Quotes and Orders)

**Problems:**
1. Quote system works for customer self-service but staff can't create quotes on behalf of customers
2. No margin visibility when creating or reviewing quotes
3. Sales Order exists but has no lifecycle dashboard (where is every order in its fulfillment journey?)
4. No delivery note generation from completed picking slips
5. No invoice/proforma generation
6. No credit note process
7. No back-order management
8. No customer communication trail (emails sent, notes, follow-ups)
9. Quote doesn't show "last time this customer bought this product" context

### 4.4 Manufacturing (Job Cards and BOMs)

**Problems:**
1. BOM exists but there's no way to see component availability before starting a job
2. Job Card has status flow but does completing a job card ACTUALLY add manufactured items to stock?
3. No component consumption tracking (when a job card starts, components should be reserved/consumed)
4. No manufacturing dashboard showing "jobs in progress, jobs waiting for materials, jobs completed today"
5. No estimated vs actual time tracking on job cards
6. No scrap/waste recording from manufacturing

### 4.5 Warehouse Operations

**Problems:**
1. Picking Slip exists but there's no efficient picking workflow (warehouse worker picks items, confirms quantities)
2. No packing workflow after picking
3. No bin/location management within warehouses
4. Transfer Request exists but does completing it ACTUALLY move stock between warehouses?
5. No transfer receipt confirmation at the receiving warehouse
6. No cycle count functionality
7. No stock-take/physical inventory process
8. No putaway process (when goods are received, where do they go?)

### 4.6 The Fulfillment Orchestration Engine

**Problems:**
1. Built as a one-time "generate plan" action rather than a persistent workflow
2. After documents are generated, there's no way to see the overall order fulfillment status
3. No automatic status propagation (picking slip complete → updates order status)
4. No exception handling (what happens when a picking slip reveals a stock discrepancy?)
5. No re-orchestration (what if circumstances change after the plan was generated?)

---

## PART 5: DATA FLOW FAILURES

### 5.1 Information That Should Flow But Doesn't

| When This Happens | This Should Update | Currently |
|-------------------|--------------------|-----------|
| GRV created (goods received) | Stock +onHand, PO line qty received, PO status, StockMovement record | Uncertain — needs verification |
| Picking slip completed | Stock -onHand, Sales Order line qty picked, StockMovement record | Uncertain |
| Job card completed | Stock +onHand (finished goods), -onHand (components consumed), StockMovement records | Uncertain |
| Transfer completed | Stock -onHand (source), +onHand (destination), StockMovement records | Uncertain |
| Quote accepted | Stock soft-reserved, Sales Order created | Quote→SO works, reservation uncertain |
| Sales Order confirmed | Stock hard-reserved | Uncertain |
| Stock adjustment approved | Stock ±onHand, StockMovement record | Uncertain |
| Product price rule changed | All active quotes for that product should show a warning | Doesn't happen |

### 5.2 The "Uncertain" Problem

Many of the items above are marked "uncertain" because while backend services MAY handle these operations, there's no way to verify through the UI. There are no stock movement logs visible to users, no real-time stock dashboards that update when documents are processed, and no integration tests proving the chain works end-to-end.

---

## PART 6: WHAT TO TELL CLAUDE CODE

### Phase 0: Audit and Fix the Foundation (CRITICAL — DO THIS FIRST)

```
I need you to perform a COMPLETE integration audit of every document-to-stock flow in the system. For each of the following, trace the code from the API endpoint through the service layer and verify that stock movements are actually created and stock levels are actually updated:

1. GRV Creation → Does it create StockMovement records with type RECEIPT? Does it increase StockLevel.onHand? Does it decrease StockLevel.onOrder? Does it update PurchaseOrderLine.quantityReceived?

2. Picking Slip Completion → Does it create StockMovement records with type ISSUE? Does it decrease StockLevel.onHand? Does it release StockReservation? Does it update SalesOrderLine status?

3. Job Card Completion → Does it create StockMovement records with type MANUFACTURE_IN for the finished product? Does it create MANUFACTURE_OUT for consumed components? Does it update StockLevel.onHand for both?

4. Transfer Request Completion → Does it create TRANSFER_OUT at source warehouse and TRANSFER_IN at destination? Does it update StockLevel.onHand for both warehouses?

5. Stock Adjustment Approval → Does it create ADJUSTMENT_IN or ADJUSTMENT_OUT? Does it update StockLevel.onHand?

6. Quote Finalization → Does it create soft StockReservations? 

7. Sales Order Confirmation → Does it convert soft reservations to hard reservations?

For EACH flow:
- Show me the exact code path
- If the integration is MISSING, implement it
- If it EXISTS but is broken, fix it
- Create a StockMovement record for every single stock change with the source document ID and type
- Make sure every StockMovement includes: productId, warehouseId, movementType, quantity, referenceType (PO, SO, TRANSFER, JOB_CARD, ADJUSTMENT), referenceId, performedBy, notes

This is the foundation. Nothing else matters until these flows are verified and working. Create a verification report showing the status of each flow.
```

### Phase 1: Rebuild the Product/Item Master Page

```
The current product view and edit pages need to be completely rebuilt into a proper ERP Item Master. Here is the specification:

PRODUCT DETAIL PAGE (View Mode — the default):
This is a RICH, READ-ONLY information display. Think of how NetSuite or Odoo shows an item master record.

Layout: Header + Tab Panel

HEADER (always visible):
- Product image (primary), or placeholder
- SKU (large, prominent)  
- Product name / description
- Category > Subcategory breadcrumb
- Product Type badge (STANDARD, ASSEMBLY, MANUFACTURED, KIT)
- Status badge (ACTIVE, DISCONTINUED, DRAFT)
- "Edit" button (visible only to ADMIN, MANAGER)
- "Add to Quote" button (visible only to CUSTOMER roles)

QUICK STATS BAR (always visible, below header):
- Total Stock: [number] [UoM]
- Available: [number] (on hand minus reserved)
- Reserved: [number]
- On Order: [number] (open POs)
- Reorder Point: [number]
- Stock status indicator (green/amber/red)

TAB: Overview
- Full description (marketing description if set, otherwise standard description)
- Technical specifications table (from JSON specs field)
- Key attributes: UoM, weight, dimensions, lead time
- Images gallery

TAB: Inventory
- Stock levels per warehouse (table: Warehouse | On Hand | Reserved | Available | On Order | Reorder Point)
- Recent stock movements (last 20, table: Date | Type | Qty | Reference | Warehouse | User)
- Stock movement chart (line chart, last 90 days)

TAB: Pricing (STAFF ONLY — hidden from customers)
- Current pricing rules affecting this product
- Price per customer tier (End User: R___, OEM: R___, Distributor: R___)
- Cost price, margin percentage
- Price history

TAB: Purchasing (STAFF ONLY)
- Suppliers who carry this product (table: Supplier | Supplier Part # | Cost Price | Lead Time | Last Ordered)
- Open Purchase Orders containing this product
- Purchase history (last 10 GRVs)

TAB: BOM (STAFF ONLY — only shown for ASSEMBLY/MANUFACTURED/KIT types)
- Bill of Materials tree view
- Component availability check (per warehouse)
- Estimated manufacturing cost

TAB: Sales History (STAFF ONLY)
- Recent sales orders containing this product
- Top customers buying this product
- Sales trend chart

TAB: Documents
- Uploaded documents (datasheets, CAD, certificates) with download links
- Images management
- Cross-references table

TAB: Audit Log (STAFF ONLY)
- Full change history: who changed what field, when
- Stock movement log (complete, with document references)

PRODUCT EDIT PAGE (Write Mode — separate from view):
This is a TABBED FORM for editing the product, accessible only by ADMIN/MANAGER.

TAB: General
- SKU, Name, Description, Marketing Description
- Category (dropdown), Subcategory (dropdown, filtered by category)
- Product Type, Status, UoM
- Weight, Dimensions, Lead Time

TAB: Pricing
- Manage pricing rules for this product
- Set base price, tier discounts
- Margin calculator

TAB: Suppliers
- Add/remove supplier relationships
- Set preferred supplier
- Enter supplier part numbers, cost prices, lead times

TAB: BOM
- Add/remove/edit components
- Set quantities per component
- Set assembly complexity

TAB: Documents & Images
- Upload/delete product images (with primary selection)
- Upload/delete documents (datasheet, CAD, certificate, etc.)
- Manage cross-references (competitor part numbers)

TAB: Inventory Settings
- Reorder point per warehouse
- Min/max stock levels per warehouse
- Stock alert thresholds

CRITICAL: The Edit page must properly load ALL existing data including:
- Dropdown fields must show the currently selected value (category, subcategory, supplier, UoM)
- Text fields must populate from the correct data source
- Relationship IDs must map to display names
- Fix the known bug where imported product data appears in view but not in edit forms
```

### Phase 2: Build Separate Customer Portal Interface

```
The customer-facing side of app.nusaf.net needs to be a completely separate interface from the staff ERP. This is NOT about hiding menu items — it's about building a purpose-built commercial experience.

CUSTOMER PORTAL LAYOUT:
- Clean, commercial header with company logo, search bar, quote cart icon with count
- Left sidebar with customer-specific navigation (not the staff navigation with items removed)
- Customer sees ONLY: Dashboard, Products, My Quotes, My Orders, Documents, Upload Drawing, My Account

CUSTOMER PRODUCT CATALOG:
- Products displayed as a clean, commercial catalog
- NO stock levels shown (or at most: "In Stock" / "Available on Request")
- NO cost prices, NO margins, NO supplier information, NO BOMs
- Show ONLY the customer's tier price
- Professional product cards with images
- Specification table
- Document downloads (public datasheets only)
- "Add to Quote" button
- Cross-reference search (search by competitor part number)

CUSTOMER DASHBOARD:
- Welcome message with company name
- Active Quotes (count and list)
- Recent Orders (with status: Processing, Shipped, Delivered)
- Account status

CUSTOMER QUOTE FLOW:
1. Browse products → Add to cart/quote basket
2. Review quote basket → Adjust quantities → Add notes
3. Submit quote → Receives email confirmation
4. View quote status → Accept or request changes
5. Quote becomes Sales Order on acceptance

CUSTOMER ORDER TRACKING:
- Simple status: Order Received → Processing → Ready to Ship → Shipped → Delivered
- NO visibility into internal operations (picking slips, job cards, transfer requests)
- Delivery tracking number when available
- Invoice download

ROLE-BASED RENDERING:
The same Next.js app must render completely different layouts based on user role:
- If user.role in [ADMIN, MANAGER, SALES, PURCHASER, WAREHOUSE] → render staff ERP layout
- If user.role in [CUSTOMER_ADMIN, CUSTOMER_BUYER, CUSTOMER_VIEWER] → render customer portal layout
- This should be handled at the layout level, not by conditionally hiding UI elements

Implement this as two separate route groups in Next.js:
- (erp)/ — staff routes with ERP layout
- (portal)/ — customer routes with portal layout
- Middleware redirects based on role after authentication
```

### Phase 3: Fix the Document Chain and Status Propagation

```
Every operational document in the system must be linked into a traceable chain with automatic status propagation.

SALES ORDER DETAIL PAGE must show:
- Order header (customer, date, status, totals)
- Order lines (product, qty ordered, qty picked, qty shipped, line status)
- Fulfillment Status Panel:
  ├── Picking Slips: [list with status badges]
  ├── Job Cards: [list with status badges]  
  ├── Transfer Requests: [list with status badges]
  ├── Purchase Orders: [list with status badges]
  └── Overall: "3 of 5 fulfillment actions complete"
- Timeline/Activity Log (every status change, every document created, every note)

STATUS PROPAGATION RULES:
1. When ALL picking slips for an order are COMPLETE:
   → If no job cards or transfers pending → Order status = READY_TO_SHIP
   → If job cards or transfers still pending → Order status = PARTIALLY_FULFILLED

2. When a Job Card is marked COMPLETE:
   → Create MANUFACTURE_IN stock movement
   → Create MANUFACTURE_OUT for components
   → Check if this completes all job cards for the order → update order status

3. When a Transfer Request is marked RECEIVED at destination:
   → Create TRANSFER_IN stock movement at destination
   → Check if all transfers for the order are complete → update order status

4. When a GRV is created against a PO:
   → Create RECEIPT stock movement  
   → Update PO line received quantities
   → If PO was linked to a sales order (backorder), check if this resolves the backorder

5. When a Delivery Note is created (new document type needed):
   → Order status = SHIPPED
   → Reduce reserved stock
   → Create stock ISSUE movements for all delivered items

PURCHASE ORDER DETAIL PAGE must show:
- PO header (supplier, date, status, totals)
- PO lines (product, qty ordered, qty received, qty outstanding)
- GRV history: [list of GRVs received against this PO]
- Linked Sales Orders (if PO was triggered by demand)

PICKING SLIP DETAIL PAGE must show:
- Which Sales Order this belongs to
- Lines to pick (product, qty required, location/bin if applicable)
- Pick confirmation (actual qty picked, discrepancies noted)
- Status: PENDING → IN_PROGRESS → COMPLETE

Implement a FULFILLMENT DASHBOARD for operations staff:
- Today's Picking Queue (picking slips needing attention)
- Jobs In Progress (active job cards)
- Pending Transfers (transfer requests awaiting action)
- Awaiting Delivery (POs expected this week)
- Orders Ready to Ship
- Exception Alerts (stock discrepancies, overdue POs, stalled job cards)
```

### Phase 4: Fix the Inventory Module

```
The inventory module needs to work as a proper warehouse management interface.

INVENTORY DASHBOARD (for warehouse staff):
- Multi-warehouse stock summary
- Low stock alerts (products below reorder point)  
- Today's movements (receipts, issues, transfers)
- Pending stock adjustments awaiting approval
- Quick links: Receive Goods, Create Adjustment, View Movements

STOCK MOVEMENTS PAGE:
- Filterable log of ALL stock movements across all warehouses
- Filters: Date range, Warehouse, Movement Type, Product, Reference Document
- Each movement shows: Date, Product, Warehouse, Type, Qty, Before/After balance, Reference (clickable link to source document), User
- Export to Excel

STOCK ADJUSTMENT WORKFLOW:
1. Warehouse staff creates adjustment (product, warehouse, qty change, reason)
2. Status: PENDING
3. Manager reviews and approves/rejects
4. On approval: Stock updates, StockMovement created
5. Full audit trail

STOCK TAKE / CYCLE COUNT:
1. Create a count session (select warehouse, select products or count all)
2. Print count sheets or use on-screen entry
3. Enter counted quantities
4. System shows variances (system qty vs counted qty)
5. Generate adjustments for discrepancies
6. Approve adjustments

REORDER REPORT:
- Products below reorder point per warehouse
- Suggested purchase quantities
- One-click "Create PO" from reorder suggestions
- Historical consumption rate to inform reorder quantities
```

### Phase 5: Missing ERP Documents

```
These documents are standard in any B2B distribution ERP and are currently missing:

1. DELIVERY NOTE
   - Created when goods are packed and ready for shipment
   - Lists items being delivered, quantities, weights
   - Links to: Sales Order, Picking Slip(s)
   - Printable/PDF format
   - Customer receives a copy
   - Triggers stock ISSUE movement
   - Status: CREATED → DISPATCHED → DELIVERED

2. PROFORMA INVOICE
   - Created from a Sales Order (before delivery)
   - Shows items, quantities, prices, totals, tax, payment terms
   - Customer can review and approve before delivery
   - PDF generation and email

3. PURCHASE REQUISITION
   - Warehouse staff or system (from reorder points) requests a purchase
   - Purchaser reviews and converts to PO
   - Status: REQUESTED → APPROVED → CONVERTED_TO_PO → REJECTED

4. RETURN AUTHORIZATION
   - Customer returns process
   - Links to original Sales Order/Delivery Note
   - Determines: restock, scrap, or replace
   - Updates stock accordingly

5. PACKING LIST
   - Detailed list of what's in each package/carton
   - Weights, dimensions per package
   - Used by logistics for shipping
```

### Phase 6: Reports and Analytics

```
A real ERP is useless without reports. Build these essential reports:

SALES REPORTS:
- Sales by Customer (period)
- Sales by Product (period)
- Sales by Category (period)  
- Quote-to-Order Conversion Rate
- Average Order Value
- Top 10 Products by Revenue
- Top 10 Customers by Revenue
- Margin Analysis by Product/Category

INVENTORY REPORTS:
- Current Stock Valuation (per warehouse and total)
- Stock Aging (how long items have been in stock)
- Dead Stock (items with no movement in 90+ days)
- Inventory Turnover Rate
- Reorder Report
- Stock Movement Summary (period)

PURCHASING REPORTS:
- Purchase History by Supplier (period)
- Open POs Summary
- GRV Summary (period)
- Supplier Lead Time Performance
- Purchase Price Variance

OPERATIONS REPORTS:
- Order Fulfillment Rate
- Average Fulfillment Time
- Picking Accuracy
- Manufacturing Output
- Outstanding Transfers
```

---

## PART 7: PRIORITY SEQUENCE

This is the order Claude Code should tackle these issues:

1. **Phase 0: Integration Audit** — Verify and fix all document-to-stock flows. This is foundational. (1-2 days)

2. **Phase 1A: Fix Product Edit Form** — The known bug where edit forms don't load data. This blocks daily operations. (1 day)

3. **Phase 2: Route Separation** — Create (erp) and (portal) route groups with role-based layout switching. This is architectural and easier to do now than later. (1-2 days)

4. **Phase 1B: Rebuild Product Detail Page** — The comprehensive Item Master view with all tabs and facets. (2-3 days)

5. **Phase 3: Document Chain** — Status propagation, fulfillment dashboard, linked document views. (3-4 days)

6. **Phase 4: Inventory Module** — Stock movements page, adjustment workflow, cycle counts. (2-3 days)

7. **Phase 5: Missing Documents** — Delivery Notes, Proformas, Purchase Requisitions. (2-3 days)

8. **Phase 6: Reports** — Build essential reports. (2-3 days)

**Total estimated effort: 15-20 days of focused Claude Code work.**

---

## PART 8: GOLDEN RULES FOR CLAUDE CODE GOING FORWARD

```
RULES THAT MUST BE FOLLOWED FOR ALL FUTURE DEVELOPMENT:

1. EVERY stock change MUST create a StockMovement record with a reference to the source document. No exceptions.

2. EVERY document must link to its parent document(s). A picking slip must reference its sales order. A GRV must reference its PO. A PO must reference its triggering demand (sales order or reorder point).

3. View pages and Edit pages are SEPARATE. View is read-only, rich, and information-dense. Edit is a form. They are different pages with different URLs.

4. Customer-facing pages must NEVER show: cost prices, supplier information, BOMs, stock quantities (only in-stock badges), other customers' data, internal operational documents.

5. Staff-facing pages must show rich context: when viewing a product, show stock levels, pricing, suppliers, BOM, recent movements. When viewing an order, show all related documents and their statuses.

6. Status changes must propagate. When a child document (picking slip) is completed, the parent document (sales order) must be updated accordingly. Build this as event-driven logic, not manual updates.

7. No feature is complete without:
   - Proper data loading (edit forms must populate from existing data)
   - Role-based visibility (different users see different things)
   - Linked navigation (every reference to another document is a clickable link)
   - Audit trail (who did what, when, with document reference)

8. Test every feature from the perspective of:
   - A warehouse worker processing incoming goods
   - A purchaser creating and managing POs
   - A sales person managing quotes and orders
   - A customer browsing products and tracking orders
   - A manager reviewing operations and approving actions
```

---

## APPENDIX: HOW TO USE THIS DOCUMENT WITH CLAUDE CODE

**Step 1:** Save this entire document to your project: `.claude/plans/erp-gap-analysis-remediation.md`

**Step 2:** Start with Phase 0. Paste this into Claude Code:

```
Read .claude/plans/erp-gap-analysis-remediation.md — this is a comprehensive audit of everything wrong with our system. Start with Phase 0: Integration Audit. For each of the 7 document-to-stock flows listed, trace the actual code path and tell me:
- Does the integration exist? Show me the exact code.
- If it exists, is it correct and complete?
- If it's missing, implement it.

Create a verification report before implementing anything.
```

**Step 3:** After Phase 0 is verified, move to each subsequent phase. For each phase, tell Claude Code:

```
Read Phase [X] from .claude/plans/erp-gap-analysis-remediation.md. Implement exactly as specified. Before writing code, create a plan showing what files need to be created/modified. Follow all 8 golden rules listed in Part 8.
```
