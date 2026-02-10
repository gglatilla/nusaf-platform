'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useCustomer } from '@/hooks/useCustomers';
import { useAuthStore } from '@/stores/auth-store';
import { CustomerDetailHeader, OverviewTab, FinancialTab, AddressesTab, ContactsTab } from '@/components/customers/detail';
import { cn } from '@/lib/utils';

type TabId = 'overview' | 'financial' | 'addresses' | 'contacts';

function LoadingSkeleton(): JSX.Element {
  return (
    <div className="p-4 sm:p-6 xl:p-8">
      <div className="animate-pulse space-y-6">
        <div className="h-4 bg-slate-200 rounded w-32" />
        <div className="flex items-center gap-3">
          <div className="h-8 bg-slate-200 rounded w-64" />
          <div className="h-6 bg-slate-200 rounded w-20" />
          <div className="h-6 bg-slate-200 rounded w-20" />
        </div>
        <div className="h-4 bg-slate-200 rounded w-48" />
        <div className="flex gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-200 rounded w-24" />
          ))}
        </div>
        <div className="h-96 bg-slate-200 rounded" />
      </div>
    </div>
  );
}

export default function CustomerDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { data: customer, isLoading, error } = useCustomer(id);

  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const canEdit = user && ['ADMIN', 'MANAGER'].includes(user.role);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !customer) {
    return (
      <div className="p-4 sm:p-6 xl:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Customer not found or failed to load.
        </div>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'financial', label: 'Financial' },
    { id: 'addresses', label: 'Addresses', count: customer.addresses.length },
    { id: 'contacts', label: 'Contacts', count: customer.contacts.length },
  ];

  return (
    <div className="p-4 sm:p-6 xl:p-8 space-y-6">
      {/* Header */}
      <CustomerDetailHeader customer={customer} />

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-0" aria-label="Customer detail tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn(
                  'ml-1.5 text-xs px-1.5 py-0.5 rounded-full',
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-slate-100 text-slate-500'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <OverviewTab customer={customer} canEdit={!!canEdit} />
        )}

        {activeTab === 'financial' && (
          <FinancialTab customer={customer} canEdit={!!canEdit} />
        )}

        {activeTab === 'addresses' && (
          <AddressesTab customer={customer} canEdit={!!canEdit} />
        )}

        {activeTab === 'contacts' && (
          <ContactsTab customer={customer} canEdit={!!canEdit} />
        )}
      </div>
    </div>
  );
}
