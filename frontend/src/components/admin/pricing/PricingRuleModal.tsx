'use client';

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogCloseButton,
} from '@/components/ui/dialog';
import {
  type PricingRule,
  type ImportSupplier,
  type ImportCategory,
  type CreatePricingRuleData,
  type UpdatePricingRuleData,
} from '@/lib/api';

interface PricingRuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: PricingRule | null; // null for create mode
  suppliers: ImportSupplier[];
  categories: ImportCategory[];
  onSave: (data: CreatePricingRuleData | UpdatePricingRuleData, isEdit: boolean, ruleId?: string) => Promise<void>;
  isSubmitting: boolean;
}

export function PricingRuleModal({
  open,
  onOpenChange,
  rule,
  suppliers,
  categories,
  onSave,
  isSubmitting,
}: PricingRuleModalProps) {
  const isEditMode = rule !== null;

  // Form state
  const [supplierId, setSupplierId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState<string | null>(null);
  const [isGross, setIsGross] = useState(false);
  const [discountPercent, setDiscountPercent] = useState('');
  const [freightPercent, setFreightPercent] = useState('');
  const [marginDivisor, setMarginDivisor] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/rule changes
  useEffect(() => {
    if (open) {
      if (rule) {
        // Edit mode - populate from existing rule
        setSupplierId(rule.supplier.id);
        setCategoryId(rule.category.id);
        setSubCategoryId(rule.subCategory?.id || null);
        setIsGross(rule.isGross);
        setDiscountPercent(rule.discountPercent !== null ? rule.discountPercent.toString() : '');
        setFreightPercent(rule.freightPercent.toString());
        setMarginDivisor(rule.marginDivisor.toString());
      } else {
        // Create mode - reset to defaults
        setSupplierId('');
        setCategoryId('');
        setSubCategoryId(null);
        setIsGross(false);
        setDiscountPercent('');
        setFreightPercent('12');
        setMarginDivisor('0.65');
      }
      setErrors({});
    }
  }, [open, rule]);

  // Get subcategories for selected category
  const selectedCategory = categories.find((c) => c.code === categoryId || c.name === categoryId);
  const subcategories = selectedCategory?.subcategories || [];

  // Find category by ID (need to match against the actual ID from suppliers)
  const getCategoryById = (id: string) => categories.find((c) => c.code === id);

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isEditMode) {
      if (!supplierId) newErrors.supplierId = 'Supplier is required';
      if (!categoryId) newErrors.categoryId = 'Category is required';
    }

    const freight = parseFloat(freightPercent);
    if (isNaN(freight) || freight < 0 || freight > 100) {
      newErrors.freightPercent = 'Must be between 0 and 100';
    }

    const margin = parseFloat(marginDivisor);
    if (isNaN(margin) || margin <= 0 || margin > 1) {
      newErrors.marginDivisor = 'Must be between 0 and 1';
    }

    if (isGross) {
      const discount = parseFloat(discountPercent);
      if (isNaN(discount) || discount < 0 || discount > 100) {
        newErrors.discountPercent = 'Must be between 0 and 100';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validate()) return;

    if (isEditMode && rule) {
      const updateData: UpdatePricingRuleData = {
        isGross,
        discountPercent: isGross ? parseFloat(discountPercent) : null,
        freightPercent: parseFloat(freightPercent),
        marginDivisor: parseFloat(marginDivisor),
      };
      await onSave(updateData, true, rule.id);
    } else {
      const createData: CreatePricingRuleData = {
        supplierId,
        categoryId,
        subCategoryId: subCategoryId || null,
        isGross,
        discountPercent: isGross ? parseFloat(discountPercent) : null,
        freightPercent: parseFloat(freightPercent),
        marginDivisor: parseFloat(marginDivisor),
      };
      await onSave(createData, false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Pricing Rule' : 'Add Pricing Rule'}</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>

        <DialogBody>
          <div className="space-y-4">
            {/* Supplier (only in create mode) */}
            {!isEditMode && (
              <div>
                <label htmlFor="supplier" className="block text-sm font-medium text-slate-700 mb-1">
                  Supplier <span className="text-red-500">*</span>
                </label>
                <select
                  id="supplier"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.supplierId ? 'border-red-300 bg-red-50' : 'border-slate-300'
                  }`}
                >
                  <option value="">Select supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
                {errors.supplierId && <p className="mt-1 text-xs text-red-600">{errors.supplierId}</p>}
              </div>
            )}

            {/* Category (only in create mode) */}
            {!isEditMode && (
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setSubCategoryId(null); // Reset subcategory when category changes
                  }}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.categoryId ? 'border-red-300 bg-red-50' : 'border-slate-300'
                  }`}
                >
                  <option value="">Select category...</option>
                  {categories.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
                {errors.categoryId && <p className="mt-1 text-xs text-red-600">{errors.categoryId}</p>}
              </div>
            )}

            {/* SubCategory (only in create mode) */}
            {!isEditMode && subcategories.length > 0 && (
              <div>
                <label htmlFor="subcategory" className="block text-sm font-medium text-slate-700 mb-1">
                  SubCategory <span className="text-slate-400">(optional)</span>
                </label>
                <select
                  id="subcategory"
                  value={subCategoryId || ''}
                  onChange={(e) => setSubCategoryId(e.target.value || null)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All subcategories</option>
                  {subcategories.map((sc) => (
                    <option key={sc.code} value={sc.code}>
                      {sc.name} ({sc.code})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Leave empty to apply rule to all subcategories in this category
                </p>
              </div>
            )}

            {/* Read-only info in edit mode */}
            {isEditMode && rule && (
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Supplier:</span>
                  <span className="font-medium text-slate-900">{rule.supplier.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Category:</span>
                  <span className="font-medium text-slate-900">{rule.category.name}</span>
                </div>
                {rule.subCategory && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">SubCategory:</span>
                    <span className="font-medium text-slate-900">{rule.subCategory.name}</span>
                  </div>
                )}
              </div>
            )}

            {/* Is Gross toggle */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="isGross" className="text-sm font-medium text-slate-700">
                  Gross Pricing
                </label>
                <button
                  type="button"
                  id="isGross"
                  onClick={() => setIsGross(!isGross)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    isGross ? 'bg-primary-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isGross ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Enable if supplier prices are gross (require discount)
              </p>
            </div>

            {/* Discount Percent (only if gross) */}
            {isGross && (
              <div>
                <label htmlFor="discountPercent" className="block text-sm font-medium text-slate-700 mb-1">
                  Discount % <span className="text-red-500">*</span>
                </label>
                <div className="relative max-w-[150px]">
                  <input
                    type="number"
                    id="discountPercent"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    step="0.1"
                    min="0"
                    max="100"
                    className={`w-full px-3 py-2 pr-8 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.discountPercent ? 'border-red-300 bg-red-50' : 'border-slate-300'
                    }`}
                    placeholder="40"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                </div>
                {errors.discountPercent && <p className="mt-1 text-xs text-red-600">{errors.discountPercent}</p>}
              </div>
            )}

            {/* Freight Percent */}
            <div>
              <label htmlFor="freightPercent" className="block text-sm font-medium text-slate-700 mb-1">
                Freight % <span className="text-red-500">*</span>
              </label>
              <div className="relative max-w-[150px]">
                <input
                  type="number"
                  id="freightPercent"
                  value={freightPercent}
                  onChange={(e) => setFreightPercent(e.target.value)}
                  step="0.1"
                  min="0"
                  max="100"
                  className={`w-full px-3 py-2 pr-8 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.freightPercent ? 'border-red-300 bg-red-50' : 'border-slate-300'
                  }`}
                  placeholder="12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
              </div>
              {errors.freightPercent && <p className="mt-1 text-xs text-red-600">{errors.freightPercent}</p>}
              <p className="mt-1 text-xs text-slate-500">Freight/shipping cost added to base price</p>
            </div>

            {/* Margin Divisor */}
            <div>
              <label htmlFor="marginDivisor" className="block text-sm font-medium text-slate-700 mb-1">
                Margin Divisor <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="marginDivisor"
                value={marginDivisor}
                onChange={(e) => setMarginDivisor(e.target.value)}
                step="0.01"
                min="0.01"
                max="1"
                className={`max-w-[150px] px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.marginDivisor ? 'border-red-300 bg-red-50' : 'border-slate-300'
                }`}
                placeholder="0.65"
              />
              {errors.marginDivisor && <p className="mt-1 text-xs text-red-600">{errors.marginDivisor}</p>}
              <p className="mt-1 text-xs text-slate-500">
                Value between 0-1. Lower = higher margin (0.65 = ~35% margin)
              </p>
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEditMode ? (
              'Update Rule'
            ) : (
              'Create Rule'
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
