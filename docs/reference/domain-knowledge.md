# Nusaf Platform — Domain Knowledge

## Suppliers

- **Chiaravalli** (Italy) — Power transmission, uses their SKUs
- **Regina** (Italy) — Conveyor chain, uses their SKUs
- **Tecom** (Italy) — Components, complex SKU conversion required
- **Local** — Manufacturing in JHB, ZAR pricing

## Customer Tiers

| Tier | Discount off List |
|------|------------------|
| End User | 30% |
| OEM/Reseller | 40% |
| Distributor | 50% |

## Locations

| Location | Warehouse | Manufacturing | Sales |
|----------|-----------|---------------|-------|
| Johannesburg (JHB) | Main warehouse | CNC, milling, lathes, assembly | HQ |
| Cape Town (CT) | Finished goods only | None | Yes |
| Mbombela (MBB) | None | None | Yes |

## Manufacturing Equipment (JHB)

| Type | Equipment | Qty |
|------|-----------|-----|
| CNC | CNC Routers | 3 |
| Manual | Milling Machines | 2 |
| Manual | Lathes | 2 |
| Manual | Router | 1 |
| Assembly | Table Top Assembly | 1 |
| Assembly | Modular Chain Assembly Tables | 2 |
| Assembly | Components Assembly Station | 1 |
| Assembly | Gearbox/Motor Assembly Station | 1 |

## Pricing Formula (Imported Products)

```
Supplier Price (Gross/Net)
  -> Apply discount if Gross
  -> x EUR/ZAR rate
  -> x (1 + Freight %)
  -> / Margin divisor
  -> x 1.40 (always)
  = List Price
```

See `domain/pricing-product-domain` skill for full details.

## Fulfillment Flows

**JHB Customer:**
Sales Order -> Picking Slip (JHB) -> Job Cards (if needed) -> Pick & manufacture -> Invoice -> Dispatch from JHB

**Mbombela Customer:**
Sales Order -> Picking Slip (JHB) -> Job Cards (if needed) -> Pick & manufacture -> Invoice -> Dispatch from JHB to Mbombela

**CT Customer:**
Sales Order -> Check CT stock -> CT Picking Slip (available) + JHB Picking Slip (remainder) -> Job Cards (if assembly, always JHB) -> JHB completes -> Transfer Request (JHB -> CT) -> CT receives -> Invoice -> Dispatch from CT

## Quote Status Flow

```
DRAFT -> CREATED -> ACCEPTED -> CONVERTED
            \-> REJECTED
            \-> EXPIRED
            \-> CANCELLED
```
