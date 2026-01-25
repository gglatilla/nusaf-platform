# Product Configurator Skill

## Overview

This skill defines Nusaf's product configurators, starting with the Modular Chain Configurator. The configurator generates SKUs, descriptions, configuration notes, and BOMs for custom-assembled products.

---

## Configurator Output Structure

Every configured product generates:

| Output | Purpose | Example |
|--------|---------|---------|
| **SKU** | Identification, reordering | BPP2135-K12-P10-SG |
| **Description** | Standard text for that SKU | 2100 Series Solid Top, Blue PP, 12" Wide, Pusher Every 10, Side Guides |
| **Config Notes** | Customer-specific variables | Pusher Height: 50mm, Indent L: 5mm, Indent R: 5mm, SG Height: 60mm |
| **BOM** | Components and quantities | Links, half-links, pins, plugs, attachments, labour |

All three (SKU, Description, Config Notes) appear on:
- Quote
- Sales Order
- Picking Slip
- Job Card
- Invoice
- Delivery Note

---

## Modular Chain Configurator

### Chain Series Overview

| Series | Pitch | Width System | Status |
|--------|-------|--------------|--------|
| 2100 | 1" | Imperial | ✅ Defined |
| 1500 | 15mm | Imperial | 🔜 To define |
| 4700 | 38.1mm | Imperial | 🔜 To define |
| 5020 | 2" | Metric | 🔜 To define |
| 5000 | 2" | Metric | 🔜 To define |
| 2500 | 1" | Metric | 🔜 To define |
| 3030 | 30mm | Imperial (radius) | 🔜 To define |

---

## 2100 Series Specification

### Base Specs

| Attribute | Value |
|-----------|-------|
| Pitch | 1" (25.4mm) |
| Width system | Imperial |
| Width increments | 0.5" |
| Min width | 3" |
| Max width | 200" |
| Base link width | 6" |
| Links per meter | 40 rows |
| Plugs per meter | 82 (fixed, all widths) |
| Labour | R75/meter (fixed) |

### Chain Types

| Code | Type | Attachments Available |
|------|------|----------------------|
| 2135 | Solid Top | P, HF, SG (material dependent) |
| 2136 | Flush Grid | P, HF, SG (material dependent) |
| 2137 | Raised Rib | None |
| 2138 | Nub Top | P, HF, SG (material dependent) |

### Materials

| Prefix | Material | Colour | Attachments |
|--------|----------|--------|-------------|
| BPP | Polypropylene | Blue | P, HF, SG |
| WPP | Polypropylene | White | P only |
| BAC | Acetal | Blue | P, HF, SG |
| WAC | Acetal | White | P only |
| LF | Low-friction Acetal | Beige | P only |
| PA | Polyamide | Black | P only |
| MD | Metal Detectable | Dark Navy Blue | P only |

**Note:** Only Blue PP (BPP) and Blue Acetal (BAC) support full attachment options (P, HF, SG).

### Raw Material SKU Structure

**From supplier price list:**
```
[Material Prefix][Chain Type]-L

Examples:
BPP2135-L  = Blue PP Solid Top link
WAC2136-L  = White Acetal Flush Grid link
LF2137-L   = Low-friction Acetal Raised Rib link
```

**Half-link SKU (Nusaf inventory):**
```
[Material Prefix][Chain Type]-H

Examples:
BPP2135-H  = Blue PP Solid Top half-link
```

**Other components:**
- Pin material: `P2100`
- Plugs: `2100-PLUG`
- Pushers: `[Material Prefix]2100-P`
- High Friction Links: `[Material Prefix]2100-HFL`
- Side Guides: `2100-SG`

---

## SKU Generation Rules

### Configured Product SKU Structure

```
[Material][ChainType]-K[Width][Attachments]

Components:
- Material: BPP, WPP, BAC, WAC, LF, PA, MD
- ChainType: 2135, 2136, 2137, 2138
- K: Indicates configured/assembled product
- Width: In inches (e.g., 06, 12, 24)
- Attachments: P[n], HF[n], SG (optional, in sequence)
```

### Examples

| Configuration | SKU |
|--------------|-----|
| Blue PP Solid Top, 6" wide | BPP2135-K06 |
| Blue PP Solid Top, 12" wide, Pusher every 10 | BPP2135-K12-P10 |
| Blue PP Solid Top, 12" wide, HF every 20 | BPP2135-K12-HF20 |
| Blue PP Solid Top, 12" wide, Pusher every 10, Side Guides | BPP2135-K12-P10-SG |
| Blue PP Solid Top, 12" wide, Pusher every 10, HF every 20, Side Guides | BPP2135-K12-P10-HF20-SG |
| White Acetal Flush Grid, 8" wide, Pusher every 5 | WAC2136-K08-P05 |

