import { RiTranslate2 } from '@remixicon/react';
import { alternateLandingLanguage, landingPath } from '@/lib/i18n/language';
import { getServerTranslations } from '@/lib/i18n/server';
import type { Language } from '@/lib/i18n/ui';

interface LanguageAlertProps {
  lang: Language;
  acceptLanguage: string | null;
}

/** Sugiere la otra versión, escrita en el idioma que prefiere el navegador. Nunca redirige. */
export function LanguageAlert({ lang, acceptLanguage }: LanguageAlertProps) {
  const alternate = alternateLandingLanguage(lang, acceptLanguage);
  if (!alternate) return null;

  const texts = getServerTranslations(alternate).home.languageAlert;

  return (
    <div className="px-4 pt-4">
      <div role="status" lang={alternate} className="alert max-w-6xl mx-auto bg-base-200 border-base-300">
        <RiTranslate2 className="size-5 text-info" aria-hidden="true" />
        <span>{texts.message}</span>
        {/* <a> nativo: el cambio de idioma necesita recargar el layout */}
        <a href={landingPath(alternate)} hrefLang={alternate} className="btn btn-sm btn-ghost">
          {texts.action}
        </a>
      </div>
    </div>
  );
}
