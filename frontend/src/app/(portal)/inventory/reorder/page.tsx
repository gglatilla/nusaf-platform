'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/layout/PageHeader';
import { useLowStockProducts } from '@/hooks/useInventory';
import { useCreatePurchaseOrder, useAddPurchaseOrderLine } from '@/hooks/usePurchaseOrders';
import {
  AlertTriangle,
  PackageX,
  TrendingDown,
  Factory,
  Hash,
  ShoppingCart,
  Check,
  Loader2,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LowStockProduct } from '@/lib/api';
import { formatCurrency } from '@/lib/formatting';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  OUT_OF_STOCK: { label: 'Out of Stock', className: 'bg-red-100 text-red-700' },
  LOW_STOCK: { label: 'Low Stock', className: 'bg-amber-100 text-amber-700' },
};

const SEVERITY_TABS = [
  { value: '', label: 'All' },
  { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
  { value: 'LOW_STOCK', label: 'Low Stock' },
] as const;

interface SupplierGroup {
  supplier: LowStockProduct['supplier'];
  items: LowStockProduct[];
}

function groupBySupplier(items: LowStockProduct[]): SupplierGroup[] {
  const map = new Map<string, SupplierGroup>();
  for (const item of items) {
    const key = item.supplier.id;
    if (!map.has(key)) {
      map.set(key, { supplier: item.supplier, items: [] });
    }
    map.get(key)!.items.push(item);
  }
  return Array.from(map.values()).sort((a, b) => a.supplier.name.localeCompare(b.supplier.name));
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ReorderReportPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Filters
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [supplierFilter, setSupplierFilter] = useState<string>('');
  const [groupBySupplierMode, setGroupBySupplierMode] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // PO generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPOs, setGeneratedPOs] = useState<{ poId: string; poNumber: string; supplierName: string }[]>([]);
  const [skippedItems, setSkippedItems] = useState<{ sku: string; description: string }[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Data
  const { data, isLoading, error } = useLowStockProducts(locationFilter || undefined);
  const createPO = useCreatePurchaseOrder();
  const addLine = useAddPurchaseOrderLine();

  // Filtered data
  const filteredItems = useMemo(() => {
    if (!data?.lowStockProducts) return [];
    let items = data.lowStockProducts;
    if (severityFilter) {
      items = items.filter((i) => i.stockStatus === severityFilter);
    }
    if (supplierFilter) {
      items = items.filter((i) => i.supplier.id === supplierFilter);
    }
    return items;
  }, [data, severityFilter, supplierFilter]);

  const groups = useMemo(() => groupBySupplier(filteredItems), [filteredItems]);

  // Summary stats
  const stats = useMemo(() => {
    const items = filteredItems;
    return {
      total: items.length,
      outOfStock: items.filter((i) => i.stockStatus === 'OUT_OF_STOCK').length,
      suppliers: new Set(items.map((i) => i.supplier.id)).size,
      totalShortfall: items.reduce((sum, i) => sum + i.shortfall, 0),
    };
  }, [filteredItems]);

  // Unique suppliers for filter dropdown
  const supplierOptions = useMemo(() => {
    if (!data?.lowStockProducts) return [];
    const map = new Map<string, string>();
    for (const item of data.lowStockProducts) {
      map.set(item.supplier.id, item.supplier.name);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  // Selection helpers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((i) => i.id)));
    }
  };

  const toggleSelectGroup = (supplierId: string) => {
    const groupItems = filteredItems.filter((i) => i.supplier.id === supplierId);
    const allSelected = groupItems.every((i) => selectedIds.has(i.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const item of groupItems) {
        if (allSelected) next.delete(item.id);
        else next.add(item.id);
      }
      return next;
    });
  };

  const toggleCollapseGroup = (supplierId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(supplierId)) next.delete(supplierId);
      else next.add(supplierId);
      return next;
    });
  };

  // Preview data for the confirmation modal
  const previewGroups = useMemo(() => {
    const selected = filteredItems.filter((i) => selectedIds.has(i.id));
    if (selected.length === 0) return [];

    const bySupplier: Record<string, { supplier: LowStockProduct['supplier']; items: LowStockProduct[] }> = {};
    for (const item of selected) {
      const key = item.supplier.id;
      if (!bySupplier[key]) bySupplier[key] = { supplier: item.supplier, items: [] };
      bySupplier[key].items.push(item);
    }

    return Object.values(bySupplier)
      .sort((a, b) => a.supplier.name.localeCompare(b.supplier.name))
      .map((group) => {
        const lines = group.items.map((item) => {
          const qty = item.reorderQuantity ?? item.shortfall;
          const cost = item.costPrice;
          return {
            sku: item.product.nusafSku,
            description: item.product.description,
            quantity: qty,
            costPrice: cost,
            lineTotal: cost != null ? qty * cost : null,
          };
        });
        const supplierTotal = lines.reduce((sum, l) => sum + (l.lineTotal ?? 0), 0);
        const hasMissingCost = lines.some((l) => l.costPrice == null || l.costPrice === 0);
        return { supplier: group.supplier, lines, supplierTotal, hasMissingCost };
      });
  }, [filteredItems, selectedIds]);

  // Generate PO(s) from selected items
  const handleGeneratePOs = async () => {
    const selected = filteredItems.filter((i) => selectedIds.has(i.id));
    if (selected.length === 0) return;

    setShowPreview(false);
    setIsGenerating(true);
    setGeneratedPOs([]);
    setSkippedItems([]);

    try {
      // Filter out items with null/zero costPrice
      const skipped: { sku: string; description: string }[] = [];
      const validItems = selected.filter((item) => {
        if (item.costPrice == null || item.costPrice <= 0) {
          skipped.push({ sku: item.product.nusafSku, description: item.product.description });
          return false;
        }
        return true;
      });
      setSkippedItems(skipped);

      if (validItems.length === 0) {
        // All items skipped — nothing to generate
        setIsGenerating(false);
        return;
      }

      // Group valid items by supplier
      const bySupplier: Record<string, LowStockProduct[]> = {};
      for (const item of validItems) {
        const key = item.supplier.id;
        if (!bySupplier[key]) bySupplier[key] = [];
        bySupplier[key].push(item);
      }

      const createdPOs: { poId: string; poNumber: string; supplierName: string }[] = [];

      for (const supplierId of Object.keys(bySupplier)) {
        const items = bySupplier[supplierId];
        // Create draft PO
        const poResult = await createPO.mutateAsync({
          supplierId,
          deliveryLocation: locationFilter === 'JHB' || locationFilter === 'CT' ? locationFilter as 'JHB' | 'CT' : 'JHB',
          internalNotes: `Generated from Reorder Report — ${items.length} item(s) below reorder point`,
        });

        if (poResult?.id) {
          // Add lines
          for (const item of items) {
            const qty = item.reorderQuantity ?? item.shortfall;
            if (qty > 0) {
              await addLine.mutateAsync({
                poId: poResult.id,
                data: {
                  productId: item.productId,
                  quantityOrdered: qty,
                  unitCost: item.costPrice!,
                },
              });
            }
          }
          createdPOs.push({
            poId: poResult.id,
            poNumber: poResult.poNumber,
            supplierName: items[0].supplier.name,
          });
        }
      }

      setGeneratedPOs(createdPOs);
      setSelectedIds(new Set());

      // Single PO → redirect to it
      if (createdPOs.length === 1) {
        router.push(`/purchase-orders/${createdPOs[0].poId}`);
      }
    } catch (err) {
      console.error('Failed to generate PO(s):', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Role check
  const canGeneratePO = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'PURCHASER';

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reorder Report"
        description="Products below reorder point — review and generate purchase orders"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={TrendingDown} label="Below Reorder Point" value={stats.total} className="text-amber-600 bg-amber-50" />
        <SummaryCard icon={PackageX} label="Out of Stock" value={stats.outOfStock} className="text-red-600 bg-red-50" />
        <SummaryCard icon={Factory} label="Suppliers Affected" value={stats.suppliers} className="text-blue-600 bg-blue-50" />
        <SummaryCard icon={Hash} label="Total Shortfall" value={stats.totalShortfall} className="text-slate-600 bg-slate-50" />
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Severity Tabs */}
        <div className="flex rounded-lg border border-slate-200 bg-white overflow-hidden">
          {SEVERITY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setSeverityFilter(tab.value); setSelectedIds(new Set()); }}
              className={cn(
                'px-3 py-1.5 text-sm font-medium transition-colors',
                severityFilter === tab.value
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Warehouse Filter */}
        <select
          value={locationFilter}
          onChange={(e) => { setLocationFilter(e.target.value); setSelectedIds(new Set()); }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
        >
          <option value="">All Warehouses</option>
          <option value="JHB">Johannesburg</option>
          <option value="CT">Cape Town</option>
        </select>

        {/* Supplier Filter */}
        <select
          value={supplierFilter}
          onChange={(e) => { setSupplierFilter(e.target.value); setSelectedIds(new Set()); }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
        >
          <option value="">All Suppliers</option>
          {supplierOptions.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {/* Group Toggle */}
        <label className="flex items-center gap-2 text-sm text-slate-600 ml-auto">
          <input
            type="checkbox"
            checked={groupBySupplierMode}
            onChange={(e) => setGroupBySupplierMode(e.target.checked)}
            className="rounded border-slate-300"
          />
          Group by Supplier
        </label>
      </div>

      {/* Success Banner */}
      {generatedPOs.length > 1 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
            <Check className="h-4 w-4" />
            {generatedPOs.length} Draft Purchase Orders Created
          </div>
          <div className="space-y-1">
            {generatedPOs.map((po) => (
              <div key={po.poId} className="text-sm">
                <Link href={`/purchase-orders/${po.poId}`} className="text-green-700 underline hover:text-green-800">
                  {po.poNumber}
                </Link>
                {' — '}{po.supplierName}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skipped Items Warning */}
      {skippedItems.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
            <AlertTriangle className="h-4 w-4" />
            {skippedItems.length} item{skippedItems.length !== 1 ? 's' : ''} skipped — no cost price set
          </div>
          <div className="space-y-1">
            {skippedItems.map((item) => (
              <div key={item.sku} className="text-sm text-amber-700">
                <span className="font-mono text-xs">{item.sku}</span>
                {' — '}{item.description}
              </div>
            ))}
          </div>
          <p className="text-xs text-amber-600 mt-2">
            Set a cost price on these products before including them in purchase orders.
          </p>
        </div>
      )}

      {/* Loading / Error / Empty */}
      {isLoading && (
        <div className="flex items-center justify-center py-12 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading reorder data...
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
          Failed to load reorder data: {error.message}
        </div>
      )}

      {!isLoading && !error && filteredItems.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <Check className="h-10 w-10 text-green-500 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">All stock levels are healthy</p>
          <p className="text-slate-400 text-sm mt-1">No products are below their reorder point</p>
        </div>
      )}

      {/* Table */}
      {!isLoading && filteredItems.length > 0 && (
        <>
          {groupBySupplierMode ? (
            <div className="space-y-4">
              {groups.map((group) => {
                const allSelected = group.items.every((i) => selectedIds.has(i.id));
                const someSelected = group.items.some((i) => selectedIds.has(i.id));
                const isCollapsed = collapsedGroups.has(group.supplier.id);

                return (
                  <div key={group.supplier.id} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                    {/* Supplier Header */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <button onClick={() => toggleCollapseGroup(group.supplier.id)} className="text-slate-400 hover:text-slate-600">
                        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      {canGeneratePO && (
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                          onChange={() => toggleSelectGroup(group.supplier.id)}
                          className="rounded border-slate-300"
                        />
                      )}
                      <Link
                        href={`/admin/suppliers/${group.supplier.id}`}
                        className="font-medium text-slate-900 hover:text-primary-600"
                      >
                        {group.supplier.name}
                      </Link>
                      <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                        {group.supplier.code}
                      </span>
                      <span className="text-sm text-slate-500 ml-auto">
                        {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Table rows */}
                    {!isCollapsed && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 text-left text-xs text-slate-500 uppercase">
                              {canGeneratePO && <th className="px-4 py-2 w-8" />}
                              <th className="px-4 py-2">SKU</th>
                              <th className="px-4 py-2">Description</th>
                              <th className="px-4 py-2">Warehouse</th>
                              <th className="px-4 py-2 text-right">On Hand</th>
                              <th className="px-4 py-2 text-right">Available</th>
                              <th className="px-4 py-2 text-right">On Order</th>
                              <th className="px-4 py-2 text-right">Reorder Pt</th>
                              <th className="px-4 py-2 text-right">Shortfall</th>
                              <th className="px-4 py-2 text-right">Suggested Qty</th>
                              <th className="px-4 py-2 text-right">Lead Time</th>
                              <th className="px-4 py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {group.items.map((item) => (
                              <ReorderRow
                                key={item.id}
                                item={item}
                                selected={selectedIds.has(item.id)}
                                onToggle={() => toggleSelect(item.id)}
                                showCheckbox={canGeneratePO}
                                showSupplier={false}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Flat table mode */
            <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs text-slate-500 uppercase bg-slate-50">
                      {canGeneratePO && (
                        <th className="px-4 py-2 w-8">
                          <input
                            type="checkbox"
                            checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
                            ref={(el) => { if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < filteredItems.length; }}
                            onChange={toggleSelectAll}
                            className="rounded border-slate-300"
                          />
                        </th>
                      )}
                      <th className="px-4 py-2">SKU</th>
                      <th className="px-4 py-2">Description</th>
                      <th className="px-4 py-2">Supplier</th>
                      <th className="px-4 py-2">Warehouse</th>
                      <th className="px-4 py-2 text-right">On Hand</th>
                      <th className="px-4 py-2 text-right">Available</th>
                      <th className="px-4 py-2 text-right">On Order</th>
                      <th className="px-4 py-2 text-right">Reorder Pt</th>
                      <th className="px-4 py-2 text-right">Shortfall</th>
                      <th className="px-4 py-2 text-right">Suggested Qty</th>
                      <th className="px-4 py-2 text-right">Lead Time</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredItems.map((item) => (
                      <ReorderRow
                        key={item.id}
                        item={item}
                        selected={selectedIds.has(item.id)}
                        onToggle={() => toggleSelect(item.id)}
                        showCheckbox={canGeneratePO}
                        showSupplier={true}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Sticky Bottom Action Bar */}
      {canGeneratePO && selectedIds.size > 0 && (
        <div className="sticky bottom-0 bg-white border-t border-slate-200 shadow-lg -mx-6 px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-slate-600">
            <span className="font-medium">{selectedIds.size}</span> item{selectedIds.size !== 1 ? 's' : ''} selected
            {' from '}
            <span className="font-medium">
              {new Set(filteredItems.filter((i) => selectedIds.has(i.id)).map((i) => i.supplier.id)).size}
            </span>
            {' supplier(s)'}
          </span>
          <button
            onClick={() => setShowPreview(true)}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
            {isGenerating ? 'Generating...' : 'Generate Draft PO(s)'}
          </button>
        </div>
      )}

      {/* PO Preview Confirmation Modal */}
      {showPreview && previewGroups.length > 0 && (
        <POPreviewModal
          groups={previewGroups}
          onConfirm={handleGeneratePOs}
          onCancel={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SummaryCard({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className={cn('rounded-lg p-2', className)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-semibold text-slate-900">{value.toLocaleString()}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

interface PreviewLine {
  sku: string;
  description: string;
  quantity: number;
  costPrice: number | null;
  lineTotal: number | null;
}

interface PreviewGroup {
  supplier: LowStockProduct['supplier'];
  lines: PreviewLine[];
  supplierTotal: number;
  hasMissingCost: boolean;
}

function POPreviewModal({
  groups,
  onConfirm,
  onCancel,
}: {
  groups: PreviewGroup[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const totalItems = groups.reduce((sum, g) => sum + g.lines.length, 0);
  const grandTotal = groups.reduce((sum, g) => sum + g.supplierTotal, 0);
  const anyMissingCost = groups.some((g) => g.hasMissingCost);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Review Purchase Orders
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {groups.length} PO{groups.length !== 1 ? 's' : ''} will be created with {totalItems} line item{totalItems !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 overflow-y-auto max-h-[60vh] space-y-5">
            {anyMissingCost && (
              <div className="flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Some items have no cost price set. These will be added with R0.00 unit cost — update them on the PO before sending to supplier.</span>
              </div>
            )}

            {groups.map((group) => (
              <div key={group.supplier.id} className="rounded-lg border border-slate-200 overflow-hidden">
                {/* Supplier Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{group.supplier.name}</span>
                    <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                      {group.supplier.code}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    {group.lines.length} item{group.lines.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Lines Table */}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs text-slate-500 uppercase">
                      <th className="px-4 py-2">SKU</th>
                      <th className="px-4 py-2">Description</th>
                      <th className="px-4 py-2 text-right">Qty</th>
                      <th className="px-4 py-2 text-right">Unit Cost</th>
                      <th className="px-4 py-2 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {group.lines.map((line) => (
                      <tr key={line.sku}>
                        <td className="px-4 py-2 font-mono text-xs text-slate-700">{line.sku}</td>
                        <td className="px-4 py-2 text-slate-700 max-w-[200px] truncate" title={line.description}>
                          {line.description}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">{line.quantity}</td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {line.costPrice != null && line.costPrice > 0 ? (
                            formatCurrency(line.costPrice)
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                              <AlertTriangle className="h-3 w-3" />
                              Cost TBD
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {line.lineTotal != null ? formatCurrency(line.lineTotal) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200 bg-slate-50">
                      <td colSpan={4} className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">
                        Supplier Total
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums font-semibold text-slate-900">
                        {formatCurrency(group.supplierTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ))}

            {/* Grand Total */}
            {groups.length > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-slate-100 rounded-lg">
                <span className="text-sm font-semibold text-slate-700 uppercase">Grand Total</span>
                <span className="text-lg font-semibold text-slate-900 tabular-nums">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
            >
              <ShoppingCart className="h-4 w-4" />
              Create {groups.length} Draft PO{groups.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReorderRow({
  item,
  selected,
  onToggle,
  showCheckbox,
  showSupplier,
}: {
  item: LowStockProduct;
  selected: boolean;
  onToggle: () => void;
  showCheckbox: boolean;
  showSupplier: boolean;
}) {
  const badge = STATUS_BADGE[item.stockStatus];
  const suggestedQty = item.reorderQuantity ?? item.shortfall;

  return (
    <tr className={cn('hover:bg-slate-50', selected && 'bg-primary-50')}>
      {showCheckbox && (
        <td className="px-4 py-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            className="rounded border-slate-300"
          />
        </td>
      )}
      <td className="px-4 py-2 font-mono text-xs">
        <Link
          href={`/inventory/items/${item.product.nusafSku}`}
          className="text-primary-600 hover:text-primary-700 hover:underline"
        >
          {item.product.nusafSku}
        </Link>
      </td>
      <td className="px-4 py-2 text-slate-700 max-w-[200px] truncate" title={item.product.description}>
        {item.product.description}
      </td>
      {showSupplier && (
        <td className="px-4 py-2 text-slate-600">
          <Link
            href={`/admin/suppliers/${item.supplier.id}`}
            className="hover:text-primary-600 hover:underline"
          >
            {item.supplier.name}
          </Link>
        </td>
      )}
      <td className="px-4 py-2 text-slate-600">{item.location}</td>
      <td className="px-4 py-2 text-right tabular-nums">{item.onHand}</td>
      <td className="px-4 py-2 text-right tabular-nums">{item.available}</td>
      <td className="px-4 py-2 text-right tabular-nums text-slate-500">{item.onOrder}</td>
      <td className="px-4 py-2 text-right tabular-nums">{item.reorderPoint ?? '—'}</td>
      <td className="px-4 py-2 text-right tabular-nums font-medium text-red-600">{item.shortfall}</td>
      <td className="px-4 py-2 text-right tabular-nums font-medium text-primary-600">{suggestedQty}</td>
      <td className="px-4 py-2 text-right tabular-nums text-slate-500">
        {item.leadTimeDays != null ? `${item.leadTimeDays}d` : '—'}
      </td>
      <td className="px-4 py-2">
        <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-medium', badge?.className)}>
          {badge?.label}
        </span>
      </td>
    </tr>
  );
}
