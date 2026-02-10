'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Building2, Search, ChevronDown, X, Check } from 'lucide-react';
import { api, type CompanyListItem } from '@/lib/api';
import { useQuoteCompanyStore, type QuoteCompany } from '@/stores/quote-company-store';

const TIER_LABELS: Record<string, string> = {
  END_USER: 'End User',
  OEM_RESELLER: 'OEM/Reseller',
  DISTRIBUTOR: 'Distributor',
};

const TIER_COLORS: Record<string, string> = {
  END_USER: 'bg-slate-100 text-slate-700',
  OEM_RESELLER: 'bg-blue-100 text-blue-700',
  DISTRIBUTOR: 'bg-purple-100 text-purple-700',
};

const PAYMENT_LABELS: Record<string, string> = {
  PREPAY: 'Prepay',
  COD: 'COD',
  NET_30: 'Net 30',
  NET_60: 'Net 60',
  NET_90: 'Net 90',
};

/**
 * Company picker for staff to select a customer company when creating quotes on their behalf.
 * Renders as a dropdown with search, showing company name, tier, and payment terms.
 */
export function CustomerCompanyPicker() {
  const { selectedCompany, selectCompany, clearCompany } = useQuoteCompanyStore();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Fetch companies with debounced search
  const fetchCompanies = useCallback(async (searchTerm: string) => {
    setIsLoading(true);
    try {
      const response = await api.getCompanies({
        search: searchTerm || undefined,
        pageSize: 20,
      });
      if (response.success && response.data) {
        setCompanies(response.data.companies.filter((c) => c.isActive));
      }
    } catch {
      setCompanies([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchCompanies(search);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search, isOpen, fetchCompanies]);

  const handleSelect = (company: CompanyListItem) => {
    const quoteCompany: QuoteCompany = {
      id: company.id,
      name: company.name,
      tier: company.tier,
      paymentTerms: company.paymentTerms,
    };
    selectCompany(quoteCompany);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearCompany();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors min-w-[200px] ${
          selectedCompany
            ? 'border-primary-300 bg-primary-50 text-primary-700 hover:bg-primary-100'
            : 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
        }`}
      >
        <Building2 className="h-4 w-4 flex-shrink-0" />
        <span className="truncate flex-1 text-left">
          {selectedCompany ? selectedCompany.name : 'Select Customer...'}
        </span>
        {selectedCompany ? (
          <X className="h-4 w-4 flex-shrink-0 hover:text-red-500" onClick={handleClear} />
        ) : (
          <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 mt-1 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
          {/* Search */}
          <div className="p-2 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search companies..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Company list */}
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : companies.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                {search ? 'No companies found' : 'No active companies'}
              </div>
            ) : (
              companies.map((company) => {
                const isSelected = selectedCompany?.id === company.id;
                return (
                  <button
                    key={company.id}
                    onClick={() => handleSelect(company)}
                    className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex items-start gap-3 ${
                      isSelected ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {company.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${TIER_COLORS[company.tier] || 'bg-slate-100 text-slate-700'}`}>
                          {TIER_LABELS[company.tier] || company.tier}
                        </span>
                        <span className="text-xs text-slate-500">
                          {PAYMENT_LABELS[company.paymentTerms] || company.paymentTerms}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
