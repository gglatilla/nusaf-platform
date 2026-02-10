/**
 * Centralized URL builders for the marketing website.
 * Use these functions to generate URLs consistently across the codebase.
 */

/**
 * Product-related URLs for the marketing website (nusaf.net)
 */
export const productUrls = {
  /**
   * Main products page with categories and search
   * @example productUrls.index() => '/products'
   */
  index: () => '/products',

  /**
   * Category page
   * @example productUrls.category('conveyor-components') => '/products/conveyor-components'
   */
  category: (slug: string) => `/products/${slug}`,

  /**
   * Subcategory page
   * @example productUrls.subCategory('conveyor-components', 'bases') => '/products/conveyor-components/bases'
   */
  subCategory: (categorySlug: string, subCategorySlug: string) =>
    `/products/${categorySlug}/${subCategorySlug}`,

  /**
   * Product detail page
   * @example productUrls.detail('CHN-123') => '/products/p/CHN-123'
   */
  detail: (sku: string) => `/products/p/${sku}`,

  /**
   * Products page with search query
   * @example productUrls.search('sprocket') => '/products?search=sprocket'
   */
  search: (query: string) => `/products?search=${encodeURIComponent(query)}`,
};

/**
 * Static page URLs for the marketing website
 */
export const pageUrls = {
  home: () => '/',
  about: () => '/about',
  contact: () => '/contact',
  services: () => '/services',
  solutions: () => '/solutions',
  resources: () => '/resources',
  privacy: () => '/privacy',
  terms: () => '/terms',
};

/**
 * Website URLs (www.nusaf.net)
 * These are for generating external links to the public marketing site from the portal.
 */
export const websiteUrls = {
  /**
   * Get the website base URL from environment or default
   */
  base: () => process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nusaf.net',

  /**
   * Product detail page on the public website
   * @example websiteUrls.productDetail('CHN-123') => 'https://www.nusaf.net/products/p/CHN-123'
   */
  productDetail: (sku: string) => `${websiteUrls.base()}/products/p/${sku}`,

  /**
   * Product detail page with preview mode (for admins)
   */
  productPreview: (sku: string) => `${websiteUrls.base()}/products/p/${sku}?preview=true`,
};

/**
 * Portal URLs (app.nusaf.net)
 * These are for generating external links to the portal from the marketing site.
 */
export const portalUrls = {
  /**
   * Get the portal base URL from environment or default
   */
  base: () => process.env.NEXT_PUBLIC_PORTAL_URL || 'https://app.nusaf.net',

  /**
   * Portal login page
   */
  login: () => `${portalUrls.base()}/login`,

  /**
   * Portal dashboard
   */
  dashboard: () => `${portalUrls.base()}/dashboard`,
};

/**
 * Convenience export for all URLs
 */
export const urls = {
  products: productUrls,
  pages: pageUrls,
  portal: portalUrls,
  website: websiteUrls,
};

export default urls;
