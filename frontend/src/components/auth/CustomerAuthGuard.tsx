'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

interface CustomerAuthGuardProps {
  children: React.ReactNode;
}

/**
 * Auth guard for the customer portal (/my/*).
 * - Redirects unauthenticated users to /login
 * - Redirects non-CUSTOMER roles to /dashboard (ERP)
 */
export function CustomerAuthGuard({ children }: CustomerAuthGuardProps) {
  const router = useRouter();
  const { user, accessToken, isLoading } = useAuthStore();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    if (useAuthStore.persist?.hasHydrated()) {
      setHasHydrated(true);
    }

    const unsub = useAuthStore.persist?.onFinishHydration(() => {
      setHasHydrated(true);
    });

    return () => unsub?.();
  }, []);

  useEffect(() => {
    if (!hasHydrated || isLoading) return;

    if (!accessToken) {
      router.push('/login');
      return;
    }

    // Staff users should not be on the customer portal
    if (user && user.role !== 'CUSTOMER') {
      router.push('/dashboard');
    }
  }, [hasHydrated, isLoading, accessToken, user, router]);

  if (!hasHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user || !accessToken || user.role !== 'CUSTOMER') {
    return null;
  }

  return <>{children}</>;
}
