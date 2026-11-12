import type { ReactNode } from 'react';
import { RiCheckLine, RiMagicLine, RiSearchLine, RiSparklingLine } from '@remixicon/react';
import { getServerTranslations } from '@/lib/i18n/server';
import type { Language } from '@/lib/i18n/ui';

interface AuthLayoutProps {
  lang: Language;
  title: string;
  subtitle: string;
  children: ReactNode;
}

/** Pantalla dividida de inicio de sesión y registro: panel de marca desde lg y tarjeta con el formulario. */
export function AuthLayout({ lang, title, subtitle, children }: AuthLayoutProps) {
  const { hero, tools } = getServerTranslations(lang).home;
  const highlights = [
    { icon: RiSearchLine, ...tools.items.crawler },
    { icon: RiMagicLine, ...tools.items.ai },
    { icon: RiSparklingLine, ...tools.items.geo },
  ];

  return (
    // La cabecera global mide 4rem
    <main className="grid min-h-[calc(100vh-4rem)] bg-base-100 lg:grid-cols-2">
      <aside className="hidden lg:flex flex-col justify-center gap-10 bg-gradient-to-br from-base-200 to-base-100 px-12 xl:px-20 py-16 border-r border-base-300">
        <div>
          <span className="badge badge-secondary gap-1 py-3 mb-4">
            <RiSparklingLine className="size-4" aria-hidden="true" />
            {hero.badge}
          </span>
          <p className="text-4xl font-bold leading-tight text-base-content">{hero.title}</p>
          <p className="mt-4 text-lg text-base-content/70">{hero.subtitle}</p>
        </div>

        <ul className="space-y-5">
          {highlights.map(({ icon: Icon, name, desc }) => (
            <li key={name} className="flex gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-box bg-primary text-primary-content">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-base-content flex items-center gap-1">
                  {name}
                  <RiCheckLine className="size-4 text-success" aria-hidden="true" />
                </p>
                <p className="text-sm text-base-content/70">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="card w-full max-w-md bg-base-100 border border-base-300 shadow-xl">
          <div className="card-body gap-6 p-6 sm:p-8">
            <header>
              <h1 className="text-2xl font-bold text-base-content">{title}</h1>
              <p className="mt-1 text-base-content/70">{subtitle}</p>
            </header>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
