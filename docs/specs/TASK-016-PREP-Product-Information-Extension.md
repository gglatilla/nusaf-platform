# TASK-016-PREP: Product Information Extension

## Overview

Before building the public website product pages (TASK-016), we need to extend the Product model to support:
- Marketing content for public website
- Technical specifications
- Product documents (datasheets, catalogs, CAD drawings)
- Product images
- Competitor cross-references (for part number search)

All files (PDFs, images) must be stored in **Cloudflare R2** bucket.

---

## Schema Changes

### 1. Extend Product Model

Add these fields to the existing `Product` model:

```prisma
model Product {
  // ... existing fields ...
  
  // Marketing/Public Website Content
  marketingTitle       String?   @map("marketing_title")       // SEO-friendly title for public site
  marketingDescription String?   @map("marketing_description") @db.Text  // Rich description for public site
  metaTitle            String?   @map("meta_title")            // SEO meta title (max 60 chars)
  metaDescription      String?   @map("meta_description")      // SEO meta description (max 160 chars)
  
  // Technical Specifications (flexible JSON structure)
  specifications       Json?     // e.g. { "material": "Stainless Steel", "loadCapacity": "500kg", "thread": "M8" }
  
  // Publishing status for public website
  isPublished          Boolean   @default(false) @map("is_published")  // Only published products show on public site
  publishedAt          DateTime? @map("published_at")
  
  // Relations to new models
  documents            ProductDocument[]
  crossReferences      ProductCrossReference[]
  images               ProductImage[]
}
```

### 2. Create ProductDocument Model

```prisma
model ProductDocument {
  id          String       @id @default(uuid())
  productId   String       @map("product_id")
  product     Product      @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  type        DocumentType
  name        String                    // Display name: "Product Datasheet"
  fileName    String       @map("file_name")  // Original filename: "NUS-LF-SS-40-datasheet.pdf"
  fileUrl     String       @map("file_url")   // R2 URL
  fileSize    Int?         @map("file_size")  // Size in bytes
  mimeType    String?      @map("mime_type")  // "application/pdf"
  
  sortOrder   Int          @default(0) @map("sort_order")
  isActive    Boolean      @default(true) @map("is_active")
  
  createdAt   DateTime     @default(now()) @map("created_at")
  createdBy   String?      @map("created_by")
  updatedAt   DateTime     @updatedAt @map("updated_at")
  
  @@index([productId])
  @@map("product_documents")
}

enum DocumentType {
  DATASHEET           // Technical specification sheet for single product
  CATALOG             // Category/range brochure (e.g., "Levelling Feet Catalog 2025")
  CAD_DRAWING         // Technical drawings (DWG, DXF as PDF)
  INSTALLATION_MANUAL // Assembly/installation instructions
  CERTIFICATE         // ISO, CE, quality certificates
  MSDS                // Material Safety Data Sheet
  OTHER
}
```

### 3. Create ProductCrossReference Model

For competitor part number search functionality:

```prisma
model ProductCrossReference {
  id            String   @id @default(uuid())
  productId     String   @map("product_id")
  product       Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  manufacturer  String              // Competitor name: "Elesa+Ganter", "Halder", "Norelem"
  partNumber    String   @map("part_number")  // Competitor's part number: "LV.A-40-C-M8x40"
  notes         String?             // "Exact equivalent" or "Similar - check load rating"
  isExact       Boolean  @default(false) @map("is_exact")  // true = exact match, false = similar/compatible
  
  createdAt     DateTime @default(now()) @map("created_at")
  createdBy     String?  @map("created_by")
  
  @@unique([productId, manufacturer, partNumber])
  @@index([manufacturer, partNumber])  // For cross-reference search
  @@index([partNumber])                // For partial match search
  @@map("product_cross_references")
}
```

### 4. Create ProductImage Model

```prisma
model ProductImage {
  id          String   @id @default(uuid())
  productId   String   @map("product_id")
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  url         String              // R2 URL
  thumbnailUrl String? @map("thumbnail_url")  // R2 URL for thumbnail (optional)
  altText     String?  @map("alt_text")       // Accessibility alt text
  caption     String?             // Optional caption
  isPrimary   Boolean  @default(false) @map("is_primary")  // Primary image shown in listings
  sortOrder   Int      @default(0) @map("sort_order")
  
  createdAt   DateTime @default(now()) @map("created_at")
  createdBy   String?  @map("created_by")
  
  @@index([productId])
  @@map("product_images")
}
```

---

## Cloudflare R2 Integration

### R2 Bucket Structure

```
nusaf-assets/
├── products/
│   ├── images/
│   │   ├── {productId}/
│   │   │   ├── {uuid}-original.jpg
│   │   │   ├── {uuid}-thumbnail.jpg
│   │   │   └── ...
│   └── documents/
│       ├── {productId}/
│       │   ├── {uuid}-datasheet.pdf
│       │   ├── {uuid}-catalog.pdf
│       │   └── ...
└── catalogs/
    └── {year}/
        └── levelling-feet-catalog-2025.pdf
```

### R2 Service

