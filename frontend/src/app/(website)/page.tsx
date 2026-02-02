export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - MT-4 */}
      <section className="bg-gradient-to-b from-white to-slate-50 py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
            Industrial Components.
            <br />
            Local Stock. Fast Delivery.
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            Premium conveyor components, power transmission, bearings, and gearboxes from
            Europe&apos;s leading manufacturers. Stocked locally in Johannesburg, Cape Town, and
            Mbombela.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/products"
              className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              Explore Products
            </a>
            <button className="inline-flex items-center justify-center px-8 py-4 border-2 border-primary-600 text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors">
              Request Quote
            </button>
          </div>
        </div>
      </section>

      {/* Value Props Section - MT-5 */}
      <section className="bg-slate-50 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Local Stock',
                description: 'Warehouses in JHB, Cape Town & Mbombela',
                icon: '📦',
              },
              {
                title: 'Fast Delivery',
                description: 'Next-day delivery on stock items',
                icon: '🚚',
              },
              {
                title: 'Expert Support',
                description: 'Technical team to assist with specifications',
                icon: '👥',
              },
              {
                title: 'Quality Assured',
                description: 'European suppliers, ISO certified',
                icon: '🛡️',
              },
            ].map((prop) => (
              <div
                key={prop.title}
                className="bg-white p-6 rounded-xl border border-slate-200 text-center"
              >
                <div className="text-4xl mb-4">{prop.icon}</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{prop.title}</h3>
                <p className="text-sm text-slate-600">{prop.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Categories Section - MT-6 */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Our Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              'Levelling Feet',
              'Conveyor Components',
              'Power Transmission',
              'Gearboxes & Motors',
              'Bearings',
              'V-Belts',
            ].map((category) => (
              <a
                key={category}
                href="/products"
                className="group bg-white p-6 rounded-xl border border-slate-200 text-center hover:border-primary-500 hover:shadow-lg transition-all"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-primary-50">
                  <span className="text-2xl text-slate-400 group-hover:text-primary-600">⚙️</span>
                </div>
                <h3 className="text-sm font-medium text-slate-900">{category}</h3>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By Section - MT-7 */}
      <section className="bg-slate-50 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-8">
            Trusted by manufacturers across South Africa
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-24 h-12 bg-slate-200 rounded flex items-center justify-center text-slate-400 text-xs"
              >
                Logo {i}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner - MT-8 */}
      <section className="bg-primary-600 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to optimise your production line?
          </h2>
          <p className="text-primary-100 mb-8">
            Browse our catalog or request a custom quote for your project.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/products"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Explore Products
            </a>
            <a
              href="tel:+27000000000"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              Call +27 (0) 00 000 0000
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
