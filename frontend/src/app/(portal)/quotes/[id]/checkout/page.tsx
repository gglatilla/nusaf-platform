'use client';

import { useParams } from 'next/navigation';
import { CheckoutPage } from '@/components/checkout';

export default function StaffCheckoutPage(): JSX.Element {
  const params = useParams();
  const quoteId = params.id as string;

  return (
    <div className="py-6">
      <CheckoutPage quoteId={quoteId} portalType="staff" />
    </div>
  );
}
