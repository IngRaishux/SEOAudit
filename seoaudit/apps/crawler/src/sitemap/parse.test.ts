import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseSitemap, parseSitemapEntries } from './parse';

const SITEMAP = 'https://hotel.example.com/sitemap.xml';

function mockSitemaps(files: Record<string, string>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const body = files[url];
      return body === undefined
        ? new Response('not found', { status: 404 })
        : new Response(body, { status: 200 });
    })
  );
}

afterEach(() => vi.unstubAllGlobals());

const urlset = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://hotel.example.com/</loc>
    <xhtml:link rel="alternate" hreflang="es-MX" href="https://hotel.example.com/"/>
    <xhtml:link rel="alternate" hreflang="en-US" href="https://hotel.example.com/en/"/>
    <xhtml:link rel="alternate" hreflang="en-US" href="https://hotel.example.com/en/"/>
  </url>
  <url>
    <loc>https://hotel.example.com/en/</loc>
    <xhtml:link rel="alternate" hreflang="x-default" href="/"/>
  </url>
  <url>
    <loc>https://hotel.example.com/contacto/</loc>
  </url>
</urlset>`;

describe('parseSitemapEntries', () => {
  it('lee uno o varios xhtml:link por URL, sin duplicados y con URL absoluta', async () => {
    mockSitemaps({ [SITEMAP]: urlset });
    const entries = await parseSitemapEntries(SITEMAP);
    expect(entries).toEqual([
      {
        loc: 'https://hotel.example.com/',
        alternates: [
          { hreflang: 'es-MX', href: 'https://hotel.example.com/', source: 'sitemap' },
          { hreflang: 'en-US', href: 'https://hotel.example.com/en/', source: 'sitemap' },
        ],
      },
      {
        loc: 'https://hotel.example.com/en/',
        alternates: [{ hreflang: 'x-default', href: 'https://hotel.example.com/', source: 'sitemap' }],
      },
      { loc: 'https://hotel.example.com/contacto/', alternates: [] },
    ]);
  });

  it('recorre los índices de sitemaps', async () => {
    mockSitemaps({
      [SITEMAP]: `<sitemapindex><sitemap><loc>https://hotel.example.com/pages.xml</loc></sitemap></sitemapindex>`,
      'https://hotel.example.com/pages.xml': urlset,
    });
    const entries = await parseSitemapEntries(SITEMAP);
    expect(entries.map((e) => e.loc)).toHaveLength(3);
    expect(entries[0].alternates).toHaveLength(2);
  });

  it('ignora xhtml:link que no son alternate', async () => {
    mockSitemaps({
      [SITEMAP]: `<urlset><url><loc>https://hotel.example.com/</loc><xhtml:link rel="canonical" hreflang="es" href="/"/></url></urlset>`,
    });
    expect((await parseSitemapEntries(SITEMAP))[0].alternates).toEqual([]);
  });
});

describe('parseSitemap', () => {
  it('sigue devolviendo solo las URLs', async () => {
    mockSitemaps({ [SITEMAP]: urlset });
    expect(await parseSitemap(SITEMAP)).toEqual([
      'https://hotel.example.com/',
      'https://hotel.example.com/en/',
      'https://hotel.example.com/contacto/',
    ]);
  });
});
