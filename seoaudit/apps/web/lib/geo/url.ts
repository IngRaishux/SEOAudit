import { familyOf } from './rules';

const LOCALE_SEGMENT = /^([a-z]{2})(-[a-z]{2})?$/i;

// Solo códigos ISO 639-1 frecuentes en sitios comerciales; evita confundir slugs como /df/ con un idioma
const KNOWN_LANGUAGES = new Set([
  'ar', 'ca', 'cs', 'da', 'de', 'el', 'en', 'es', 'eu', 'fi', 'fr', 'gl', 'he', 'hi', 'hu', 'id',
  'it', 'ja', 'ko', 'nl', 'no', 'pl', 'pt', 'ro', 'ru', 'sv', 'th', 'tr', 'uk', 'vi', 'zh',
]);

export interface NormalizedPath {
  path: string;
  lang: string | null;
}

export interface ScopedEntity {
  key: string;
  scope?: string | null;
}

function firstSegment(path: string): string | null {
  const segment = path.split('/').filter(Boolean)[0];
  return segment ?? null;
}

function pathOf(urlOrPath: string): string {
  try {
    return new URL(urlOrPath).pathname;
  } catch {
    return urlOrPath;
  }
}

/**
 * Idiomas que el sitio usa como primer segmento. Un segmento cuenta solo si es un código
 * conocido y aparece en al menos dos páginas, para no tratar como idioma el slug de un hotel.
 */
export function detectSiteLanguages(urls: string[]): string[] {
  const counts = new Map<string, number>();
  for (const url of urls) {
    const segment = firstSegment(pathOf(url));
    const match = segment?.match(LOCALE_SEGMENT);
    if (!match || !KNOWN_LANGUAGES.has(match[1].toLowerCase())) continue;
    const lang = segment!.toLowerCase();
    counts.set(lang, (counts.get(lang) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, n]) => n >= 2).map(([lang]) => lang).sort();
}

export function normalizePath(urlOrPath: string, languages: string[]): NormalizedPath {
  const path = pathOf(urlOrPath) || '/';
  const segments = path.split('/').filter(Boolean);
  const head = segments[0]?.toLowerCase();
  if (head && languages.includes(head)) {
    const rest = segments.slice(1);
    return { path: rest.length ? `/${rest.join('/')}/` : '/', lang: head };
  }
  return { path: segments.length ? `/${segments.join('/')}/` : '/', lang: null };
}

export function normalizeScope(scope: string): string {
  const segments = scope.split('/').filter(Boolean);
  return segments.length ? `/${segments.join('/')}/` : '/';
}

/** Asigna la entidad cuyo scope es el prefijo más largo de la ruta ya normalizada. */
export function assignEntity<T extends ScopedEntity>(normalizedPath: string, entities: T[]): T | null {
  let best: T | null = null;
  let bestLength = -1;
  for (const entity of entities) {
    if (entity.scope == null) continue;
    const scope = normalizeScope(entity.scope);
    if (normalizedPath.startsWith(scope) && scope.length > bestLength) {
      best = entity;
      bestLength = scope.length;
    }
  }
  return best;
}

export function entityFragment(type: string): string {
  const family = familyOf(type);
  if (family === 'Organization') return 'organization';
  if (family === 'LodgingBusiness') return 'hotel';
  return 'business';
}

/** @id estable sin idioma: origen + scope + fragmento por tipo. */
export function entityId(origin: string, scope: string, type: string): string {
  return `${new URL(origin).origin}${normalizeScope(scope)}#${entityFragment(type)}`;
}

export function originOf(url: string): string {
  return new URL(url).origin;
}
