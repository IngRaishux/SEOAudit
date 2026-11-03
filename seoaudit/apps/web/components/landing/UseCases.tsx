import type { ReactNode } from 'react';
import { RiBuilding2Line, RiCheckLine } from '@remixicon/react';
import { SERPPreview } from '@/components/SERPPreview';
import { EXAMPLE_URL, LANDING_EXAMPLES, exampleJsonLd, exampleLlmsTxt } from './examples';
import type { SectionProps } from './types';

function CaseText({ title, desc, points }: { title: string; desc: string; points: readonly string[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-base-content">{title}</h3>
      <p className="text-base-content/70">{desc}</p>
      <ul className="space-y-2">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-2 text-base-content">
            <RiCheckLine className="size-5 shrink-0 text-success" aria-hidden="true" />
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="mockup-code text-xs sm:text-sm">
      <pre data-prefix="#" className="text-base-content/60">
        <code>{label}</code>
      </pre>
      {code.split('\n').map((line, index) => (
        <pre key={index} data-prefix={index + 1}>
          <code>{line}</code>
        </pre>
      ))}
    </div>
  );
}

// Pestañas con radio: funcionan sin JavaScript y todo el contenido queda en el HTML
function Tab({ label, checked, children }: { label: string; checked?: boolean; children: ReactNode }) {
  return (
    <>
      <input
        type="radio"
        name="landing-use-cases"
        role="tab"
        className="tab whitespace-nowrap"
        aria-label={label}
        defaultChecked={checked}
      />
      <div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-4 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">{children}</div>
      </div>
    </>
  );
}

export function UseCases({ texts, lang }: SectionProps) {
  const { title, subtitle, tabs, seo, geo, agencies } = texts.useCases;
  const example = LANDING_EXAMPLES[lang];

  return (
    <section id="use-cases" className="px-4 py-20 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-base-content">{title}</h2>
          <p className="mt-3 text-lg text-base-content/70">{subtitle}</p>
        </div>

        <div role="tablist" className="tabs tabs-lifted sm:tabs-lg">
          <Tab label={tabs.seo} checked>
            <div className="space-y-6">
              <CaseText title={seo.title} desc={seo.desc} points={seo.points} />
              {/* Comparación del title antes y después de aplicar la sugerencia */}
              <div className="space-y-3">
                <div className="rounded-box border border-error/40 bg-error/10 p-4">
                  <span className="badge badge-error mb-2">{seo.before}</span>
                  <p className="font-medium text-base-content line-through decoration-error/60">
                    {example.titleBefore}
                  </p>
                </div>
                <div className="rounded-box border border-success/40 bg-success/10 p-4">
                  <span className="badge badge-success mb-2">{seo.after}</span>
                  <p className="font-medium text-base-content break-words">{example.serp.title}</p>
                </div>
              </div>
            </div>
            <div className="min-w-0">
              <SERPPreview title={example.serp.title} description={example.serp.description} url={EXAMPLE_URL} />
            </div>
          </Tab>

          <Tab label={tabs.geo}>
            <CaseText title={geo.title} desc={geo.desc} points={geo.points} />
            <div className="min-w-0 space-y-4">
              <CodeBlock label={geo.jsonLdLabel} code={exampleJsonLd(lang)} />
              <CodeBlock label={geo.llmsLabel} code={exampleLlmsTxt(lang)} />
            </div>
          </Tab>

          <Tab label={tabs.agencies}>
            <CaseText title={agencies.title} desc={agencies.desc} points={agencies.points} />
            <div className="mockup-window border border-base-300 bg-base-300 min-w-0">
              <div className="bg-base-100 p-4 sm:p-6">
                <p className="font-semibold text-base-content mb-4">{agencies.windowTitle}</p>
                <ul className="space-y-3">
                  {example.organizations.map((org) => (
                    <li
                      key={org.name}
                      className="flex items-center gap-3 rounded-box border border-base-300 p-3"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-box bg-secondary text-secondary-content">
                        <RiBuilding2Line className="size-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-base-content truncate">{org.name}</p>
                        <p className="text-sm text-base-content/60">
                          {org.sites} {agencies.sitesLabel}
                        </p>
                      </div>
                      <span className="badge badge-outline shrink-0">{org.role}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Tab>
        </div>
      </div>
    </section>
  );
}
