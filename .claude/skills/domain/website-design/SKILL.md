# Nusaf Website Design

## Overview

This skill defines the design patterns, structure, and content guidelines for the Nusaf public website. The website serves as the company's digital storefront, showcasing products, building trust, and driving qualified leads to the customer portal.

**Primary Goals:**
1. Establish credibility and professionalism
2. Help visitors find products quickly
3. Drive sign-ups to the customer portal
4. Generate quote requests and enquiries
5. Showcase manufacturing capabilities

## Design Principles

### Premium Modern Industrial

The website should feel:
- **Premium** — High-quality imagery, generous whitespace, refined typography
- **Modern** — Clean layouts, subtle animations, contemporary UI patterns
- **Industrial** — Technical credibility, engineering precision, trustworthy

### Key Design Rules

1. **White backgrounds dominate** — Clean, scannable, professional
2. **Electric Blue for action** — All CTAs use the primary blue
3. **Generous whitespace** — Let content breathe, don't crowd
4. **High-quality photography** — Real products and facilities, no stock photos
5. **Clear hierarchy** — One primary CTA per section
6. **Mobile-first** — Responsive design for all devices

---

## Site Structure

### Information Architecture

```
Home
├── Products (mega menu entry point)
│   ├── [Division] Conveyor Components
│   │   ├── [Category] Modular Chain
│   │   │   ├── [Sub-cat] 2100 Series
│   │   │   │   ├── Solid Top → Configurator or Detail
│   │   │   │   ├── Flush Grid → Configurator or Detail
│   │   │   │   └── ...
│   │   │   ├── [Sub-cat] 1500 Series
│   │   │   └── ...
│   │   ├── [Category] Table Top Chain
│   │   ├── [Category] Conveyor Rollers
│   │   ├── [Category] Wear Strips
│   │   └── ...
│   │
│   ├── [Division] Power Transmission
│   │   ├── [Category] Sprockets
│   │   │   ├── [Type] ISO Chain Sprockets
│   │   │   │   ├── [Variant] Simplex
│   │   │   │   │   ├── [Pitch] 5x2.5mm
│   │   │   │   │   │   ├── Z=8 → Product Detail
│   │   │   │   │   │   ├── Z=9 → Product Detail
│   │   │   │   │   │   └── ...
│   │   │   │   │   ├── [Pitch] 1/2"x1/8"
│   │   │   │   │   └── ...
│   │   │   │   ├── [Variant] Duplex
│   │   │   │   └── [Variant] Triplex
│   │   │   ├── [Type] ASA Chain Sprockets
│   │   │   └── ...
│   │   ├── [Category] Timing Pulleys
│   │   ├── [Category] V-Belt Pulleys
│   │   ├── [Category] Gears
│   │   └── ...
│   │
│   ├── [Division] Bearings
│   ├── [Division] Gearboxes & Motors
│   ├── [Division] V-Belts
│   └── [Division] Levelling Feet
│
├── Solutions
│   ├── By Industry
│   │   ├── Food & Beverage
│   │   ├── Mining
│   │   ├── Manufacturing
│   │   └── Packaging
│   └── Custom Engineering
│
├── Services
│   ├── Chain Configuration
│   ├── Custom Machining
│   └── Technical Support
│
├── About
│   ├── Company
│   ├── Facilities
│   └── Quality & Certifications
│
├── Resources
│   ├── Technical Documentation
│   ├── Catalogues (PDF Downloads)
│   └── News / Blog (optional)
│
├── Contact
│
└── Customer Portal (Login/Register)
```

### URL Structure

URLs should be clean, readable, and reflect the hierarchy:

```
/products/                                          → All divisions
/products/power-transmission/                       → Division
/products/power-transmission/sprockets/             → Category
/products/power-transmission/sprockets/iso-chain/   → Type
/products/power-transmission/sprockets/iso-chain/simplex/           → Variant
/products/power-transmission/sprockets/iso-chain/simplex/12x1-8/    → Pitch
/products/power-transmission/sprockets/iso-chain/simplex/12x1-8/z12 → Product
```

Or with SKU-based detail pages:
```
/products/10112012                                  → Product by SKU
```

