# TASK-021: Stock Allocation Service — Implementation Plan

## Overview

Build a service that determines HOW to fulfill an order based on:
1. Customer's delivery warehouse (from `SalesOrder.warehouse`)
2. Stock availability across warehouses (JHB, CT)
3. Product type (assembly products always from JHB)

**Output**: An allocation plan (NOT document creation — that's TASK-022)

---

## Decisions Confirmed

1. **Assembly identification**: Use `ProductType` enum
   - `ASSEMBLY_REQUIRED` and `MADE_TO_ORDER` = must come from JHB
   - `STOCK_ONLY` and `KIT` = can come from any warehouse

2. **Service scope**: Plan only
   - Returns allocation plan
   - TASK-022 (orchestration engine) consumes plan to create documents

3. **CT spillover**: Transfer to CT
   - JHB picks → Transfer Request → CT dispatches to customer
   - CT is the customer-facing warehouse for CT customers

---

## Business Rules

### Allocation Logic

| Customer Warehouse | Product Type | Allocation |
|-------------------|--------------|------------|
| CT | STOCK_ONLY/KIT | Check CT first → spill to JHB |
| CT | ASSEMBLY_REQUIRED/MADE_TO_ORDER | JHB only |
| JHB | Any | JHB only |
| (Mbombela ships from JHB) | Any | JHB only |

### Available Stock Formula
```
available = onHand - hardReserved
```
(Soft reservations don't reduce available)

### Spillover Behavior (CT customers)
1. Try to fulfill from CT stock first
2. If CT has partial stock → allocate what CT has
3. Remainder allocated to JHB (will be transferred to CT)
4. If neither warehouse has stock → backorder

---

## Interface Design

```typescript
// Input: What we're trying to allocate
interface AllocationRequest {
  productId: string;
  quantity: number;
}

// Output: Where each quantity comes from
interface AllocationLine {
  productId: string;
  warehouse: Warehouse;
  quantityAllocated: number;
  requiresTransfer: boolean; // True if JHB → CT transfer needed
}

interface BackorderLine {
  productId: string;
  quantityBackorder: number;
}

interface AllocationPlan {
  orderId?: string;
  customerWarehouse: Warehouse;
  allocations: AllocationLine[];
  backorders: BackorderLine[];
  summary: {
    totalRequested: number;
    totalAllocated: number;
    totalBackorder: number;
    canFulfillCompletely: boolean;
  };
}

// Main service functions
async function checkProductAvailability(
  productId: string,
  quantity: number,
  customerWarehouse: Warehouse
): Promise<AllocationPlan>

async function allocateForOrder(
  orderId: string
): Promise<AllocationPlan>
```

---

## Micro-Tasks

### MT-1: Create allocation service file with types
- Create `backend/src/services/allocation.service.ts`
- Define interfaces: `AllocationRequest`, `AllocationLine`, `BackorderLine`, `AllocationPlan`
- Export helper function to identify assembly products

### MT-2: Implement single-product allocation function
- `checkProductAvailability(productId, quantity, customerWarehouse)`
- Query `StockLevel` for product at both warehouses
- Apply allocation logic based on customer warehouse and product type
- Return allocation plan for single product

### MT-3: Implement order allocation function
- `allocateForOrder(orderId)`
- Load order with lines and products (including productType)
- Call `checkProductAvailability` for each line
- Aggregate into single `AllocationPlan`

### MT-4: Add API endpoint for allocation check
- `GET /api/v1/orders/:id/allocation-plan`
- Returns allocation plan (preview, doesn't reserve)
- Used by orchestration engine and UI

### MT-5: Write unit tests
- Test CT customer with CT stock available
- Test CT customer with spillover to JHB
- Test JHB customer (JHB only)
- Test assembly product (always JHB)
- Test insufficient stock (backorder)

---

## Files to Create/Modify

```
backend/
├── src/
│   ├── services/
│   │   └── allocation.service.ts     # NEW - Main service
│   └── routes/
│       └── orders.ts                 # MODIFY - Add allocation endpoint
└── tests/
    └── unit/
        └── allocation.service.test.ts # NEW - Unit tests
```

---

## Key Dependencies

### Existing Code to Use
- `prisma.stockLevel.findUnique({ where: { productId_location } })` — get stock by warehouse
- `StockLevel` model fields: `onHand`, `hardReserved`
- `Product` model field: `productType`
- `SalesOrder` model field: `warehouse` (customer's delivery location)

### Related Models
```prisma
// From Product
productType: ProductType  // STOCK_ONLY | ASSEMBLY_REQUIRED | MADE_TO_ORDER | KIT

// From SalesOrder
warehouse: Warehouse  // JHB | CT (delivery/fulfillment location)

// From StockLevel
onHand: Int
hardReserved: Int
// available = onHand - hardReserved
```

---

## Verification Plan

1. **Unit tests**: Run `npm run test:unit -- allocation`
2. **Manual API test**:
   - Create a sales order for a CT customer
   - Call `GET /api/v1/orders/:id/allocation-plan`
   - Verify CT stock checked first, spillover to JHB works
3. **Edge cases to test**:
   - CT customer, all stock in CT → no transfer needed
   - CT customer, partial CT stock → split allocation
   - CT customer, no CT stock → all from JHB with transfer
   - CT customer, assembly product → JHB only (ignores CT stock)
   - JHB customer → JHB only (ignores CT stock)
   - Insufficient total stock → backorder created

---

## Example Allocation Scenarios

### Scenario 1: CT Customer, Stock in CT
```
Order: 10 units of STOCK_ONLY product
CT has: 10 available
JHB has: 50 available

Result:
- allocations: [{ warehouse: CT, qty: 10, requiresTransfer: false }]
- backorders: []
```

### Scenario 2: CT Customer, Spillover
```
Order: 10 units of STOCK_ONLY product
CT has: 3 available
JHB has: 50 available

Result:
- allocations: [
    { warehouse: CT, qty: 3, requiresTransfer: false },
    { warehouse: JHB, qty: 7, requiresTransfer: true }
  ]
- backorders: []
```

### Scenario 3: CT Customer, Assembly Product
```
Order: 5 units of ASSEMBLY_REQUIRED product
CT has: 10 available (ignored — assembly)
JHB has: 8 available

Result:
- allocations: [{ warehouse: JHB, qty: 5, requiresTransfer: true }]
- backorders: []
```

### Scenario 4: Insufficient Stock
```
Order: 20 units
CT has: 3 available
JHB has: 10 available

Result:
- allocations: [
    { warehouse: CT, qty: 3, requiresTransfer: false },
    { warehouse: JHB, qty: 10, requiresTransfer: true }
  ]
- backorders: [{ productId, quantityBackorder: 7 }]
```

---

## Status: READY FOR APPROVAL
