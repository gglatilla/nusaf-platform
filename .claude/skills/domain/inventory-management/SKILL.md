# Inventory Management Skill

## Overview

This skill defines Nusaf's inventory management system across multiple locations, including stock tracking, reservations, reordering, and BOM-based material planning.

---

## Locations

| Location | Type | Stock Held |
|----------|------|------------|
| Johannesburg (JHB) | Main warehouse | Raw materials, WIP, finished goods |
| Cape Town (CT) | Satellite warehouse | Finished goods only |
| Mbombela | Sales office only | No stock |

---

## Stock Tracking

### Per Product, Per Location

| Field | Description |
|-------|-------------|
| On Hand | Physical quantity in warehouse |
| Soft Reserved | Reserved for quotes (does not reduce available) |
| Hard Reserved | Reserved for confirmed orders (reduces available) |
| Available | On Hand - Hard Reserved |
| On Order | Quantity on purchase orders not yet received |
| Minimum Level | Reorder point |
| Reorder Quantity | How much to order when triggered |

### Calculation

```
Available = On Hand - Hard Reserved

Available for Promising = On Hand - Hard Reserved - Soft Reserved + On Order
```

**Note:** Soft reservations don't reduce Available, but are tracked for visibility and demand planning.

---

## Two-Tier Reservation System

### Research Basis

Industry best practice uses soft and hard reservations to balance stock protection with flexibility:

- **Soft reservations** earmark stock without firm commitment, supporting longer B2B sales cycles
- **Hard reservations** are firm commitments that reduce available inventory
- Soft reservations automatically convert to hard when orders are confirmed

### Reservation Lifecycle

```
Quote Created
    ↓
Soft Reservation (linked to quote, expires with quote validity)
    ↓
Quote Accepted → Sales Order Created
    ↓
Soft Reservation converts to Hard Reservation
    ↓
Picking / Fulfillment
    ↓
Reservation Released (stock physically removed)
```

### Soft Reservation (Quote Stage)

| Attribute | Value |
|-----------|-------|
| Trigger | Quote created |
| Effect on Available | None (still shows as available) |
| Visibility | Shown separately for demand planning |
| Duration | Until quote expiry date |
| Auto-release | Quote expires, declined, or converted to order |

**Purpose:** Prevents overselling while not blocking stock unnecessarily during long B2B sales cycles.

### Hard Reservation (Order Stage)

| Attribute | Value |
|-----------|-------|
| Trigger | Sales Order confirmed |
| Effect on Available | REDUCES available quantity |
| Duration | Until fulfilled or cancelled |
| Release | When goods are picked/shipped |

**For finished goods:** Hard reserved immediately when Sales Order is created.

**For manufactured items:** 
1. Sales Order creates hard reservation for finished goods (even if not in stock)
2. Job Card creation triggers BOM explosion
3. Raw materials hard reserved based on BOM requirements

---

## BOM-Based Material Reservation

When a job card is created for manufacturing:

1. **System reads BOM** for the product being manufactured
2. **Calculates required materials** based on quantity to produce
3. **Hard reserves raw materials** from JHB inventory
4. **Checks availability:**
   - If sufficient stock → reserves and proceeds
   - If insufficient → flags shortage, may trigger reorder

### BOM Structure

```
BillOfMaterials
├── id
├── product_id (finished good)
├── version
├── effective_from
├── effective_to
├── status (Draft, Active, Obsolete)
├── created_at
└── updated_at

BOMItem
├── id
├── bom_id (FK)
├── component_product_id (FK) -- raw material or sub-assembly
├── quantity_per -- how many needed per 1 finished good
├── unit_of_measure
├── scrap_percentage -- expected waste allowance
├── notes
└── sort_order
```

### Material Requirement Calculation

```
Required Quantity = (Quantity to Produce × Quantity Per) × (1 + Scrap Percentage)

Example:
- Manufacturing 10 units
- BOM item: Steel Rod, 2 per unit, 5% scrap
- Required = (10 × 2) × 1.05 = 21 steel rods
```

---

## Automatic Reordering

### Trigger

When `Available` falls below `Minimum Level`, system auto-generates a Purchase Order draft.

### Process

1. **Check:** Available < Minimum Level
2. **Generate:** Draft PO with Reorder Quantity
3. **Notify:** Alert sent to Purchasing / Admin
4. **Review:** User reviews and can adjust
5. **Approve:** Admin (or Purchasing Manager role) approves
6. **Send:** PO sent to supplier

### Configuration

Per product:
- Minimum Level (reorder point)
- Reorder Quantity
- Preferred Supplier
- Lead Time (days)

---

## Purchase Order Tracking

### PO Lifecycle

| Status | Meaning |
|--------|---------|
| Draft | Auto-generated or manually created, awaiting approval |
| Approved | Approved, ready to send |
| Sent | Sent to supplier |
| Partially Received | Some items received |
| Received | All items received |
| Cancelled | PO cancelled |

### Partial Receipts

Support receiving goods in multiple deliveries:

