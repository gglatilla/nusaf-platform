# Multi-Tenant Architecture Skill

## Overview

This skill defines Nusaf's customer portal architecture, including company isolation, user management, pricing tiers, and portal features.

---

## Multi-Tenancy Model

Each customer company is a tenant with:
- Isolated data (their quotes, orders, invoices only)
- Multiple users per company
- Role-based access within the company
- Tier-based pricing

---

## Pricing Tiers

| Tier | Discount off List Price |
|------|------------------------|
| End User | 30% |
| OEM/Reseller | 40% |
| Distributor | 50% |

**Display rule:** Customers see only their discounted price, never the list price.

**Calculation:**
```
Customer Price = List Price × (1 - Tier Discount)

Example (List Price R1,000):
- End User: R1,000 × 0.70 = R700
- OEM/Reseller: R1,000 × 0.60 = R600
- Distributor: R1,000 × 0.50 = R500
```

---

## User Roles

Each company can have multiple users with different roles:

| Role | Permissions |
|------|-------------|
| **Viewer** | View quotes, orders, invoices, catalog with pricing, request quotes, upload drawings |
| **Buyer** | All Viewer permissions + place orders |
| **Admin** | All Buyer permissions + manage company users |

---

## Portal Features

### Product Catalog
- Browse products by category/sub-category
- Search by SKU, description, specifications
- View product details, specs, images
- See pricing (tier-discounted price only)
- Download technical documents, CAD files

### Quote Management
- Request new quote
- Upload PDFs and drawings for custom parts
- View quote history
- Accept/decline quotes
- Quote becomes order when accepted

### Order Management
- View orders and status
- Track order progress (picking, manufacturing, transit)
- Place orders (Buyer role required)
- Reorder from previous orders

### Invoice & Documents
- View invoices
- Download invoice PDFs
- Download quotes, orders, delivery notes
- Access archived documents

### Stock Availability
- Check stock levels per product
- See availability across locations
- Backorder indication for out-of-stock items

### Delivery Tracking
- Track shipment status
- View expected delivery date
- Delivery history

### Modular Chain Configurator
- Configure custom modular chains
- Visual configurator interface
- Real-time pricing as configured
- Save configurations
- Add configured chain to quote request

### User Management (Admin only)
- Invite new users to company
- Assign roles
- Deactivate users
- View user activity

---

## Data Isolation

**Strict tenant isolation rules:**

| Data Type | Visibility |
|-----------|------------|
| Quotes | Own company only |
| Orders | Own company only |
| Invoices | Own company only |
| Documents | Own company only |
| Products | All (but pricing is tier-specific) |
| Stock levels | All (read-only) |
| User list | Own company only |

**Implementation:**
- All queries must include `company_id` filter
- API endpoints validate user belongs to company
- No cross-tenant data leakage

---

## Database Schema

### Company

```
Company
├── id
├── name
├── code (unique short code)
├── pricing_tier (EndUser, OEMReseller, Distributor)
├── credit_limit
├── payment_terms
├── billing_address
├── shipping_addresses[] (can have multiple)
├── is_active
├── created_at
├── updated_at
└── deleted_at
```

### Company User

```
CompanyUser
├── id
├── company_id (FK)
├── user_id (FK to auth user)
├── role (Viewer, Buyer, Admin)
├── is_active
├── invited_by
├── invited_at
├── accepted_at
├── created_at
└── updated_at
```

### User Invitation

```
CompanyInvitation
├── id
├── company_id (FK)
├── email
├── role
├── invited_by
├── token (unique)
├── expires_at
├── accepted_at
├── created_at
```

---

## Authentication & Authorization

### Login Flow

1. User logs in with email/password
2. System looks up which company(s) user belongs to
3. If multiple companies, user selects which to access
4. Session includes `user_id` and `company_id`
5. All API calls filtered by `company_id`

### Authorization Checks

