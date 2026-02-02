import Link from 'next/link';

const footerNavigation = {
  products: [
    { name: 'Conveyor Components', href: '/products' },
    { name: 'Power Transmission', href: '/products' },
    { name: 'Bearings', href: '/products' },
    { name: 'Gearboxes & Motors', href: '/products' },
    { name: 'Levelling Feet', href: '/products' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'Customer Portal', href: 'https://app.nusaf.net/login' },
  ],
  locations: [
    { name: 'Johannesburg (HQ)', detail: 'Main warehouse & manufacturing' },
    { name: 'Cape Town', detail: 'Sales office & finished goods' },
    { name: 'Mbombela', detail: 'Sales office' },
  ],
};

export function WebsiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-block">
              <span className="text-2xl font-bold text-white">Nusaf</span>
            </Link>
            <p className="mt-4 text-slate-400 text-sm leading-relaxed">
              Driving Dynamic Solutions. Premium industrial components from Europe&apos;s leading
              manufacturers, stocked locally in South Africa.
            </p>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">
              Products
            </h3>
            <ul className="space-y-3">
              {footerNavigation.products.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {footerNavigation.company.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">
              Locations
            </h3>
            <ul className="space-y-4">
              {footerNavigation.locations.map((location) => (
                <li key={location.name}>
                  <p className="text-sm text-white font-medium">{location.name}</p>
                  <p className="text-xs text-slate-500">{location.detail}</p>
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-4 border-t border-slate-800">
              <p className="text-sm text-slate-400">info@nusaf.net</p>
              <p className="text-sm text-slate-400">+27 (0) 00 000 0000</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">
              © {currentYear} Nusaf Dynamic Technologies. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/privacy"
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                Terms & Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
