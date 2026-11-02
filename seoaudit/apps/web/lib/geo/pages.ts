import type { StoredJsonLdBlock } from './jsonld';
import { assignEntity, normalizePath, type ScopedEntity } from './url';

/** Lo que la capa GEO necesita de cada página persistida. */
export interface GeoPage {
  _id?: string;
  url: string;
  statusCode?: number | null;
  title?: string | null;
  description?: string | null;
  canonical?: string | null;
  links?: Array<{ url: string; text?: string; isExternal?: boolean }>;
  images?: Array<{ url: string; alt?: string }>;
  metaTags?: Array<{ name: string; content: string }>;
  jsonLd?: StoredJsonLdBlock[];
  bodyText?: string;
  footerText?: string;
}

export interface LocatedPage<E> {
  page: GeoPage;
  path: string;
  lang: string | null;
  entity: E | null;
}

export function locatePages<E extends ScopedEntity>(pages: GeoPage[], entities: E[], languages: string[]): LocatedPage<E>[] {
  return pages.map((page) => {
    const { path, lang } = normalizePath(page.url, languages);
    return { page, path, lang, entity: assignEntity(path, entities) };
  });
}

export function metaContent(page: GeoPage, name: string): string | null {
  return page.metaTags?.find((m) => m.name === name)?.content ?? null;
}

/** ¿La página tiene las señales que agrega este cambio? Los crawls anteriores no las traen. */
export function hasGeoSignals(page: GeoPage): boolean {
  return Array.isArray(page.jsonLd) && typeof page.bodyText === 'string';
}