Create `backend/src/services/r2.service.ts`:

```typescript
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'nusaf-assets';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // e.g., https://assets.nusaf.co.za

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadFile(
  file: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  await r2Client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
  }));
  
  return `${R2_PUBLIC_URL}/${key}`;
}

export async function deleteFile(key: string): Promise<void> {
  await r2Client.send(new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  }));
}

export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });
  
  return getSignedUrl(r2Client, command, { expiresIn });
}

// Helper to generate storage key
export function generateStorageKey(
  type: 'image' | 'document',
  productId: string,
  fileName: string
): string {
  const uuid = crypto.randomUUID();
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return `products/${type}s/${productId}/${uuid}.${ext}`;
}
```

### Environment Variables

Add to `.env`:

```env
# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=nusaf-assets
R2_PUBLIC_URL=https://assets.nusaf.co.za
```

---

## API Endpoints

### Product Documents

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/products/:id/documents` | List product documents | Public |
| POST | `/api/v1/products/:id/documents` | Upload document | ADMIN |
| DELETE | `/api/v1/products/:id/documents/:docId` | Delete document | ADMIN |

### Product Images

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/products/:id/images` | List product images | Public |
| POST | `/api/v1/products/:id/images` | Upload image | ADMIN |
| PATCH | `/api/v1/products/:id/images/:imgId` | Update (set primary, reorder) | ADMIN |
| DELETE | `/api/v1/products/:id/images/:imgId` | Delete image | ADMIN |

### Product Cross-References

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/products/:id/cross-references` | List cross-refs for product | Public |
| POST | `/api/v1/products/:id/cross-references` | Add cross-reference | ADMIN |
| PATCH | `/api/v1/products/:id/cross-references/:refId` | Update cross-reference | ADMIN |
| DELETE | `/api/v1/products/:id/cross-references/:refId` | Delete cross-reference | ADMIN |
| GET | `/api/v1/public/cross-reference/search?q=LV.A-40` | Search by competitor part number | Public |

### Public Product API (extend existing)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/public/products` | List published products (no prices) |
| GET | `/api/v1/public/products/:sku` | Get product detail by SKU (no prices) |
| GET | `/api/v1/public/products/search?q=` | Search products + cross-references |

---

## Cross-Reference Search Logic

When a user searches on the public website:

```typescript
// Search products by SKU, description, OR competitor part number
async function searchPublicProducts(query: string) {
  // 1. Search products directly
  const directMatches = await prisma.product.findMany({
    where: {
      isPublished: true,
      isActive: true,
      OR: [
        { nusafSku: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { supplierSku: { contains: query, mode: 'insensitive' } },
      ],
    },
  });
  
  // 2. Search cross-references
  const crossRefMatches = await prisma.productCrossReference.findMany({
    where: {
      partNumber: { contains: query, mode: 'insensitive' },
      product: {
        isPublished: true,
        isActive: true,
      },
    },
    include: {
      product: true,
    },
  });
  
  // 3. Merge and deduplicate
  const productMap = new Map();
  
  directMatches.forEach(p => productMap.set(p.id, { ...p, matchType: 'direct' }));
  
  crossRefMatches.forEach(cr => {
    if (!productMap.has(cr.product.id)) {
      productMap.set(cr.product.id, {
        ...cr.product,
        matchType: 'cross-reference',
        matchedPartNumber: cr.partNumber,
        matchedManufacturer: cr.manufacturer,
      });
    }
  });
  
  return Array.from(productMap.values());
}
```

---

