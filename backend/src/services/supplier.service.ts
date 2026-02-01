import { Prisma, SupplierCurrency, SkuHandling } from '@prisma/client';
import { prisma } from '../config/database';
import { Decimal } from '@prisma/client/runtime/library';

// ============================================
// TYPES
// ============================================

export interface SupplierListFilters {
  search?: string;
  isActive?: boolean;
  currency?: SupplierCurrency;
  isLocal?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CreateSupplierInput {
  code: string;
  name: string;
  country?: string;
  currency?: SupplierCurrency;
  skuHandling: SkuHandling;
  isLocal?: boolean;
  email?: string;
  phone?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  paymentTerms?: string;
  minimumOrderValue?: number;
  notes?: string;
}

export interface UpdateSupplierInput {
  name?: string;
  country?: string;
  currency?: SupplierCurrency;
  skuHandling?: SkuHandling;
  isLocal?: boolean;
  isActive?: boolean;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  postalCode?: string | null;
  paymentTerms?: string | null;
  minimumOrderValue?: number | null;
  notes?: string | null;
}

export interface SupplierContactData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string | null;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierData {
  id: string;
  code: string;
  name: string;
  country: string;
  currency: SupplierCurrency;
  skuHandling: SkuHandling;
  isLocal: boolean;
  isActive: boolean;
  email: string | null;
  phone: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postalCode: string | null;
  paymentTerms: string | null;
  minimumOrderValue: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  contacts?: SupplierContactData[];
  _count?: {
    products: number;
  };
}

// ============================================
// LIST SUPPLIERS
// ============================================

/**
 * Get paginated list of suppliers with filtering
 */
export async function listSuppliers(filters: SupplierListFilters = {}) {
  const { search, isActive, currency, isLocal, page = 1, pageSize = 20 } = filters;

  const where: Prisma.SupplierWhereInput = {};

  // Search by code or name
  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Filter by active status
  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  // Filter by currency
  if (currency) {
    where.currency = currency;
  }

  // Filter by local supplier
  if (isLocal !== undefined) {
    where.isLocal = isLocal;
  }

  const [total, suppliers] = await Promise.all([
    prisma.supplier.count({ where }),
    prisma.supplier.findMany({
      where,
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    suppliers: suppliers.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      country: s.country,
      currency: s.currency,
      skuHandling: s.skuHandling,
      isLocal: s.isLocal,
      isActive: s.isActive,
      email: s.email,
      phone: s.phone,
      website: s.website,
      addressLine1: s.addressLine1,
      addressLine2: s.addressLine2,
      city: s.city,
      postalCode: s.postalCode,
      paymentTerms: s.paymentTerms,
      minimumOrderValue: s.minimumOrderValue ? Number(s.minimumOrderValue) : null,
      notes: s.notes,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      _count: s._count,
    })),
    pagination: {
      page,
      pageSize,
      totalItems: total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// ============================================
// GET SUPPLIER BY ID
// ============================================

/**
 * Get supplier by ID with contacts
 */
export async function getSupplierById(supplierId: string): Promise<SupplierData | null> {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    include: {
      contacts: {
        orderBy: [{ isPrimary: 'desc' }, { lastName: 'asc' }],
      },
      _count: {
        select: { products: true },
      },
    },
  });

  if (!supplier) {
    return null;
  }

  return {
    id: supplier.id,
    code: supplier.code,
    name: supplier.name,
    country: supplier.country,
    currency: supplier.currency,
    skuHandling: supplier.skuHandling,
    isLocal: supplier.isLocal,
    isActive: supplier.isActive,
    email: supplier.email,
    phone: supplier.phone,
    website: supplier.website,
    addressLine1: supplier.addressLine1,
    addressLine2: supplier.addressLine2,
    city: supplier.city,
    postalCode: supplier.postalCode,
    paymentTerms: supplier.paymentTerms,
    minimumOrderValue: supplier.minimumOrderValue ? Number(supplier.minimumOrderValue) : null,
    notes: supplier.notes,
    createdAt: supplier.createdAt,
    updatedAt: supplier.updatedAt,
    contacts: supplier.contacts.map((c) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      role: c.role,
      isPrimary: c.isPrimary,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
    _count: supplier._count,
  };
}

// ============================================
// CREATE SUPPLIER
// ============================================

/**
 * Create a new supplier
 */
export async function createSupplier(
  input: CreateSupplierInput,
  userId: string
): Promise<{ success: boolean; supplier?: SupplierData; error?: string }> {
  try {
    // Check for duplicate code
    const existing = await prisma.supplier.findUnique({
      where: { code: input.code.toUpperCase() },
    });

    if (existing) {
      return { success: false, error: `Supplier with code "${input.code}" already exists` };
    }

    const supplier = await prisma.supplier.create({
      data: {
        code: input.code.toUpperCase(),
        name: input.name,
        country: input.country ?? 'Italy',
        currency: input.currency ?? 'EUR',
        skuHandling: input.skuHandling,
        isLocal: input.isLocal ?? false,
        isActive: true,
        email: input.email,
        phone: input.phone,
        website: input.website,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
        city: input.city,
        postalCode: input.postalCode,
        paymentTerms: input.paymentTerms,
        minimumOrderValue: input.minimumOrderValue ? new Decimal(input.minimumOrderValue) : null,
        notes: input.notes,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return {
      success: true,
      supplier: {
        id: supplier.id,
        code: supplier.code,
        name: supplier.name,
        country: supplier.country,
        currency: supplier.currency,
        skuHandling: supplier.skuHandling,
        isLocal: supplier.isLocal,
        isActive: supplier.isActive,
        email: supplier.email,
        phone: supplier.phone,
        website: supplier.website,
        addressLine1: supplier.addressLine1,
        addressLine2: supplier.addressLine2,
        city: supplier.city,
        postalCode: supplier.postalCode,
        paymentTerms: supplier.paymentTerms,
        minimumOrderValue: supplier.minimumOrderValue ? Number(supplier.minimumOrderValue) : null,
        notes: supplier.notes,
        createdAt: supplier.createdAt,
        updatedAt: supplier.updatedAt,
        contacts: [],
        _count: supplier._count,
      },
    };
  } catch (error) {
    console.error('Create supplier error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create supplier',
    };
  }
}

// ============================================
// UPDATE SUPPLIER
// ============================================

/**
 * Update an existing supplier
 */
export async function updateSupplier(
  supplierId: string,
  input: UpdateSupplierInput,
  userId: string
): Promise<{ success: boolean; supplier?: SupplierData; error?: string }> {
  try {
    // Check if supplier exists
    const existing = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!existing) {
      return { success: false, error: 'Supplier not found' };
    }

    const supplier = await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        name: input.name,
        country: input.country,
        currency: input.currency,
        skuHandling: input.skuHandling,
        isLocal: input.isLocal,
        isActive: input.isActive,
        email: input.email,
        phone: input.phone,
        website: input.website,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
        city: input.city,
        postalCode: input.postalCode,
        paymentTerms: input.paymentTerms,
        minimumOrderValue:
          input.minimumOrderValue === null
            ? null
            : input.minimumOrderValue !== undefined
              ? new Decimal(input.minimumOrderValue)
              : undefined,
        notes: input.notes,
        updatedBy: userId,
      },
      include: {
        contacts: {
          orderBy: [{ isPrimary: 'desc' }, { lastName: 'asc' }],
        },
        _count: {
          select: { products: true },
        },
      },
    });

    return {
      success: true,
      supplier: {
        id: supplier.id,
        code: supplier.code,
        name: supplier.name,
        country: supplier.country,
        currency: supplier.currency,
        skuHandling: supplier.skuHandling,
        isLocal: supplier.isLocal,
        isActive: supplier.isActive,
        email: supplier.email,
        phone: supplier.phone,
        website: supplier.website,
        addressLine1: supplier.addressLine1,
        addressLine2: supplier.addressLine2,
        city: supplier.city,
        postalCode: supplier.postalCode,
        paymentTerms: supplier.paymentTerms,
        minimumOrderValue: supplier.minimumOrderValue ? Number(supplier.minimumOrderValue) : null,
        notes: supplier.notes,
        createdAt: supplier.createdAt,
        updatedAt: supplier.updatedAt,
        contacts: supplier.contacts.map((c) => ({
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          phone: c.phone,
          role: c.role,
          isPrimary: c.isPrimary,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
        _count: supplier._count,
      },
    };
  } catch (error) {
    console.error('Update supplier error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update supplier',
    };
  }
}

// ============================================
// SOFT DELETE SUPPLIER
// ============================================

/**
 * Soft delete a supplier (set isActive = false)
 */
export async function softDeleteSupplier(
  supplierId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if supplier exists
    const existing = await prisma.supplier.findUnique({
      where: { id: supplierId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!existing) {
      return { success: false, error: 'Supplier not found' };
    }

    // Warn if supplier has products (but still allow deactivation)
    if (existing._count.products > 0) {
      console.warn(
        `Deactivating supplier ${existing.code} with ${existing._count.products} products`
      );
    }

    await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        isActive: false,
        updatedBy: userId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Soft delete supplier error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete supplier',
    };
  }
}

// ============================================
// SUPPLIER CONTACT FUNCTIONS
// ============================================

export interface CreateContactInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: string;
  isPrimary?: boolean;
}

export interface UpdateContactInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  role?: string | null;
  isPrimary?: boolean;
}

/**
 * Add a contact to a supplier
 */
export async function addContact(
  supplierId: string,
  input: CreateContactInput
): Promise<{ success: boolean; contact?: SupplierContactData; error?: string }> {
  try {
    // Check if supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      return { success: false, error: 'Supplier not found' };
    }

    // If this contact is primary, unset any existing primary
    if (input.isPrimary) {
      await prisma.supplierContact.updateMany({
        where: { supplierId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const contact = await prisma.supplierContact.create({
      data: {
        supplierId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        role: input.role,
        isPrimary: input.isPrimary ?? false,
      },
    });

    return {
      success: true,
      contact: {
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        role: contact.role,
        isPrimary: contact.isPrimary,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      },
    };
  } catch (error) {
    console.error('Add contact error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add contact',
    };
  }
}

/**
 * Update a supplier contact
 */
export async function updateContact(
  contactId: string,
  input: UpdateContactInput
): Promise<{ success: boolean; contact?: SupplierContactData; error?: string }> {
  try {
    // Check if contact exists
    const existing = await prisma.supplierContact.findUnique({
      where: { id: contactId },
    });

    if (!existing) {
      return { success: false, error: 'Contact not found' };
    }

    // If setting as primary, unset any existing primary for this supplier
    if (input.isPrimary) {
      await prisma.supplierContact.updateMany({
        where: { supplierId: existing.supplierId, isPrimary: true, id: { not: contactId } },
        data: { isPrimary: false },
      });
    }

    const contact = await prisma.supplierContact.update({
      where: { id: contactId },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        role: input.role,
        isPrimary: input.isPrimary,
      },
    });

    return {
      success: true,
      contact: {
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        role: contact.role,
        isPrimary: contact.isPrimary,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      },
    };
  } catch (error) {
    console.error('Update contact error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update contact',
    };
  }
}

/**
 * Delete a supplier contact
 */
export async function deleteContact(
  contactId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if contact exists
    const existing = await prisma.supplierContact.findUnique({
      where: { id: contactId },
    });

    if (!existing) {
      return { success: false, error: 'Contact not found' };
    }

    await prisma.supplierContact.delete({
      where: { id: contactId },
    });

    return { success: true };
  } catch (error) {
    console.error('Delete contact error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete contact',
    };
  }
}
