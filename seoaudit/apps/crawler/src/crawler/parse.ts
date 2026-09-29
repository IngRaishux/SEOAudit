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
  error?: string;
}

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
    wordCount: $('body').text().trim().split(/\s+/).filter(Boolean).length,
    loadTimeMs,
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
