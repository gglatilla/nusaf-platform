import { Metadata } from 'next';
import { WebsiteHeader } from '@/components/website/WebsiteHeader';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';
import { Container } from '@/components/website/Container';
import { ContactForm } from '@/components/website/ContactForm';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with Nusaf Dynamic Technologies for product enquiries, technical support, and quotes. Offices in Johannesburg, Cape Town, and Mbombela.',
  openGraph: {
    title: 'Contact Us | Nusaf Dynamic Technologies',
    description:
      'Contact our team for industrial components, technical support, and custom solutions.',
  },
};

const locations = [
  {
    name: 'Johannesburg (Head Office)',
    address: ['Unit 5, Tunney Industrial Park', '102 Harry Galaun Drive', 'Tunney, 1460'],
    phone: '+27 11 592 1962',
    email: 'sales@nusaf.co.za',
    hours: 'Mon-Fri: 7:30 AM - 4:30 PM',
    isHQ: true,
  },
  {
    name: 'Cape Town',
    address: ['Unit 12, Montague Park', 'Montague Drive', 'Montague Gardens, 7441'],
    phone: '+27 21 551 2345',
    email: 'cpt@nusaf.co.za',
    hours: 'Mon-Fri: 8:00 AM - 5:00 PM',
    isHQ: false,
  },
  {
    name: 'Mbombela',
    address: ['12 Industrial Road', 'Mbombela', '1200'],
    phone: '+27 13 752 3456',
    email: 'mbombela@nusaf.co.za',
    hours: 'Mon-Fri: 8:00 AM - 5:00 PM',
    isHQ: false,
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <WebsiteHeader />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-slate-50 to-white py-12 lg:py-16">
          <Container>
            <div className="max-w-2xl">
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Contact Us</h1>
              <p className="text-lg text-slate-600">
                Get in touch with our team for product enquiries, technical support, or general
                questions. We&apos;re here to help.
              </p>
            </div>
          </Container>
        </section>

        {/* Main Content */}
        <section className="py-12 lg:py-16">
          <Container>
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Send us a Message</h2>
                <ContactForm />
              </div>

              {/* Locations */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Our Offices</h2>
                <div className="space-y-6">
                  {locations.map((location) => (
                    <div
                      key={location.name}
                      className={`p-6 rounded-xl border ${
                        location.isHQ
                          ? 'border-primary-200 bg-primary-50'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <h3 className="font-semibold text-slate-900 mb-3">
                        {location.name}
                        {location.isHQ && (
                          <span className="ml-2 text-xs font-medium text-primary-600 bg-primary-100 px-2 py-0.5 rounded">
                            HQ
                          </span>
                        )}
                      </h3>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                          <div className="text-slate-600">
                            {location.address.map((line, i) => (
                              <span key={i}>
                                {line}
                                {i < location.address.length - 1 && <br />}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <a
                            href={`tel:${location.phone.replace(/\s/g, '')}`}
                            className="text-slate-600 hover:text-primary-600"
                          >
                            {location.phone}
                          </a>
                        </div>

                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <a
                            href={`mailto:${location.email}`}
                            className="text-slate-600 hover:text-primary-600"
                          >
                            {location.email}
                          </a>
                        </div>

                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="text-slate-600">{location.hours}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <WebsiteFooter />
    </div>
  );
}
