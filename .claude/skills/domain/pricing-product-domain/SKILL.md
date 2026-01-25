# Pricing & Product Domain Skill

## Overview

This skill defines Nusaf's product taxonomy, SKU mapping rules, and pricing engine logic. It provides the complete context for building pricing-related features in the B2B platform.

## Suppliers

| Supplier | Type | Currency | SKU Handling |
|----------|------|----------|--------------|
| Tecom | Italian import | EUR | Complex conversion (see SKU Mapping) |
| Chiaravalli | Italian import | EUR | Use supplier SKU as Nusaf SKU |
| Regina | Italian import | EUR | Use supplier SKU as Nusaf SKU |
| Nusaf | Local manufacture | ZAR | Own SKU system |

---

## Product Taxonomy

### Categories and Sub-categories

#### 1. Conveyor Components
- Bases
- Bearing heads
- Connecting joints
- Guide rail brackets
- Tightening eyebolts
- Heads for brackets
- Knobs and handles
- Clamps
- Return rollers
- Nose over
- Split shaft collars
- Shoes
- Accessories for cross adjustment of side guides
- Chain tensioners
- Bearing supports
- Bushings
- Hinges
- Process control
- Modular transfer plates
- Product guides and accessories
- Guide rail clamps
- Product / chain guides and accessories
- Chain guides and accessories

#### 2. Levelling Feet
- Fixed feet
- Articulated feet (includes PA articulated)
- Adjustable feet
- Articulated feet, sanitizable
- Adjustable feet, sanitizable
- Accessories for supporting and levelling components
- Bushings

#### 3. Bearings
- UCF
- UCFL
- UCFB
- UCP
- UCPA
- UCT
- UCFC
- F series

#### 4. Table Top Chain
- Straight running steel chains
- Sideflexing steel chains
- Rubberized surface steel chains
- Straight running plastic chains
- Sideflexing plastic chains
- Rubberized surface plastic chains
- Two-piece chains
- Gripper chains
- LBP chains (Low back-line pressure)

#### 5. Modular Chain
**Regina Matveyor:**
- 8mm Nanopitch belt
- ½" pitch belts and chains
- 1" pitch light duty belts and chains
- ¾" pitch medium duty belts and chains
- 1" pitch heavy duty belts and chains
- 1" pitch sideflexing chains
- 1¼" pitch heavy duty sideflexing belts
- Heavy duty fixed radius belts
- 2" pitch heavy duty raised rib belts
- 1½" pitch heavy duty UCC chains

**Nusaf Modular Chain:**
- To be defined during modular chain configurator phase

#### 6. Mechanical Power Transmission
- Sprockets (no idlers - power transmission only)
- Platewheels, Wheels for table top chains, Hubs and adaptors
- Chains and Chain riders
- Straight spur gears and racks
- Bevel gears
- Timing pulleys
- V-belt pulleys
- Timing bars, Flanges for pulleys, Clamping belts plates
- Taper bushes (BrandRCB)
- Clamping elements (RCK Brand)
- Flexible couplings (GIFLEX Brand), Torque limiters
- Collars and washers
- Pillow blocks (FSB Brand), Monoblock pillow blocks (RCM Brand)
- Adjustable motor mounting

#### 7. Sprockets and Idlers
- Moulded sprockets and idlers
- Machined sprockets and idlers

> **Note:** This is a separate category from "Sprockets" under Mechanical Power Transmission. Conveyor sprockets and idlers (including Tecom Idler Wheels) belong here with custom SKU mappings.

#### 8. Bends
- Magnetic bends
- TAB bends

#### 9. Wear Strips
- Machined
- Extruded

#### 10. V-belts
- Wrapped classical section v-belt
- Wrapped narrow section v-belt
- Classical raw edge cogged v-belt
- Narrow raw edge cogged v-belt

#### 11. Gearbox and Electric Motors
- CHM Worm geared motors and worm gear units
- CHML Worm gearboxes with torque limiter
- CH Worm geared motors and worm gear units
- CHC Helical gear units
- Bevel helical gear units
- Electric motors
- Electric motors "Hygienic" stainless steel & aluminium
- Cast iron electric motors

### Extensibility

The system must allow adding new categories and sub-categories as the business grows.

---

## SKU Mapping

### Chiaravalli & Regina

Use supplier SKU directly as Nusaf SKU - no conversion required.

### Tecom SKU Conversion

Tecom SKUs follow a structured format:

```
C 0200 80271
│ │    │
│ │    └── Identifying code (specific variant)
│ └─────── Part number with leading zeros (0200 = Part 200)
└───────── Prefix (C, L, or B)
```

**Catalog format:** `200/80271` (Part 200, variant 80271)
**Price list format:** `C020080271` (with prefix and leading zeros)

#### Conversion Rules

| Prefix | Action | Example |
|--------|--------|---------|
| **B** | Keep as-is, no conversion | `B00123456` → `B00123456` |
| **C** | Convert to Nusaf format | `C020080271` → `1200-80271` |
| **L** | Convert to Nusaf format | `L008580271` → `185-80271` |

**Nusaf format:** `1` + Part Number (strip leading zeros) + `-` + Identifying Code

#### Conversion Algorithm

```
function convertTecomSku(tecomSku):
    prefix = tecomSku[0]
    
    if prefix == 'B':
        return tecomSku  // Keep as-is
    
    if prefix in ['C', 'L']:
        partNumber = tecomSku[1:5]  // 4 digits after prefix
        identifyingCode = tecomSku[5:]  // Rest of string
        
        // Strip leading zeros from part number
        partNumberClean = parseInt(partNumber).toString()
        
        return '1' + partNumberClean + '-' + identifyingCode
    
    throw Error('Unknown prefix: ' + prefix)
```

#### Exception Handling

Some SKUs require manual override mappings (estimated 20-100 SKUs):

- **Idler Wheels** - moved to "Sprockets and Idlers" category with custom mappings
- Other exceptions as identified

The system must support:
1. Default conversion rule (as above)
2. Override table for exceptions where user manually defines Tecom SKU → Nusaf SKU
3. Ability to add, edit, and remove overrides

---

## Pricing Engine

### Pricing Formula

#### Imported Products (Tecom, Chiaravalli, Regina)

```
Supplier Price (Gross or Net)
    │
    ▼ IF Gross: Apply Discount %
Net Price (EUR)
    │
    ▼ × EUR/ZAR Exchange Rate
ZAR Value
    │
    ▼ × (1 + Freight %)
Landed Cost (ZAR)
    │
    ▼ ÷ Margin Divisor
Cost + Margin
    │
    ▼ × 1.40 (always 40% markup)
List Price (ZAR)
```

#### Local Products (Nusaf)

```
Cost Price (ZAR)
    │
    ▼ (= Landed Cost, no conversion needed)
Landed Cost (ZAR)
    │
    ▼ ÷ Margin Divisor
Cost + Margin
    │
    ▼ × 1.40 (always 40% markup)
List Price (ZAR)
```

### Pricing Configuration Structure

Each pricing rule is defined by the unique combination of **Supplier + Category + Sub-category**.

#### Configuration Fields

| Field | Imported Products | Local Products |
|-------|-------------------|----------------|
| Gross or Net? | ✓ | ✗ (always Net/Cost) |
| Discount % | ✓ (if gross) | ✗ |
| Freight % | ✓ | ✗ |
| Margin Divisor | ✓ | ✓ |

#### Example Configuration

| Supplier | Category | Sub-category | Gross/Net | Discount % | Freight % | Margin Divisor |
|----------|----------|--------------|-----------|------------|-----------|----------------|
| Tecom | Bearings | UCF | Net | - | 12% | 0.65 |
| Tecom | Bearings | UCP | Net | - | 12% | 0.60 |
| Nusaf | Bearings | UCF | - | - | - | 0.55 |

> **Key insight:** Same category + sub-category can have different pricing rules for different suppliers. This handles the overlap where multiple suppliers provide products in the same category.

### User-Controlled Global Settings

| Setting | Description |
|---------|-------------|
| EUR/ZAR Exchange Rate | User sets manually, applies to all imported products |
| Publication Timing | Annual cycle - user controls when new prices are published |

### Price List Sources

**Tecom** provides 3 separate price lists:
1. Bearings
2. Conveyor Components
3. Levelling Feet

**Column structure** (typical across suppliers):
- CODE
- DESCRIPTION
- UM (unit of measure - typically "NR")
- Price (Gross or Net - varies by list)
- NET WEIGHT (sometimes included)

**Gross vs Net:** User "just knows" which lists are gross vs net through institutional knowledge. System stores this configuration per Supplier + Price List.

---

## Database Implications

### Core Entities

