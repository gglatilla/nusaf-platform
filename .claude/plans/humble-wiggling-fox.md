# Fix: Next.js Route Conflict

## Problem

Build error on Vercel:
```
Error: You cannot use different slug names for the same dynamic path ('id' !== 'categorySlug').
```

**Root cause**: Next.js App Router route groups `(portal)` and `(website)` share the same URL namespace. Both have `/products/[param]` routes with different parameter names:
- `(portal)/products/[id]/page.tsx` → `/products/123` (admin product detail)
- `(website)/products/[categorySlug]/page.tsx` → `/products/conveyor-components` (public category)

## Solution

Rename the website's category pages from `/products/...` to `/browse/...`:
- `/products` → `/browse` (products index)
- `/products/[categorySlug]` → `/browse/[categorySlug]` (category page)
- `/products/[categorySlug]/[subCategorySlug]` → `/browse/[categorySlug]/[subCategorySlug]` (subcategory page)

This keeps the portal's `/products/[id]` routes unchanged and gives the public site a semantic URL for browsing.

## Files to Modify

### 1. Move Route Directories (3 files)

```
frontend/src/app/(website)/products/
  → frontend/src/app/(website)/browse/
```

Files to move:
- `products/page.tsx` → `browse/page.tsx`
- `products/[categorySlug]/page.tsx` → `browse/[categorySlug]/page.tsx`
- `products/[categorySlug]/[subCategorySlug]/page.tsx` → `browse/[categorySlug]/[subCategorySlug]/page.tsx`

### 2. Update Website Links (6 files)

These files have links to `/products/...` that need updating to `/browse/...`:

| File | Links to Update |
|------|-----------------|
| `components/website/MegaMenu.tsx` | `/products`, `/products/${category.slug}`, `/products/${category.slug}/${sub.slug}` |
| `components/website/MobileNavDrawer.tsx` | `/products`, `/products/${category.slug}`, `/products/${category.slug}/${sub.slug}` |
| `app/(website)/browse/page.tsx` | `/products/${category.slug}` in CategoryCard href |
| `app/(website)/browse/[categorySlug]/page.tsx` | Breadcrumbs and subcategory hrefs |
| `app/(website)/about/page.tsx` | CTA link `href="/products"` |
| `app/(website)/services/page.tsx` | CTA link `href="/products"` |

### 3. Files NOT to Change (Portal)

These portal files use `/products/[id]` and should remain unchanged:
- `app/(portal)/dashboard/page.tsx`
- `app/(portal)/quotes/[id]/page.tsx`
- `app/(portal)/products/[id]/page.tsx`
- `components/products/WhereUsedSection.tsx`
- `components/quotes/QuoteListTable.tsx`
- `components/quotes/QuoteCart.tsx`
- `components/products/ProductDetailModal.tsx`
- `components/inventory/InventoryStockTable.tsx`

## Verification

1. Run `npm run typecheck` in frontend
2. Run `npm run build` in frontend (should complete without route conflict)
3. Test navigation: Homepage → Browse → Category → Subcategory
4. Verify portal `/products/[id]` routes still work

## Alternative Considered

Could rename `[categorySlug]` to `[id]` to match, but this would be semantically confusing and require logic changes to differentiate category slugs from product IDs.
