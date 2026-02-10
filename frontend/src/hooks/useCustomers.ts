import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type CompanyDetail,
  type CompanyAddress,
  type CompanyContact,
  type CreditStatusType,
  type AccountStatusType,
  type ShippingMethodType,
  type ContactRoleType,
  type PaymentTermsType,
} from '@/lib/api';

/**
 * Hook for fetching a single customer (company) by ID
 */
export function useCustomer(id: string | null): ReturnType<typeof useQuery<CompanyDetail>> {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      if (!id) throw new Error('Customer ID is required');
      const response = await api.getCompany(id);
      return response.data as CompanyDetail;
    },
    enabled: !!id,
  });
}

/**
 * Hook for updating a customer
 */
export function useUpdateCustomer(): ReturnType<typeof useMutation<CompanyDetail, Error, { id: string; data: UpdateCustomerData }>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCustomerData }) => {
      const response = await api.updateCompany(id, data);
      return response.data as CompanyDetail;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export interface UpdateCustomerData {
  name?: string;
  tradingName?: string;
  registrationNumber?: string;
  vatNumber?: string;
  paymentTerms?: PaymentTermsType;
  tier?: string;
  isActive?: boolean;
  primaryWarehouse?: 'JHB' | 'CT' | null;
  fulfillmentPolicy?: string;
  assignedSalesRepId?: string | null;
  creditLimit?: number | null;
  creditStatus?: CreditStatusType;
  accountStatus?: AccountStatusType;
  territory?: string | null;
  discountOverride?: number | null;
  defaultShippingMethod?: ShippingMethodType | null;
  statementEmail?: string | null;
  invoiceEmail?: string | null;
  internalNotes?: string | null;
  bbbeeLevel?: number | null;
  bbbeeExpiryDate?: string | null;
}

// --- Address mutations ---

interface CreateAddressData {
  type: 'BILLING' | 'SHIPPING';
  label?: string;
  line1: string;
  line2?: string;
  suburb?: string;
  city: string;
  province: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
  deliveryInstructions?: string;
  contactName?: string;
  contactPhone?: string;
}

interface UpdateAddressData extends Partial<CreateAddressData> {}

export function useCreateCompanyAddress(): ReturnType<typeof useMutation<CompanyAddress, Error, { companyId: string; data: CreateAddressData }>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, data }: { companyId: string; data: CreateAddressData }) => {
      const response = await api.createCompanyAddress(companyId, data);
      return response.data as CompanyAddress;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer', variables.companyId] });
    },
  });
}

export function useUpdateCompanyAddress(): ReturnType<typeof useMutation<CompanyAddress, Error, { companyId: string; addressId: string; data: UpdateAddressData }>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, addressId, data }: { companyId: string; addressId: string; data: UpdateAddressData }) => {
      const response = await api.updateCompanyAddress(companyId, addressId, data);
      return response.data as CompanyAddress;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer', variables.companyId] });
    },
  });
}

export function useDeleteCompanyAddress(): ReturnType<typeof useMutation<void, Error, { companyId: string; addressId: string }>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, addressId }: { companyId: string; addressId: string }) => {
      await api.deleteCompanyAddress(companyId, addressId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer', variables.companyId] });
    },
  });
}

// --- Contact mutations ---

interface CreateContactData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  contactRole?: ContactRoleType;
  isPrimary?: boolean;
  isActive?: boolean;
}

interface UpdateContactData extends Partial<CreateContactData> {}

export function useCreateCompanyContact(): ReturnType<typeof useMutation<CompanyContact, Error, { companyId: string; data: CreateContactData }>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, data }: { companyId: string; data: CreateContactData }) => {
      const response = await api.createCompanyContact(companyId, data);
      return response.data as CompanyContact;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer', variables.companyId] });
    },
  });
}

export function useUpdateCompanyContact(): ReturnType<typeof useMutation<CompanyContact, Error, { companyId: string; contactId: string; data: UpdateContactData }>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, contactId, data }: { companyId: string; contactId: string; data: UpdateContactData }) => {
      const response = await api.updateCompanyContact(companyId, contactId, data);
      return response.data as CompanyContact;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer', variables.companyId] });
    },
  });
}

export function useDeleteCompanyContact(): ReturnType<typeof useMutation<void, Error, { companyId: string; contactId: string }>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, contactId }: { companyId: string; contactId: string }) => {
      await api.deleteCompanyContact(companyId, contactId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer', variables.companyId] });
    },
  });
}

// --- Staff users for assignment ---

export function useStaffUsersForAssignment(): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: ['staff-users-assignment'],
    queryFn: async () => {
      const response = await api.getStaffUsersForAssignment();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Staff list rarely changes
  });
}
