'use client';

import { useState } from 'react';
import { PublicProductDetail } from '@/lib/api';
import { DescriptionTab } from './DescriptionTab';
import { SpecificationsTab } from './SpecificationsTab';
import { DocumentsTab } from './DocumentsTab';
import { CrossReferenceTab } from './CrossReferenceTab';

interface ProductTabsProps {
  product: PublicProductDetail;
}

type TabId = 'description' | 'specifications' | 'documents' | 'cross-reference';

interface Tab {
  id: TabId;
  label: string;
  count?: number;
}

export function ProductTabs({ product }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('description');

  const tabs: Tab[] = [
    { id: 'description', label: 'Description' },
    { id: 'specifications', label: 'Specifications' },
    {
      id: 'documents',
      label: 'Documents',
      count: product.documents.length,
    },
    {
      id: 'cross-reference',
      label: 'Cross-Reference',
      count: product.crossReferences.length,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Tab headers */}
      <div className="border-b border-slate-200">
        <nav className="flex overflow-x-auto" aria-label="Product information tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="px-6" role="tabpanel" id={`tabpanel-${activeTab}`}>
        {activeTab === 'description' && <DescriptionTab description={product.description} />}
        {activeTab === 'specifications' && (
          <SpecificationsTab specifications={product.specifications} />
        )}
        {activeTab === 'documents' && <DocumentsTab documents={product.documents} />}
        {activeTab === 'cross-reference' && (
          <CrossReferenceTab crossReferences={product.crossReferences} />
        )}
      </div>
    </div>
  );
}
