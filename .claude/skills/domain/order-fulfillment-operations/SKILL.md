# Order Fulfillment & Operations Skill

## Overview

This skill defines Nusaf's order fulfillment workflow across multiple locations, including picking slips, job cards, inter-branch transfers, and document archival.

---

## Locations

| Location | Warehouse | Machining/Assembly | Sales Office |
|----------|-----------|-------------------|--------------|
| Johannesburg (JHB) | ✓ (main) | ✓ | ✓ |
| Cape Town (CT) | ✓ (finished goods only) | ✗ | ✓ |
| Mbombela | ✗ | ✗ | ✓ |

**Key rules:**
- All manufacturing and assembly happens in JHB only
- CT warehouse only carries finished goods ready for sale
- Mbombela orders always fulfilled from JHB

---

## Document Types

### Permanent Records
| Document | Purpose |
|----------|---------|
| Quote | What was quoted to customer |
| Customer PO | Customer's purchase order |
| Job Card | Manufacturing/assembly record |
| Invoice | Final billing document |
| Signed Delivery Note | Proof of delivery (scanned upload) |

### Working Documents
| Document | Purpose | Lifecycle |
|----------|---------|-----------|
| Sales Order | Bridges Quote to Invoice | Deleted after invoicing |
| Picking Slip | Warehouse picking instruction | Per location, working document |

---

## Document Flow

```
Quote
  ↓ (customer accepts)
Customer PO received
  ↓
Sales Order created
  ↓
Picking Slips generated (per location)
  ↓
Job Cards created (if manufacturing needed)
  ↓
Transfer Request (if JHB→CT needed)
  ↓
Invoice
  ↓
Dispatch / Ready for Collection
  ↓
Signed Delivery Note uploaded
  ↓
Archive folder created
  ↓
Sales Order deleted
```

---

## Fulfillment Flows

### 1. JHB Customer

| Step | Action | Document |
|------|--------|----------|
| 1 | Sales Order created | Sales Order |
| 2 | Picking slip generated | Picking Slip - JHB |
| 3 | Job cards created (if needed) | Job Card(s) |
| 4 | Pick and manufacture | - |
| 5 | Invoice customer | Invoice |
| 6 | Dispatch from JHB | Delivery Note |

### 2. Mbombela Customer

| Step | Action | Document |
|------|--------|----------|
| 1 | Sales Order created | Sales Order |
| 2 | Picking slip generated | Picking Slip - JHB |
| 3 | Job cards created (if needed) | Job Card(s) |
| 4 | Pick and manufacture | - |
| 5 | Invoice customer | Invoice |
| 6 | Dispatch from JHB to Mbombela | Delivery Note |

### 3. CT Customer

| Step | Action | Document |
|------|--------|----------|
| 1 | Sales Order created | Sales Order |
| 2 | Check CT stock availability | - |
| 3a | If CT has all stock | Picking Slip - CT only |
| 3b | If partial/none in CT | Picking Slip - CT + Picking Slip - JHB |
| 4 | Job cards created (if needed) | Job Card(s) - always JHB |
| 5 | JHB picks and manufactures | - |
| 6 | JHB ships to CT | Transfer Request |
| 7 | CT receives and consolidates | - |
| 8 | Invoice customer | Invoice |
| 9 | Dispatch from CT | Delivery Note |

---

## Stock Allocation Logic

**For CT customers:**
1. Check CT warehouse stock first
2. If CT has full stock → fulfill from CT only
3. If CT has partial stock → split between CT and JHB
4. If CT has no stock → fulfill from JHB with transfer to CT

**Decision points (manual per order):**
- Partial fulfillment vs wait for consolidation
- Based on customer urgency and customer request

**Default behavior:** Wait until all items consolidated, then ship together

---

## Document Statuses

### Picking Slip

| Status | Meaning |
|--------|---------|
| Pending | Created, waiting to be picked |
| In Progress | Someone is actively picking |
| Complete | All items picked and packed |

