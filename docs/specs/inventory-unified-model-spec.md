# Inventory System Redesign: Unified Product-Inventory Model

## Context & Problem Statement

Our system currently treats Products and Inventory as two disconnected concepts. This is incorrect from a business perspective. In every major ERP system (SAP, Odoo, NetSuite, SYSPRO), **a product IS an inventory item**. They are the same entity viewed through different lenses.

### The Correct Mental Model

Think of it like a person's medical record. A person has:
- **Identity data** — name, DOB, ID number (≈ product master data: SKU, description, category)
- **Financial data** — medical aid, billing (≈ commercial data: pricing, tax)
- **Health data** — vitals, conditions, medications (≈ inventory data: stock levels, movements)
- **History** — past visits, procedures (≈ stock movement history, audit trail)

You don't create a "person" and then separately create their "health record" as a disconnected thing. It's ONE person with different facets of information. The same applies here: one product with inventory being one of its facets.

### How Major ERPs Handle This

| ERP System | Approach |
|---|---|
| **SAP** | Single "Material Master" record, but data stored across 20+ tables internally (MARA for basic data, MARC for plant-level data, MARD for stock quantities). User sees ONE entity. |
| **Odoo** | `product.template` + `product.product` models with `stock.quant` for quantities. UI presents them as one unified product form with an "Inventory" tab. |
| **NetSuite** | Single Item record with sub-records for inventory, pricing, vendors. One screen, multiple tabs. |
| **SYSPRO** | Single Stock Code master file. Inventory is a tab/view on the stock item. |

