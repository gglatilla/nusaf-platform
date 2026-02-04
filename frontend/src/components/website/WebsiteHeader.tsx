import Link from 'next/link';
import { MobileMenuWrapper } from './MobileMenuWrapper';
import { GuestQuoteBasket } from './GuestQuoteBasket';

const navigation = [
  { name: 'Solutions', href: '/solutions' },
  { name: 'Services', href: '/services' },
  { name: 'About', href: '/about' },
  { name: 'Resources', href: '/resources' },
  { name: 'Contact', href: '/contact' },
];

export function WebsiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-slate-900">Nusaf</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link
              href="/browse"
              className="text-sm font-medium text-slate-700 hover:text-primary-600 transition-colors"
            >
              Products
            </Link>
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-slate-700 hover:text-primary-600 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side: Quote basket + Portal CTA */}
          <div className="flex items-center gap-4">
            <GuestQuoteBasket />

            {/* Customer Portal CTA */}
            <Link
              href="https://app.nusaf.net/login"
              className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Customer Portal
            </Link>

            {/* Mobile menu button */}
            <MobileMenuWrapper />
          </div>
        </div>
      </div>
    </header>
  );
}
