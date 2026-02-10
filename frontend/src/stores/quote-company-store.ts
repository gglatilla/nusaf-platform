'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface QuoteCompany {
  id: string;
  name: string;
  tier: string;
  paymentTerms: string;
  isCashAccount: boolean;
}

export interface CashCustomerState {
  cashCustomerName: string;
  cashCustomerPhone: string;
  cashCustomerEmail: string;
  cashCustomerCompany: string;
  cashCustomerVat: string;
  cashCustomerAddress: string;
}

const EMPTY_CASH_CUSTOMER: CashCustomerState = {
  cashCustomerName: '',
  cashCustomerPhone: '',
  cashCustomerEmail: '',
  cashCustomerCompany: '',
  cashCustomerVat: '',
  cashCustomerAddress: '',
};

interface QuoteCompanyStoreState {
  selectedCompany: QuoteCompany | null;
  cashCustomer: CashCustomerState;
}

interface QuoteCompanyActions {
  selectCompany: (company: QuoteCompany) => void;
  clearCompany: () => void;
  setCashCustomer: (details: Partial<CashCustomerState>) => void;
  clearCashCustomer: () => void;
}

type QuoteCompanyStore = QuoteCompanyStoreState & QuoteCompanyActions;

/**
 * Store for staff to select a customer company when creating quotes on their behalf.
 * Uses sessionStorage so it persists across page navigations but clears on tab close.
 */
export const useQuoteCompanyStore = create<QuoteCompanyStore>()(
  persist(
    (set) => ({
      selectedCompany: null,
      cashCustomer: { ...EMPTY_CASH_CUSTOMER },

      selectCompany: (company: QuoteCompany) => set({
        selectedCompany: company,
        // Clear cash customer details when switching companies
        cashCustomer: { ...EMPTY_CASH_CUSTOMER },
      }),

      clearCompany: () => set({
        selectedCompany: null,
        cashCustomer: { ...EMPTY_CASH_CUSTOMER },
      }),

      setCashCustomer: (details: Partial<CashCustomerState>) =>
        set((state) => ({
          cashCustomer: { ...state.cashCustomer, ...details },
        })),

      clearCashCustomer: () => set({ cashCustomer: { ...EMPTY_CASH_CUSTOMER } }),
    }),
    {
      name: 'nusaf-quote-company',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? sessionStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      ),
    }
  )
);
