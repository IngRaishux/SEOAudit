import * as cheerio from 'cheerio';

export interface PageSeo {
  url: string;
  statusCode: number;
  title: string | null;
  description: string | null;
  canonical: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  robots: string | null;
  h1: string[];
  h2: string[];
  p: string[];
  wordCount: number;
  loadTimeMs: number;
  jsonLd: JsonLdBlock[];
  links: PageLink[];
  images: PageImage[];
  bodyText: string;
  footerText: string;
  textTruncated: boolean;
  error?: string;
}

export interface JsonLdBlock {
  raw: string;
  parsed: unknown | null;
  parseError: string | null;
}

export interface PageLink {
  url: string;
  text: string;
  isExternal: boolean;
}

export interface PageImage {
  url: string;
  alt: string;
}

export const BODY_TEXT_MAX_CHARS = 20_000;
export const FOOTER_TEXT_MAX_CHARS = 4_000;

export function parseSeoFromHtml(
  url: string,
  html: string,
  statusCode: number,
  loadTimeMs: number,
  metadata?: { title: string | null; description: string | null; [key: string]: string | null | undefined },
  fullHtml?: string
): PageSeo {
  const $ = cheerio.load(html);
  const $full = fullHtml ? cheerio.load(fullHtml) : null;

  // Extract canonical from full HTML if available (cleaned_html may not have it)
  let canonical: string | null = attr($('link[rel="canonical"]'), 'href');
  if (!canonical && $full) {
    canonical = attr($full('link[rel="canonical"]'), 'href');
  }

  // og:*/robots live in <head>, which cleaned_html strips out. Crawl4AI's
  // metadata dict already parses these from the raw head, so prefer it and
  // only fall back to scraping the full html's <head> ourselves.
  const ogTitle = metadata?.['og:title'] ?? (($full && attr($full('meta[property="og:title"]'), 'content')) || null);
  const ogDescription = metadata?.['og:description'] ?? (($full && attr($full('meta[property="og:description"]'), 'content')) || null);
  const ogImage = metadata?.['og:image'] ?? (($full && attr($full('meta[property="og:image"]'), 'content')) || null);
  const robots = metadata?.['robots'] ?? (($full && attr($full('meta[name="robots"]'), 'content')) || null);

  // JSON-LD, links e imágenes se leen del documento completo: cleaned_html pierde el <head>
  const $doc = $full ?? $;
  const wordCount = $('body').text().trim().split(/\s+/).filter(Boolean).length;
  const signals = extractGeoSignals($doc, url);

  return {
    url,
    statusCode,
    title: metadata?.title || text($('title').first()),
    description: metadata?.description || attr($('meta[name="description"]'), 'content'),
    canonical,
    ogTitle,
    ogDescription,
    ogImage,
    robots,
    h1: headings($, 'h1'),
    h2: headings($, 'h2'),
    p: $('p').text().trim().split(/\n+/),
    wordCount,
    loadTimeMs,
    ...signals,
  };
}

export function emptyPageSeo(url: string, loadTimeMs: number, error: string): PageSeo {
  return {
    url,
    statusCode: 0,
    title: null,
    description: null,
    canonical: null,
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    robots: null,
    h1: [],
    h2: [],
    p:[],
    wordCount: 0,
    loadTimeMs,
    jsonLd: [],
    links: [],
    images: [],
    bodyText: '',
    footerText: '',
    textTruncated: false,
    error,
  };
}

function headings($: cheerio.CheerioAPI, selector: string): string[] {
  return $(selector).map((_, el) => $(el).text().trim()).get().filter(Boolean);
}

function text($el: cheerio.Cheerio<any>): string | null {
  const t = $el.text().trim();
  return t || null;
}

function attr($el: cheerio.Cheerio<any>, name: string): string | null {
  const v = $el.attr(name);
  return v ? v.trim() : null;
}

function extractGeoSignals($: cheerio.CheerioAPI, pageUrl: string) {
  const jsonLd: JsonLdBlock[] = $('script[type="application/ld+json"]')
    .map((_, el) => parseJsonLd($(el).text()))
    .get();

  const pageHost = safeUrl(pageUrl)?.host;
  const seenLinks = new Set<string>();
  const links: PageLink[] = [];
  $('a[href]').each((_, el) => {
    const href = ($(el).attr('href') ?? '').trim();
    const resolved = resolveHref(href, pageUrl);
    if (!resolved || seenLinks.has(resolved)) return;
    seenLinks.add(resolved);
    const parsed = safeUrl(resolved);
    const isHttp = parsed?.protocol === 'http:' || parsed?.protocol === 'https:';
    links.push({
      url: resolved,
      text: collapse($(el).text()),
      isExternal: isHttp && parsed!.host !== pageHost,
    });
  });

  const seenImages = new Set<string>();
  const images: PageImage[] = [];
  $('img').each((_, el) => {
    const src = ($(el).attr('src') || $(el).attr('data-src') || '').trim();
    if (!src || src.startsWith('data:')) return;
    const resolved = safeUrl(src, pageUrl)?.href;
    if (!resolved || seenImages.has(resolved)) return;
    seenImages.add(resolved);
    images.push({ url: resolved, alt: ($(el).attr('alt') ?? '').trim() });
  });

  // Se eliminan nodos no visibles solo después de leer el JSON-LD
  $('script, style, noscript, template').remove();
  const footer = truncate(collapse($('footer, [role="contentinfo"]').text()), FOOTER_TEXT_MAX_CHARS);
  const body = truncate(collapse($('body').text()), BODY_TEXT_MAX_CHARS);

  return {
    jsonLd,
    links,
    images,
    bodyText: body.text,
    footerText: footer.text,
    textTruncated: body.truncated || footer.truncated,
  };
}

function parseJsonLd(raw: string): JsonLdBlock {
  const trimmed = raw.trim();
  try {
    return { raw: trimmed, parsed: JSON.parse(trimmed), parseError: null };
  } catch (err) {
    return { raw: trimmed, parsed: null, parseError: err instanceof Error ? err.message : String(err) };
  }
}

function resolveHref(href: string, base: string): string | null {
  if (!href || href.startsWith('#') || /^javascript:/i.test(href)) return null;
  if (/^(tel|mailto):/i.test(href)) return href;
  return safeUrl(href, base)?.href ?? null;
}

function safeUrl(value: string, base?: string): URL | null {
  try {
    return new URL(value, base);
  } catch {
    return null;
  }
}

function collapse(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function truncate(value: string, max: number): { text: string; truncated: boolean } {
  return value.length > max ? { text: value.slice(0, max), truncated: true } : { text: value, truncated: false };
}
