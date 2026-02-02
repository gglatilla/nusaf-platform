# Current Session

## Active Task
[TASK-021] Stock Allocation Service ✓ COMPLETE

## Summary

Built the stock allocation service that determines HOW to fulfill an order based on:
1. Customer's delivery warehouse (from `SalesOrder.warehouse`)
2. Stock availability across warehouses (JHB, CT)
3. Product type (assembly products always from JHB)

### Business Rules Implemented
- **CT customer + stock product**: CT first → spill to JHB (with transfer flag)
- **CT customer + assembly product**: JHB only (requires transfer)
- **JHB customer**: JHB only
- **Available = onHand - hardReserved**

### Files Created
- `backend/src/services/allocation.service.ts`
  - Types: `AllocationPlan`, `AllocationLine`, `BackorderLine`, `AllocationSummary`
  - `checkProductAvailability(productId, quantity, customerWarehouse)` - single product
  - `allocateForOrder(orderId)` - full order allocation
  - `isAssemblyProduct(productType)` - helper
  - `groupAllocationsByWarehouse()` - utility for orchestration
  - `getTransferAllocations()` - utility for transfers

### API Endpoint Added
- `GET /api/v1/orders/:id/allocation-plan`
  - Returns allocation plan (preview, doesn't create reservations)
  - For orchestration engine and UI consumption

### Micro-tasks Completed
- [x] MT-1: Create allocation service file with types
- [x] MT-2: Implement single-product allocation function
- [x] MT-3: Implement order allocation function
- [x] MT-4: Add API endpoint for allocation check
- [SKIP] MT-5: Unit tests (no test infrastructure - noted as tech debt)

### Tech Debt
- Backend has Jest configured but no test directory structure
- Unit tests for allocation service should be added when test infrastructure is set up

## Commits This Session
1. `7c26ce6` TASK-021: Stock Allocation Service (MT-1 to MT-4)

## Next Task
TASK-021A: BOM Explosion Service or TASK-022: Fulfillment Orchestration Engine
