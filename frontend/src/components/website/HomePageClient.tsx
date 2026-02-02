'use client';

import { useState } from 'react';
import { WebsiteHeader, WebsiteFooter } from '@/components/website';
import { QuoteRequestModal } from '@/components/website/QuoteRequestModal';
import {
  HeroSection,
  ValuePropsSection,
  ProductCategoriesSection,
  TrustedBySection,
  CTABannerSection,
} from '@/components/website/sections';

export function HomePageClient() {
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const openModal = () => setIsQuoteModalOpen(true);
  const closeModal = () => setIsQuoteModalOpen(false);

  return (
    <div className="min-h-screen flex flex-col">
      <WebsiteHeader onRequestQuote={openModal} />
      <main className="flex-1">
        <HeroSection onRequestQuote={openModal} />
        <ValuePropsSection />
        <ProductCategoriesSection />
        <TrustedBySection />
        <CTABannerSection onRequestQuote={openModal} />
      </main>
      <WebsiteFooter />
      <QuoteRequestModal isOpen={isQuoteModalOpen} onClose={closeModal} />
    </div>
  );
}
