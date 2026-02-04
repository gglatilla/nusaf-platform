import { Metadata } from 'next';
import Link from 'next/link';
import { WebsiteHeader } from '@/components/website/WebsiteHeader';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';
import { Container } from '@/components/website/Container';
import {
  FileText,
  Download,
  BookOpen,
  Wrench,
  ExternalLink,
  FileSpreadsheet,
  Cog,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Resources',
  description:
    'Download product catalogues, technical documentation, and specifications from Nusaf Dynamic Technologies and our European supplier partners.',
  openGraph: {
    title: 'Resources | Nusaf Dynamic Technologies',
    description:
      'Access product catalogues, technical documentation, and specifications for industrial components.',
  },
};

// Supplier catalogues available for download
const catalogues = [
  {
    supplier: 'Chiaravalli',
    title: 'Power Transmission Catalogue',
    description:
      'Complete catalogue of sprockets, timing pulleys, gears, and power transmission components.',
    fileSize: '45 MB',
    format: 'PDF',
    href: 'https://www.chiyvalli.com/en/catalogue-download', // External link to supplier
    external: true,
  },
  {
    supplier: 'Regina',
    title: 'Conveyor Chain Catalogue',
    description: 'Modular belting, table top chains, and conveyor components for food and packaging.',
    fileSize: '32 MB',
    format: 'PDF',
    href: 'https://www.regina.it/en/download-area/',
    external: true,
  },
  {
    supplier: 'Tecom',
    title: 'Industrial Components Catalogue',
    description: 'Levelling feet, tube connectors, and structural components for machinery.',
    fileSize: '28 MB',
    format: 'PDF',
    href: 'https://www.tecom-srl.com/downloads/',
    external: true,
  },
];

// Technical documentation categories
const documentation = [
  {
    icon: Wrench,
    title: 'Installation Guides',
    description: 'Step-by-step instructions for mounting and installing our products.',
    items: [
      { name: 'Chain Installation Guide', href: '#' },
      { name: 'Gearbox Mounting Manual', href: '#' },
      { name: 'Bearing Installation Tips', href: '#' },
    ],
  },
  {
    icon: FileSpreadsheet,
    title: 'Technical Specifications',
    description: 'Detailed specifications and dimensional data for product selection.',
    items: [
      { name: 'Sprocket Specifications', href: '/catalog?category=power-transmission' },
      { name: 'Chain Pitch Reference', href: '/catalog?category=conveyor' },
      { name: 'Gearbox Selection Guide', href: '/catalog?category=gearboxes' },
    ],
  },
  {
    icon: Cog,
    title: 'Maintenance Resources',
    description: 'Maintenance schedules, troubleshooting guides, and care instructions.',
    items: [
      { name: 'Chain Maintenance Guide', href: '#' },
      { name: 'Lubrication Recommendations', href: '#' },
      { name: 'Troubleshooting FAQ', href: '#' },
    ],
  },
];

export default function ResourcesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <WebsiteHeader />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-16 lg:py-20">
          <Container>
            <div className="max-w-3xl">
              <h1 className="text-4xl lg:text-5xl font-bold mb-6">Resources & Downloads</h1>
              <p className="text-xl text-slate-300 leading-relaxed">
                Access product catalogues, technical documentation, and specifications to help you
                select the right components for your application.
              </p>
            </div>
          </Container>
        </section>

        {/* Catalogues Section */}
        <section className="py-16 lg:py-20">
          <Container>
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-6 h-6 text-primary-600" />
                <h2 className="text-2xl font-bold text-slate-900">Supplier Catalogues</h2>
              </div>
              <p className="text-slate-600 max-w-2xl">
                Download comprehensive product catalogues from our European manufacturing partners.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {catalogues.map((catalogue) => (
                <div
                  key={catalogue.title}
                  className="bg-white border border-slate-200 rounded-xl p-6 hover:border-primary-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                >
                  {/* Supplier badge */}
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded mb-4">
                    {catalogue.supplier}
                  </span>

                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{catalogue.title}</h3>
                  <p className="text-sm text-slate-600 mb-4">{catalogue.description}</p>

                  {/* File info */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {catalogue.format}
                    </span>
                    <span>{catalogue.fileSize}</span>
                  </div>

                  {/* Download button */}
                  {catalogue.external ? (
                    <a
                      href={catalogue.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 w-full justify-center px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Visit Download Page
                    </a>
                  ) : (
                    <a
                      href={catalogue.href}
                      download
                      className="inline-flex items-center gap-2 w-full justify-center px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Technical Documentation Section */}
        <section className="py-16 lg:py-20 bg-slate-50">
          <Container>
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-primary-600" />
                <h2 className="text-2xl font-bold text-slate-900">Technical Documentation</h2>
              </div>
              <p className="text-slate-600 max-w-2xl">
                Access installation guides, specifications, and maintenance resources for our product
                range.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {documentation.map((category) => (
                <div key={category.title} className="bg-white rounded-xl p-6 border border-slate-200">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                    <category.icon className="w-6 h-6 text-primary-600" />
                  </div>

                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{category.title}</h3>
                  <p className="text-sm text-slate-600 mb-4">{category.description}</p>

                  <ul className="space-y-2">
                    {category.items.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
                        >
                          {item.name} →
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Need Help Section */}
        <section className="py-16 lg:py-20">
          <Container>
            <div className="bg-primary-50 border border-primary-200 rounded-2xl p-8 lg:p-12 text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Need Help Selecting Products?
              </h2>
              <p className="text-slate-600 max-w-xl mx-auto mb-6">
                Our technical team can help you find the right components for your application.
                Contact us for expert advice and customized solutions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Contact Technical Support
                </Link>
                <Link
                  href="/catalog"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-slate-700 font-medium rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  Browse Products
                </Link>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <WebsiteFooter />
    </div>
  );
}
