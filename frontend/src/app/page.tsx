export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <span className="text-xl font-bold text-slate-900">Nusaf</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="/login" className="text-sm font-medium text-slate-600 hover:text-primary-600">
              Sign in
            </a>
            <a
              href="/register"
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-500 transition-colors duration-fast"
            >
              Get started
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center bg-slate-50 px-4 py-24 text-center">
        <h1 className="max-w-3xl text-h1 text-slate-900">
          Driving Dynamic Solutions
        </h1>
        <p className="mt-6 max-w-2xl text-body-lg text-slate-600">
          Conveyor components, power transmission, and industrial supplies.
          Quality products from trusted suppliers, configured to your specifications.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="/products"
            className="rounded-md bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-primary-500 hover:shadow-blue transition-all duration-base"
          >
            Browse Products
          </a>
          <a
            href="/contact"
            className="rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors duration-fast"
          >
            Contact Sales
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-h4 text-slate-900">Modular Chain Systems</h3>
              <p className="mt-2 text-body-sm text-slate-600">
                Configure conveyor chains to your exact specifications with our interactive builder.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-h4 text-slate-900">Power Transmission</h3>
              <p className="mt-2 text-body-sm text-slate-600">
                Premium sprockets, gears, and transmission components from European suppliers.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-h4 text-slate-900">Fast Delivery</h3>
              <p className="mt-2 text-body-sm text-slate-600">
                Stock items shipped same-day from Johannesburg and Cape Town warehouses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <span className="font-bold text-white">Nusaf Dynamic Technologies</span>
            <p className="text-sm">
              Johannesburg &bull; Cape Town &bull; Mbombela
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
