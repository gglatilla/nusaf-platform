'use client';

import { useState } from 'react';
import {
  HeroSection,
  ValuePropsSection,
  ProductCategoriesSection,
  TrustedBySection,
  CTABannerSection,
} from '@/components/website/sections';

export default function HomePage() {
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  const handleRequestQuote = () => {
    // TODO: Open QuoteRequestModal (MT-11)
    setIsQuoteModalOpen(true);
    console.log('Request quote clicked - modal will be added in MT-11');
  };

  return (
    <div>
      <HeroSection onRequestQuote={handleRequestQuote} />
      <ValuePropsSection />
      <ProductCategoriesSection />
      <TrustedBySection />
      <CTABannerSection onRequestQuote={handleRequestQuote} />
    </div>
  );
}
