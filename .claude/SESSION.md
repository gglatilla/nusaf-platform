# Current Session

## Active Task
[TASK-019] BOM Schema & API [Master Data, Backend]

## Status
COMPLETE | 100%

## Micro-tasks
- [x] MT-1: Add BomItem model to schema.prisma with Product relations
- [x] MT-2: Create and run migration
- [x] MT-3: Create Zod validation schemas for BOM operations
- [x] MT-4: Implement `getBom()` function
- [x] MT-5: Implement `addBomComponent()`
- [x] MT-6: Implement `updateBomComponent()`
- [x] MT-7: Implement `removeBomComponent()`
- [x] MT-8: Implement `validateBomCircular()`
- [x] MT-9: Wire circular validation into addBomComponent
- [x] MT-10: Implement `explodeBom()` - recursive
- [x] MT-11: Implement `checkBomStock()`
- [x] MT-12: Implement `getWhereUsed()` and `copyBom()`
- [x] MT-13: Add GET `/products/:id/bom` endpoint
- [x] MT-14: Add POST `/products/:id/bom` endpoint
- [x] MT-15: Add PATCH/DELETE `/products/:id/bom/:componentId`
- [x] MT-16: Add GET `/products/:id/bom/stock-check`
- [x] MT-17: Add GET `/products/:id/where-used`, POST `copy-from`
- [x] MT-18: Final commit and push

## Decisions Made
- No BOM versioning (simple model, edits in place)
- Recursive BOM explosion (components can have their own BOMs)
- Optional items excluded from stock fulfillment check (listed but don't affect canFulfill)
- BFS algorithm for circular reference detection

## Files Modified
### Backend
- backend/prisma/schema.prisma (added BomItem model, Product relations)
- backend/prisma/migrations/20260201140000_add_bom_items/migration.sql (created)
- backend/src/utils/validation/bom.ts (created - Zod schemas)
- backend/src/services/bom.service.ts (created - all BOM functions)
- backend/src/api/v1/products/route.ts (added BOM endpoints)

## API Endpoints Implemented
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/products/:id/bom` | Get BOM tree | All authenticated |
| POST | `/products/:id/bom` | Add component | ADMIN |
| PATCH | `/products/:id/bom/:componentId` | Update component | ADMIN |
| DELETE | `/products/:id/bom/:componentId` | Remove component | ADMIN |
| GET | `/products/:id/bom/stock-check` | Check stock | All authenticated |
| GET | `/products/:id/where-used` | Reverse lookup | All authenticated |
| POST | `/products/:id/bom/copy-from/:sourceId` | Copy BOM | ADMIN |

## Next Steps
TASK-019 is complete. Ready for next task (TASK-019A: BOM UI).

## Context for Next Session
Completed TASK-019: BOM Schema & API. The backend now supports:
- Bill of Materials with parent/component product relationships
- Recursive BOM explosion (components can have their own BOMs)
- Circular reference prevention (BFS validation)
- Stock availability checking for all components
- Where-used lookup (which products use this component)
- Copy BOM between products

The BOM UI (TASK-019A) should implement:
- BOM tab on product detail/edit page
- Component picker modal
- Quantity editing
- Where-used view
- Copy BOM UI
