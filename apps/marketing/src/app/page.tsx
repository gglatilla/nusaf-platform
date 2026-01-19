import Link from "next/link";
import { Button } from "@nusaf/ui";

export default function HomePage() {
  const webappUrl = process.env.NEXT_PUBLIC_WEBAPP_URL || "https://app.nusaf.net";

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            NUSAF
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/about" className="text-sm hover:text-primary">
              About
            </Link>
            <Link href="/products" className="text-sm hover:text-primary">
              Products
            </Link>
            <Link href="/industries" className="text-sm hover:text-primary">
              Industries
            </Link>
            <Link href="/capabilities" className="text-sm hover:text-primary">
              Capabilities
            </Link>
            <Link href="/contact" className="text-sm hover:text-primary">
              Contact
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href={`${webappUrl}/login`}>
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/quote-request">
              <Button size="sm">Get a Quote</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Industrial Components &amp; Engineering Solutions
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Leading supplier of conveyor components, table top chain, modular
            chain, gearboxes, and precision machined parts in South Africa.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/products">
              <Button size="lg">View Products</Button>
            </Link>
            <Link href="/quote-request">
              <Button variant="outline" size="lg">
                Request Quote
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Product Categories
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/products/${category.slug}`}
                className="group"
              >
                <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary">
                    {category.name}
                  </h3>
                  <p className="text-muted-foreground">{category.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Served */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Industries We Serve
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {industries.map((industry) => (
              <div key={industry} className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <div className="w-8 h-8 bg-primary/20 rounded-full" />
                </div>
                <h3 className="font-medium">{industry}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Need a Quote?</h2>
          <p className="text-lg mb-8 opacity-90">
            Get fast, accurate quotes for conveyor components and engineering
            solutions.
          </p>
          <Link href="/quote-request">
            <Button variant="secondary" size="lg">
              Request a Quote
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold mb-4">NUSAF</h3>
              <p className="text-sm text-muted-foreground">
                Industrial components and precision engineering solutions since
                1995.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Products</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/products/conveyor-components">
                    Conveyor Components
                  </Link>
                </li>
                <li>
                  <Link href="/products/plastic-table-top-chain">
                    Table Top Chain
                  </Link>
                </li>
                <li>
                  <Link href="/products/gearboxes-motors">
                    Gearboxes &amp; Motors
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/about">About Us</Link>
                </li>
                <li>
                  <Link href="/contact">Contact</Link>
                </li>
                <li>
                  <Link href="/privacy-policy">Privacy Policy</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <address className="text-sm text-muted-foreground not-italic">
                <p>Johannesburg, South Africa</p>
                <p>info@nusaf.co.za</p>
                <p>+27 11 xxx xxxx</p>
              </address>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} NUSAF Dynamic Technologies. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const categories = [
  {
    name: "Conveyor Components",
    slug: "conveyor-components",
    description: "Complete range of conveyor system components and accessories.",
  },
  {
    name: "Table Top Chain",
    slug: "plastic-table-top-chain",
    description: "Plastic and stainless steel table top chain solutions.",
  },
  {
    name: "Modular Chain",
    slug: "modular-chain",
    description: "Modular belt and chain for various applications.",
  },
  {
    name: "Gearboxes & Motors",
    slug: "gearboxes-motors",
    description: "Industrial gearboxes, motors, and power transmission.",
  },
  {
    name: "Power Transmission",
    slug: "power-transmission",
    description: "Sprockets, bearings, and transmission components.",
  },
  {
    name: "Custom Engineering",
    slug: "nusaf-engineering",
    description: "Precision machined parts and custom solutions.",
  },
];

const industries = [
  "Food & Beverage",
  "Packaging",
  "Bottling",
  "Automotive",
  "Mining",
  "Pharmaceutical",
  "Manufacturing",
  "Agriculture",
];