### Primary Navigation

**Desktop:** Horizontal nav in header with mega menu for Products
- Products (mega menu showing divisions and top categories)
- Solutions
- Services
- About
- Resources
- Contact
- [Customer Portal] — Primary CTA button

**Mobile:** Hamburger menu with slide-out drawer, collapsible sections

### Mega Menu (Products)

Essential for navigating deep hierarchy. Shows divisions and top categories at a glance.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Conveyor          Power              Bearings      Gearboxes    V-Belts   │
│  Components        Transmission                     & Motors               │
│  ────────────      ────────────       ────────────  ──────────   ───────── │
│  Modular Chain     Sprockets          Ball          Worm         Classical │
│  Table Top Chain   Timing Pulleys     Roller        Helical      Narrow    │
│  Rollers           V-Belt Pulleys     Pillow Block  Planetary    Cogged    │
│  Wear Strips       Gears & Racks      Housed        Electric     Banded    │
│  Guides            Chain Slide        Flanged       Motors                 │
│  Bends             Couplings                                               │
│                                                                            │
│  [View All →]      [View All →]       [View All →]  [View All →] [View →]  │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Element | Style |
|---------|-------|
| Background | White #FFFFFF |
| Shadow | Large drop shadow |
| Columns | One per division |
| Division title | 14px, SemiBold, Ink #0F172A |
| Category links | 14px, Regular, Charcoal #334155 |
| Link hover | Electric Blue #2563EB |
| "View All" | 14px, Medium, Electric Blue #2563EB |

---

## Page Templates

### Header (Global)

```
┌─────────────────────────────────────────────────────────────┐
│  Logo          Nav Links                   [Customer Portal]│
│  Nusaf         Products Solutions Services About Contact    │
└─────────────────────────────────────────────────────────────┘
```

| Element | Style |
|---------|-------|
| Background | White #FFFFFF |
| Height | 72px desktop, 64px mobile |
| Logo | "Nusaf" wordmark, Ink #0F172A |
| Nav links | 14px, Medium, Charcoal #334155 |
| Nav hover | Electric Blue #2563EB |
| CTA button | Primary button (Electric Blue) |
| Border | 1px solid #E2E8F0 (optional, or shadow) |
| Sticky | Yes, with subtle shadow on scroll |

**Mega Menu (Products):**
- Full-width dropdown
- White background
- Categories in columns with icons
- Featured products highlighted
- "View All Products" link

### Footer (Global)

```
┌─────────────────────────────────────────────────────────────┐
│  [Dark Background: Ink #0F172A]                             │
│                                                             │
│  Nusaf                  Products    About      Contact      │
│  Driving Dynamic        Conveyor    Company    Johannesburg │
│  Solutions              Power Trans Facilities Cape Town    │
│                         Bearings    Quality    Mbombela     │
│  [Social Icons]         Gearboxes              info@nusaf.. │
│                                                +27 ...      │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  © 2026 Nusaf Dynamic Technologies. All rights reserved.   │
│  Privacy Policy  |  Terms & Conditions                      │
└─────────────────────────────────────────────────────────────┘
```

| Element | Style |
|---------|-------|
| Background | Ink #0F172A |
| Padding | 64px top/bottom |
| Logo/tagline | White #FFFFFF |
| Column headers | 12px, SemiBold, uppercase, Steel #64748B |
| Links | 14px, Regular, Silver #94A3B8 |
| Link hover | White #FFFFFF |
| Bottom bar | Border top: 1px solid Slate #1E293B |
| Copyright | 14px, Steel #64748B |

---

### Home Page

#### Hero Section

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│     Driving Dynamic Solutions                               │
│                                                             │
│     Premium conveyor components and power transmission      │
│     solutions for South Africa's leading manufacturers.     │
│                                                             │
│     [Explore Products]  [Request Quote]                     │
│                                                             │
│     (Background: Subtle gradient or hero image)             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| Element | Style |
|---------|-------|
| Background | White to Snow gradient, or hero image with overlay |
| Headline | H1, 48-56px, Bold, Ink #0F172A |
| Subheadline | 18-20px, Regular, Steel #64748B, max-width 560px |
| Primary CTA | Primary button |
| Secondary CTA | Secondary (outline) button |
| Height | 500-600px desktop, 400px mobile |

