import { gunzipSync } from 'node:zlib';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });

export async function parseSitemap(sitemapUrl: string): Promise<string[]> {
  const xml = await fetchSitemapXml(sitemapUrl);
  const doc = parser.parse(xml);

  if (doc.sitemapindex) {
    const children = toArray(doc.sitemapindex.sitemap);
    const nested = await Promise.all(
      children.map((s: { loc: string }) => parseSitemap(s.loc))
    );
    return nested.flat();
  }

  if (doc.urlset) {
    return toArray(doc.urlset.url).map((u: { loc: string }) => u.loc);
  }

  return [];
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
