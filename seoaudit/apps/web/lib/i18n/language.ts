import type { Language } from './ui';

// El idioma vive en una cookie para que el servidor renderice el mismo texto que el cliente
export const LANGUAGE_COOKIE = 'language';
export const LANGUAGE_EVENT = 'language-change';
export const DEFAULT_LANGUAGE: Language = 'es';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function parseLanguage(value: string | null | undefined): Language | null {
  return value === 'es' || value === 'en' ? value : null;
}

/** Primer idioma soportado del header Accept-Language (p. ej. "en-US,en;q=0.9"). */
export function languageFromAcceptLanguage(header: string | null | undefined): Language | null {
  if (!header) return null;
  const preferred = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { lang: tag.toLowerCase().split('-')[0], q: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { lang } of preferred) {
    const parsed = parseLanguage(lang);
    if (parsed) return parsed;
  }
  return null;
}

// El middleware lo pone en la petición de la landing; nunca se confía en el que envía el cliente
export const LANDING_LANGUAGE_HEADER = 'x-landing-lang';

/** Idioma que fija la URL de la landing: `/` → es, `/en` → en; cualquier otra ruta → null. */
export function landingLanguageForPath(pathname: string): Language | null {
  if (pathname === '/') return 'es';
  if (pathname === '/en' || pathname === '/en/') return 'en';
  return null;
}

export function landingPath(lang: Language): string {
  return lang === 'en' ? '/en' : '/';
}

/** En la landing la URL manda; fuera de ella, cookie > Accept-Language > español. */
export function resolveLanguage(
  routeLanguage: string | null | undefined,
  cookieValue: string | null | undefined,
  acceptLanguage: string | null | undefined
): Language {
  return (
    parseLanguage(routeLanguage) ??
    parseLanguage(cookieValue) ??
    languageFromAcceptLanguage(acceptLanguage) ??
    DEFAULT_LANGUAGE
  );
}

/**
 * Otra versión de la landing que conviene sugerir: solo cuando el navegador prefiere
 * el otro idioma soportado. Coincidente, no soportado o sin header → null.
 */
export function alternateLandingLanguage(
  pageLanguage: Language,
  acceptLanguage: string | null | undefined
): Language | null {
  const preferred = languageFromAcceptLanguage(acceptLanguage);
  return preferred && preferred !== pageLanguage ? preferred : null;
}

export function languageCookie(lang: Language): string {
  return `${LANGUAGE_COOKIE}=${lang}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
}
