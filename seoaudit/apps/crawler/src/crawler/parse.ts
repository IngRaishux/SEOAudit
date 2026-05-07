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
  wordCount: number;
  loadTimeMs: number;
  error?: string;
}

export function parseSeoFromHtml(
  url: string,
  html: string,
  statusCode: number,
  loadTimeMs: number
): PageSeo {
  const $ = cheerio.load(html);

  return {
    url,
    statusCode,
    title: text($('title').first()),
    description: attr($('meta[name="description"]'), 'content'),
    canonical: attr($('link[rel="canonical"]'), 'href'),
    ogTitle: attr($('meta[property="og:title"]'), 'content'),
    ogDescription: attr($('meta[property="og:description"]'), 'content'),
    ogImage: attr($('meta[property="og:image"]'), 'content'),
    robots: attr($('meta[name="robots"]'), 'content'),
    h1: headings($, 'h1'),
    h2: headings($, 'h2'),
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
