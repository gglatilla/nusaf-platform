// Public API types (no authentication required)

export interface PublicProductImage {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  caption: string | null;
  isPrimary: boolean;
}

export interface PublicProductDocument {
  id: string;
  type: 'DATASHEET' | 'CATALOG' | 'CAD_DRAWING' | 'INSTALLATION_MANUAL' | 'CERTIFICATE' | 'MSDS' | 'OTHER';
  name: string;
  fileUrl: string;
  fileSize: number | null;
}

export interface PublicCrossReference {
  id: string;
  competitorBrand: string;
  competitorSku: string;
  notes: string | null;
  isExact: boolean;
}

export interface PublicProduct {
  id: string;
  sku: string;
  title: string;
  description: string | null;
  category: {
    id: string;
    code: string;
    name: string;
  };
  subCategory: {
    id: string;
    code: string;
    name: string;
  } | null;
  primaryImage: {
    url: string;
    thumbnailUrl: string | null;
    altText: string | null;
  } | null;
  unitOfMeasure: string;
  crossReferences?: PublicCrossReference[];
}

export interface PublicProductDetail extends Omit<PublicProduct, 'primaryImage'> {
  specifications: Record<string, string | number | boolean> | null;
  metaTitle: string | null;
  metaDescription: string | null;
  images: PublicProductImage[];
  documents: PublicProductDocument[];
  crossReferences: PublicCrossReference[];
}

export interface PublicProductsParams {
  categoryId?: string;
  categoryCode?: string;
  subCategoryId?: string;
  subCategoryCode?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PublicProductsResponse {
  products: PublicProduct[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface PublicProductSearchParams {
  q: string;
  page?: number;
  pageSize?: number;
}

export interface PublicProductSearchResponse {
  products: PublicProduct[];
  pagination: {
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
  searchTerm: string;
}

export interface PublicSubCategory {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  productCount: number;
}

export interface PublicCategory {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  productCount: number;
  subCategories: PublicSubCategory[];
}

export interface PublicCategoriesResponse {
  categories: PublicCategory[];
}

export interface PublicCategoryWithParent extends PublicSubCategory {
  category: {
    id: string;
    code: string;
    name: string;
    slug: string;
  };
}

export interface PublicCrossRefSearchParams {
  q: string;
  brand?: string;
}

export interface PublicCrossRefSearchResult {
  crossReference: {
    competitorBrand: string;
    competitorSku: string;
    isExact: boolean;
    notes: string | null;
  };
  product: PublicProduct;
}

export interface PublicCrossRefSearchResponse {
  results: PublicCrossRefSearchResult[];
  searchedPartNumber: string;
  searchedBrand: string | null;
}

// Quote request types
export interface GuestQuoteItem {
  productId: string;
  quantity: number;
}

export interface GuestQuoteRequestData {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  message?: string;
  items: GuestQuoteItem[];
}

export interface GuestQuoteRequestResponse {
  requestNumber: string;
  message: string;
}

// Contact form types
export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  message: string;
}

export interface ContactFormResponse {
  success: boolean;
  message: string;
}
