import { Metadata } from 'next';
import { WebsiteHeader } from '@/components/website/WebsiteHeader';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';
import { QuoteModalWrapper } from '@/components/website/QuoteModalWrapper';
import { OrganizationJsonLd } from '@/components/seo';
import {
  HeroSection,
  ValuePropsSection,
  ProductCategoriesSection,
  TrustedBySection,
  CTABannerSection,
} from '@/components/website/sections';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nusaf.co.za';

export const metadata: Metadata = {
  title: 'Nusaf Dynamic Technologies | Industrial Components & Power Transmission',
  description:
    'Premium conveyor components and power transmission solutions for South African manufacturers. Sprockets, modular chain, bearings, gearboxes, and custom machining. Local stock, fast delivery.',
  openGraph: {
    title: 'Nusaf Dynamic Technologies | Industrial Components',
    description:
      'Premium conveyor components and power transmission solutions for South African manufacturers.',
    type: 'website',
  },
};

// Organization structured data for SEO
const organizationData = {
  name: 'Nusaf Dynamic Technologies',
  description:
    'Premium conveyor components and power transmission solutions for South African manufacturers. Sprockets, modular chain, bearings, gearboxes, and custom machining.',
  url: BASE_URL,
  logo: `${BASE_URL}/images/logo.png`,
  contactPoint: {
    telephone: '+27 11 592 1962',
    email: 'sales@nusaf.co.za',
    contactType: 'sales',
  },
  address: {
    addressLocality: 'Johannesburg',
    addressRegion: 'Gauteng',
    addressCountry: 'South Africa',
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* SEO: Organization JSON-LD */}
      <OrganizationJsonLd data={organizationData} />

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
