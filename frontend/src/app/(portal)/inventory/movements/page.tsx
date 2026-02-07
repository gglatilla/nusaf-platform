'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/layout/PageHeader';
import { MovementLogTable } from '@/components/inventory';

export default function StockMovementsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();

  useEffect(() => {
    if (!authLoading && user && user.role === 'CUSTOMER') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="p-4 sm:p-6 xl:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="h-64 bg-slate-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (user?.role === 'CUSTOMER') {
    return null;
  }

  return (
    <>
      <PageHeader
        title="Stock Movements"
        description="Audit log of all inventory changes across warehouses"
      />
      <div className="p-4 sm:p-6 xl:p-8">
        <MovementLogTable />
      </div>
    </>
  );
}
