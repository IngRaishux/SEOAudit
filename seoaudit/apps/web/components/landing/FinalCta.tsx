import { CtaButtons } from './CtaButtons';
import type { SectionProps } from './types';

export function FinalCta({ texts, isAuthenticated }: SectionProps & { isAuthenticated: boolean }) {
  return (
    <section className="px-4 py-20">
      <div className="max-w-4xl mx-auto card bg-primary text-primary-content shadow-xl">
        <div className="card-body items-center text-center py-12 gap-4">
          <h2 className="text-3xl md:text-4xl font-bold">{texts.finalCta.title}</h2>
          <p className="text-lg opacity-80 mb-2">{texts.finalCta.subtitle}</p>
          <CtaButtons texts={texts.hero} isAuthenticated={isAuthenticated} onPrimary />
        </div>
      </div>
    </section>
  );
}