### Job Card

| Status | Meaning |
|--------|---------|
| Pending | Created, waiting to start |
| In Progress | Manufacturing/assembly underway |
| Complete | Finished, ready for picking slip |
| On Hold | Blocked (waiting for materials, etc.) |

### Transfer Request

| Status | Meaning |
|--------|---------|
| Pending | Waiting to be shipped |
| In Transit | Shipped, on the way to CT |
| Received | CT confirmed receipt |

---

## Document Structure

### Sales Order

Generated when quote is accepted and customer PO is received.

```
SalesOrder
├── id
├── order_number
├── quote_id (FK)
├── customer_id (FK)
├── customer_po_reference
├── customer_po_document (file reference)
├── delivery_location (JHB, CT, Mbombela)
├── delivery_address
├── partial_fulfillment_allowed (boolean, default false)
├── notes
├── created_at
├── created_by (sales person)
└── line_items[]
    ├── product_id
    ├── quantity
    ├── unit_price
    └── line_total
```

### Picking Slip

One per warehouse location per sales order.

```
PickingSlip
├── id
├── picking_slip_number
├── sales_order_id (FK)
├── location (JHB, CT)
├── status (Pending, In Progress, Complete)
├── assigned_to (warehouse staff)
├── started_at
├── completed_at
├── created_at
└── line_items[]
    ├── sales_order_line_id (FK)
    ├── product_id
    ├── quantity_to_pick
    ├── quantity_picked
    └── picked_at
```

### Job Card

For manufacturing/assembly, linked to picking slip.

```
JobCard
├── id
├── job_card_number
├── picking_slip_id (FK)
├── picking_slip_line_id (FK)
├── product_id
├── quantity
├── job_type (Machining, Assembly)
├── status (Pending, In Progress, Complete, On Hold)
├── hold_reason (if On Hold)
├── assigned_to
├── started_at
├── completed_at
├── notes
├── created_at
└── created_by
```

### Transfer Request

For JHB→CT movements.

```
TransferRequest
├── id
├── transfer_number
├── sales_order_id (FK)
├── from_location (always JHB)
├── to_location (always CT)
├── status (Pending, In Transit, Received)
├── shipped_at
├── shipped_by
├── received_at
├── received_by
├── created_at
└── line_items[]
    ├── picking_slip_line_id (FK)
    ├── product_id
    ├── quantity
    └── received_quantity
```

---

## Issue/Delay Flagging

Warehouse staff can manually flag issues on picking slips or job cards.

```
IssueFlag
├── id
├── document_type (PickingSlip, JobCard)
├── document_id
├── reason
├── flagged_by
├── flagged_at
├── resolved_at
├── resolved_by
└── resolution_notes
```

When an issue is flagged, the sales person receives an in-system notification.

---

## Notifications

### To Customer (Email)

| Trigger | Notification |
|---------|--------------|
| Sales Order created | "Your order has been accepted" + Sales Order PDF attached |
| Order dispatched | "Your order has been dispatched" |
| Ready for collection | "Your order is ready for collection" |

### To Sales Person (In-System)

| Trigger | Notification |
|---------|--------------|
| Picking slip starts | "Goods being picked for [Order]" |
| Job card starts | "Machining/assembly started for [Order]" |
| Job card complete | "Machining/assembly complete for [Order]" |
| Transfer shipped | "Goods in transit to CT for [Order]" |
| Transfer received | "Goods received in CT for [Order]" |
| Ready to invoice | "Order ready for invoicing" |
| Issue flagged | "Issue on [Order]: [reason]" |

---

## Document Archive

After invoicing, all permanent documents are archived to Cloudflare R2.

### Storage Structure

