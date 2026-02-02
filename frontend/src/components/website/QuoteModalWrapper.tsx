'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Suspense } from 'react';
import { QuoteRequestModal } from './QuoteRequestModal';

function QuoteModalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const isOpen = searchParams.get('modal') === 'quote';

  const handleClose = () => {
    // Remove modal param, keep other params
    const params = new URLSearchParams(searchParams.toString());
    params.delete('modal');
    const newUrl = params.toString() ? `${pathname}?${params}` : pathname;
    router.push(newUrl);
  };

  return <QuoteRequestModal isOpen={isOpen} onClose={handleClose} />;
}

export function QuoteModalWrapper() {
  return (
    <Suspense fallback={null}>
      <QuoteModalContent />
    </Suspense>
  );
}