```
PurchaseOrder
├── id
├── po_number
├── supplier_id
├── status
├── expected_delivery_date
├── approved_by
├── approved_at
├── sent_at
├── created_at
└── updated_at

PurchaseOrderLine
├── id
├── purchase_order_id (FK)
├── product_id (FK)
├── quantity_ordered
├── quantity_received (updated with each receipt)
├── unit_cost
├── line_total
└── notes

GoodsReceipt
├── id
├── purchase_order_id (FK)
├── received_at
├── received_by
├── location (JHB or CT)
├── notes
└── created_at

GoodsReceiptLine
├── id
├── goods_receipt_id (FK)
├── purchase_order_line_id (FK)
├── product_id (FK)
├── quantity_received
├── batch_number (optional)
├── serial_numbers[] (optional)
└── notes
```

### Stock Update on Receipt

When goods are received:
1. `On Hand` increases by received quantity
2. `On Order` decreases by received quantity
3. If PO line fully received, line status updates
4. If all lines received, PO status → Received

---

## Optional Tracking Features

Built in but optional per product. Enable as business grows.

### Batch/Lot Tracking

| Field | Description |
|-------|-------------|
| batch_tracking_enabled | Boolean on product |
| Batch Number | Assigned on receipt or manufacture |
| Expiry Date | Optional, for shelf-life items |
| Manufacture Date | Optional |

**Use cases:** Bearings, chemicals, items with shelf life

### Serial Number Tracking

| Field | Description |
|-------|-------------|
| serial_tracking_enabled | Boolean on product |
| Serial Number | Unique identifier per unit |

**Use cases:** Gearboxes, motors, high-value items requiring individual traceability

---

## Stock Movements

Track all inventory movements for audit trail:

```
StockMovement
├── id
├── product_id (FK)
├── location_id (FK)
├── movement_type (see below)
├── quantity (positive = in, negative = out)
├── reference_type (PurchaseOrder, SalesOrder, Transfer, Adjustment, JobCard)
├── reference_id
├── batch_number (optional)
├── serial_number (optional)
├── notes
├── created_by
└── created_at
```

### Movement Types

| Type | Direction | Trigger |
|------|-----------|---------|
| RECEIPT | In | Goods received from supplier |
| ISSUE | Out | Goods picked for sales order |
| TRANSFER_OUT | Out | Sent to another location |
| TRANSFER_IN | In | Received from another location |
| MANUFACTURE_IN | In | Finished goods from production |
| MANUFACTURE_OUT | Out | Raw materials consumed by production |
| ADJUSTMENT_IN | In | Manual stock correction (positive) |
| ADJUSTMENT_OUT | Out | Manual stock correction (negative) |
| SCRAP | Out | Damaged/scrapped goods |

---

## Inter-Location Transfers

For JHB → CT transfers (tied to Order Fulfillment workflow):

```
TransferRequest (from Order Fulfillment skill)
    ↓
Creates StockMovement TRANSFER_OUT at JHB
    ↓
Goods in transit
    ↓
Creates StockMovement TRANSFER_IN at CT
```

---

## Reservation Data Model

```
StockReservation
├── id
├── product_id (FK)
├── location_id (FK)
├── reservation_type (Soft, Hard)
├── quantity
├── reference_type (Quote, SalesOrder, JobCard)
├── reference_id
├── expires_at (for soft reservations)
├── created_at
├── created_by
├── released_at
└── released_by

```

### Reservation Rules

1. **Soft reservations** must have `expires_at` (from quote validity)
2. **Hard reservations** don't expire (released on fulfillment)
3. When quote converts to order, soft → hard reservation
4. When quote expires/declines, soft reservation auto-releases
5. When goods shipped, hard reservation releases

---

## Notifications

| Event | Notify |
|-------|--------|
| Stock below minimum | Purchasing / Admin |
| PO draft auto-generated | Purchasing / Admin |
| PO awaiting approval | Admin |
| Goods received | Purchasing |
| Soft reservation expiring (1 day before) | Sales person |
| Insufficient stock for job card | Production / Sales |

---

## Admin UI Requirements

### Stock Overview
- View stock levels per product per location
- Filter by location, category, low stock
- See Available, Reserved (soft/hard), On Order

### Product Stock Settings
- Set minimum level, reorder quantity
- Set preferred supplier
- Enable/disable batch tracking
- Enable/disable serial tracking

### Purchase Orders
- View PO list with status
- Create manual PO
- Approve draft POs
- Record goods receipt (full or partial)

### Stock Movements
- View movement history per product
- Filter by type, date, location
- Create manual adjustments with reason

### Reservations
- View active reservations
- See what's soft vs hard reserved
- Manual release (with reason)

### Reports
- Stock valuation report
- Stock movement report
- Low stock report
- Reservation report

---

## Related Skills

- **Order Fulfillment & Operations**: Picking slips consume reserved stock
- **Pricing & Product Domain**: Products and categories
- **Multi-Tenant Architecture**: Customer portal stock visibility