#### Value Propositions

```
┌─────────────────────────────────────────────────────────────┐
│  [Icon]              [Icon]              [Icon]             │
│  Quality Assured     Fast Delivery       Expert Support     │
│  European suppliers, Ex-stock & custom   Technical team     │
│  ISO certified       5-day turnaround    on-site support    │
└─────────────────────────────────────────────────────────────┘
```

- 3-4 cards in a row
- Icon (32px) + Title (16px, SemiBold) + Description (14px, Steel)
- Background: Snow #F8FAFC
- Padding: 64px top/bottom

#### Product Categories

```
┌─────────────────────────────────────────────────────────────┐
│  Our Products                                               │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Image   │  │ Image   │  │ Image   │  │ Image   │        │
│  │ Modular │  │ Power   │  │ Bearings│  │ Gearbox │        │
│  │ Chain   │  │ Trans   │  │         │  │         │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
│                                                             │
│  [View All Products →]                                      │
└─────────────────────────────────────────────────────────────┘
```

- Section title: H2, centered or left-aligned
- Cards: Image (square or 4:3) + Category name
- Hover: Subtle lift, blue border
- Link: Text link with arrow icon

#### Why Choose Nusaf

```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────┐  ┌───────────────────────────────┐ │
│  │                     │  │  Why Choose Nusaf             │ │
│  │    [Image:          │  │                               │ │
│  │     Facility or     │  │  • European quality suppliers │ │
│  │     Team Photo]     │  │  • Local stock & manufacturing│ │
│  │                     │  │  • Custom machining capability│ │
│  │                     │  │  • Technical support & service│ │
│  │                     │  │                               │ │
│  │                     │  │  [Contact Our Team]           │ │
│  └─────────────────────┘  └───────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

- Two-column layout
- Image on one side, content on other
- Bullet points with checkmarks or icons
- CTA button

#### Industries Served

```
┌─────────────────────────────────────────────────────────────┐
│  Industries We Serve                                        │
│                                                             │
│  [Food & Bev]  [Mining]  [Manufacturing]  [Packaging]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- Icon or image per industry
- Click to go to industry solution page
- Background: Snow

#### CTA Banner

