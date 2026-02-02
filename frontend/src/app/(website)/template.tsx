'use client';

import { WebsiteHeader, WebsiteFooter } from '@/components/website';
import { QuoteRequestModal } from '@/components/website/QuoteRequestModal';
import { QuoteModalProvider, useQuoteModal } from '@/components/website/QuoteModalContext';

function WebsiteTemplateContent({ children }: { children: React.ReactNode }) {
  const { isOpen, openModal, closeModal } = useQuoteModal();

  return (
    <div className="min-h-screen flex flex-col">
      <WebsiteHeader onRequestQuote={openModal} />
      <main className="flex-1">{children}</main>
      <WebsiteFooter />

      <QuoteRequestModal isOpen={isOpen} onClose={closeModal} />
    </div>
  );
}

export default function WebsiteTemplate({ children }: { children: React.ReactNode }) {
  return (
    <QuoteModalProvider>
      <WebsiteTemplateContent>{children}</WebsiteTemplateContent>
    </QuoteModalProvider>
  );
}
