/**
 * JSON-LD Structured Data Components for SEO
 *
 * These components render schema.org structured data as JSON-LD scripts.
 * They help search engines understand page content for rich results.
 */

import { PublicProductDetail, PublicProductImage } from '@/lib/api';

// ============================================
// ORGANIZATION SCHEMA
// ============================================

export interface OrganizationSchemaData {
  name: string;
  description: string;
  url: string;
  logo?: string;
  contactPoint?: {
    telephone: string;
    email: string;
    contactType: string;
  };
  address?: {
    streetAddress?: string;
    addressLocality: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry: string;
  };
  sameAs?: string[]; // Social media URLs
}

export function OrganizationJsonLd({ data }: { data: OrganizationSchemaData }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: data.name,
    description: data.description,
    url: data.url,
    ...(data.logo && { logo: data.logo }),
    ...(data.contactPoint && {
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: data.contactPoint.telephone,
        email: data.contactPoint.email,
        contactType: data.contactPoint.contactType,
      },
    }),
    ...(data.address && {
      address: {
        '@type': 'PostalAddress',
        ...data.address,
      },
    }),
    ...(data.sameAs && { sameAs: data.sameAs }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================
// PRODUCT SCHEMA
// ============================================

export interface ProductSchemaData {
  name: string;
  description?: string;
  sku: string;
  image?: string[];
  brand?: string;
  category?: string;
  url: string;
  // For B2B without public pricing, we don't include offers
}

export function ProductJsonLd({ data }: { data: ProductSchemaData }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name,
    ...(data.description && { description: data.description }),
    sku: data.sku,
    ...(data.image && data.image.length > 0 && { image: data.image }),
    ...(data.brand && {
      brand: {
        '@type': 'Brand',
        name: data.brand,
      },
    }),
    ...(data.category && { category: data.category }),
    url: data.url,
    // Note: No "offers" since this is B2B with quote-based pricing
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Helper to build ProductSchemaData from PublicProductDetail
 */
export function buildProductSchema(
  product: PublicProductDetail,
  baseUrl: string
): ProductSchemaData {
  return {
    name: product.title,
    description: product.description || undefined,
    sku: product.sku,
    image: product.images.length > 0
      ? product.images.map((img) => img.url)
      : undefined,
    brand: 'Nusaf', // Could also use supplier brand if available
    category: product.category?.name,
    url: `${baseUrl}/catalog/${product.sku}`,
  };
}

// ============================================
// BREADCRUMB SCHEMA
// ============================================

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================
// LOCAL BUSINESS SCHEMA (for contact page)
// ============================================

export interface LocalBusinessSchemaData {
  name: string;
  description: string;
  url: string;
  telephone: string;
  email: string;
  address: {
    streetAddress?: string;
    addressLocality: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  openingHours?: string[]; // e.g., ["Mo-Fr 08:00-17:00"]
}

export function LocalBusinessJsonLd({ data }: { data: LocalBusinessSchemaData }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: data.name,
    description: data.description,
    url: data.url,
    telephone: data.telephone,
    email: data.email,
    address: {
      '@type': 'PostalAddress',
      ...data.address,
    },
    ...(data.geo && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: data.geo.latitude,
        longitude: data.geo.longitude,
      },
    }),
    ...(data.openingHours && { openingHoursSpecification: data.openingHours }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
