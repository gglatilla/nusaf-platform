import { Metadata } from 'next';
import Link from 'next/link';
import { WebsiteHeader } from '@/components/website/WebsiteHeader';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';
import { Container } from '@/components/website/Container';
import { Factory, HardHat, Package2, Utensils, Cog, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Solutions by Industry',
  description:
    'Industrial component solutions for food & beverage, mining, manufacturing, and packaging industries. Tailored expertise for your sector.',
  openGraph: {
    title: 'Solutions by Industry | Nusaf Dynamic Technologies',
    description:
      'Specialized industrial solutions for food processing, mining, manufacturing, and packaging.',
  },
};

const industries = [
  {
    icon: Utensils,
    title: 'Food & Beverage',
    description:
      'Hygienic conveyor solutions for food processing and beverage production. FDA-compliant materials and easy-clean designs.',
    applications: [
      'Bottling lines',
      'Packaging systems',
      'Processing conveyors',
      'Cooling and freezing tunnels',
    ],
    products: ['Stainless steel chain', 'Food-grade belting', 'Hygienic components'],
    href: '/catalog',
  },
  {
    icon: HardHat,
    title: 'Mining',
    description:
      'Heavy-duty components built for harsh mining environments. Durable solutions for material handling and processing.',
    applications: [
      'Ore processing',
      'Material handling',
      'Crushing and screening',
      'Bulk transport',
    ],
    products: ['Heavy-duty chain', 'Mining sprockets', 'Wear-resistant components'],
    href: '/catalog',
  },
  {
    icon: Factory,
    title: 'Manufacturing',
    description:
      'Reliable power transmission and motion control for manufacturing operations. Precision components for assembly and automation.',
    applications: [
      'Assembly lines',
      'Automation systems',
      'Machine drives',
      'Material flow',
    ],
    products: ['Gearboxes', 'Bearings', 'Drives and motors'],
    href: '/catalog',
  },
  {
    icon: Package2,
    title: 'Packaging',
    description:
      'Efficient conveying solutions for packaging operations. Smooth, reliable product handling from filling to palletizing.',
    applications: [
      'Filling lines',
      'Case packing',
      'Palletizing systems',
      'Accumulation conveyors',
    ],
    products: ['Tabletop chain', 'Modular belting', 'Conveyor components'],
    href: '/catalog',
  },
];

export default function SolutionsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <WebsiteHeader />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-16 lg:py-24">
          <Container>
            <div className="max-w-2xl">
              <h1 className="text-3xl lg:text-4xl font-bold mb-4">Solutions by Industry</h1>
              <p className="text-lg text-slate-300">
                We understand that different industries have unique requirements. Our team has deep
                experience across multiple sectors, helping us provide tailored solutions for your
                specific application.
              </p>
            </div>
          </Container>
        </section>

        {/* Industries */}
        <section className="py-12 lg:py-16">
          <Container>
            <div className="space-y-12">
              {industries.map((industry, index) => (
                <div
                  key={industry.title}
                  className={`grid lg:grid-cols-2 gap-8 items-center ${
                    index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                  }`}
                >
                  <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <industry.icon className="w-6 h-6 text-primary-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">{industry.title}</h2>
                    </div>
                    <p className="text-slate-600 mb-6">{industry.description}</p>

                    <div className="grid sm:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="font-medium text-slate-900 mb-2">Applications</h4>
                        <ul className="space-y-1">
                          {industry.applications.map((app) => (
                            <li key={app} className="text-sm text-slate-500 flex items-center">
                              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full mr-2" />
                              {app}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 mb-2">Products</h4>
                        <ul className="space-y-1">
                          {industry.products.map((product) => (
                            <li key={product} className="text-sm text-slate-500 flex items-center">
                              <span className="w-1.5 h-1.5 bg-primary-400 rounded-full mr-2" />
                              {product}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <Link
                      href={industry.href}
                      className="inline-flex items-center text-primary-600 font-medium hover:text-primary-700"
                    >
                      View related products
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>

                  <div
                    className={`h-64 lg:h-80 bg-slate-100 rounded-2xl flex items-center justify-center ${
                      index % 2 === 1 ? 'lg:order-1' : ''
                    }`}
                  >
                    <industry.icon className="w-20 h-20 text-slate-300" />
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Custom Engineering Section */}
        <section className="py-16 lg:py-24 bg-slate-50">
          <Container>
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                    <Cog className="w-6 h-6 text-slate-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Custom Engineering</h2>
                </div>
                <p className="text-slate-600 mb-6">
                  When standard products don&apos;t meet your requirements, our engineering team can
                  help design and manufacture custom solutions. From modified standard components to
                  completely bespoke designs, we work with you to solve challenging applications.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <span className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="w-2 h-2 bg-primary-600 rounded-full" />
                    </span>
                    <span className="text-slate-600">Application analysis and consultation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="w-2 h-2 bg-primary-600 rounded-full" />
                    </span>
                    <span className="text-slate-600">Custom component design and manufacturing</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="w-2 h-2 bg-primary-600 rounded-full" />
                    </span>
                    <span className="text-slate-600">Prototype development and testing</span>
                  </li>
                </ul>
                <Link
                  href="/contact"
                  className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Discuss Your Project
                </Link>
              </div>
              <div className="h-64 lg:h-80 bg-slate-200 rounded-2xl flex items-center justify-center">
                <Cog className="w-20 h-20 text-slate-400" />
              </div>
            </div>
          </Container>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24 bg-primary-600 text-white">
          <Container>
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">Not Sure Where to Start?</h2>
              <p className="text-lg text-primary-100 mb-8">
                Our technical team can help identify the right products for your application. Share
                your requirements and we&apos;ll guide you to the best solution.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-3 bg-white text-primary-600 font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                Get Expert Advice
              </Link>
            </div>
          </Container>
        </section>
      </main>

      <WebsiteFooter />
    </div>
  );
}
