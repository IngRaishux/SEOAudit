import { cookies, headers } from 'next/headers';
import { translations, type Language, t } from './ui';
import { LANDING_LANGUAGE_HEADER, LANGUAGE_COOKIE, resolveLanguage } from './language';

export function getServerTranslations(lang: Language = 'es') {
  return translations[lang];
}

export function serverT(lang: Language, path: string, defaultValue = '') {
  return t(lang, path, defaultValue);
}

/** Idioma de la petición actual: ruta de la landing > cookie > Accept-Language > español. */
export async function getRequestLanguage(): Promise<Language> {
  const requestHeaders = await headers();
  return resolveLanguage(
    requestHeaders.get(LANDING_LANGUAGE_HEADER),
    (await cookies()).get(LANGUAGE_COOKIE)?.value,
    requestHeaders.get('accept-language')
  );
}
