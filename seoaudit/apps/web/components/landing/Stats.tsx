import type { SectionProps } from './types';

// Solo hechos verificables del producto: no hay métricas de uso que mostrar
export function Stats({ texts }: SectionProps) {
  const items = [texts.stats.tools, texts.stats.languages, texts.stats.steps, texts.stats.formats];

  return (
    <section className="px-4 -mt-6 relative">
      <div className="max-w-6xl mx-auto">
        <div className="stats stats-vertical md:stats-horizontal w-full bg-base-100 border border-base-300 shadow-lg">
          {items.map((item) => (
            <div key={item.title} className="stat place-items-center text-center">
              <div className="stat-value text-base-content">{item.value}</div>
              <div className="stat-title font-semibold text-base-content">{item.title}</div>
              <div className="stat-desc whitespace-normal">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
