import { RiSearchEyeLine } from '@remixicon/react';
import { FREE_LIMITS, freeToolsEnabled, turnstileSiteKey } from '@/lib/free/config';
import { FreeAnalyzer } from './FreeAnalyzer';
import type { SectionProps } from './types';

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(values[key] ?? ''));

/**
 * Herramientas gratuitas para visitantes sin cuenta. El encabezado y la explicación del cupo se
 * renderizan en el servidor; cada herramienta es una tarjeta, para poder añadir más después.
 */
export function FreeTools({ texts, lang }: SectionProps) {
  const t = texts.freeTools;
  const siteKey = turnstileSiteKey();
  const enabled = freeToolsEnabled() && siteKey !== null;

  return (
    <section id="free-tools" className="px-4 py-20 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <div data-motion="reveal" className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-base-content">{t.title}</h2>
          <p className="mt-3 text-lg text-base-content/70">{t.subtitle}</p>
          <p className="mt-2 text-sm text-base-content/60">
            {fill(t.limitsNote, { crawl: FREE_LIMITS.crawlPages, suggestions: FREE_LIMITS.suggestions })}
          </p>
        </div>

        <article data-motion="reveal" className="card bg-base-100 border border-base-300 shadow-sm">
          <div className="card-body gap-6 p-4 sm:p-8 min-w-0">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-box bg-primary text-primary-content">
                <RiSearchEyeLine className="size-6" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="card-title text-base-content flex-wrap">
                  {t.analyzer.name}
                  <span className="badge badge-accent">{t.analyzer.badge}</span>
                </h3>
                <p className="text-base-content/70 mt-1">{t.analyzer.desc}</p>
              </div>
            </div>

            {enabled ? (
              <FreeAnalyzer texts={t} lang={lang} siteKey={siteKey} />
            ) : (
              <div role="status" className="alert bg-base-200 border-base-300">
                <span>{t.unavailable}</span>
              </div>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
