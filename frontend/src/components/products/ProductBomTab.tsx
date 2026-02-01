'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { BomTable } from './BomTable';
import { AddComponentModal } from './AddComponentModal';
import { WhereUsedSection } from './WhereUsedSection';
import { useGetBom } from '@/hooks/useBom';

interface ProductBomTabProps {
  productId: string;
  productSku: string;
  canEdit: boolean;
}

export function ProductBomTab({ productId, productSku, canEdit }: ProductBomTabProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { data } = useGetBom(productId);

  const existingComponentIds = data?.components?.map((c) => c.componentProductId) ?? [];

  return (
    <div className="space-y-6">
      {/* BOM Table Section */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="font-medium text-slate-900">Bill of Materials</h3>
          {canEdit && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Component
            </button>
          )}
        </div>
        <BomTable productId={productId} canEdit={canEdit} />
      </div>

      {/* Where Used Section */}
      <WhereUsedSection productId={productId} />

      {/* Add Component Modal */}
      <AddComponentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        productId={productId}
        productSku={productSku}
        existingComponentIds={existingComponentIds}
      />
    </div>
  );
}
