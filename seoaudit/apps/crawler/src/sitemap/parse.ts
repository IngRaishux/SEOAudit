import { gunzipSync } from 'node:zlib';
import { XMLParser } from 'fast-xml-parser';
import type { HreflangAlternate } from '../crawler/parse';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });

export interface SitemapEntry {
  loc: string;
  /** Alternos declarados con <xhtml:link rel="alternate" hreflang>, con fuente "sitemap". */
  alternates: HreflangAlternate[];
}

interface XhtmlLink {
  rel?: string;
  hreflang?: string;
  href?: string;
}

interface SitemapUrlNode {
  loc: string;
  'xhtml:link'?: XhtmlLink | XhtmlLink[];
}

export async function parseSitemap(sitemapUrl: string): Promise<string[]> {
  return (await parseSitemapEntries(sitemapUrl)).map((entry) => entry.loc);
}

export async function parseSitemapEntries(sitemapUrl: string): Promise<SitemapEntry[]> {
  const xml = await fetchSitemapXml(sitemapUrl);
  const doc = parser.parse(xml);

  if (doc.sitemapindex) {
    const children = toArray(doc.sitemapindex.sitemap);
    const nested = await Promise.all(
      children.map((s: { loc: string }) => parseSitemapEntries(resolveLoc(s.loc, sitemapUrl)))
    );
    return nested.flat();
  }

  if (doc.urlset) {
    return toArray<SitemapUrlNode>(doc.urlset.url).map((u) => {
      const loc = resolveLoc(u.loc, sitemapUrl);
      return { loc, alternates: sitemapAlternates(u['xhtml:link'], loc) };
    });
  }

  return [];
}

function sitemapAlternates(links: XhtmlLink | XhtmlLink[] | undefined, loc: string): HreflangAlternate[] {
  const seen = new Set<string>();
  const alternates: HreflangAlternate[] = [];
  for (const link of toArray(links)) {
    if (!(link.rel ?? '').toLowerCase().split(/\s+/).includes('alternate')) continue;
    const hreflang = (link.hreflang ?? '').trim();
    const href = link.href ? resolveLoc(link.href.trim(), loc) : '';
    if (!hreflang || !href) continue;
    const key = `${hreflang.toLowerCase()} ${href}`;
    if (seen.has(key)) continue;
    seen.add(key);
    alternates.push({ hreflang, href, source: 'sitemap' });
  }
  return alternates;
}

// Some sites emit <loc> as a path relative to the sitemap's own URL instead of
// an absolute URL (against the sitemap protocol spec, but seen in the wild),
// which crashes Node's fetch() since it has no document origin to resolve against.
function resolveLoc(loc: string, base: string): string {
  try {
    return new URL(loc, base).toString();
  } catch {
    return loc;
  }
}

async function fetchSitemapXml(url: string): Promise<string> {
  const res = await fetch(url);

  if (!res.ok) throw new Error(`Failed to fetch sitemap: ${url} (${res.status})`);

  if (url.endsWith('.gz')) {
    const buf = Buffer.from(await res.arrayBuffer());
    return gunzipSync(buf).toString('utf-8');
  }
  return await res.text();
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}
