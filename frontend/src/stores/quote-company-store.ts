'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface QuoteCompany {
  id: string;
  name: string;
  tier: string;
  paymentTerms: string;
}

interface QuoteCompanyState {
  selectedCompany: QuoteCompany | null;
}

interface QuoteCompanyActions {
  selectCompany: (company: QuoteCompany) => void;
  clearCompany: () => void;
}

type QuoteCompanyStore = QuoteCompanyState & QuoteCompanyActions;

/**
 * Store for staff to select a customer company when creating quotes on their behalf.
 * Uses sessionStorage so it persists across page navigations but clears on tab close.
 */
export const useQuoteCompanyStore = create<QuoteCompanyStore>()(
  persist(
    (set) => ({
      selectedCompany: null,

      selectCompany: (company: QuoteCompany) => set({ selectedCompany: company }),

      clearCompany: () => set({ selectedCompany: null }),
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
