import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type SuppliersQueryParams,
  type CreateSupplierData,
  type UpdateSupplierData,
  type CreateContactData,
  type UpdateContactData,
} from '@/lib/api';

/**
 * Hook for fetching paginated suppliers list
 */
export function useSuppliers(params: SuppliersQueryParams = {}) {
  return useQuery({
    queryKey: ['suppliers', params],
    queryFn: async () => {
      const response = await api.getSuppliers(params);
      return response.data;
    },
  });
}

/**
 * Hook for fetching a single supplier by ID
 */
export function useSupplier(id: string | null) {
  return useQuery({
    queryKey: ['supplier', id],
    queryFn: async () => {
      if (!id) throw new Error('Supplier ID is required');
      const response = await api.getSupplierById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook for creating a new supplier
 */
export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSupplierData) => {
      const response = await api.createSupplier(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

/**
 * Hook for updating a supplier
 */
export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSupplierData }) => {
      const response = await api.updateSupplier(id, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['supplier', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

/**
 * Hook for deleting (deactivating) a supplier
 */
export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.deleteSupplier(id);
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['supplier', id] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

/**
 * Hook for adding a contact to a supplier
 */
export function useAddSupplierContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ supplierId, data }: { supplierId: string; data: CreateContactData }) => {
      const response = await api.addSupplierContact(supplierId, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['supplier', variables.supplierId] });
    },
  });
}

/**
 * Hook for updating a supplier contact
 */
export function useUpdateSupplierContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      supplierId,
      contactId,
      data,
    }: {
      supplierId: string;
      contactId: string;
      data: UpdateContactData;
    }) => {
      const response = await api.updateSupplierContact(supplierId, contactId, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['supplier', variables.supplierId] });
    },
  });
}

/**
 * Hook for deleting a supplier contact
 */
export function useDeleteSupplierContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ supplierId, contactId }: { supplierId: string; contactId: string }) => {
      await api.deleteSupplierContact(supplierId, contactId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['supplier', variables.supplierId] });
    },
  });
}
