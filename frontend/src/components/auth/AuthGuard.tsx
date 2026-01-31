'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { user, accessToken, isLoading } = useAuthStore();
  const hasHydrated = useAuthStore.persist.hasHydrated();

  // Force re-render when hydration completes
  const [, forceUpdate] = useState({});
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      forceUpdate({});
    });
    return unsub;
  }, []);

  useEffect(() => {
    // Only redirect after hydration is complete
    if (hasHydrated && !isLoading && !accessToken) {
      router.push('/login');
    }
  }, [hasHydrated, isLoading, accessToken, router]);

  // Show loading while hydrating or loading
  if (!hasHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Not authenticated - will redirect in useEffect
  if (!user || !accessToken) {
    return null;
  }

  return <>{children}</>;
}
