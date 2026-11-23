import { findEntityNode, nodesFromBlocks, type JsonLdNode } from './jsonld';
import { metaContent, type LocatedPage } from './pages';
import type { Facts, Source, Texts } from './profile';
import { familyOf } from './rules';
import { normalizeScope } from './url';

export interface PrefillTarget {
  id: string;
  type: string;
  scope: string;
}

export interface PrefillResult {
  facts: Facts;
  texts: Texts;
}

const SOCIAL_HOSTS = [
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'linkedin.com',
  'youtube.com',
  'x.com',
  'twitter.com',
  'pinterest.com',
  'tripadvisor.com',
  'tripadvisor.com.mx',
];

// Links de compartir no identifican al negocio
const SHARE_PATH = /\/(sharer|share|intent)(\.php)?\b/i;

const digits = (value: string) => value.replace(/\D/g, '');

const sourced = <T>(value: T, source: Source) => ({ value, source });

function asString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (value && typeof value === 'object' && 'url' in value) return asString((value as { url: unknown }).url);
  return undefined;
}

function asStrings(value: unknown): string[] | undefined {
  const list = (Array.isArray(value) ? value : [value]).map(asString).filter((v): v is string => !!v);
  return list.length ? list : undefined;
}

function asNumber(value: unknown): number | undefined {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

function mostFrequent(values: string[]): string | undefined {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

/** Valores que el sitio ya declara en su JSON-LD para la entidad. */
export function prefillFromJsonLd(pages: LocatedPage<unknown>[], target: PrefillTarget, defaultLanguage: string): PrefillResult {
  const facts: Facts = {};
  const texts: Texts = {};

  for (const { page, lang } of pages) {
    const node = findEntityNode(nodesFromBlocks(page.jsonLd ?? []), target);
    if (!node) continue;
    const pageLang = lang ?? defaultLanguage;
    mergeMissing(facts, factsFromNode(node));
    addText(texts, 'description', pageLang, asString(node.description));
    addText(texts, 'alternateName', pageLang, asStrings(node.alternateName));
    addText(texts, 'amenities', pageLang, amenityNames(node));
  }
  return { facts, texts };
}

function factsFromNode(node: JsonLdNode): Facts {
  const s = 'existing-jsonld' as const;
  const facts: Facts = {};
  const name = asString(node.name);
  if (name) facts.name = sourced(name, s);
  const url = asString(node.url);
  if (url) facts.url = sourced(url, s);
  const telephone = asString(node.telephone);
  if (telephone) facts.telephone = sourced(telephone, s);
  const email = asString(node.email);
  if (email) facts.email = sourced(email.replace(/^mailto:/i, ''), s);

  const address = node.address;
  if (typeof address === 'string' && address.trim()) {
    facts.address = sourced({ streetAddress: address.trim() }, s);
  } else if (address && typeof address === 'object') {
    const a = address as Record<string, unknown>;
    const value = {
      streetAddress: asString(a.streetAddress),
      addressLocality: asString(a.addressLocality),
      addressRegion: asString(a.addressRegion),
      postalCode: asString(a.postalCode),
      addressCountry: asString(a.addressCountry),
    };
    if (Object.values(value).some(Boolean)) facts.address = sourced(stripUndefined(value), s);
  }

  const geo = node.geo as Record<string, unknown> | undefined;
  const latitude = asNumber(geo?.latitude);
  const longitude = asNumber(geo?.longitude);
  if (latitude !== undefined && longitude !== undefined) facts.geo = sourced({ latitude, longitude }, s);

  const logo = asString(node.logo);
  if (logo) facts.logo = sourced(logo, s);
  const image = asStrings(node.image)?.[0];
  if (image) facts.image = sourced(image, s);
  const sameAs = asStrings(node.sameAs);
  if (sameAs) facts.sameAs = sourced(sameAs, s);
  const openingHours = asStrings(node.openingHours);
  if (openingHours) facts.openingHours = sourced(openingHours.join(', '), s);

  for (const key of ['checkinTime', 'checkoutTime', 'priceRange'] as const) {
    const v = asString(node[key]);
    if (v) facts[key] = sourced(v, s);
  }
  const rating = node.starRating as unknown;
  const starRating = asNumber(rating && typeof rating === 'object' ? (rating as Record<string, unknown>).ratingValue : rating);
  if (starRating !== undefined) facts.starRating = sourced(starRating, s);
  const rooms = asNumber(node.numberOfRooms);
  if (rooms !== undefined) facts.numberOfRooms = sourced(rooms, s);
  if (typeof node.petsAllowed === 'boolean') facts.petsAllowed = sourced(node.petsAllowed, s);
  return facts;
}

function amenityNames(node: JsonLdNode): string[] | undefined {
  const list = Array.isArray(node.amenityFeature) ? node.amenityFeature : node.amenityFeature ? [node.amenityFeature] : [];
  const names = list
    .map((a) => (typeof a === 'string' ? a : asString((a as Record<string, unknown>)?.name)))
    .filter((n): n is string => !!n);
  return names.length ? names : undefined;
}

/** Valores que se leen directo de las señales del crawl, sin IA. */
export function prefillFromSignals(
  pages: LocatedPage<unknown>[],
  target: PrefillTarget,
  defaultLanguage: string
): PrefillResult {
  const s = 'extracted' as const;
  const facts: Facts = {};
  const links = pages.flatMap(({ page }) => page.links ?? []);
  const scope = normalizeScope(target.scope);
  const rootPages = pages.filter((p) => p.path === scope);
  const root = rootPages.find((p) => p.lang === null || p.lang === defaultLanguage) ?? rootPages[0] ?? pages[0];

  const telLinks = links.filter((l) => /^tel:/i.test(l.url));
  const tel = mostFrequent(telLinks.map((l) => digits(l.url)).filter((d) => d.length >= 7));
  if (tel) {
    const shown = telLinks.find((l) => digits(l.url) === tel && l.text && digits(l.text) === tel)?.text;
    facts.telephone = sourced(shown ?? `+${tel}`, s);
  }

  const email = mostFrequent(
    links.filter((l) => /^mailto:/i.test(l.url)).map((l) => decodeURIComponent(l.url.slice(7).split('?')[0]).toLowerCase())
  );
  if (email) facts.email = sourced(email, s);

  const sameAs = [...new Set(links.filter((l) => l.isExternal).map((l) => l.url).filter(isSocialProfile))];
  if (sameAs.length) facts.sameAs = sourced(sameAs, s);

  const geo = links.map((l) => coordinatesFromMapsUrl(l.url)).find(Boolean);
  if (geo) facts.geo = sourced(geo, s);

  const image = root ? metaContent(root.page, 'og:image') : null;
  if (image) facts.image = sourced(image, s);

  if (familyOf(target.type) === 'Organization') {
    const logo = pages
      .flatMap(({ page }) => page.images ?? [])
      .find((img) => /logo/i.test(img.alt ?? '') || /logo/i.test(img.url));
    if (logo) facts.logo = sourced(logo.url, s);
  }

  const name = root?.page.title?.split(/\s[|\-–—·:]\s/)[0]?.trim();
  if (name) facts.name = sourced(name, s);
  if (root) facts.url = sourced(root.page.url, s);

  return { facts, texts: {} };
}

export function isSocialProfile(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    const matches = SOCIAL_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
    return matches && parsed.pathname.length > 1 && !SHARE_PATH.test(parsed.pathname);
  } catch {
    return false;
  }
}

export function coordinatesFromMapsUrl(url: string): { latitude: number; longitude: number } | null {
  if (!/google\.[a-z.]+\/maps|maps\.google\.|goo\.gl\/maps|maps\.app\.goo\.gl/i.test(url)) return null;
  const decoded = decodeURIComponent(url);
  const match =
    decoded.match(/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/) ??
    decoded.match(/[?&](?:q|ll|query|center)=(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/) ??
    decoded.match(/!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/);
  if (!match) return null;
  const latitude = parseFloat(match[1]);
  const longitude = parseFloat(match[2]);
  return Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? { latitude, longitude } : null;
}

/** JSON-LD existente gana sobre la extracción; la extracción solo llena huecos. */
export function prefillEntity(pages: LocatedPage<unknown>[], target: PrefillTarget, defaultLanguage: string): PrefillResult {
  const fromJsonLd = prefillFromJsonLd(pages, target, defaultLanguage);
  const fromSignals = prefillFromSignals(pages, target, defaultLanguage);
  const facts = { ...fromJsonLd.facts };
  mergeMissing(facts, fromSignals.facts);
  return { facts, texts: fromJsonLd.texts };
}

export function mergeMissing(target: Facts, extra: Facts) {
  for (const [key, value] of Object.entries(extra) as [keyof Facts, Facts[keyof Facts]][]) {
    if (value && target[key] === undefined) (target as Record<string, unknown>)[key] = value;
  }
}

function addText<K extends keyof Texts>(texts: Texts, key: K, lang: string, value: unknown) {
  if (value === undefined) return;
  const byLang = ((texts[key] as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;
  if (!byLang[lang]) byLang[lang] = { value, source: 'existing-jsonld' };
  (texts as Record<string, unknown>)[key] = byLang;
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}
