# Nusaf UI/UX — Web Application

## Overview

This skill defines UI/UX patterns, components, and interaction design for the Nusaf web application (customer portal and internal admin). All interfaces must follow the Brand Identity skill for colours, typography, and spacing.

## Application Structure

### Layout Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Dark Sidebar (240px)  │  Main Content Area (fluid)        │
│  - Logo                │  ┌─────────────────────────────┐  │
│  - Navigation          │  │  Page Header + Actions      │  │
│  - User Menu           │  ├─────────────────────────────┤  │
│                        │  │                             │  │
│                        │  │  Page Content               │  │
│                        │  │  (Snow #F8FAFC background)  │  │
│                        │  │                             │  │
│                        │  │                             │  │
│                        │  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Sidebar (Dark Theme)

| Property | Value |
|----------|-------|
| Width | 240px (desktop), collapsible to 64px |
| Background | Ink #0F172A |
| Logo colour | White #FFFFFF |
| Nav item colour | Silver #94A3B8 |
| Nav item hover | White #FFFFFF, background Slate #1E293B |
| Nav item active | White #FFFFFF, background Electric Blue #2563EB |
| Dividers | Slate #1E293B |

**Navigation Items:**
- Icon (20px) + Label
- Padding: 12px 24px
- Border-radius: 6px (with 8px margin on sides)
- Nested items indented 16px

### Main Content Area

| Property | Value |
|----------|-------|
| Background | Snow #F8FAFC |
| Padding | 32px |
| Max content width | 1280px (optional, for readability) |

### Page Header

| Property | Value |
|----------|-------|
| Background | White #FFFFFF |
| Padding | 24px 32px |
| Border bottom | 1px solid Mist #E2E8F0 |
| Title | H3 (24px, SemiBold, Ink) |
| Actions | Right-aligned, primary button |

---

## Components

### Buttons

#### Primary Button
```css
background: #2563EB;
color: #FFFFFF;
padding: 10px 20px;
border-radius: 6px;
font-weight: 600;
font-size: 14px;
transition: all 150ms ease-out;

/* Hover */
background: #3B82F6;
box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
transform: translateY(-1px);

/* Active */
background: #1D4ED8;
transform: translateY(0);

/* Disabled */
background: #94A3B8;
cursor: not-allowed;
```

#### Secondary Button (Outline)
```css
background: transparent;
color: #2563EB;
border: 1px solid #2563EB;
padding: 10px 20px;
border-radius: 6px;
font-weight: 600;
font-size: 14px;

/* Hover */
background: #EFF6FF;

/* Disabled */
color: #94A3B8;
border-color: #E2E8F0;
```

#### Tertiary Button (Ghost)
```css
background: transparent;
color: #334155;
padding: 10px 20px;
border-radius: 6px;
font-weight: 500;
font-size: 14px;

/* Hover */
background: #F1F5F9;
```

#### Destructive Button
```css
background: #EF4444;
color: #FFFFFF;
/* Same structure as primary */

/* Hover */
background: #DC2626;
```

#### Button Sizes

| Size | Padding | Font Size | Icon Size |
|------|---------|-----------|-----------|
| Small | 6px 12px | 12px | 16px |
| Medium (default) | 10px 20px | 14px | 18px |
| Large | 14px 28px | 16px | 20px |

### Inputs

#### Text Input
```css
background: #FFFFFF;
border: 1px solid #E2E8F0;
border-radius: 6px;
padding: 10px 14px;
font-size: 14px;
color: #0F172A;
transition: border-color 150ms, box-shadow 150ms;

/* Placeholder */
color: #94A3B8;

/* Focus */
border-color: #2563EB;
box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
outline: none;

/* Error */
border-color: #EF4444;
box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);

/* Disabled */
background: #F8FAFC;
color: #94A3B8;
cursor: not-allowed;
```

#### Input with Label
```html
<div class="form-field">
  <label>Label Text</label>
  <input type="text" placeholder="Placeholder" />
  <span class="helper-text">Helper or error text</span>
</div>
```

| Element | Style |
|---------|-------|
| Label | 14px, Medium (500), Charcoal #334155, margin-bottom 6px |
| Helper text | 12px, Regular, Steel #64748B, margin-top 6px |
| Error text | 12px, Regular, Error #EF4444, margin-top 6px |
| Required indicator | Red asterisk after label |

#### Select / Dropdown
Same styling as text input with dropdown icon (chevron-down) on right.

#### Textarea
Same styling as text input, min-height: 100px, resize: vertical.

#### Checkbox
```css
/* Custom checkbox */
width: 18px;
height: 18px;
border: 1px solid #E2E8F0;
border-radius: 4px;
background: #FFFFFF;

/* Checked */
background: #2563EB;
border-color: #2563EB;
/* White checkmark icon */
```

#### Radio Button
```css
/* Custom radio */
width: 18px;
height: 18px;
border: 1px solid #E2E8F0;
border-radius: 50%;
background: #FFFFFF;

/* Selected */
border-color: #2563EB;
/* Inner circle: 8px, #2563EB */
```

#### Toggle Switch
```css
/* Track */
width: 44px;
height: 24px;
background: #E2E8F0;
border-radius: 12px;

/* Thumb */
width: 20px;
height: 20px;
background: #FFFFFF;
border-radius: 50%;
box-shadow: 0 1px 3px rgba(0,0,0,0.2);

/* Active */
track background: #2563EB;
thumb position: right;
```

### Cards

#### Standard Card
```css
background: #FFFFFF;
border: 1px solid #E2E8F0;
border-radius: 8px;
padding: 24px;
/* No shadow by default */

/* Hover (if interactive) */
border-color: #2563EB;
box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
transform: translateY(-2px);
```

#### Stat Card
```html
<div class="stat-card">
  <div class="stat-label">Active Orders</div>
  <div class="stat-value">12</div>
  <div class="stat-change positive">↑ 2 this week</div>
</div>
```

| Element | Style |
|---------|-------|
| Label | 12px, Medium, Steel #64748B |
| Value | 28px, Bold, Ink #0F172A (or Electric Blue for emphasis) |
| Change (positive) | 12px, Regular, Success #10B981 |
| Change (negative) | 12px, Regular, Error #EF4444 |

### Tables

#### Table Structure
```css
/* Table container */
background: #FFFFFF;
border: 1px solid #E2E8F0;
border-radius: 8px;
overflow: hidden;

/* Header row */
background: #F8FAFC;
border-bottom: 1px solid #E2E8F0;

/* Header cell */
padding: 12px 16px;
font-size: 12px;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.5px;
color: #64748B;
text-align: left;

/* Body row */
border-bottom: 1px solid #F1F5F9;

/* Body row hover */
background: #F8FAFC;

/* Body cell */
padding: 16px;
font-size: 14px;
color: #334155;

/* Last row */
border-bottom: none;
```

#### Table Features
- Sortable columns: Click header to sort, show arrow indicator
- Row selection: Checkbox in first column
- Row actions: Icon buttons or dropdown menu in last column
- Pagination: Below table, showing "1-20 of 156" with prev/next

### Badges & Tags

#### Status Badge
```css
display: inline-flex;
align-items: center;
padding: 4px 10px;
border-radius: 4px;
font-size: 12px;
font-weight: 500;
```

| Status | Background | Text |
|--------|------------|------|
| Success / Completed | #D1FAE5 | #047857 |
| Warning / Pending | #FEF3C7 | #B45309 |
| Error / Failed | #FEE2E2 | #B91C1C |
| Info / Default | #DBEAFE | #1D4ED8 |
| Neutral | #F1F5F9 | #475569 |

#### Tag (Removable)
```css
display: inline-flex;
align-items: center;
gap: 6px;
padding: 4px 8px 4px 10px;
background: #F1F5F9;
border-radius: 4px;
font-size: 12px;
color: #334155;

/* Remove button */
width: 16px;
height: 16px;
border-radius: 50%;
/* X icon, hover: background #E2E8F0 */
```

### Modals

#### Modal Structure
```css
/* Overlay */
background: rgba(15, 23, 42, 0.5);
backdrop-filter: blur(4px);

/* Modal */
background: #FFFFFF;
border-radius: 12px;
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
max-width: 480px; /* Small: 400px, Large: 640px, XL: 800px */
max-height: 85vh;
overflow: hidden;

/* Header */
padding: 20px 24px;
border-bottom: 1px solid #E2E8F0;
/* Title: 18px, SemiBold, Ink */
/* Close button: top-right, X icon */

/* Body */
padding: 24px;
overflow-y: auto;

/* Footer */
padding: 16px 24px;
border-top: 1px solid #E2E8F0;
background: #F8FAFC;
/* Buttons right-aligned */
```

#### Modal Animation
- Enter: Fade in overlay (200ms) + scale modal from 0.95 to 1 (200ms)
- Exit: Reverse

### Toast Notifications

```css
/* Container: fixed bottom-right, stack with gap */
position: fixed;
bottom: 24px;
right: 24px;

/* Toast */
display: flex;
align-items: flex-start;
gap: 12px;
padding: 16px;
background: #FFFFFF;
border-radius: 8px;
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
border-left: 4px solid; /* colour based on type */
min-width: 320px;
max-width: 420px;
```

| Type | Border Colour | Icon |
|------|---------------|------|
| Success | #10B981 | Check circle |
| Error | #EF4444 | X circle |
| Warning | #F59E0B | Alert triangle |
| Info | #2563EB | Info circle |

Auto-dismiss after 5 seconds (configurable). Include close button.

### Dropdown Menu

```css
/* Trigger: button or text with chevron */

/* Menu */
background: #FFFFFF;
border: 1px solid #E2E8F0;
border-radius: 8px;
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
padding: 4px;
min-width: 180px;

/* Menu item */
padding: 10px 12px;
border-radius: 4px;
font-size: 14px;
color: #334155;
cursor: pointer;

/* Menu item hover */
background: #F8FAFC;

/* Menu item active */
background: #EFF6FF;
color: #2563EB;

/* Divider */
height: 1px;
background: #E2E8F0;
margin: 4px 0;

/* Destructive item */
color: #EF4444;
```

### Tabs

```css
/* Tab list */
display: flex;
border-bottom: 1px solid #E2E8F0;
gap: 0;

/* Tab */
padding: 12px 20px;
font-size: 14px;
font-weight: 500;
color: #64748B;
border-bottom: 2px solid transparent;
margin-bottom: -1px;
cursor: pointer;

/* Tab hover */
color: #334155;

/* Tab active */
color: #2563EB;
border-bottom-color: #2563EB;
```

### Breadcrumbs

```css
display: flex;
align-items: center;
gap: 8px;
font-size: 14px;

/* Link */
color: #64748B;

/* Link hover */
color: #2563EB;

/* Separator */
color: #CBD5E1;
/* chevron-right icon, 16px */

/* Current (last item) */
color: #334155;
font-weight: 500;
```

### Pagination

```css
display: flex;
align-items: center;
gap: 8px;

/* Info text */
font-size: 14px;
color: #64748B;
margin-right: auto;

/* Page button */
width: 36px;
height: 36px;
border-radius: 6px;
font-size: 14px;
color: #334155;
background: #FFFFFF;
border: 1px solid #E2E8F0;

/* Page button hover */
background: #F8FAFC;

/* Page button active */
background: #2563EB;
color: #FFFFFF;
border-color: #2563EB;

/* Prev/Next buttons */
/* Same as page button, with arrow icon */
```

### Empty States

```html
<div class="empty-state">
  <div class="empty-icon">📦</div>
  <h3>No orders yet</h3>
  <p>When you place orders, they'll appear here.</p>
  <button class="primary">Browse Products</button>
</div>
```

| Element | Style |
|---------|-------|
| Container | Centered, padding 48px |
| Icon | 48px, muted colour or illustration |
| Heading | 18px, SemiBold, Ink |
| Description | 14px, Regular, Steel, max-width 300px |
| Action button | Primary button |

### Loading States

**Skeleton Loading:**
```css
/* Skeleton block */
background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
background-size: 200% 100%;
animation: shimmer 1.5s infinite;
border-radius: 4px;

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Spinner:**
```css
width: 24px;
height: 24px;
border: 2px solid #E2E8F0;
border-top-color: #2563EB;
border-radius: 50%;
animation: spin 0.8s linear infinite;
```

---

## Page Patterns

### List Page (Orders, Quotes, Invoices)

```
┌─────────────────────────────────────────────────────────────┐
│  Page Header: "Orders"                    [+ New Order]     │
├─────────────────────────────────────────────────────────────┤
│  Filters Bar: [Search] [Status ▾] [Date Range] [Clear]      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Table                                              │    │
│  │  ☐  Order #   Customer      Status    Total   Date │    │
│  │  ☐  ORD-001   ABC Mining    Pending   R12,450  ...  │    │
│  │  ☐  ORD-002   XYZ Foods     Shipped   R8,200   ...  │    │
│  └─────────────────────────────────────────────────────┘    │
│  Pagination: Showing 1-20 of 156         [< Prev] [Next >]  │
└─────────────────────────────────────────────────────────────┘
```

### Detail Page (Order Detail, Quote Detail)

```
┌─────────────────────────────────────────────────────────────┐
│  Breadcrumb: Orders > ORD-2025-00123                        │
│  Page Header: "Order #ORD-2025-00123"   [Edit] [Actions ▾]  │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────────────────┐     │
│  │  Status Card     │  │  Customer Info Card          │     │
│  │  [Badge: Pending]│  │  ABC Mining Ltd              │     │
│  │  Created: Jan 25 │  │  Contact: John Smith         │     │
│  └──────────────────┘  └──────────────────────────────┘     │
├─────────────────────────────────────────────────────────────┤
│  Tabs: [Items] [Documents] [Activity]                       │
├─────────────────────────────────────────────────────────────┤
│  Tab Content (Items table, document list, or activity log)  │
└─────────────────────────────────────────────────────────────┘
```

### Form Page (New Order, Edit Quote)

```
┌─────────────────────────────────────────────────────────────┐
│  Page Header: "New Order"                     [Cancel]      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Section: Customer Details                          │    │
│  │  [Customer Select ▾]                                │    │
│  │  Delivery Address: [Select ▾]                       │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Section: Order Items                               │    │
│  │  [Product search / add]                             │    │
│  │  Items table with qty, price                        │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Section: Notes                                     │    │
│  │  [Textarea]                                         │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  Footer: [Cancel]                    [Save Draft] [Submit]  │
└─────────────────────────────────────────────────────────────┘
```

### Dashboard Page

```
┌─────────────────────────────────────────────────────────────┐
│  Page Header: "Dashboard"                                   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                       │
│  │Stat 1│ │Stat 2│ │Stat 3│ │Stat 4│   (4 stat cards)      │
│  └──────┘ └──────┘ └──────┘ └──────┘                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐ ┌─────────────────────────┐    │
│  │  Recent Orders          │ │  Pending Quotes         │    │
│  │  (mini table)           │ │  (mini table)           │    │
│  │  [View All →]           │ │  [View All →]           │    │
│  └─────────────────────────┘ └─────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Responsive Behaviour

### Breakpoints

| Name | Width | Sidebar |
|------|-------|---------|
| Mobile | < 768px | Hidden, hamburger menu |
| Tablet | 768px - 1024px | Collapsed (icons only, 64px) |
| Desktop | > 1024px | Full sidebar (240px) |

### Mobile Adaptations

- Sidebar becomes slide-out drawer
- Tables become card lists on mobile
- Stat cards stack vertically
- Modals become full-screen
- Filters collapse into dropdown/drawer

---

## Accessibility Requirements

### Keyboard Navigation
- All interactive elements focusable via Tab
- Escape closes modals/dropdowns
- Arrow keys navigate within menus
- Enter/Space activates buttons

### Focus States
```css
/* Visible focus ring */
outline: none;
box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.4);
```

### Colour Contrast
- Text: Minimum 4.5:1 contrast ratio (WCAG AA)
- Large text (18px+): Minimum 3:1
- Interactive elements: Minimum 3:1

### Screen Readers
- Use semantic HTML (button, nav, main, etc.)
- Include aria-labels for icon-only buttons
- Use aria-live for dynamic content updates
- Form fields have associated labels

---

## Performance Guidelines

### Loading Strategy
1. Show skeleton/loading state immediately
2. Load critical content first (header, navigation)
3. Progressive enhancement for non-critical features
4. Lazy load images and heavy components

### Optimistic Updates
- For simple actions (toggle, delete), update UI immediately
- Show loading indicator for network requests
- Rollback on error with toast notification

### Pagination
- Default 20 items per page
- Option to change: 20, 50, 100
- For large datasets, consider infinite scroll

---

## Component Checklist

When building new components, ensure:

- [ ] Follows colour palette from Brand Identity
- [ ] Uses correct typography scale
- [ ] Has hover, active, focus, and disabled states
- [ ] Keyboard accessible
- [ ] Works on mobile breakpoints
- [ ] Has loading state (if async)
- [ ] Has empty state (if list/data)
- [ ] Has error state (if form/input)
- [ ] Animations use defined timing
- [ ] Tested with screen reader
