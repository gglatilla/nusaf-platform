import Link from 'next/link';
import { Container } from '../Container';

export function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-white to-slate-50 py-16 sm:py-20 lg:py-28">
      <Container size="xl" className="text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
          Industrial Components.
          <br />
          Local Stock. Fast Delivery.
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10">
          Premium conveyor components, power transmission, bearings, and gearboxes from
          Europe&apos;s leading manufacturers. Stocked locally in Johannesburg, Cape Town, and
          Mbombela.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/catalog"
            className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/25"
          >
            Explore Products
          </Link>
          <Link
            href="?modal=quote"
            className="inline-flex items-center justify-center px-8 py-4 border-2 border-primary-600 text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors"
          >
            Request Quote
          </Link>
        </div>
      </Container>
    </section>
  );
}
