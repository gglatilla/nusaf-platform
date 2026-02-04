import Link from 'next/link';
import { Disc, Cog, Circle, Settings, RotateCcw, Minus } from 'lucide-react';

const categories = [
  {
    name: 'Levelling Feet',
    href: '/catalog?category=levelling-feet',
    icon: Disc,
  },
  {
    name: 'Conveyor Components',
    href: '/catalog?category=conveyor',
    icon: Minus,
  },
  {
    name: 'Power Transmission',
    href: '/catalog?category=power-transmission',
    icon: Cog,
  },
  {
    name: 'Gearboxes & Motors',
    href: '/catalog?category=gearboxes',
    icon: Settings,
  },
  {
    name: 'Bearings',
    href: '/catalog?category=bearings',
    icon: Circle,
  },
  {
    name: 'V-Belts',
    href: '/catalog?category=v-belts',
    icon: RotateCcw,
  },
];

export function ProductCategoriesSection() {
  return (
    <section className="py-16 lg:py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Products</h2>
          <p className="text-slate-600 max-w-xl mx-auto">
            Browse our comprehensive range of industrial components from leading European
            manufacturers.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.name}
                href={category.href}
                className="group bg-white p-6 rounded-xl border border-slate-200 text-center hover:border-primary-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-primary-50 transition-colors">
                  <Icon className="w-8 h-8 text-slate-400 group-hover:text-primary-600 transition-colors" />
                </div>
                <h3 className="text-sm font-medium text-slate-900 group-hover:text-primary-600 transition-colors">
                  {category.name}
                </h3>
              </Link>
            );
          })}
        </div>
        <div className="text-center mt-10">
          <Link
            href="/catalog"
            className="inline-flex items-center text-primary-600 font-medium hover:text-primary-700"
          >
            View all products
            <svg
              className="ml-2 w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
