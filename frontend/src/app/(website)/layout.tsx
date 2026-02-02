import { Metadata } from 'next';
import { WebsiteHeader, WebsiteFooter } from '@/components/website';

export const metadata: Metadata = {
  title: {
    default: 'Nusaf Dynamic Technologies | Industrial Components & Power Transmission',
    template: '%s | Nusaf',
  },
  description:
    'Premium conveyor components, power transmission, bearings, and gearboxes. Local stock in Johannesburg, Cape Town, and Mbombela. Fast delivery across South Africa.',
  keywords: [
    'conveyor components',
    'power transmission',
    'sprockets',
    'gearboxes',
    'bearings',
    'levelling feet',
    'industrial supplies',
    'South Africa',
  ],
  openGraph: {
    title: 'Nusaf Dynamic Technologies',
    description: 'Premium industrial components with local stock and fast delivery.',
    type: 'website',
    locale: 'en_ZA',
  },
};

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <WebsiteHeader />
      <main className="flex-1">{children}</main>
      <WebsiteFooter />
    </div>
  );
}
