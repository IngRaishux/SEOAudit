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

export function resolveLanguage(cookieValue: string | null | undefined, acceptLanguage: string | null | undefined): Language {
  return parseLanguage(cookieValue) ?? languageFromAcceptLanguage(acceptLanguage) ?? DEFAULT_LANGUAGE;
}

export function languageCookie(lang: Language): string {
  return `${LANGUAGE_COOKIE}=${lang}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
}
