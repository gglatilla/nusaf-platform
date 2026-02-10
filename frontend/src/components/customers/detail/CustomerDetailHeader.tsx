'use client';

import Link from 'next/link';
import { ArrowLeft, Building2, ShoppingCart, FileText } from 'lucide-react';
import type { CompanyDetail } from '@/lib/api';
import { formatDate } from '@/lib/formatting';
import {
  TIER_LABELS,
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_STATUS_COLORS,
  PAYMENT_TERMS_LABELS,
} from '@/components/customers/constants';

interface CustomerDetailHeaderProps {
  customer: CompanyDetail;
}

export function CustomerDetailHeader({ customer }: CustomerDetailHeaderProps): JSX.Element {
  return (
    <div className="space-y-4">
      {/* Back link */}
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Customers
      </Link>

      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <Building2 className="h-6 w-6 text-slate-400" />
            <h1 className="text-2xl font-semibold text-slate-900">{customer.name}</h1>
            {customer.accountNumber && (
              <span className="text-sm font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {customer.accountNumber}
              </span>
            )}
            {/* Account Status Badge */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                ACCOUNT_STATUS_COLORS[customer.accountStatus || 'ACTIVE'] || 'bg-slate-100 text-slate-700'
              }`}
            >
              {ACCOUNT_STATUS_LABELS[customer.accountStatus || 'ACTIVE'] || customer.accountStatus}
            </span>
            {/* Tier Badge */}
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
              {TIER_LABELS[customer.tier] || customer.tier}
            </span>
            {/* Cash Account Badge */}
            {customer.isCashAccount && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                Cash Account
              </span>
            )}
            {/* Inactive Badge */}
            {!customer.isActive && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                Inactive
              </span>
            )}
          </div>
          {customer.tradingName && customer.tradingName !== customer.name && (
            <p className="text-sm text-slate-500">Trading as: {customer.tradingName}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>{PAYMENT_TERMS_LABELS[customer.paymentTerms] || customer.paymentTerms}</span>
            {customer.territory && (
              <>
                <span className="text-slate-300">|</span>
                <span>{customer.territory}</span>
              </>
            )}
            {customer.assignedSalesRep && (
              <>
                <span className="text-slate-300">|</span>
                <span>Rep: {customer.assignedSalesRep.firstName} {customer.assignedSalesRep.lastName}</span>
              </>
            )}
            <span className="text-slate-300">|</span>
            <span>Since {formatDate(customer.createdAt)}</span>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-center px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-center gap-1.5 text-slate-500 mb-1">
              <ShoppingCart className="h-3.5 w-3.5" />
              <span className="text-xs">Orders</span>
            </div>
            <span className="text-lg font-semibold text-slate-900">{customer._count.orders}</span>
          </div>
          <div className="text-center px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-center gap-1.5 text-slate-500 mb-1">
              <FileText className="h-3.5 w-3.5" />
              <span className="text-xs">Quotes</span>
            </div>
            <span className="text-lg font-semibold text-slate-900">{customer._count.quotes}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