**Key takeaway**: All ERPs use separate tables internally (that's just good database design/normalization). But they ALL present it as ONE unified entity to the user.

---

## Current Architecture (What Exists)

### Database Tables (These are FINE — keep them)

```
Product           — Master data (SKU, description, category, pricing)
StockLevel        — Quantities per product per warehouse (onHand, reserved, onOrder)
StockMovement     — Audit trail of every stock change
StockAdjustment   — Workflow for stock corrections (pending → approved/rejected)
StockReservation  — Soft (quotes) and hard (orders) reservations
```

**This separation is correct database design.** Do NOT merge these into one table. The issue is not the database — it's how the system PRESENTS and EXPOSES this data.

### What's Wrong Currently

1. **Conceptual separation**: The code treats inventory as a completely separate module from products, as if they're unrelated entities
2. **No UI exists**: Backend inventory APIs exist but no frontend pages use them
3. **Disconnected APIs**: Product endpoints know nothing about stock; inventory endpoints feel like a separate system
4. **Missing unified view**: There's no way to see a product and its stock information together

---

## Target Architecture (What To Build)

### Principle: One Entity, Multiple Facets

A product in this system is the complete item record. When a user opens a product, they should be able to see and manage ALL aspects of that item:

- **Details tab** — SKU, description, category, subcategory, unit of measure, images
- **Pricing tab** — Base price, customer-specific pricing, price history
- **Inventory tab** — Stock levels per warehouse, reorder points, stock movements, adjustments
- **Sales tab** — Quote history, order history, top customers for this item (future)

### Backend Changes Required

#### 1. Unified Product API Response

When fetching a product, the API should return inventory data as part of the product response. The product IS the inventory item.

**Current** (wrong — forces separate calls):
```
GET /api/v1/products/:id          → { sku, description, price, category }
GET /api/v1/inventory/stock?productId=X  → { onHand, reserved, available }
```

**Target** (correct — unified response):
```
GET /api/v1/products/:id → {
  id, sku, description, price, category, subcategory, unitOfMeasure,
  inventory: {
    totalOnHand: 150,
    totalAvailable: 120,
    totalReserved: 30,
    totalOnOrder: 50,
    byLocation: [
      { warehouseId: "JHB", warehouseName: "Johannesburg", onHand: 100, reserved: 20, available: 80, onOrder: 30 },
      { warehouseId: "CT", warehouseName: "Cape Town", onHand: 50, reserved: 10, available: 40, onOrder: 20 }
    ]
  }
}
```

The product endpoint should include an `include` query parameter to control what facets are loaded:
```
GET /api/v1/products/:id?include=inventory         → includes stock levels
GET /api/v1/products/:id?include=inventory,pricing  → includes stock + pricing detail
GET /api/v1/products/:id                           → basic product data only (for lists/search)
```

#### 2. Product List with Stock Summary

The product listing should optionally include stock summaries:
```
GET /api/v1/products?include=stockSummary → [
  { id, sku, description, price, stockSummary: { totalOnHand: 150, totalAvailable: 120 } },
  ...
]
```

This allows the product list page to show stock status indicators (in stock, low stock, out of stock) without separate API calls.

#### 3. Stock Operations Stay on Inventory Routes (But Reference Products)

Stock operations (adjustments, movements, reservations) should keep their own API routes because they have their own workflows. But they're always performed IN THE CONTEXT of a product:

```
POST /api/v1/products/:productId/stock/adjustments   — Create adjustment for this product
GET  /api/v1/products/:productId/stock/movements     — Movement history for this product
GET  /api/v1/products/:productId/stock/reservations   — Active reservations for this product
```

Alternatively, keep the existing inventory routes but ensure they're also accessible through the product context:
```
# Both should work:
POST /api/v1/inventory/adjustments  (with productId in body)
POST /api/v1/products/:productId/stock/adjustments
```

#### 4. Stock Status Helper

Add a computed field or helper that translates raw numbers into business status:

```typescript
function getStockStatus(product): 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'ON_ORDER' {
  const totalAvailable = product.inventory.totalAvailable;
  const reorderPoint = product.reorderPoint || 0;
  
  if (totalAvailable <= 0 && product.inventory.totalOnOrder > 0) return 'ON_ORDER';
  if (totalAvailable <= 0) return 'OUT_OF_STOCK';
  if (totalAvailable <= reorderPoint) return 'LOW_STOCK';
  return 'IN_STOCK';
}
```

### Frontend Changes Required

#### 1. Product Detail Page — Add Inventory Tab

The existing product detail/edit page should gain an "Inventory" tab showing:

- **Stock Overview**: Total on hand, available, reserved, on order (across all warehouses)
- **Per-Warehouse Breakdown**: Table showing each warehouse's quantities
- **Stock Status Badge**: Visual indicator (green = in stock, amber = low, red = out of stock)
- **Quick Adjustment Button**: Open a modal to create a stock adjustment directly from the product page
- **Recent Movements**: Last 10-20 stock movements for this product (expandable to full history)

#### 2. Product List Page — Add Stock Indicators

The existing product list should show:
- A stock status badge/icon next to each product (colored dot or tag)
- Optional column for "Available" quantity
- Filter/sort by stock status (show me all out-of-stock items)

#### 3. Inventory Management Page (Operational View)

This is a SEPARATE page but it's for operational inventory management, not for "creating inventory items." Think of it as a warehouse operations view:

- **Stock Overview Dashboard**: Summary cards (total SKUs, items below reorder point, pending adjustments)
- **Stock Levels Table**: All products with their stock levels, filterable by warehouse, status, category
- **Pending Adjustments**: List of adjustments awaiting approval
- **Stock Movement Log**: Searchable/filterable audit trail

This page links back to individual products. Clicking any product row takes you to that product's detail page (inventory tab).

#### 4. Stock Adjustment Workflow

From either the product page or the inventory management page:
1. User clicks "Adjust Stock"
2. Modal/form: Select product (pre-filled if from product page), warehouse, adjustment type (add/remove/set), quantity, reason
3. Creates a PENDING adjustment
4. Authorized user approves/rejects
5. On approval, stock levels update and movement is recorded

### Important: What NOT To Build

- **Do NOT create a separate "Inventory Items" CRUD**: Products are inventory items. There's no separate entity to create/edit/delete.
- **Do NOT build inventory management disconnected from products**: Every stock operation relates to a product. The UI should always make this connection clear.
- **Do NOT require users to "activate" inventory for a product**: Every product has inventory by default. If no stock has been received yet, the quantities are simply zero.

---

## Database Schema Notes

### Keep Existing Tables As-Is

The current schema with `Product`, `StockLevel`, `StockMovement`, `StockAdjustment`, and `StockReservation` is well-designed. The relationship is:

```
Product (1) ──── (many) StockLevel      [one per warehouse]
Product (1) ──── (many) StockMovement   [audit trail]
Product (1) ──── (many) StockAdjustment [corrections]
Product (1) ──── (many) StockReservation [quote/order holds]
```

### Consider Adding to Product Table

```prisma
model Product {
  // ... existing fields ...
  
  // Inventory management fields (on the product because they ARE the item)
  reorderPoint      Int?        @default(0)    // When to reorder
  reorderQuantity   Int?                       // How many to reorder
  minimumStock      Int?        @default(0)    // Safety stock level
  maximumStock      Int?                       // Max storage capacity
  leadTimeDays      Int?                       // Supplier lead time
  
  // Relations (already exist)
  stockLevels       StockLevel[]
  stockMovements    StockMovement[]
  stockAdjustments  StockAdjustment[]
  stockReservations StockReservation[]
}
```

These fields belong on the Product because they define properties of THE ITEM, not of a particular warehouse location.

---

## Implementation Order

### Phase 1: Unified API (Backend)
1. Extend the product GET endpoint to include inventory data via `?include=inventory`
2. Extend the product list endpoint to include stock summaries via `?include=stockSummary`
3. Add nested stock routes under products (`/products/:id/stock/...`)
4. Add stock status computation helper
5. Add reorder point fields to Product model

### Phase 2: Product Page Inventory Tab (Frontend)
1. Add "Inventory" tab to product detail page
2. Show stock levels per warehouse in a clean table
3. Show stock status badge
4. Add "Adjust Stock" button that opens adjustment modal
5. Show recent stock movements for this product

### Phase 3: Product List Enhancements (Frontend)
1. Add stock status indicators to product list
2. Add "Available" column (optional/toggleable)
3. Add stock status filter
4. Add sort by stock level

### Phase 4: Inventory Operations Page (Frontend)
1. Build the operational inventory management page
2. Stock overview dashboard with summary metrics
3. Cross-product stock levels table with filters
4. Pending adjustments queue
5. Stock movement audit log

---

## Summary

**The core principle**: A product IS an inventory item. The database can (and should) use separate tables for normalization, but the API, UI, and user experience must present them as one unified entity. Users never "create inventory items" — they manage products, and inventory is simply one facet of each product. Every ERP system in the world works this way, and our system should too.
