# TASK-013B: Product Page Inventory Tab

## Context

Read `docs/specs/inventory-unified-model-spec.md` for architectural background.

**Core principle**: A product IS an inventory item. TASK-013A added `?include=inventory` and `?include=inventory,movements` to the product API. This task builds the frontend to display that data.

**Task lineage**:
- TASK-013 — Inventory tracking backend (complete)
- TASK-013A — Unified Product-Inventory API (complete — `?include=inventory,movements`, stock status, nested routes)
- **TASK-013B** — Product page Inventory tab (this task — frontend)
- TASK-013C — Product list stock badges (future)
- TASK-013D — Inventory operations dashboard (future)

---

## What This Task Covers

TASK-013B is **frontend only**. All API endpoints already exist from TASK-013A. This task adds an Inventory tab to the product detail view.

### Prerequisite: Primary Warehouse Assignment

The Available-First inventory display needs to know which warehouse is relevant to the current user. This requires a small backend addition before or alongside this task:

**Database changes needed:**
```prisma
model User {
  // ... existing fields
  primaryWarehouseId  String?   @map("primary_warehouse_id")
  primaryWarehouse    Warehouse? @relation(fields: [primaryWarehouseId], references: [id])
}

model Customer {
  // ... existing fields
  primaryWarehouseId  String?   @map("primary_warehouse_id")
  primaryWarehouse    Warehouse? @relation(fields: [primaryWarehouseId], references: [id])
}
```

**Why both User AND Customer need this:**
- **User.primaryWarehouseId** → Controls what the logged-in user sees on the Inventory tab. A CT sales rep sees CT stock as the hero metric. An admin might have no primary warehouse (sees totals).
- **Customer.primaryWarehouseId** → Controls fulfillment routing. When a CT customer's order comes in, the system checks CT stock first, then spills over to JHB with auto-generated picking slips / job cards / transfer requests. This is the trigger for the "Local First, JHB Backup" fulfillment logic.

**API changes needed:**
- The current user's `primaryWarehouseId` should be available in the auth/session context (it probably already loads User data — just include this field)
- Admin UI: add a "Primary Warehouse" dropdown to user management and customer management forms (can be a follow-up task if needed, for now seed via database)

**If this prerequisite is not yet implemented when building the frontend:**
- Fall back gracefully: show totals across all warehouses (the combined view)
- Add a TODO comment where the primary warehouse filtering would go
- The component should check `if (currentUser.primaryWarehouseId)` and adapt

---

## Step 1: Explore What Exists

Before building anything, explore:
1. The current product detail component — is it a modal (`ProductDetailModal`) or a page (`/products/[id]`)? What's the current layout?
2. What tab system exists (if any) — does the product detail already have tabs?
3. What UI component library is in use — are there existing Tab, Badge, Table, Modal components?
4. How does the frontend currently call the product API — check `lib/api.ts` and any React Query hooks

Adapt the implementation below to fit whatever currently exists. Do NOT rebuild the product detail from scratch.

---

## Step 2: Add Inventory Tab to Product Detail

### If the product detail is currently a MODAL:

The modal may be too small for inventory data. Consider one of these approaches:
- **Option A**: Convert the modal to a full page at `/products/[id]` with tabs (Details, Inventory). The product list can still link to this page.
- **Option B**: Keep the modal but add a "View Full Details" link that goes to a full page with tabs.
- **Option C**: Add a simple inventory summary section to the modal (not a full tab) — just stock status badge and total available, with a link to the full page for more detail.

Use your judgment on what fits the current UI best. If converting to a full page is too disruptive, go with Option C for now.

### If the product detail is already a PAGE:

Add an "Inventory" tab alongside any existing tabs. If there are no tabs yet, create a tab system with at least "Details" (existing content) and "Inventory" (new).

---

## Step 3: Inventory Tab Content

### API Call

When the Inventory tab is selected (or on page load if inventory is always visible), call:
```
GET /api/v1/products/:id?include=inventory,movements&movementLimit=20
```