```
┌─────────────────────────────────────────────────────────────┐
│  [Blue Background: Electric Blue #2563EB]                   │
│                                                             │
│  Ready to optimise your production line?                    │
│                                                             │
│  [Get a Quote]  [Call +27 ...]                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- Full-width blue banner
- White text
- Primary CTA: White background, blue text
- Contact number visible

#### Trusted By / Clients (Optional)

- Logo carousel or grid
- Grayscale logos, colour on hover
- "Trusted by South Africa's leading manufacturers"

---

---

## Product Hierarchy & Navigation Flow

Based on supplier catalog structures (Chiaravalli, Regina, Tecom), Nusaf products follow a deep hierarchy that users drill down through to find specific items.

### Hierarchy Levels

```
Level 1: Division          → Conveyor Components, Power Transmission, etc.
Level 2: Category          → Open Transmission, Gearboxes, Modular Chain, etc.
Level 3: Sub-category      → Sprockets, V-Belts, Timing Pulleys, etc.
Level 4: Type              → ISO Chain Sprockets, ASA Chain Sprockets, etc.
Level 5: Variant           → Simplex, Duplex, Triplex
Level 6: Size/Pitch        → 5x2.5mm, 1/2"x1/8", 3/4"x7/16", etc.
Level 7: Specification     → Z=8, Z=10, Z=12 (number of teeth)
Level 8: Product Detail    → Specific SKU with full specs
```

**Note:** Not all products go 7 levels deep. Simpler products (e.g., levelling feet) may only have 3-4 levels. The system must handle variable depth gracefully.

### Example Navigation Paths

**Deep path (Sprockets):**
```
Products → Power Transmission → Sprockets → ISO Chain Sprockets → Simplex → 1/2"x1/8" → Z=12 → Product Detail
```

**Medium path (Modular Chain):**
```
Products → Conveyor Components → Modular Chain → 2100 Series → Solid Top → Product Detail (or Configurator)
```

**Shallow path (Levelling Feet):**
```
Products → Conveyor Components → Levelling Feet → Stainless Steel → Product Detail
```

### Page Types by Level

| Level | Page Type | Layout | Content |
|-------|-----------|--------|---------|
| 1-3 | Category Landing | Hero + Card Grid | Description, image, child categories |
| 4-6 | Sub-category List | Card Grid | Child items, may include filters |
| 7 | Product List | Compact Grid | Products by spec (Z=8, Z=9...) |
| 8 | Product Detail | Detail Layout | Full specs, downloads, quote button |

### Breadcrumb Navigation

Breadcrumbs are **critical** for deep hierarchies. Always show full path:

```
Home | Power Transmission | Sprockets | ISO Chain Sprockets | Simplex | 1/2"x1/8" | Z=12
```

- Clickable links for all levels except current
- Current page shown but not linked
- Truncate on mobile (show "..." with dropdown for middle levels)

### Navigation Patterns

#### Category Landing Page (Levels 1-3)

```
┌─────────────────────────────────────────────────────────────┐
│  Breadcrumb: Home > Products > Power Transmission           │
│                                                             │
│  ┌─────────────────────┐  ┌───────────────────────────────┐ │
│  │                     │  │  Power Transmission           │ │
│  │    [Hero Image]     │  │                               │ │
│  │                     │  │  Sprockets, pulleys, gears,   │ │
│  │                     │  │  and drive components...      │ │
│  └─────────────────────┘  └───────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ [Image] │  │ [Image] │  │ [Image] │  │ [Image] │        │
│  │Sprockets│  │ Timing  │  │ V-Belt  │  │ Bevel   │        │
│  │         │  │ Pulleys │  │ Pulleys │  │ Gears   │        │
│  │ Scopri →│  │ Scopri →│  │ Scopri →│  │ Scopri →│        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ [Image] │  │ [Image] │  │ [Image] │  │ [Image] │        │
│  │ Chain   │  │ Spur    │  │ Timing  │  │ Flanges │        │
│  │ Slide   │  │ Gears   │  │ Bars    │  │         │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
└─────────────────────────────────────────────────────────────┘
```

#### Sub-category List Page (Levels 4-6)

```
┌─────────────────────────────────────────────────────────────┐
│  Breadcrumb: ... > Sprockets > ISO Chain Sprockets          │
│                                                             │
│  ISO Chain Sprockets                                        │
│  Precision sprockets for ISO standard roller chains.        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐    │
│  │    [Image]    │  │    [Image]    │  │    [Image]    │    │
│  │    SIMPLEX    │  │    DUPLEX     │  │    TRIPLEX    │    │
│  │    Scopri →   │  │    Scopri →   │  │    Scopri →   │    │
│  └───────────────┘  └───────────────┘  └───────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  📄 Download: ISO Chain Sprockets Specifications    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

#### Specification Selection Page (Level 6-7)

For products with many variants by size/pitch, then by specification (teeth count):

```
┌─────────────────────────────────────────────────────────────┐
│  Breadcrumb: ... > ISO Chain Sprockets > Simplex            │
│                                                             │
│  Simplex ISO Chain Sprockets                                │
│  Select pitch size:                                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐ │
│  │ 5x2.5mm │ │ 6x2.8mm │ │1/4"x1/8"│ │  8x3mm  │ │3/8"x..│ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └───────┘ │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐ │
│  │1/2"x1/8"│ │1/2"x3/16│ │1/2"x1/4"│ │1/2"x5/16│ │5/8"x..│ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └───────┘ │
└─────────────────────────────────────────────────────────────┘
```

Then after selecting pitch:

