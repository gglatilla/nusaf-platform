import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { WebsiteHeader } from '@/components/website/WebsiteHeader';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';
import { Container } from '@/components/website/Container';
import { Building2, Globe, Wrench, Shield, Award, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Learn about Nusaf Dynamic Technologies - your trusted partner for industrial components, power transmission, and conveyor solutions in South Africa since 1993.',
  openGraph: {
    title: 'About Us | Nusaf Dynamic Technologies',
    description:
      'Premium industrial components from leading European manufacturers. Local expertise, global quality.',
  },
};

const capabilities = [
  {
    icon: Globe,
    title: 'Global Sourcing',
    description:
      'Direct partnerships with leading European manufacturers including Chiaravalli, Regina, and Tecom.',
  },
  {
    icon: Wrench,
    title: 'Custom Solutions',
    description:
      'In-house manufacturing capability for chain configuration, custom machining, and modifications.',
  },
  {
    icon: Users,
    title: 'Technical Support',
    description:
      'Expert engineering support to help you select the right components for your application.',
  },
];

const values = [
  {
    icon: Shield,
    title: 'Quality Assurance',
    description: 'ISO 9001 certified processes ensuring consistent quality across all products.',
  },
  {
    icon: Award,
    title: 'Industry Experience',
    description: 'Over 30 years of expertise serving South African industry.',
  },
  {
    icon: Building2,
    title: 'Local Presence',
    description: 'Warehouses in Johannesburg and Cape Town for fast delivery nationwide.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <WebsiteHeader />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-20 lg:py-28">
          <Container>
            <div className="max-w-3xl">
              <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                Driving Dynamic Solutions Since 1993
              </h1>
              <p className="text-xl text-slate-300 leading-relaxed">
                Nusaf Dynamic Technologies is South Africa&apos;s trusted supplier of premium
                industrial components, specializing in conveyor systems, power transmission, and
                motion control solutions.
              </p>
            </div>
          </Container>
        </section>

        {/* Story Section */}
        <section className="py-16 lg:py-24">
          <Container>
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Story</h2>
                <div className="space-y-4 text-slate-600">
                  <p>
                    Founded in 1993, Nusaf Dynamic Technologies has grown from a small conveyor
                    component distributor to become a leading supplier of industrial components
                    across South Africa.
                  </p>
                  <p>
                    Headquartered in Johannesburg with additional facilities in Cape Town and
                    Mbombela, we serve customers nationwide with a comprehensive range of products
                    and services.
                  </p>
                  <p>
                    Our success is built on strong partnerships with world-class European
                    manufacturers, combined with local expertise and understanding of the unique
                    requirements of South African industry.
                  </p>
                </div>
              </div>
              <div className="relative h-80 lg:h-[400px] bg-slate-100 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Building2 className="w-24 h-24 text-slate-300" />
                </div>
                {/* Placeholder for facility image */}
              </div>
            </div>
          </Container>
        </section>

        {/* Capabilities Section */}
        <section className="py-16 lg:py-24 bg-slate-50">
          <Container>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">What We Do</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                From sourcing to support, we provide complete solutions for your industrial
                component needs.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {capabilities.map((capability) => (
                <div
                  key={capability.title}
                  className="bg-white p-8 rounded-xl shadow-sm border border-slate-200"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-6">
                    <capability.icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">{capability.title}</h3>
                  <p className="text-slate-600">{capability.description}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Values Section */}
        <section className="py-16 lg:py-24">
          <Container>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Choose Nusaf</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Our commitment to quality and service sets us apart in the industry.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {values.map((value) => (
                <div key={value.title} className="text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <value.icon className="w-8 h-8 text-slate-700" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">{value.title}</h3>
                  <p className="text-slate-600">{value.description}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Locations Section */}
        <section className="py-16 lg:py-24 bg-slate-50">
          <Container>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Locations</h2>
              <p className="text-lg text-slate-600">
                Strategically positioned to serve customers across South Africa.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-2">Johannesburg (HQ)</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Main warehouse, manufacturing facility, and head office
                </p>
                <ul className="text-sm text-slate-500 space-y-1">
                  <li>Full product range</li>
                  <li>Chain configuration</li>
                  <li>Custom machining</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-2">Cape Town</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Regional warehouse and sales office
                </p>
                <ul className="text-sm text-slate-500 space-y-1">
                  <li>Finished goods stock</li>
                  <li>Fast local delivery</li>
                  <li>Technical support</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-2">Mbombela</h3>
                <p className="text-sm text-slate-600 mb-4">Sales office serving Mpumalanga region</p>
                <ul className="text-sm text-slate-500 space-y-1">
                  <li>Regional sales</li>
                  <li>Customer support</li>
                  <li>Order coordination</li>
                </ul>
              </div>
            </div>
          </Container>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24 bg-primary-600 text-white">
          <Container>
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">Ready to Work Together?</h2>
              <p className="text-lg text-primary-100 mb-8">
                Contact our team to discuss your requirements or request a quote.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="px-8 py-3 bg-white text-primary-600 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Contact Us
                </Link>
                <Link
                  href="/browse"
                  className="px-8 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-400 transition-colors"
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
