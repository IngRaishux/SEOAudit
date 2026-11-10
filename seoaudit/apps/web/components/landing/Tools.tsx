import {
  RiGoogleLine,
  RiMagicLine,
  RiPriceTag3Line,
  RiSearchLine,
  RiSparklingLine,
  RiStackLine,
  RiTeamLine,
} from '@remixicon/react';
import type { HomeTexts, SectionProps } from './types';

type ToolKey = keyof HomeTexts['tools']['items'];

const TOOL_ICONS: Record<ToolKey, typeof RiSearchLine> = {
  crawler: RiSearchLine,
  serp: RiGoogleLine,
  meta: RiPriceTag3Line,
  ai: RiMagicLine,
  bulk: RiStackLine,
  geo: RiSparklingLine,
  orgs: RiTeamLine,
};

const TOOL_ORDER: ToolKey[] = ['crawler', 'serp', 'meta', 'ai', 'bulk', 'geo', 'orgs'];

export function Tools({ texts }: SectionProps) {
  const { title, subtitle, items } = texts.tools;

  return (
    <section id="tools" className="px-4 py-20 bg-base-200 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <div data-motion="reveal" className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-base-content">{title}</h2>
          <p className="mt-3 text-lg text-base-content/70">{subtitle}</p>
        </div>

        {/* GSAP anima el envoltorio de cada tarjeta: el hover CSS del article sigue siendo suyo */}
        <div data-motion="stagger" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOOL_ORDER.map((key) => {
            const tool: { name: string; desc: string; badge?: string } = items[key];
            const Icon = TOOL_ICONS[key];
            return (
              <div key={key} className="grid">
                <article
                  className="card bg-base-100 border border-base-300 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="card-body">
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex size-12 items-center justify-center rounded-box bg-primary text-primary-content">
                        <Icon className="size-6" aria-hidden="true" />
                      </span>
                      {tool.badge && <span className="badge badge-accent">{tool.badge}</span>}
                    </div>
                    <h3 className="card-title text-base-content mt-2">{tool.name}</h3>
                    <p className="text-base-content/70">{tool.desc}</p>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
