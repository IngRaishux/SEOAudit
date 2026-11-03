import { RiSparklingLine } from '@remixicon/react';
import { SERPPreview } from '@/components/SERPPreview';
import { CtaButtons } from './CtaButtons';
import { EXAMPLE_URL, LANDING_EXAMPLES } from './examples';
import type { SectionProps } from './types';

export function Hero({ texts, lang, isAuthenticated }: SectionProps & { isAuthenticated: boolean }) {
  const example = LANDING_EXAMPLES[lang].serp;

  return (
    <section className="hero bg-gradient-to-b from-base-200 to-base-100">
      <div className="hero-content max-w-6xl w-full min-w-0 flex-col lg:flex-row gap-12 px-4 py-16 lg:py-24">
        <div className="flex-1 min-w-0 w-full text-center lg:text-left">
          <span className="badge badge-secondary gap-1 mb-4 py-3 h-auto whitespace-normal">
            <RiSparklingLine className="size-4" aria-hidden="true" />
            {texts.hero.badge}
          </span>
          {/* Único h1 de la página */}
          <h1 className="text-4xl md:text-5xl font-bold leading-tight text-base-content">{texts.hero.title}</h1>
          <p className="py-6 text-lg text-base-content/70">{texts.hero.subtitle}</p>
          <CtaButtons texts={texts.hero} isAuthenticated={isAuthenticated} />
        </div>

        <div className="flex-1 w-full min-w-0">
          <div className="mockup-browser border border-base-300 bg-base-300 shadow-xl">
            <div className="mockup-browser-toolbar">
              {/* daisyUI v4 fija la barra en 24rem: más ancha que un móvil de 360 px */}
              <div className="input truncate !w-auto max-w-sm flex-1 mx-2">{EXAMPLE_URL}</div>
            </div>
            {/* Recortado: la vista previa completa está en los ejemplos de uso */}
            <div className="relative bg-base-100 max-h-96 overflow-hidden p-4" aria-hidden="true">
              <SERPPreview title={example.title} description={example.description} url={EXAMPLE_URL} />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-base-100" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
