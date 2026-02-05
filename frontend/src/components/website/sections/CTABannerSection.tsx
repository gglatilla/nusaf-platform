import Link from 'next/link';
import { Phone } from 'lucide-react';
import { Container } from '../Container';

export function CTABannerSection() {
  return (
    <section className="bg-primary-600 py-12 sm:py-16 lg:py-20">
      <Container size="md" className="text-center">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
          Ready to optimise your production line?
        </h2>
        <p className="text-primary-100 text-lg mb-10 max-w-2xl mx-auto">
          Browse our catalog of industrial components or request a custom quote for your project.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
          >
            Explore Products
          </Link>
          <Link
            href="?modal=quote"
            className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
          >
            Request Quote
          </Link>
        </div>
        <div className="mt-10 pt-8 border-t border-primary-500">
          <p className="text-primary-200 text-sm mb-2">Or call us directly</p>
          <a
            href="tel:+27000000000"
            className="inline-flex items-center text-white text-lg font-semibold hover:text-primary-100 transition-colors"
          >
            <Phone className="w-5 h-5 mr-2" />
            +27 (0) 00 000 0000
          </a>
        </div>
      </Container>
    </section>
  );
}
