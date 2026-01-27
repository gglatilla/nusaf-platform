'use client';

import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/layout/PageHeader';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.firstName}`}
      />

      <div className="p-6 lg:p-8">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Active Orders"
            value="0"
            change="No orders yet"
          />
          <StatCard
            label="Pending Quotes"
            value="0"
            change="No quotes yet"
          />
          <StatCard
            label="Open Invoices"
            value="R 0.00"
            change="No invoices"
          />
          <StatCard
            label="Last Order"
            value="—"
            change="No recent orders"
          />
        </div>

        {/* Content cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Recent Orders
            </h2>
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">No orders yet</p>
              <p className="text-slate-400 text-xs mt-1">
                Your recent orders will appear here
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Pending Quotes
            </h2>
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">No pending quotes</p>
              <p className="text-slate-400 text-xs mt-1">
                Request a quote to get started
              </p>
            </div>
          </div>
        </div>

        {/* Account info */}
        <div className="mt-6 bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Account Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Company
              </p>
              <p className="mt-1 text-base font-semibold text-slate-900">
                {user?.company.name}
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Tier
              </p>
              <p className="mt-1 text-base font-semibold text-slate-900">
                {user?.company.tier.replace('_', ' ')}
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Role
              </p>
              <p className="mt-1 text-base font-semibold text-slate-900">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
}

function StatCard({ label, value, change, positive }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {change && (
        <p
          className={`mt-1 text-xs ${
            positive === true
              ? 'text-success'
              : positive === false
                ? 'text-error'
                : 'text-slate-400'
          }`}
        >
          {change}
        </p>
      )}
    </div>
  );
}
