// Public API types (no authentication required)

export interface PublicProductImage {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  caption: string | null;
  isPrimary: boolean;
}

export type ProductDocumentType =
  | 'DATASHEET'
  | 'CATALOG'
  | 'CAD_DRAWING'
  | 'INSTALLATION_MANUAL'
  | 'CERTIFICATE'
  | 'MSDS'
  | 'OTHER'
  // CAD 2D formats
  | 'CAD_2D_DXF'
  | 'CAD_2D_DWG'
  | 'CAD_2D_PDF'
  // CAD 3D formats
  | 'CAD_3D_STEP'
  | 'CAD_3D_IGES'
  | 'CAD_3D_SAT'
  | 'CAD_3D_PARASOLID'
  | 'CAD_3D_SOLIDWORKS'
  | 'CAD_3D_INVENTOR'
  | 'CAD_3D_CATIA';

export interface PublicProductDocument {
  id: string;
  type: ProductDocumentType;
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
  specs?: Record<string, string>;
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
  filters?: {
    categoryId: string | null;
    subCategoryId: string | null;
    search: string | null;
    specs: Record<string, string> | null;
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

export interface RelatedProductsResponse {
  products: PublicProduct[];
  sourceProductSku: string;
  categoryId: string;
  subCategoryId: string | null;
}

// Specification filter types
export interface SpecificationOption {
  key: string;
  label: string;
  values: string[];
  valueCount: number;
}

export interface SpecificationsParams {
  categoryId?: string;
  categoryCode?: string;
  subCategoryId?: string;
  subCategoryCode?: string;
}

export interface SpecificationsResponse {
  specifications: SpecificationOption[];
  productCount: number;
  categoryId: string | null;
  subCategoryId: string | null;
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