Use React Query for caching. Only fetch inventory data when the tab is active (lazy loading) unless the tab system doesn't support this, in which case fetch on page load.

### 3A: Stock Overview Section — Available-First, Warehouse-Aware Design

> **CRITICAL UX PRINCIPLE**: "Available to Sell" is the ONLY number that matters for
> sales decisions. "On Hand" includes stock already reserved for other orders and is
> NOT what can be promised to a new customer. This is a well-documented source of
> human error in ERP systems — sales staff under pressure glance at the first/biggest
> number, assume it's what they can sell, and oversell. Every major ERP (NetSuite,
> Odoo, Dynamics 365) has learned this the hard way.
>
> The fix: Make "Available to Sell" the visually dominant hero metric. Demote
> "On Hand" to a secondary, smaller, clearly-labelled supporting detail.
>
> **SECOND CRITICAL PRINCIPLE**: A combined "Available: 120" across all warehouses
> is just as misleading as showing On Hand first — if 80 of those units are in JHB
> and the CT rep can't ship them today. The hero metric must show the user's
> PRIMARY WAREHOUSE stock. Other warehouses are secondary context ("also available
> via transfer").

The display adapts based on whether the current user has a `primaryWarehouseId` set:

#### Scenario A: User HAS a primary warehouse (most sales staff)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Stock Overview                                           [IN STOCK 🟢] │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                                                                    │  │
│  │        ✅  AVAILABLE TO SELL at Cape Town                          │  │
│  │                       40                                           │  │
│  │        This is what you can promise for immediate fulfillment      │  │
│  │                                                                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐             │
│  │  On Hand (CT)  │  │  Reserved (CT) │  │  On Order (CT) │             │
│  │  50            │  │  10            │  │  20            │             │
│  │  total in      │  │  committed to  │  │  incoming from │             │
│  │  warehouse     │  │  other orders  │  │  suppliers     │             │
│  └────────────────┘  └────────────────┘  └────────────────┘             │
│                                                                          │
│  Available to Sell = On Hand (50) − Reserved (10) = 40                   │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  📦 Also available at other warehouses:                            │  │
│  │  Johannesburg: 80 available  ·  (fulfilled via transfer request)   │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Scenario B: User has NO primary warehouse (admins, or not yet configured)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Stock Overview                                           [IN STOCK 🟢] │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                                                                    │  │
│  │        ✅  AVAILABLE TO SELL (all warehouses)                      │  │
│  │                       120                                          │  │
│  │        Total across all locations                                  │  │
│  │                                                                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐             │
│  │  On Hand       │  │  Reserved      │  │  On Order      │             │
│  │  150           │  │  30            │  │  50            │             │
│  │  total in all  │  │  committed to  │  │  incoming from │             │
│  │  warehouses    │  │  other orders  │  │  suppliers     │             │
│  └────────────────┘  └────────────────┘  └────────────────┘             │
│                                                                          │
│  Available to Sell = On Hand (150) − Reserved (30) = 120                 │
└──────────────────────────────────────────────────────────────────────────┘
```

**Layout rules:**

1. **Hero card (Available to Sell)** — Full width, visually prominent:
   - Large font for the number (2x–3x the size of secondary metrics)
   - Accent/brand color border or background tint (e.g. green-50 bg with green-600 border)
   - **Subtitle changes based on context:**
     - With primary warehouse: "Available to Sell **at Cape Town**" + "This is what you can promise for immediate fulfillment"
     - Without primary warehouse: "Available to Sell **(all warehouses)**" + "Total across all locations"
   - The stock status badge (🟢 In Stock, etc.) sits in the top-right of the overview section

2. **Supporting cards (On Hand, Reserved, On Order)** — Smaller row below:
   - Show numbers for the user's primary warehouse only (or all warehouses if no primary set)
   - Label each card with the warehouse name: "On Hand (CT)" not just "On Hand"
   - Neutral/gray styling — visually subordinate, NOT competing for attention
   - Each card includes a micro-label explaining what it means:
     - On Hand → "total in warehouse"
     - Reserved → "committed to other orders"
     - On Order → "incoming from suppliers"

3. **Formula bar** — Below the cards, a single line showing the math:
   - "Available to Sell = On Hand (50) − Reserved (10) = 40"
   - Small text, muted color — builds trust and teaches the distinction over time

4. **"Also available" bar** (only when user has a primary warehouse):
   - Light info-style card below the formula bar
   - Lists other warehouses and their available quantity
   - Includes a note like "fulfilled via transfer request" to set expectations
   - This answers: "I can't fulfill from CT, but can I get it from JHB?"
   - If other warehouses also have 0 available, show: "No additional stock at other warehouses"

**How to compute the hero number:**
```javascript
// Pseudo-code for the frontend
const user = useCurrentUser(); // includes primaryWarehouseId

if (user.primaryWarehouseId && product.inventory.byLocation) {
  // Find the user's warehouse in the breakdown
  const myWarehouse = product.inventory.byLocation.find(
    loc => loc.warehouseId === user.primaryWarehouseId
  );
  const otherWarehouses = product.inventory.byLocation.filter(
    loc => loc.warehouseId !== user.primaryWarehouseId
  );

  heroNumber = myWarehouse?.available ?? 0;
  heroLabel = `Available to Sell at ${myWarehouse?.warehouseName ?? 'your warehouse'}`;
  onHand = myWarehouse?.onHand ?? 0;
  reserved = (myWarehouse?.softReserved ?? 0) + (myWarehouse?.hardReserved ?? 0);
  onOrder = myWarehouse?.onOrder ?? 0;
  
  // "Also available" section
  alsoAvailable = otherWarehouses.map(w => ({
    name: w.warehouseName,
    available: w.available
  }));
} else {
  // No primary warehouse — show totals
  heroNumber = product.inventory.available;      // total across all
  heroLabel = 'Available to Sell (all warehouses)';
  onHand = product.inventory.onHand;
  reserved = product.inventory.reserved;
  onOrder = product.inventory.onOrder;
  alsoAvailable = null; // not needed
}
```

**Role-based emphasis:**
- For SALES role: The hero card shows their primary warehouse. The "also available"
  bar helps them answer "can I get it from JHB?" without confusing the numbers.
  Consider hiding the formula bar for less noise.
- For ADMIN/MANAGER roles: May not have a primary warehouse — sees totals.
  Show everything including the formula bar. If they DO have a primary warehouse,
  still show the warehouse-specific view but with full detail.
- For CUSTOMER role: Show a simplified, customer-friendly stock view. No operational
  details (no On Hand, no Reserved, no formula bar, no movements, no settings).
  Customers see:
  1. **Their primary warehouse stock** as the hero — with "Available for immediate
     dispatch" messaging and a stock status badge
  2. **Other warehouse stock** shown below as a secondary option with delivery
     lead time, e.g. "Also available from Johannesburg: 80 units · Est. 2–4 working days"
  This gives customers the full picture: "I can get 40 today from CT, plus 80 more
  from JHB if I'm willing to wait a few days." In B2B this is critical information
  that closes sales rather than losing them to uncertainty.
  If no customer warehouse is set, show the total available across all locations.

**Customer View Layout:**

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                           [IN STOCK 🟢] │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                                                                    │  │
│  │        ✅  40 Available                                            │  │
│  │        Ready for immediate dispatch                                │  │
│  │                                                                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  📦  Also available from Johannesburg:  80 units                   │  │
│  │      Estimated delivery: 2–4 working days                          │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

Notes on the customer view:
- Hero says "Available" not "Available to Sell" — friendlier language for customers
- "Ready for immediate dispatch" not "This is what you can promise" — customer framing
- The "also available" bar uses warm language: "Also available from Johannesburg"
  with a clear delivery estimate rather than operational language about transfers
- Customers do NOT see warehouse names for their primary — just "Available" (they
  don't need to know which warehouse it ships from, just that it's quick)
- If the primary warehouse has 0 available but JHB has stock, the hero should
  show "0 Available for immediate dispatch" (not hide the section) and the JHB
  bar becomes the main actionable info
- If ALL warehouses have 0 available, show the OUT_OF_STOCK badge and a
  message like "Currently out of stock — contact us for estimated availability"

**Stock Status Badge Colors:**
| Status | Color | Label |
|--------|-------|-------|
| IN_STOCK | Green | In Stock |
| LOW_STOCK | Amber/Yellow | Low Stock |
| OUT_OF_STOCK | Red | Out of Stock |
| ON_ORDER | Blue | On Order |
| OVERSTOCK | Orange | Overstock |

Use the `stockStatus` value from the API response — don't recompute it on the frontend.
Note: when showing a single warehouse view, the stock status should ideally reflect
that warehouse's status specifically. The `byLocation` array from TASK-013A includes
per-location `stockStatus`.

### 3B: Per-Warehouse Breakdown Table

Below the summary cards, show a table with stock per location. **Available column comes FIRST** (after warehouse name), On Hand is secondary. **User's primary warehouse row is highlighted:**

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  Stock by Warehouse                                                                  │
│                                                                                      │
│  Warehouse      │ Available │ On Hand │ Reserved │ On Order │ Reorder Pt │ Status    │
│  ════════════════╪═══════════╪═════════╪══════════╪══════════╪════════════╪══════════ │
│▸ Cape Town  ★   │    ⚠️ 40  │     50  │       10 │       20 │        10  │ 🟡 Low    │ ← highlighted
│  ────────────────┼───────────┼─────────┼──────────┼──────────┼────────────┼────────── │
│  Johannesburg   │    ✅ 80  │    100  │       20 │       30 │        25  │ 🟢 In Stock│
└──────────────────────────────────────────────────────────────────────────────────────┘
```

**Key differences from a flat table:**

1. **User's primary warehouse sorts to the top** and gets a visual highlight:
   - Subtle background tint (e.g. blue-50 or brand-50)
   - A ★ icon or "Your warehouse" label
   - Slightly bolder row styling
   - This reinforces: "this is YOUR stock"

2. **Other warehouses appear below** in alphabetical order, standard styling

3. **If user has no primary warehouse**: No highlighting, standard alphabetical sort

**Column order matters** — Available is the first data column because it's the actionable number:

1. **Warehouse**: `warehouseName` from byLocation — with ★ indicator for user's primary
2. **Available**: `available` (= onHand − softReserved − hardReserved) — **bold text**, with a small status icon (✅ normal, ⚠️ low, ❌ zero)
3. **On Hand**: `onHand` — normal weight, muted/gray text to visually subordinate it
4. **Reserved**: Sum of `softReserved + hardReserved`. Tooltip on hover: "Soft: X, Hard: Y"
5. **On Order**: `onOrder`
6. **Reorder Point**: `reorderPoint` (show "—" if null)
7. **Status**: `stockStatus` per location with colored badge

**Visual treatment:**
- Available column: bold text, slightly larger or with colored background for the cell
- On Hand column: regular weight, slightly muted (text-gray-500 vs text-gray-900)
- This subtle difference reinforces that Available is the number to look at

If `byLocation` is an empty array (product has no stock records), show a clean empty state:
```
No stock records yet. Stock will appear here once inventory is received.
```

### 3C: Adjust Stock Button + Modal

Below the warehouse table (or in the top right near the status badge), add an "Adjust Stock" button.

**Button visibility**: Only show for users with ADMIN or MANAGER roles. Regular customers should NOT see this.

Clicking opens a modal:

```
┌─────────────────────────────────────────────┐
│  Adjust Stock                          [X]  │
│                                             │
│  Product: Tecom Levelling Foot M10x80mm     │
│  SKU: TEC-LF-M10-080                       │
│                                             │
│  Warehouse *        [JHB ▾]                 │
│                                             │
│  Adjustment Type *  [Add Stock ▾]           │
│                     - Add Stock             │
│                     - Remove Stock          │
│                     - Set Quantity           │
│                                             │
│  Quantity *         [____]                  │
│                                             │
│  Reason *           [____________________]  │
│                     [____________________]  │
│                                             │
│  Note: This creates a PENDING adjustment    │
│  that requires approval before stock        │
│  levels are updated.                        │
│                                             │
│         [Cancel]          [Submit]          │
└─────────────────────────────────────────────┘
```

**Form fields:**
- **Warehouse**: Dropdown with warehouse options (JHB, CT). Required.
- **Adjustment Type**: Dropdown — "Add Stock", "Remove Stock", "Set Quantity". Required.
- **Quantity**: Positive integer. Required.
- **Reason**: Text area. Required — audit trail needs a reason.

**On submit:**
- Call `POST /api/v1/products/:productId/stock/adjustments` with the form data
- Show success toast: "Stock adjustment submitted for approval"
- Close modal
- Refetch inventory data to show updated state (though pending adjustment won't change onHand until approved)

**Validation:**
- Quantity must be > 0
- Reason must not be empty
- All fields required

### 3D: Recent Stock Movements

Below the warehouse table, show the last 20 movements:

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  Recent Stock Movements                                          [View All →]       │
│                                                                                      │
│  Date         │ Type        │ Warehouse    │ Qty    │ Reference      │ Notes         │
│  ─────────────┼─────────────┼──────────────┼────────┼────────────────┼────────────── │
│  28 Jan 2026  │ 📥 Receipt  │ Johannesburg │ +50    │ PO-2026-00012  │ Supplier del. │
│  27 Jan 2026  │ 📤 Issue    │ Cape Town    │ -10    │ SO-2026-00089  │ Order pickup  │
│  25 Jan 2026  │ 🔄 Transfer │ Johannesburg │ -20    │ TR-2026-00023  │ JHB → CT      │
│  25 Jan 2026  │ 🔄 Transfer │ Cape Town    │ +20    │ TR-2026-00023  │ JHB → CT      │
│  24 Jan 2026  │ ✏️ Adjust   │ Johannesburg │ +5     │ ADJ-2026-00004 │ Count correct │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

**Columns:**
- **Date**: `createdAt` formatted as DD MMM YYYY
- **Type**: `type` with icon — RECEIPT (📥), ISSUE (📤), TRANSFER_IN/OUT (🔄), ADJUSTMENT_IN/OUT (✏️), MANUFACTURE_IN/OUT (🔧), SCRAP (🗑️)
- **Warehouse**: `warehouseName`
- **Qty**: `quantity` with +/- prefix. Green for positive, red for negative.
- **Reference**: Reference document number (PO, SO, TR, ADJ, etc.)
- **Notes**: `notes` field, truncated if long

**Movement type display labels:**
```typescript
const MOVEMENT_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  RECEIPT: { label: 'Receipt', icon: '📥' },
  ISSUE: { label: 'Issue', icon: '📤' },
  TRANSFER_OUT: { label: 'Transfer Out', icon: '🔄' },
  TRANSFER_IN: { label: 'Transfer In', icon: '🔄' },
  MANUFACTURE_IN: { label: 'Manufacture In', icon: '🔧' },
  MANUFACTURE_OUT: { label: 'Manufacture Out', icon: '🔧' },
  ADJUSTMENT_IN: { label: 'Adjustment In', icon: '✏️' },
  ADJUSTMENT_OUT: { label: 'Adjustment Out', icon: '✏️' },
  SCRAP: { label: 'Scrap', icon: '🗑️' },
};
```

If there are no movements, show: "No stock movements recorded yet."

**"View All" link**: For now, this can be a placeholder or link to the future TASK-013D inventory dashboard. Don't build a separate full movements page in this task.

---

## Step 4: Reorder Settings Section (Admin Only)

Below the movements table, show reorder settings. Only visible to ADMIN/MANAGER roles.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Inventory Settings                                        [Edit ✏️]    │
│                                                                          │
│  Product Defaults                                                        │
│  Reorder Point: 20  │  Reorder Qty: 50  │  Min Stock: 5  │  Lead: 14d  │
│                                                                          │
│  Location Overrides                                                      │
│  JHB: Reorder at 25, order 50, min 10                                    │
│  CT:  Reorder at 10, order 25, min 5                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

**Edit mode**: Clicking "Edit" makes the fields editable inline or opens a modal. On save:
- Product defaults → `PATCH /api/v1/products/:id` with `defaultReorderPoint`, etc.
- Location overrides → This depends on what endpoint exists for updating StockLevel reorder settings. Check the existing inventory API. If no endpoint exists, skip location override editing for now and add a TODO comment.

---

## Components to Create

| Component | Purpose |
|-----------|---------|
| `StockOverviewCards` | Hero "Available to Sell" card + secondary On Hand/Reserved/On Order cards + formula bar |
| `StockStatusBadge` | Reusable colored badge (IN_STOCK → green, etc.) |
| `WarehouseStockTable` | Per-location breakdown table |
| `AdjustStockModal` | Form modal for creating stock adjustments |
| `StockMovementsTable` | Recent movements list with type icons |
| `InventorySettings` | Reorder point display/edit (admin only) |
| `ProductInventoryTab` | Container component that assembles everything above |

Place these in a logical folder — likely `components/inventory/` or `components/products/inventory/`. Follow whatever pattern the existing codebase uses for component organization.

---

## API Hooks to Create

Create React Query hooks (follow existing patterns in the codebase):

```typescript
// Fetch product with inventory data
useProductWithInventory(productId: string) 
  → GET /api/v1/products/:id?include=inventory,movements&movementLimit=20

// Create stock adjustment
useCreateStockAdjustment(productId: string)
  → POST /api/v1/products/:productId/stock/adjustments
  → On success: invalidate product inventory query
```

Check what hook patterns already exist (likely in a `hooks/` folder or alongside existing features like `useQuotes.ts`). Follow the same conventions.

---

## Access Control

| Feature | ADMIN | MANAGER | SALES | CUSTOMER |
|---------|-------|---------|-------|----------|
| Available to Sell (hero, primary warehouse) | ✓ | ✓ | ✓ (dominant) | ✓ (customer-friendly language) |
| "Also available" from other warehouses | ✓ | ✓ | ✓ | ✓ (with delivery estimate) |
| On Hand / Reserved / On Order | ✓ | ✓ | ✓ (subdued) | ✗ |
| Formula bar | ✓ | ✓ | Optional | ✗ |
| Warehouse breakdown table | ✓ | ✓ | ✓ | ✗ |
| View stock movements | ✓ | ✓ | ✓ | ✗ |
| Adjust stock button | ✓ | ✓ | ✗ | ✗ |
| Inventory settings | ✓ | ✓ | ✗ | ✗ |

Check how the existing app handles role-based UI visibility and follow the same pattern.

**For customers**: They see a simplified, clean view: hero available quantity scoped to their primary warehouse ("Available · Ready for immediate dispatch"), the stock status badge, and an "Also available from Johannesburg: X units · Est. 2–4 working days" bar for other warehouse stock. No On Hand, no Reserved, no formula, no movements table, no warehouse breakdown table. The language is customer-facing ("Available" not "Available to Sell", "Ready for immediate dispatch" not "promise to customers"). This gives them everything they need to make a purchasing decision: what they can get now, and what they can get with a short wait.

**For sales staff**: Available to Sell is the hero metric scoped to their primary warehouse, with On Hand/Reserved/On Order as small supporting context. The "also available" bar helps them answer customer questions about JHB stock without confusing the primary numbers. The warehouse breakdown table is useful for more detail.

---

## Empty States

Handle these gracefully:
- **Product has no stock records**: Show stock overview with all zeros, empty warehouse table with message, empty movements with message
- **No movements yet**: "No stock movements recorded yet."
- **Inventory tab loading**: Show skeleton/loading state for the overview cards and tables

---

## Implementation Notes

### DO:
- Fetch inventory data only when the Inventory tab is active (lazy loading)
- Use existing UI components (tables, badges, modals, cards) wherever they exist
- Follow existing code patterns for API calls, hooks, and component structure
- Show loading skeletons while data is fetching
- Invalidate and refetch inventory data after a successful stock adjustment
- Use the `StockStatusBadge` component consistently — same badge in overview, warehouse table, and later in TASK-013C

### DO NOT:
- Rebuild the product detail page/modal from scratch — add to what exists
- Create new API endpoints — everything needed already exists from TASK-013A
- Recompute stock status on the frontend — use the `stockStatus` value from the API
- Show the Inventory tab to unauthenticated users (if the product catalog is public)
- Build a full movements page — just the recent movements section within the tab

### Performance:
- Use React Query with staleTime of 30 seconds for inventory data (stock changes aren't instant)
- Don't fetch inventory data for every product in a list — that's TASK-013C's scope
- Movements table doesn't need pagination in this task — 20 most recent is sufficient

---

## Testing Checklist

After implementation, verify:

- [ ] Inventory tab appears on product detail view
- [ ] **With primary warehouse set**: Hero card shows "Available to Sell at [Warehouse Name]" with that warehouse's number only
- [ ] **With primary warehouse set**: Supporting cards (On Hand, Reserved, On Order) show that warehouse's numbers with "(CT)" or "(JHB)" label
- [ ] **With primary warehouse set**: "Also available" bar shows other warehouses with their available counts
- [ ] **With primary warehouse set**: User's warehouse row is highlighted in the warehouse table (sorted to top, ★ indicator)
- [ ] **Without primary warehouse**: Hero card shows combined "Available to Sell (all warehouses)" with totals
- [ ] **Without primary warehouse**: Warehouse table shows all locations in alphabetical order, no highlighting
- [ ] Formula bar shows correct math for the displayed scope (single warehouse or total)
- [ ] Stock status badge shows correct color/label (per-warehouse status when primary is set)
- [ ] Warehouse table has Available as FIRST data column (before On Hand)
- [ ] Available column is bold/emphasized, On Hand column is muted
- [ ] Products with no stock records show zeros and empty state messages (no errors)
- [ ] Adjust Stock button only visible for ADMIN/MANAGER
- [ ] Adjust Stock modal submits correctly and refreshes data
- [ ] Stock movements table shows recent movements with correct icons and formatting
- [ ] Positive quantities show green, negative show red
- [ ] Inventory settings section visible for ADMIN/MANAGER only
- [ ] Tab lazy-loads inventory data (doesn't fetch on initial page load if another tab is default)
- [ ] Loading states show skeletons while fetching
- [ ] **Customer role**: Sees hero available quantity scoped to their Customer.primaryWarehouseId with customer-friendly language ("Available", "Ready for immediate dispatch")
- [ ] **Customer role**: Sees "Also available from Johannesburg: X units · Est. 2–4 working days" bar when other warehouses have stock
- [ ] **Customer role**: Does NOT see On Hand, Reserved, formula bar, movements, warehouse table, or settings
- [ ] **Customer role**: When primary warehouse has 0 available, hero shows "0 Available" and JHB bar becomes the main info
- [ ] **Customer role**: When ALL warehouses have 0 available, shows OUT_OF_STOCK badge and contact message
- [ ] **Sales role**: Sees Available to Sell for their warehouse prominently, with On Hand/Reserved as secondary context
- [ ] **Graceful fallback**: If primaryWarehouseId is set but warehouse not found in byLocation, falls back to total view (not an error)

---

## What Comes Next (NOT in this task)

- **TASK-013C** — Product list stock badges (stock indicators on the product listing page)
- **TASK-013D** — Inventory operations dashboard (cross-product stock view, pending adjustments queue)

Do NOT build stock badges on the product list or the operations dashboard in this task.
