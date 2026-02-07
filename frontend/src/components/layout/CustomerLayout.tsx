'use client';

import { CustomerHeader } from './CustomerHeader';

interface CustomerLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout for the customer portal (/my/*).
 * Header-based navigation (no sidebar), centered content with max-w-7xl.
 */
export function CustomerLayout({ children }: CustomerLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