```
┌─────────────────────────────────────────────────────────────┐
│  Breadcrumb: ... > Simplex > 1/2"x1/8"                      │
│                                                             │
│  Simplex 1/2"x1/8" - Select Number of Teeth                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌─────┐ │
│  │[Image]│ │[Image]│ │[Image]│ │[Image]│ │[Image]│ │ ... │ │
│  │  Z=8  │ │  Z=9  │ │ Z=10  │ │ Z=11  │ │ Z=12  │ │     │ │
│  └───────┘ └───────┘ └───────┘ └───────┘ └───────┘ └─────┘ │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌─────┐ │
│  │ Z=14  │ │ Z=15  │ │ Z=16  │ │ Z=17  │ │ Z=18  │ │ Z=19│ │
│  └───────┘ └───────┘ └───────┘ └───────┘ └───────┘ └─────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Alternative: Filter-Based Navigation

For categories with many attributes, offer filters instead of drilling down:

```
┌─────────────────────────────────────────────────────────────┐
│  Breadcrumb: ... > Sprockets > ISO Chain Sprockets          │
│                                                             │
│  ISO Chain Sprockets                                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Filters:                                                   │
│  [Type: Simplex ▾] [Pitch: All ▾] [Teeth: All ▾] [Clear]   │
├─────────────────────────────────────────────────────────────┤
│  Showing 156 products                                       │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Product │ │ Product │ │ Product │ │ Product │           │
│  │  Card   │ │  Card   │ │  Card   │ │  Card   │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                             │
│  Pagination                                                 │
└─────────────────────────────────────────────────────────────┘
```

**When to use filters vs drill-down:**
- **Drill-down:** When hierarchy is clear and users know the path (standard industrial catalogs)
- **Filters:** When users may search by multiple attributes, or when showing search results
- **Hybrid:** Offer both — drill-down as primary, filters as refinement

### Product Card Variations

**Category Card (navigates to sub-category):**
```
┌─────────────────────┐
│      [Image]        │
│                     │
│    Category Name    │
│    View Products →  │
└─────────────────────┘
```

**Product Card (navigates to detail):**
```
┌─────────────────────┐
│      [Image]        │
│                     │
│    Product Name     │
│    SKU: ABC123      │
│    View Details →   │
└─────────────────────┘
```

**Specification Card (compact, for Z=8, Z=9, etc.):**
```
┌─────────────┐
│   [Image]   │
│    Z=12     │
└─────────────┘
```
Click to go directly to product detail.

---

### Product Detail Page

Based on supplier patterns (Chiaravalli CADENAS integration), product detail pages include technical drawings, specifications, and download options.

```
┌─────────────────────────────────────────────────────────────┐
│  Breadcrumb: ... > Simplex > 1/2"x1/8" > Z=12               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐  ┌───────────────────────────┐ │
│  │                         │  │  CHAIN SPROCKET           │ │
│  │   [Technical Drawing    │  │  1/2" x 1/8" Z=12 SIMPLEX │ │
│  │    or Product Image]    │  │                           │ │
│  │                         │  │  Code: 10112012           │ │
│  │   [View Options:]       │  │  Article: Z=12            │ │
│  │   ☰ 🔘 ✓ 📐 🖼️          │  │                           │ │
│  │   List/3D/Check/        │  ├───────────────────────────┤ │
│  │   Drawing/Photo         │  │  SPECIFICATIONS           │ │
│  │                         │  │  ─────────────────────    │ │
│  └─────────────────────────┘  │  dp:      20.47 mm        │ │
│                               │  de:      23.80 mm        │ │
│                               │  A:       15 mm           │ │
│                               │  dm:      10 mm           │ │
│                               │  Df:      6 mm            │ │
│                               │  Weight:  0.05 kg         │ │
│                               │  Material: Steel C45      │ │
│                               │                           │ │
│                               ├───────────────────────────┤ │
│                               │  [Select CAD 2D Format ▾] │ │
│                               │  [Download CAD 2D     →]  │ │
│                               │                           │ │
│                               │  [Select CAD 3D Format ▾] │ │
│                               │  [Download CAD 3D     →]  │ │
│                               │                           │ │
│                               │  [PDF Datasheet       →]  │ │
│                               │                           │ │
│                               │  [Request Quote       →]  │ │
│                               └───────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Related Products / Other Sizes                             │
│  [Z=10] [Z=11] [Z=13] [Z=14] [Z=15] ...                     │
└─────────────────────────────────────────────────────────────┘
```

#### Product Detail Elements

| Element | Description |
|---------|-------------|
| **Breadcrumb** | Full path, all levels clickable |
| **Product Title** | Clear name with key specs (pitch, teeth, type) |
| **Code/SKU** | Supplier code and/or Nusaf SKU |
| **Image/Drawing** | Photo, technical drawing, or 3D model viewer |
| **View Toggle** | Switch between list view, 3D, drawing, photo |
| **Specifications Table** | Key technical specs with units |
| **CAD Downloads** | 2D and 3D formats (DXF, DWG, STEP, IGES, etc.) |
| **PDF Datasheet** | Downloadable spec sheet |
| **Quote Button** | Primary CTA — request pricing |
| **Related Products** | Quick links to other sizes/variants |

#### Specification Table Guidelines

- Display in two columns: Label | Value
- Include units (mm, kg, etc.)
- Group related specs if many
- Show "Made in Italy" or origin if relevant
- Material specification important for engineering

#### Download Options (CAD Formats)

**2D Formats:**
- DXF
- DWG
- PDF (drawing)

**3D Formats:**
- STEP
- IGES
- SAT
- Parasolid
- SolidWorks
- Inventor
- CATIA

Dropdowns allow format selection before download.

#### Customer Portal Integration

For logged-in customers:
- Show their tier-discounted price
- "Add to Quote" or "Add to Cart" buttons
- Stock availability indicator
- Estimated delivery

For public website:
- "Request Quote" button (no pricing shown)
- "Login for Pricing" link

---

### Contact Page

```
┌─────────────────────────────────────────────────────────────┐
│  Contact Us                                                 │
│  Get in touch with our team for enquiries and support.      │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────┐  ┌─────────────────────────┐ │
│  │  Contact Form             │  │  Our Locations          │ │
│  │                           │  │                         │ │
│  │  Name [_______________]   │  │  Johannesburg (HQ)      │ │
│  │  Email [______________]   │  │  Address...             │ │
│  │  Company [____________]   │  │  Phone: +27 ...         │ │
│  │  Message [___________     │  │                         │ │
│  │           ___________]    │  │  Cape Town              │ │
│  │                           │  │  Address...             │ │
│  │  [Send Message]           │  │                         │ │
│  │                           │  │  Mbombela               │ │
│  └───────────────────────────┘  │  Address...             │ │
│                                 └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

