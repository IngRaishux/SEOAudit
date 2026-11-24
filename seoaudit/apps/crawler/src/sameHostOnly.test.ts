import { describe, expect, it, vi } from 'vitest';

// Las páginas las descarga Crawl4AI: se simula para comprobar qué URLs se piden
vi.mock('./crawler/extract', () => ({
  extractPageSeo: vi.fn(async (url: string) => ({ url, alternates: [] })),
}));

import { crawlSite, NoSitemapError } from './index';
import { extractPageSeo } from './crawler/extract';

const SITE = 'https://hotel.example.com';
const urlset = (locs: string[]) =>
  `<urlset>${locs.map((loc) => `<url><loc>${loc}</loc></url>`).join('')}</urlset>`;

function fakeFetch(files: Record<string, string | { redirect: string }>) {
  return vi.fn(async (url: string) => {
    const file = files[url];
    if (file === undefined) return new Response('not found', { status: 404 });
    if (typeof file === 'object') return new Response(null, { status: 302, headers: { location: file.redirect } });
    return new Response(file, { status: 200 });
  }) as unknown as typeof fetch;
}

const sitemap = urlset([`${SITE}/`, 'https://otro.com/x', `https://www.hotel.example.com/b`, `${SITE}/c`, `${SITE}/d`]);

describe('crawlSite con sameHostOnly', () => {
  it('filtra las páginas de otros hosts antes de aplicar maxUrls', async () => {
    vi.mocked(extractPageSeo).mockClear();
    const fetchImpl = fakeFetch({ [`${SITE}/sitemap.xml`]: sitemap });
    const result = await crawlSite(SITE, { sameHostOnly: true, maxUrls: 3, fetchImpl });
    expect(result.pages.map((p) => p.url)).toEqual([`${SITE}/`, 'https://www.hotel.example.com/b', `${SITE}/c`]);
  });

  it('sin la opción el comportamiento no cambia', async () => {
    vi.mocked(extractPageSeo).mockClear();
    const fetchImpl = fakeFetch({ [`${SITE}/sitemap.xml`]: sitemap });
    const result = await crawlSite(SITE, { maxUrls: 3, fetchImpl });
    expect(result.pages.map((p) => p.url)).toEqual([`${SITE}/`, 'https://otro.com/x', 'https://www.hotel.example.com/b']);
  });

  it('ignora un sitemap de robots.txt en otro host y lanza NoSitemapError', async () => {
    const fetchImpl = fakeFetch({
      [`${SITE}/robots.txt`]: 'Sitemap: http://169.254.169.254/sitemap.xml',
      'http://169.254.169.254/sitemap.xml': sitemap,
    });
    await expect(crawlSite(SITE, { sameHostOnly: true, fetchImpl })).rejects.toBeInstanceOf(NoSitemapError);
    expect(fetchImpl).not.toHaveBeenCalledWith('http://169.254.169.254/sitemap.xml', expect.anything());
  });

  it('omite los sitemaps hijos de otro host y no sigue redirecciones fuera', async () => {
    vi.mocked(extractPageSeo).mockClear();
    const fetchImpl = fakeFetch({
      [`${SITE}/sitemap.xml`]: `<sitemapindex><sitemap><loc>${SITE}/a.xml</loc></sitemap><sitemap><loc>http://10.0.0.5/b.xml</loc></sitemap></sitemapindex>`,
      [`${SITE}/a.xml`]: urlset([`${SITE}/uno`]),
      [`${SITE}/llms.txt`]: { redirect: 'http://127.0.0.1/llms.txt' },
    });
    const result = await crawlSite(SITE, { sameHostOnly: true, fetchImpl });
    expect(result.pages.map((p) => p.url)).toEqual([`${SITE}/uno`]);
    expect(result.llmsTxt.content).toBeNull();
    const requested = vi.mocked(fetchImpl).mock.calls.map(([url]) => String(url));
    expect(requested.some((url) => url.includes('10.0.0.5') || url.includes('127.0.0.1'))).toBe(false);
  });
});
