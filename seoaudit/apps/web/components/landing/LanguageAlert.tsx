import { alternateLandingLanguage, landingPath } from '@/lib/i18n/language';
import { getServerTranslations } from '@/lib/i18n/server';
import type { Language } from '@/lib/i18n/ui';
import { LanguageAlertBanner } from './LanguageAlertBanner';

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
    <LanguageAlertBanner
      lang={alternate}
      href={landingPath(alternate)}
      message={texts.message}
      action={texts.action}
      closeLabel={texts.close}
    />
  );
}
