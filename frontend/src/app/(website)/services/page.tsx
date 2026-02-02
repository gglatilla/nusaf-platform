import { Metadata } from 'next';
import Link from 'next/link';
import { WebsiteHeader } from '@/components/website/WebsiteHeader';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';
import { Container } from '@/components/website/Container';
import { Settings, Wrench, HelpCircle, Package, Truck, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Discover our range of services including chain configuration, custom machining, technical support, and fast delivery across South Africa.',
  openGraph: {
    title: 'Services | Nusaf Dynamic Technologies',
    description:
      'Expert services for industrial components - from custom configuration to technical support.',
  },
};

const services = [
  {
    icon: Settings,
    title: 'Chain Configuration',
    description:
      'Custom chain assembly and configuration to your exact specifications. We configure conveyor chain with attachments, side plates, and specialized components.',
    features: [
      'Attachment assembly',
      'Custom pitch configurations',
      'Side plate installation',
      'Pre-tensioning',
    ],
  },
  {
    icon: Wrench,
    title: 'Custom Machining',
    description:
      'In-house machining capability for modifications and custom components. Our skilled machinists can modify standard parts to meet your specific requirements.',
    features: [
      'Keyway cutting',
      'Bore modifications',
      'Custom sprocket machining',
      'Component modifications',
    ],
  },
  {
    icon: HelpCircle,
    title: 'Technical Support',
    description:
      'Expert guidance from our experienced engineering team. We help you select the right components for your application and troubleshoot issues.',
    features: [
      'Product selection assistance',
      'Application engineering',
      'Troubleshooting support',
      'Installation guidance',
    ],
  },
  {
    icon: Package,
    title: 'Local Stockholding',
    description:
      'Extensive local stock across our Johannesburg and Cape Town warehouses ensures quick availability of standard components.',
    features: [
      'Wide product range',
      'Real-time stock visibility',
      'Emergency stock sourcing',
      'Stock reservations',
    ],
  },
  {
    icon: Truck,
    title: 'Fast Delivery',
    description:
      'Reliable delivery across South Africa. Same-day dispatch for in-stock items ordered before 2 PM. Nationwide courier network.',
    features: [
      'Same-day dispatch',
      'Nationwide delivery',
      'Order tracking',
      'Express options available',
    ],
  },
  {
    icon: FileText,
    title: 'Documentation',
    description:
      'Comprehensive technical documentation and certification. We provide datasheets, drawings, and certificates as required.',
    features: [
      'Technical datasheets',
      'CAD drawings',
      'Material certificates',
      'Test reports',
    ],
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <WebsiteHeader />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-slate-50 to-white py-12 lg:py-16">
          <Container>
            <div className="max-w-2xl">
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Our Services</h1>
              <p className="text-lg text-slate-600">
                Beyond supplying quality components, we offer a range of services to ensure you get
                exactly what you need, when you need it.
              </p>
            </div>
          </Container>
        </section>

        {/* Services Grid */}
        <section className="py-12 lg:py-16">
          <Container>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => (
                <div
                  key={service.title}
                  className="bg-white p-6 rounded-xl border border-slate-200 hover:border-primary-200 hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                    <service.icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">{service.title}</h3>
                  <p className="text-slate-600 mb-4">{service.description}</p>
                  <ul className="space-y-2">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-center text-sm text-slate-500">
                        <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24 bg-slate-900 text-white">
          <Container>
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">Need a Custom Solution?</h2>
              <p className="text-lg text-slate-300 mb-8">
                Contact our technical team to discuss your specific requirements. We&apos;re here to
                help you find the right solution.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="px-8 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-500 transition-colors"
                >
                  Contact Us
                </Link>
                <Link
                  href="/products"
                  className="px-8 py-3 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-600 transition-colors"
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