## Public Website Product Detail Page

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│ BREADCRUMBS                                                             │
│ Home > Levelling Feet > Stainless Steel > NUS-LF-SS-40                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────┐    PRODUCT HEADER                                │
│  │                  │                                                   │
│  │   PRIMARY IMAGE  │    Title: Stainless Steel Levelling Foot 40mm    │
│  │                  │    SKU: NUS-LF-SS-40-M8                          │
│  │                  │    Supplier Badge: [Elesa+Ganter]                │
│  └──────────────────┘    Category: Levelling Feet > Stainless Steel    │
│  [thumb] [thumb] [thumb]                                                │
│                          Stock Status: ● In Stock                      │
│                                                                         │
│                          [Add to Quote]  [Download Datasheet ↓]        │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ TABS: [Description] [Specifications] [Documents] [Cross-Reference]     │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ DESCRIPTION TAB (default):                                              │
│                                                                         │
│ {marketingDescription - rich text content}                              │
│                                                                         │
│ High-quality stainless steel levelling foot suitable for food          │
│ processing, pharmaceutical, and cleanroom environments. Features        │
│ adjustable height and anti-slip rubber base pad for stability...       │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ SPECIFICATIONS TAB:                                                     │
│                                                                         │
│ ┌─────────────────────────┬────────────────────────────────────────┐   │
│ │ Material                │ Stainless Steel AISI 304               │   │
│ ├─────────────────────────┼────────────────────────────────────────┤   │
│ │ Base Diameter           │ 40mm                                   │   │
│ ├─────────────────────────┼────────────────────────────────────────┤   │
│ │ Thread                  │ M8                                     │   │
│ ├─────────────────────────┼────────────────────────────────────────┤   │
│ │ Load Capacity (static)  │ 500kg                                  │   │
│ ├─────────────────────────┼────────────────────────────────────────┤   │
│ │ Adjustment Range        │ 15mm                                   │   │
│ ├─────────────────────────┼────────────────────────────────────────┤   │
│ │ Base Pad Material       │ NBR Rubber                             │   │
│ └─────────────────────────┴────────────────────────────────────────┘   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ DOCUMENTS TAB:                                                          │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────┐    │
│ │ 📄 Product Datasheet                                            │    │
│ │    PDF • 245 KB                          [View] [Download]      │    │
│ ├─────────────────────────────────────────────────────────────────┤    │
│ │ 📄 Levelling Feet Catalog 2025                                  │    │
│ │    PDF • 4.2 MB                          [View] [Download]      │    │
│ ├─────────────────────────────────────────────────────────────────┤    │
│ │ 📐 Technical Drawing                                            │    │
│ │    PDF • 156 KB                          [View] [Download]      │    │
│ └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ CROSS-REFERENCE TAB:                                                    │
│                                                                         │
│ Looking for a replacement? This product is equivalent to:              │
│                                                                         │
│ ┌──────────────────┬───────────────────────┬──────────────────────┐    │
│ │ Manufacturer     │ Part Number           │ Match Type           │    │
│ ├──────────────────┼───────────────────────┼──────────────────────┤    │
│ │ Elesa+Ganter     │ LV.A-40-C-M8x40       │ ● Exact Replacement  │    │
│ ├──────────────────┼───────────────────────┼──────────────────────┤    │
│ │ Halder           │ 22720.0040            │ ● Exact Replacement  │    │
│ ├──────────────────┼───────────────────────┼──────────────────────┤    │
│ │ Norelem          │ 22450-040801          │ ○ Similar Product    │    │
│ └──────────────────┴───────────────────────┴──────────────────────┘    │
│                                                                         │
│ Note: Cross-references are provided for convenience. Please verify     │
│ specifications match your requirements before ordering.                │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ RELATED PRODUCTS:                                                       │
│                                                                         │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                        │
│ │ [img]   │ │ [img]   │ │ [img]   │ │ [img]   │                        │
│ │ LF 50mm │ │ LF 60mm │ │ LF Zinc │ │ Adj.Foot│                        │
│ │ [Quote] │ │ [Quote] │ │ [Quote] │ │ [Quote] │                        │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Admin UI (Phase 2 - After Public Website)

Add these tabs to the Product Edit page in the admin portal:

### Marketing Tab
- Marketing Title (text input)
- Marketing Description (rich text editor - TipTap or similar)
- Meta Title (text input, max 60 chars with counter)
- Meta Description (textarea, max 160 chars with counter)
- Published toggle (with publishedAt timestamp)

### Specifications Tab
- Dynamic key-value editor
- Add/remove specification rows
- Drag to reorder
- Common spec templates per category (future)

### Images Tab
- Drag-and-drop upload zone
- Image preview gallery
- Set primary image
- Drag to reorder
- Delete with confirmation
- Upload to R2 on save

### Documents Tab
- Drag-and-drop upload zone
- Document type selector (dropdown)
- Display name input
- File size shown after upload
- Delete with confirmation
- Upload to R2 on save

### Cross-References Tab
- Add cross-reference form:
  - Manufacturer (text input with autocomplete from existing)
  - Part Number (text input)
  - Exact Match toggle
  - Notes (optional textarea)
- List existing cross-references
- Edit/Delete actions

---

## Implementation Order

### Phase 1: Schema + API (TASK-016-PREP)
1. Add fields to Product model
2. Create ProductDocument, ProductCrossReference, ProductImage models
3. Run migration
4. Create R2 service
5. Create API endpoints for documents, images, cross-references
6. Create public product search with cross-reference support

### Phase 2: Public Website (TASK-016)
1. Product listing page with search
2. Product detail page with tabs
3. Cross-reference search functionality
4. Document download tracking (optional)

### Phase 3: Admin UI Enhancement (TASK-016-ADMIN)
1. Marketing tab
2. Specifications editor
3. Images management with R2 upload
4. Documents management with R2 upload
5. Cross-references management

---

## Environment Variables Required

```env
# Cloudflare R2 Storage
CLOUDFLARE_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=nusaf-assets
R2_PUBLIC_URL=https://assets.nusaf.co.za
```

---

## Dependencies to Add

```bash
# Backend
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Frontend (if using rich text editor)
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link
```

---

## Notes

1. **No prices on public website** - Products show "Request Quote" instead of prices
2. **Stock status simplified** - Show "In Stock", "Low Stock", "Contact Us" (not exact quantities)
3. **Cross-reference search is key** - Customers search by competitor part numbers they know
4. **SEO optimization** - Include cross-reference part numbers in meta descriptions for search ranking
5. **Document downloads** - Track downloads for analytics (which datasheets are popular)
6. **R2 for all files** - Both images and documents stored in Cloudflare R2