---

## Description Generation

Standard description built from configuration:

```
[Series] Series [Chain Type Name], [Material Full Name], [Colour]
Width: [X]" ([Xmm]mm)
[Attachments if any]
```

**Example:**
```
2100 Series Solid Top, Polypropylene, Blue
Width: 12" (304.8mm)
Pusher Every 10 Links, Side Guides
```

---

## Configuration Notes

Customer-specific variables stored and displayed:

### Pusher Options
| Option | Default | Range | Increment |
|--------|---------|-------|-----------|
| Height | 76mm | Custom down to any height | 1mm |
| Indent Left | 0mm | 0mm to height | 1mm |
| Indent Right | 0mm | 0mm to height | 1mm |

### Side Guide Options
| Option | Default | Range | Increment |
|--------|---------|-------|-----------|
| Height | 76mm | Custom down to any height | 1mm |

### High Friction Links
No configuration options (no height/indent variables).

### Config Notes Format
```
Pusher Height: 50mm, Indent L: 5mm, Indent R: 5mm
SG Height: 60mm
```

If default values used, can omit from notes or show "Standard".

---

## BOM Calculations

### Links Required

**Full links per row:**
```
Full links per row = FLOOR(Width in inches / 6)
```

**Half links per row:**
```
If Width % 6 >= 3:
    Half links per row = 1
Else:
    Half links per row = 0
```

**Total per meter (40 rows):**
```
Full links needed = Full links per row × 40
Half links needed = Half links per row × 40
```

**Width examples:**

| Width | Full/row | Half/row | Full/m | Half/m |
|-------|----------|----------|--------|--------|
| 3" | 0 | 1 | 0 | 40 |
| 6" | 1 | 0 | 40 | 0 |
| 8" | 1 | 1 | 40 | 40 |
| 9" | 1 | 1 | 40 | 40 |
| 12" | 2 | 0 | 80 | 0 |
| 15" | 2 | 1 | 80 | 40 |
| 18" | 3 | 0 | 120 | 0 |

### Half-Link Sourcing (Job Card Logic)

Configurator shows requirement. Job card determines sourcing:

1. Check half-link stock (e.g., BPP2135-H)
2. If sufficient → pick from stock
3. If insufficient:
   - Calculate full links to cut: `CEILING((Half needed - Half in stock) / 2)`
   - Cutting 1 full link produces 2 half links
   - Job card instruction: "Cut X full links to produce Y half links"
4. Leftover half links return to stock

**Stock movements at production:**
- Full links issued (from stock)
- Full links issued (for cutting)
- Half links received (from cutting)
- Half links issued (to job)

### Pin Material

```
Pin (meters) = (Width in inches × 25.4 × 40) / 1000
Round to 2 decimal places, round up.
```

| Width | Pin Required |
|-------|--------------|
| 6" | 6.10m |
| 8" | 8.13m |
| 12" | 12.19m |
| 24" | 24.38m |

### Plugs

Always **82 plugs per meter** regardless of width.

Formula: 40 rows × 2 sides + 2 spare = 82

### Attachments

**Pushers (P[n]):**
- Replace normal links
- P1 = every link is pusher (40 per meter)
- P40 = 1 pusher per meter
- Formula: `Pushers per meter = 40 / n`
- Pusher quantity = Pushers per meter × links per row

**High Friction (HF[n]):**
- Replace normal links
- Same frequency logic as pushers
- Formula: `HF links per meter = 40 / n × links per row`

