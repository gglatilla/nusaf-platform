import { WebsiteHeader } from '@/components/website/WebsiteHeader';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';
import { QuoteModalWrapper } from '@/components/website/QuoteModalWrapper';
import {
  HeroSection,
  ValuePropsSection,
  ProductCategoriesSection,
  TrustedBySection,
  CTABannerSection,
} from '@/components/website/sections';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <WebsiteHeader />
      <main className="flex-1">
        <HeroSection />
        <ValuePropsSection />
        <ProductCategoriesSection />
        <TrustedBySection />
        <CTABannerSection />
      </main>
      <WebsiteFooter />
      <QuoteModalWrapper />
    </div>
  );
}
