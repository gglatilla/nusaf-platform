'use client';

import {
  HeroSection,
  ValuePropsSection,
  ProductCategoriesSection,
  TrustedBySection,
  CTABannerSection,
} from '@/components/website/sections';
import { useQuoteModal } from '@/components/website/QuoteModalContext';

export default function HomePage() {
  const { openModal } = useQuoteModal();

  return (
    <div>
      <HeroSection onRequestQuote={openModal} />
      <ValuePropsSection />
      <ProductCategoriesSection />
      <TrustedBySection />
      <CTABannerSection onRequestQuote={openModal} />
    </div>
  );
}
