import { Container } from '../Container';

export function TrustedBySection() {
  // Placeholder logos - replace with actual client logos
  const placeholderLogos = [
    { id: 1, name: 'Client 1' },
    { id: 2, name: 'Client 2' },
    { id: 3, name: 'Client 3' },
    { id: 4, name: 'Client 4' },
    { id: 5, name: 'Client 5' },
  ];

  return (
    <section className="bg-slate-50 py-12 sm:py-16">
      <Container size="xl" className="text-center">
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-10">
          Trusted by manufacturers across South Africa
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 lg:gap-16">
          {placeholderLogos.map((logo) => (
            <div
              key={logo.id}
              className="w-28 h-14 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs font-medium grayscale hover:grayscale-0 transition-all"
              title={logo.name}
            >
              Logo
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
