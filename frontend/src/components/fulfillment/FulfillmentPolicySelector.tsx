'use client';

import type { FulfillmentPolicy } from '@/lib/api';

interface FulfillmentPolicySelectorProps {
  value: FulfillmentPolicy;
  onChange: (policy: FulfillmentPolicy) => void;
  disabled?: boolean;
}

const POLICY_OPTIONS: Array<{
  value: FulfillmentPolicy;
  label: string;
  description: string;
}> = [
  {
    value: 'SHIP_COMPLETE',
    label: 'Ship Complete',
    description: 'Wait until all items are available before shipping',
  },
  {
    value: 'SHIP_PARTIAL',
    label: 'Ship Partial',
    description: 'Ship available items immediately, backorder the rest',
  },
  {
    value: 'SALES_DECISION',
    label: 'Sales Decision',
    description: 'Requires manual review by sales team',
  },
];

export function FulfillmentPolicySelector({
  value,
  onChange,
  disabled,
}: FulfillmentPolicySelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        Fulfillment Policy
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {POLICY_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`
              relative flex cursor-pointer rounded-lg border p-3 transition-colors
              ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-slate-50'}
              ${value === option.value
                ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                : 'border-slate-200 bg-white'
              }
            `}
          >
            <input
              type="radio"
              name="fulfillment-policy"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              disabled={disabled}
              className="sr-only"
            />
            <div className="flex flex-col">
              <span className={`text-sm font-medium ${
                value === option.value ? 'text-primary-700' : 'text-slate-900'
              }`}>
                {option.label}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                {option.description}
              </span>
            </div>
            {value === option.value && (
              <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary-500" />
            )}
          </label>
        ))}
      </div>
    </div>
  );
}