- Two-column layout
- Contact form with validation
- Office locations with addresses and phone numbers
- Optional: Map embed

---

### About Page

```
┌─────────────────────────────────────────────────────────────┐
│  About Nusaf                                                │
│  Driving Dynamic Solutions since [year]                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌───────────────────────────────┐ │
│  │    [Team/Facility   │  │  Company story and mission... │ │
│  │     Photo]          │  │                               │ │
│  └─────────────────────┘  └───────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Our Capabilities                                           │
│  [Card: Sourcing] [Card: Manufacturing] [Card: Support]     │
├─────────────────────────────────────────────────────────────┤
│  Quality & Certifications                                   │
│  ISO logos and certification details                        │
├─────────────────────────────────────────────────────────────┤
│  Our Facilities                                             │
│  Photo gallery of warehouse, machining, etc.                │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Patterns

### Product Card

```css
/* Card */
background: #FFFFFF;
border: 1px solid #E2E8F0;
border-radius: 8px;
overflow: hidden;
transition: all 200ms ease;

/* Hover */
border-color: #2563EB;
box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
transform: translateY(-4px);

/* Image */
aspect-ratio: 4/3;
object-fit: cover;
background: #F8FAFC;

/* Content */
padding: 16px;

/* Title */
font-size: 16px;
font-weight: 600;
color: #0F172A;
margin-bottom: 4px;

/* Description */
font-size: 14px;
color: #64748B;
line-height: 1.5;
```

### Feature Card (with Icon)

```css
/* Card */
background: #FFFFFF;
border: 1px solid #E2E8F0;
border-radius: 8px;
padding: 24px;
text-align: center; /* or left */

