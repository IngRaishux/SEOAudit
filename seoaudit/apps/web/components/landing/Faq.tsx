import type { SectionProps } from './types';

// <details> pliega sin JavaScript y deja las respuestas en el HTML
export function Faq({ texts }: SectionProps) {
  const { title, items } = texts.faq;

  return (
    <section id="faq" className="px-4 py-20 bg-base-200 scroll-mt-20">
      <div className="max-w-3xl mx-auto">
        <h2 data-motion="reveal" className="text-3xl md:text-4xl font-bold text-center text-base-content mb-10">{title}</h2>
        <div data-motion="stagger" className="space-y-3">
          {items.map((item) => (
            <details key={item.q} className="collapse collapse-arrow bg-base-100 border border-base-300">
              <summary className="collapse-title text-lg font-medium text-base-content">{item.q}</summary>
              <div className="collapse-content">
                <p className="text-base-content/70">{item.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
