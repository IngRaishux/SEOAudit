import type { SectionProps } from './types';

export function HowItWorks({ texts }: SectionProps) {
  const { title, subtitle, steps } = texts.howItWorks;

  return (
    <section id="how-it-works" className="px-4 py-20 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <div data-motion="reveal" className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-base-content">{title}</h2>
          <p className="mt-3 text-lg text-base-content/70">{subtitle}</p>
        </div>

        <ol data-motion="stagger" className="steps steps-vertical lg:steps-horizontal w-full">
          {steps.map((step) => (
            <li key={step.title} className="step step-primary">
              <div className="text-left lg:text-center px-2 py-2 lg:py-4 max-w-xs">
                <h3 className="font-semibold text-base-content">{step.title}</h3>
                <p className="text-sm text-base-content/70 mt-1">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
