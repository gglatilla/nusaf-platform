import { Package, Truck, Users, Shield } from 'lucide-react';
import { Container } from '../Container';

const valueProps = [
  {
    title: 'Local Stock',
    description: 'Warehouses in Johannesburg, Cape Town & Mbombela',
    icon: Package,
  },
  {
    title: 'Fast Delivery',
    description: 'Next-day delivery on stock items across SA',
    icon: Truck,
  },
  {
    title: 'Expert Support',
    description: 'Technical team to assist with specifications',
    icon: Users,
  },
  {
    title: 'Quality Assured',
    description: 'European suppliers, ISO certified products',
    icon: Shield,
  },
];

export function ValuePropsSection() {
  return (
    <section className="bg-slate-50 py-12 sm:py-16 lg:py-20">
      <Container size="xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {valueProps.map((prop) => {
            const Icon = prop.icon;
            return (
              <div
                key={prop.title}
                className="bg-white p-6 rounded-xl border border-slate-200 text-center hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 mx-auto mb-4 bg-primary-50 rounded-xl flex items-center justify-center">
                  <Icon className="w-7 h-7 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{prop.title}</h3>
                <p className="text-sm text-slate-600">{prop.description}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
