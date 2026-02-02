import { Metadata } from 'next';

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
    'Johannesburg',
    'Cape Town',
  ],
  authors: [{ name: 'Nusaf Dynamic Technologies' }],
  creator: 'Nusaf Dynamic Technologies',
  publisher: 'Nusaf Dynamic Technologies',
  openGraph: {
    title: 'Nusaf Dynamic Technologies',
    description: 'Premium industrial components with local stock and fast delivery.',
    type: 'website',
    locale: 'en_ZA',
    siteName: 'Nusaf Dynamic Technologies',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nusaf Dynamic Technologies',
    description: 'Premium industrial components with local stock and fast delivery.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