**Side Guides (SG):**
- Additional (don't replace links)
- Always 80 per meter (40 left + 40 right)
- Fixed regardless of width

**Adjusting link count for attachments:**
```
Normal links = Total links - (Pusher links + HF links)
```

### Labour

Fixed: **R75 per meter**

---

## BOM Example

**Configuration:** BPP2135-K12-P10-SG, 1 meter
- 12" wide = 2 links per row
- P10 = pusher every 10 rows = 4 rows with pushers
- Side guides included

| Line | SKU | Description | Qty | UOM |
|------|-----|-------------|-----|-----|
| 1 | BPP2135-L | Blue PP Solid Top Link | 72 | each |
| 2 | BPP2100-P | Blue PP 2100 Pusher | 8 | each |
| 3 | 2100-SG | 2100 Side Guide | 80 | each |
| 4 | P2100 | 2100 Pin Material | 12.19 | meters |
| 5 | 2100-PLUG | 2100 Plug | 82 | each |
| 6 | LABOUR-2100 | Assembly Labour | 1 | meter |

**Calculation breakdown:**
- Total link positions: 40 rows × 2 per row = 80
- Pusher rows: 4 (every 10th row)
- Pusher links: 4 × 2 = 8
- Normal links: 80 - 8 = 72

---

## Validation Rules

### Chain Type + Material
- 2137 (Raised Rib): No attachments allowed
- Check material allows requested attachments

### Material + Attachment Restrictions
| Material | P | HF | SG |
|----------|---|----|----|
| BPP | ✓ | ✓ | ✓ |
| WPP | ✓ | ✗ | ✗ |
| BAC | ✓ | ✓ | ✓ |
| WAC | ✓ | ✗ | ✗ |
| LF | ✓ | ✗ | ✗ |
| PA | ✓ | ✗ | ✗ |
| MD | ✓ | ✗ | ✗ |

### Width
- Minimum: 3"
- Maximum: 200"
- Increments: 0.5"

### Attachment Frequency
- Range: 1-40
- Must be whole number
- P1 or HF1 means every row

### Custom Dimensions
- Pusher/SG height: Max 76mm, min limited by function
- Indents: Cannot exceed pusher height

---

## UI Flow (Configurator Steps)

### Step 1: Select Series
- 2100, 1500, 4700, etc.

### Step 2: Select Chain Type
- Solid Top, Flush Grid, etc.
- Filter based on series

### Step 3: Select Material
- Show colour swatch
- Indicate attachment restrictions

### Step 4: Enter Width
- Input in inches
- Show mm equivalent
- Validate min/max/increment

### Step 5: Add Attachments (if available)
- Pusher: Yes/No → Frequency (P1-P40) → Height, Indent L, Indent R
- High Friction: Yes/No → Frequency (HF1-HF40)
- Side Guides: Yes/No → Height

### Step 6: Enter Quantity (meters)

### Step 7: Review
- Show generated SKU
- Show description
- Show config notes
- Show BOM breakdown
- Show calculated price

### Step 8: Add to Quote

---

## Pricing Calculation

```
Total Price = (Component Costs + Labour) × Markup

Where:
- Component Costs = Σ (Component Qty × Component Cost Price)
- Labour = R75 × meters
- Markup = As per pricing rules (supplier + category + subcategory)
```

Component costs come from Pricing & Product Domain skill (landed costs with margin divisor applied).

---

## Data Model

### ConfiguredProduct
```
ConfiguredProduct
├── id
├── sku (generated)
├── series
├── chain_type
├── material
├── width_inches
├── width_mm (calculated)
├── description (generated)
├── config_notes (generated text)
├── config_json (structured data for re-editing)
│   ├── pusher_enabled
│   ├── pusher_frequency
│   ├── pusher_height_mm
│   ├── pusher_indent_left_mm
│   ├── pusher_indent_right_mm
│   ├── hf_enabled
│   ├── hf_frequency
│   ├── sg_enabled
│   └── sg_height_mm
├── created_at
└── updated_at
```

### ConfiguredProductBOMLine
```
ConfiguredProductBOMLine
├── id
├── configured_product_id (FK)
├── component_sku
├── component_description
├── quantity_per_meter
├── unit_of_measure
└── sort_order
```

---

## Integration Points

- **Pricing & Product Domain**: Component costs, margin rules
- **Inventory Management**: Stock checks, half-link availability, reservations
- **Order Fulfillment**: Job cards with config notes, BOM for production
- **Multi-Tenant Architecture**: Customer portal access to configurator

---

## Future: Engineering Drawing Pricing Calculator

A separate configurator for custom machined parts from drawings. To be defined:
- Input: Drawing upload, material, complexity
- Output: Quote based on material + machining time + markup
- Workflow: Manual review by sales/engineering

---

## Series To Be Added

- 1500 Series (15mm pitch, imperial width)
- 4700 Series (38.1mm pitch, imperial width)
- 5020 Series (2" pitch, metric width)
- 5000 Series (2" pitch, metric width)
- 2500 Series (1" pitch, metric width)
- 3030 Series (30mm pitch, radius chain, imperial width)

Each series will document:
- Chain types available
- Materials available
- Attachment options
- Base link width
- Links per meter
- Pin and plug formulas
- Any series-specific rules