```
Supplier
├── id
├── name
├── currency (EUR, ZAR)
├── sku_handling (direct, tecom_conversion)
└── is_local (boolean)

Category
├── id
├── name
└── sort_order

SubCategory
├── id
├── category_id (FK)
├── name
└── sort_order

PricingRule
├── id
├── supplier_id (FK)
├── category_id (FK)
├── sub_category_id (FK)
├── is_gross (boolean, nullable for local)
├── discount_percent (decimal, nullable)
├── freight_percent (decimal, nullable)
└── margin_divisor (decimal)

SkuMapping
├── id
├── supplier_id (FK)
├── supplier_sku
├── nusaf_sku
├── is_override (boolean) -- true = manual override, false = auto-generated
└── category_id (FK, nullable) -- for category reassignment like Idler Wheels

GlobalSettings
├── eur_zar_rate (decimal)
└── last_published_at (timestamp)
```

### Unique Constraints

- `PricingRule`: unique on (supplier_id, category_id, sub_category_id)
- `SkuMapping`: unique on (supplier_id, supplier_sku)

---

## Supplier Price List Import

### Import Workflow

1. **Upload** - User uploads Excel file
2. **Select Supplier** - User selects which supplier this price list is from
3. **Map Columns** - User maps columns each time (columns may shift between files)
   - Required: CODE, DESCRIPTION, PRICE
   - Optional: UM (unit of measure), WEIGHT
4. **Validate** - System validates all rows, flags issues for review
5. **Review** - User reviews flagged items, can fix or skip
6. **Approve Import** - User approves the import
7. **Costs Update** - Supplier costs are updated in the system
8. **Prices Held** - List prices do NOT change until user publishes

### Column Mapping UI

User sees spreadsheet preview and assigns each column:

| Column in File | Map To |
|----------------|--------|
| A | CODE |
| B | DESCRIPTION |
| C | (skip) |
| D | PRICE |
| E | WEIGHT |

Mapping is done fresh each import - not saved per supplier.

### Validation Rules

| Check | Action |
|-------|--------|
| Duplicate SKU in file | Flag for review |
| SKU already exists in system | Update existing (this is expected for annual updates) |
| New SKU (not in system) | Flag as new item for review |
| Missing CODE | Flag for review |
| Missing PRICE | Flag for review |
| Price is zero | Flag for review |
| Price is negative | Flag for review |
| Invalid SKU format (Tecom) | Flag for review |

### Review Screen

Shows all flagged items with:
- Row number
- Issue type
- Current data in file
- Existing data in system (if applicable)

User can:
- Fix the issue
- Skip the row
- Accept as-is (for warnings)

### Import Behavior

**For existing SKUs:**
- Update supplier cost price
- DO NOT update calculated prices yet
- Store as pending price update

**For new SKUs:**
- Create product record
- Apply SKU conversion (Tecom rules)
- Assign to category/sub-category (user selects or system suggests based on SKU pattern)
- Flag for user to set pricing rule if none exists for that category

### Price Publishing

After import, costs are updated but list prices remain unchanged until user explicitly publishes:

1. User reviews pending price changes
2. User can see: Old Cost → New Cost → New Calculated Price
3. User approves/publishes
4. List prices update
5. Price list version incremented
6. Old prices retained for history

This supports the annual cycle where you import new costs but control when price changes go live.

---

## Admin UI Requirements

1. **Category/Sub-category Management**
   - CRUD for categories and sub-categories
   - Reordering capability

2. **Pricing Rule Management**
   - Grid view: Supplier + Category + Sub-category → Pricing fields
   - Filter by supplier, category
   - Bulk edit capability

3. **SKU Mapping Management**
   - View auto-generated mappings
   - Add/edit/delete manual overrides
   - Reassign products to different categories (e.g., Idler Wheels)

4. **Global Settings**
   - EUR/ZAR exchange rate input
   - Price list publication controls

5. **Price List Import**
   - Upload Excel file
   - Select supplier
   - Column mapping interface (drag-drop or dropdown per column)
   - Validation results with flagged items
   - Review and fix screen
   - Import approval

6. **Price Publishing**
   - View pending price changes (cost updated, price not yet published)
   - Compare: Old Cost → New Cost → Old Price → New Calculated Price
   - Bulk approve/publish
   - Price list version history

---

## Related Skills

- **Foundation Skills**: Database design, API design, UI components
- **Future**: Modular Chain Configurator (will define Nusaf modular chain sub-categories)
