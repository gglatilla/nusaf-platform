'use client';

import { CustomerAuthGuard } from '@/components/auth/CustomerAuthGuard';
import { CustomerLayout } from '@/components/layout/CustomerLayout';

export default function CustomerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CustomerAuthGuard>
      <CustomerLayout>{children}</CustomerLayout>
    </CustomerAuthGuard>
  );
}
