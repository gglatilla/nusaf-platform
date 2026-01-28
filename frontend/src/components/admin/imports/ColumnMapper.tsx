'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Check, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { convertTecomSku } from '@nusaf/shared';

export interface ColumnMapping {
  CODE: string;
  DESCRIPTION: string;
  PRICE: string;
  UM?: string;
  CATEGORY: string;
  SUBCATEGORY?: string;
}

interface ColumnMapperProps {
  headers: string[];
  sampleData: Record<string, unknown>[];
  initialMapping?: Partial<ColumnMapping>;
  onMappingChange: (mapping: ColumnMapping) => void;
  onValidationChange: (isValid: boolean) => void;
  supplierCode?: string;
}

const REQUIRED_FIELDS: Array<keyof ColumnMapping> = ['CODE', 'DESCRIPTION', 'PRICE', 'CATEGORY'];
const OPTIONAL_FIELDS: Array<keyof ColumnMapping> = ['UM', 'SUBCATEGORY'];

const FIELD_DESCRIPTIONS: Record<keyof ColumnMapping, string> = {
  CODE: 'Product/SKU code from supplier',
  DESCRIPTION: 'Product description',
  PRICE: 'Unit price (EUR)',
  UM: 'Unit of measure (EA, M, KG, etc.)',
  CATEGORY: 'Category code (e.g., C, B, P)',
  SUBCATEGORY: 'Subcategory code (e.g., C-001, B-001)',
};

export function ColumnMapper({
  headers,
  sampleData,
  initialMapping,
  onMappingChange,
  onValidationChange,
  supplierCode,
}: ColumnMapperProps) {
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>(initialMapping || {});
  const [showPreview, setShowPreview] = useState(true);

  // Validate mapping
  useEffect(() => {
    const isValid = REQUIRED_FIELDS.every((field) => mapping[field] && mapping[field] !== '');
    onValidationChange(isValid);

    if (isValid) {
      onMappingChange(mapping as ColumnMapping);
    }
  }, [mapping, onMappingChange, onValidationChange]);

  const handleFieldChange = (field: keyof ColumnMapping, value: string) => {
    setMapping((prev) => ({
      ...prev,
      [field]: value || undefined,
    }));
  };

  const getPreviewValue = (columnName: string | undefined): string => {
    if (!columnName || sampleData.length === 0) return '—';
    const value = sampleData[0][columnName];
    if (value === undefined || value === null) return '—';
    const strValue = String(value);
    return strValue.length > 30 ? strValue.slice(0, 30) + '...' : strValue;
  };

  const isMapped = (field: keyof ColumnMapping): boolean => {
    return !!mapping[field] && mapping[field] !== '';
  };

  // Convert supplier SKU to Nusaf code based on supplier
  const convertToNusafCode = (supplierSku: string): string => {
    if (!supplierCode) return supplierSku;

    // Tecom requires SKU conversion
    if (supplierCode === 'TECOM') {
      try {
        return convertTecomSku(supplierSku);
      } catch {
        return supplierSku; // Return original if conversion fails
      }
    }

    // Chiaravalli, Regina: use supplier SKU directly
    return supplierSku;
  };

  // Get the mapped CODE column name
  const codeColumnName = mapping.CODE;

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <HelpCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-900">Map columns from your Excel file</p>
            <p className="text-blue-700 mt-1">
              Select which column in your file corresponds to each field.
              Required fields are marked with <span className="text-red-600">*</span>
            </p>
          </div>
        </div>
      </div>

      {/* Column mapping form */}
      <div className="space-y-4">
        {/* Required fields */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-900">Required Fields</h3>
          {REQUIRED_FIELDS.map((field) => (
            <MappingRow
              key={field}
              field={field}
              description={FIELD_DESCRIPTIONS[field]}
              headers={headers}
              selectedValue={mapping[field] || ''}
              onChange={(value) => handleFieldChange(field, value)}
              isMapped={isMapped(field)}
              isRequired
              previewValue={getPreviewValue(mapping[field])}
              showPreview={showPreview}
            />
          ))}
        </div>

        {/* Optional fields */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <h3 className="text-sm font-medium text-slate-900">Optional Fields</h3>
          {OPTIONAL_FIELDS.map((field) => (
            <MappingRow
              key={field}
              field={field}
              description={FIELD_DESCRIPTIONS[field]}
              headers={headers}
              selectedValue={mapping[field] || ''}
              onChange={(value) => handleFieldChange(field, value)}
              isMapped={isMapped(field)}
              isRequired={false}
              previewValue={getPreviewValue(mapping[field])}
              showPreview={showPreview}
            />
          ))}
        </div>
      </div>

      {/* Preview toggle */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showPreview}
            onChange={(e) => setShowPreview(e.target.checked)}
            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          Show preview values
        </label>
      </div>

      {/* Sample data preview */}
      {showPreview && sampleData.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-slate-900 mb-2">Sample Data Preview</h3>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {/* Show NUSAF CODE as first column if CODE is mapped */}
                  {codeColumnName && (
                    <th className="px-3 py-2 text-left text-xs font-medium text-primary-600 uppercase tracking-wider">
                      NUSAF CODE
                    </th>
                  )}
                  {headers.slice(0, codeColumnName ? 5 : 6).map((header) => (
                    <th
                      key={header}
                      className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {sampleData.slice(0, 3).map((row, idx) => (
                  <tr key={idx}>
                    {/* Show converted Nusaf code as first column */}
                    {codeColumnName && (
                      <td className="px-3 py-2 text-sm font-medium text-primary-700 whitespace-nowrap">
                        {convertToNusafCode(String(row[codeColumnName] ?? ''))}
                      </td>
                    )}
                    {headers.slice(0, codeColumnName ? 5 : 6).map((header) => (
                      <td key={header} className="px-3 py-2 text-sm text-slate-600 whitespace-nowrap">
                        {String(row[header] ?? '—').slice(0, 25)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

interface MappingRowProps {
  field: keyof ColumnMapping;
  description: string;
  headers: string[];
  selectedValue: string;
  onChange: (value: string) => void;
  isMapped: boolean;
  isRequired: boolean;
  previewValue: string;
  showPreview: boolean;
}

function MappingRow({
  field,
  description,
  headers,
  selectedValue,
  onChange,
  isMapped,
  isRequired,
  previewValue,
  showPreview,
}: MappingRowProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Status indicator */}
      <div className="w-6 flex justify-center">
        {isMapped ? (
          <Check className="h-5 w-5 text-emerald-500" />
        ) : isRequired ? (
          <AlertCircle className="h-5 w-5 text-amber-500" />
        ) : (
          <div className="h-5 w-5" />
        )}
      </div>

      {/* Field info */}
      <div className="w-40">
        <p className="text-sm font-medium text-slate-900">
          {field}
          {isRequired && <span className="text-red-500 ml-0.5">*</span>}
        </p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>

      {/* Column selector */}
      <div className="flex-1">
        <select
          value={selectedValue}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
            !isMapped && isRequired
              ? 'border-amber-300 bg-amber-50'
              : 'border-slate-300 bg-white'
          )}
        >
          <option value="">Select column...</option>
          {headers.map((header) => (
            <option key={header} value={header}>
              {header}
            </option>
          ))}
        </select>
      </div>

      {/* Preview value */}
      {showPreview && (
        <div className="w-32 text-right">
          <p className="text-sm text-slate-500 truncate" title={previewValue}>
            {previewValue}
          </p>
        </div>
      )}
    </div>
  );
}