/* Icon container */
width: 48px;
height: 48px;
background: #EFF6FF;
border-radius: 10px;
display: flex;
align-items: center;
justify-content: center;
margin: 0 auto 16px; /* centered */
color: #2563EB;

/* Title */
font-size: 18px;
font-weight: 600;
color: #0F172A;
margin-bottom: 8px;

/* Description */
font-size: 14px;
color: #64748B;
line-height: 1.6;
```

### CTA Banner (Blue)

```css
background: #2563EB;
padding: 48px;
text-align: center;
border-radius: 12px; /* if not full-width */

/* Title */
font-size: 28px;
font-weight: 700;
color: #FFFFFF;
margin-bottom: 12px;

/* Description */
font-size: 16px;
color: rgba(255, 255, 255, 0.85);
margin-bottom: 24px;

/* Button (inverted) */
background: #FFFFFF;
color: #2563EB;
```

### Quote Request Form

**Fields:**
- Name (required)
- Email (required)
- Company
- Phone
- Product interest (dropdown or text)
- Message (textarea)
- File upload (optional, for drawings)

**Validation:**
- Inline validation on blur
- Error messages below fields
- Success: Show confirmation message or redirect

---

## Content Guidelines

### Headings

| Page Type | H1 Example |
|-----------|------------|
| Home | "Driving Dynamic Solutions" |
| Category | "Modular Chain" |
| Product | "2100 Series Solid Top" |
| About | "About Nusaf" |
| Contact | "Contact Us" |

### Product Descriptions

**Structure:**
1. One-sentence summary (what it is)
2. Key benefits (2-3 bullets)
3. Applications (where it's used)
4. Technical specifications (in table)

**Tone:**
- Technical but accessible
- Benefit-focused
- Confident without being salesy

**Example:**
> The 2100 Series Solid Top is a high-performance modular belt designed for demanding conveyor applications. With 1" pitch and multiple material options, it delivers reliable performance across food processing, packaging, and manufacturing environments.

### CTAs

| Location | Primary CTA | Secondary CTA |
|----------|-------------|---------------|
| Hero | "Explore Products" | "Request Quote" |
| Product page | "Request Quote" | "Download Datasheet" |
| Category | "View Products" | — |
| Footer banner | "Get a Quote" | "Contact Us" |
| Contact | "Send Message" | — |

---

## Responsive Design

### Breakpoints

| Name | Width | Layout Changes |
|------|-------|----------------|
| Mobile | < 768px | Single column, hamburger nav, stacked cards |
| Tablet | 768px - 1024px | 2-column grids, condensed nav |
| Desktop | > 1024px | Full layout, mega menu |

### Mobile Considerations

- Touch-friendly tap targets (min 44px)
- Simplified navigation
- Collapsed filters (drawer or dropdown)
- Full-width CTAs
- Reduced image sizes (optimised)

---

## Technical Requirements

### Performance

- Largest Contentful Paint (LCP): < 2.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1
- Optimised images (WebP, lazy loading)
- Minified CSS/JS

### SEO

- Semantic HTML (h1-h6, nav, main, footer)
- Meta titles and descriptions per page
- Open Graph tags for social sharing
- Structured data (Product, Organization)
- XML sitemap
- Canonical URLs

### Accessibility

- WCAG 2.1 AA compliance
- Alt text for all images
- Keyboard navigation
- Screen reader compatible
- Sufficient colour contrast

---

## Integration Points

### Customer Portal

- "Login" and "Register" links in header
- CTAs to sign up throughout site
- Seamless authentication flow

### Quote Requests

- Forms submit to backend/CRM
- Email notifications to sales team
- Confirmation emails to customers

### Catalogues & Documents

- PDF downloads from Cloudflare R2
- Track downloads (analytics)
- Gated content option (email for download)

---

## Page Checklist

For each page, ensure:

- [ ] Follows brand colours and typography
- [ ] Clear page title (H1)
- [ ] Primary CTA visible above the fold
- [ ] Breadcrumbs for navigation (sub-pages)
- [ ] Mobile responsive
- [ ] Images optimised and lazy-loaded
- [ ] Meta title and description set
- [ ] Links to related content
- [ ] Footer visible with contact info