```
R2 Bucket: nusaf-documents

/invoices/
  /INV-2025-00123/
    ├── quote.pdf
    ├── customer-po.pdf
    ├── job-card-001.pdf
    ├── job-card-002.pdf (if multiple)
    ├── invoice.pdf
    └── signed-delivery-note.pdf
```

### Archive Process

1. Invoice is generated
2. System automatically collects:
   - Quote (from quote_id)
   - Customer PO (from sales order)
   - All related Job Cards
   - Invoice
3. Folder created using invoice number
4. Documents uploaded to R2
5. Signed Delivery Note uploaded manually (scanned) after delivery
6. Sales Order deleted from working documents

### Signed Delivery Note Upload

- Paper signed by customer on delivery
- Scanned and uploaded by staff
- System validates it's linked to correct invoice
- Stored in archive folder

---

## Database Implications

### Core Entities

```
SalesOrder (working - soft delete after archive)
├── id
├── order_number
├── quote_id (FK)
├── customer_id (FK)
├── customer_po_reference
├── customer_po_document_url
├── delivery_location
├── partial_fulfillment_allowed
├── archived_at (when invoiced and archived)
├── created_at
├── created_by
└── updated_at

PickingSlip
├── id
├── picking_slip_number
├── sales_order_id (FK)
├── location
├── status
├── assigned_to
├── started_at
├── completed_at
├── created_at
└── updated_at

PickingSlipLine
├── id
├── picking_slip_id (FK)
├── sales_order_line_id (FK)
├── product_id (FK)
├── quantity_to_pick
├── quantity_picked
└── picked_at

JobCard
├── id
├── job_card_number
├── picking_slip_id (FK)
├── picking_slip_line_id (FK)
├── product_id (FK)
├── quantity
├── job_type
├── status
├── hold_reason
├── assigned_to
├── started_at
├── completed_at
├── notes
├── created_at
└── updated_at

TransferRequest
├── id
├── transfer_number
├── sales_order_id (FK)
├── from_location
├── to_location
├── status
├── shipped_at
├── shipped_by
├── received_at
├── received_by
├── created_at
└── updated_at

TransferRequestLine
├── id
├── transfer_request_id (FK)
├── picking_slip_line_id (FK)
├── product_id (FK)
├── quantity
└── received_quantity

IssueFlag
├── id
├── document_type
├── document_id
├── reason
├── flagged_by
├── flagged_at
├── resolved_at
├── resolved_by
└── resolution_notes

DocumentArchive
├── id
├── invoice_id (FK)
├── invoice_number
├── r2_folder_path
├── quote_url
├── customer_po_url
├── invoice_url
├── signed_delivery_note_url
├── archived_at
└── archived_by

JobCardArchive (link table)
├── id
├── document_archive_id (FK)
├── job_card_id (FK)
└── job_card_url
```

### Indexes

- `sales_order.order_number` (unique)
- `sales_order.quote_id`
- `sales_order.customer_id`
- `picking_slip.sales_order_id`
- `picking_slip.location, status`
- `job_card.picking_slip_id`
- `job_card.status`
- `transfer_request.sales_order_id`
- `transfer_request.status`
- `document_archive.invoice_number` (unique)

---

## Admin UI Requirements

### Sales Person View
- My orders with status
- Notifications feed
- Create sales order from accepted quote

### Warehouse View (JHB)
- Picking slips assigned to me
- Job cards assigned to me
- Mark picking slip status
- Mark job card status
- Flag issues
- Create transfer request

### Warehouse View (CT)
- Picking slips for CT location
- Incoming transfers
- Receive transfer confirmation
- Flag issues

### Invoice View
- Orders ready to invoice
- Generate invoice
- Trigger archive process

### Archive View
- Search by invoice number
- View/download archived documents
- Upload signed delivery note

---

## Related Skills

- **Pricing & Product Domain**: Product and pricing information for order lines
- **Foundation Skills**: Database design, API patterns, notifications
- **Future**: Inventory Management (stock levels that feed into allocation)
