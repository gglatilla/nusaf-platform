'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { WebsiteHeader } from '@/components/website/WebsiteHeader';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';
import { Container } from '@/components/website/Container';
import { MapPin, Phone, Mail, Clock, CheckCircle, Loader2 } from 'lucide-react';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  company: z.string().optional(),
  phone: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
  website: z.string().optional(), // Honeypot
});

type ContactFormData = z.infer<typeof contactSchema>;

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/v1/public/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          company: data.company || null,
          phone: data.phone || null,
          message: data.message,
          website: data.website || '', // Honeypot
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to send message');
      }

      setIsSuccess(true);
      reset();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

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

                {isSuccess ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Message Sent!</h3>
                    <p className="text-slate-600 mb-6">
                      Thank you for contacting us. We&apos;ll get back to you within 1-2 business
                      days.
                    </p>
                    <button
                      onClick={() => setIsSuccess(false)}
                      className="text-primary-600 font-medium hover:text-primary-700"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Name */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        {...register('name')}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Your full name"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        {...register('email')}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="your.email@company.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                      )}
                    </div>

                    {/* Company & Phone row */}
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-1">
                          Company
                        </label>
                        <input
                          id="company"
                          type="text"
                          {...register('company')}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Your company"
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
                          Phone
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          {...register('phone')}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="+27 00 000 0000"
                        />
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="message"
                        {...register('message')}
                        rows={5}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                        placeholder="How can we help you?"
                      />
                      {errors.message && (
                        <p className="mt-1 text-sm text-red-500">{errors.message.message}</p>
                      )}
                    </div>

                    {/* Honeypot */}
                    <div className="absolute -left-[9999px] opacity-0 pointer-events-none" aria-hidden="true">
                      <label htmlFor="website">Website</label>
                      <input
                        id="website"
                        type="text"
                        {...register('website')}
                        tabIndex={-1}
                        autoComplete="off"
                      />
                    </div>

                    {/* Error */}
                    {submitError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{submitError}</p>
                      </div>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Message'
                      )}
                    </button>
                  </form>
                )}
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