```
// Middleware pattern
function requireRole(minimumRole) {
  return (req, res, next) => {
    const userRole = req.user.companyRole;
    
    if (!hasMinimumRole(userRole, minimumRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

// Role hierarchy
const roleHierarchy = {
  Viewer: 1,
  Buyer: 2,
  Admin: 3
};

function hasMinimumRole(userRole, requiredRole) {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
```

### Tenant Isolation Middleware

```
// Every data query must include company filter
function tenantIsolation(req, res, next) {
  req.tenantFilter = {
    company_id: req.user.companyId
  };
  next();
}

// Usage in query
const orders = await prisma.order.findMany({
  where: {
    ...req.tenantFilter,
    // other filters
  }
});
```

---

## Pricing Display Logic

```
function getCustomerPrice(listPrice, company) {
  const discounts = {
    EndUser: 0.30,
    OEMReseller: 0.40,
    Distributor: 0.50
  };
  
  const discount = discounts[company.pricingTier];
  return listPrice * (1 - discount);
}

// API response - never expose list price
function formatProductForCustomer(product, company) {
  return {
    sku: product.sku,
    description: product.description,
    price: getCustomerPrice(product.listPrice, company),
    // DO NOT include: listPrice, tierDiscount
  };
}
```

---

## Quote Request with Uploads

### RFQ (Request for Quote) Flow

1. Customer uploads PDF/drawing or describes custom part
2. Optionally adds standard products from catalog
3. Submits quote request
4. Sales team receives notification
5. Sales creates quote
6. Customer receives quote notification
7. Customer accepts → becomes order

### File Upload

```
QuoteRequest
├── id
├── company_id (FK)
├── requested_by (user_id)
├── description
├── status (Pending, Quoted, Accepted, Declined, Expired)
├── created_at
└── updated_at

QuoteRequestItem
├── id
├── quote_request_id (FK)
├── item_type (Product, Custom)
├── product_id (FK, nullable - for catalog items)
├── quantity
├── description (for custom items)
├── created_at

QuoteRequestAttachment
├── id
├── quote_request_id (FK)
├── filename
├── file_url (R2 storage)
├── file_type (PDF, DWG, etc.)
├── uploaded_by
├── uploaded_at
```

### Storage

Attachments stored in Cloudflare R2:
```
/quote-requests/
  /{company_id}/
    /{quote_request_id}/
      ├── drawing.pdf
      ├── specs.pdf
      └── part-sketch.dwg
```

---

## Admin UI (Internal Staff)

### Customer Management
- List all companies
- View/edit company details
- Set pricing tier
- Set credit limit and payment terms
- View company users
- Impersonate customer view (see what they see)

### User Management
- View all portal users
- Deactivate users
- Reset passwords

---

## Portal UI Requirements

### Dashboard
- Recent quotes and status
- Recent orders and status
- Quick actions (new quote, reorder)

### Product Catalog
- Category navigation
- Search with filters
- Product detail pages
- Add to quote button

### Quote Request
- Add products from catalog
- Add custom items with description
- Upload files (drag-drop)
- Submit for quote

### Orders
- Order list with status
- Order detail with line items
- Track progress (picking, manufacturing, shipping)
- Reorder button

### Invoices
- Invoice list
- Download PDF
- Filter by date range

### Configurator
- Visual modular chain builder
- Save configurations
- Add to quote

### Settings (Admin)
- Company details (read-only for non-admin)
- User management
- Invite new users

---

## Security Considerations

1. **Tenant isolation** - Every query filtered by company_id
2. **Role enforcement** - Check role before sensitive actions
3. **File access** - Validate company owns the file before serving
4. **Invitation tokens** - Time-limited, single-use
5. **Session management** - Bind session to company, invalidate on role change
6. **Audit logging** - Log all sensitive actions with user and company

---

## Related Skills

- **Pricing & Product Domain**: List prices that get tier discount applied
- **Order Fulfillment & Operations**: Order processing after customer places order
- **Foundation Skills**: Authentication, API design, security patterns
- **Product Configurator Design**: Modular chain configurator feature
