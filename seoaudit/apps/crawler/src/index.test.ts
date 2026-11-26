import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./sitemap/discover', () => ({ discoverSitemap: vi.fn(async () => 'https://ex.com/sitemap.xml') }));
vi.mock('./sitemap/parse', () => ({
  parseSitemapEntries: vi.fn(async () =>
    Array.from({ length: 6 }, (_, i) => ({ loc: `https://ex.com/p${i}`, alternates: [] }))
  ),
}));
vi.mock('./site/llmsTxt', () => ({ fetchLlmsTxt: vi.fn(async () => ({ url: 'https://ex.com/llms.txt', status: 404 })) }));
vi.mock('./crawler/render', () => ({ extractPageSeoRendered: vi.fn(), launchBrowser: vi.fn() }));
vi.mock('./crawler/extract', () => ({
  extractPageSeo: vi.fn(async (url: string) => {
    await new Promise((r) => setTimeout(r, 20));
    return { url, alternates: [] };
  }),
}));

const { crawlSite } = await import('./index');

afterEach(() => vi.useRealTimers());

describe('crawlSite deadline', () => {
  it('sin deadline rastrea todo y no está truncado', async () => {
    const result = await crawlSite('https://ex.com', { concurrency: 2 });
    expect(result.pages).toHaveLength(6);
    expect(result.total).toBe(6);
    expect(result.truncated).toBe(false);
  });

  it('con el deadline ya vencido no empieza ninguna URL', async () => {
    const result = await crawlSite('https://ex.com', { concurrency: 2, deadline: Date.now() - 1 });
    expect(result.pages).toHaveLength(0);
    expect(result.total).toBe(6);
    expect(result.truncated).toBe(true);
  });

  it('las URLs en curso terminan y las pendientes se descartan al vencer', async () => {
    // Con concurrencia 2 y 20 ms por página, a los ~30 ms solo las 2 primeras habrán empezado
    const result = await crawlSite('https://ex.com', { concurrency: 2, deadline: Date.now() + 10 });
    expect(result.pages.length).toBeGreaterThan(0);
    expect(result.pages.length).toBeLessThan(6);
    expect(result.truncated).toBe(true);
  });
});

describe('crawlSite maxUrls', () => {
  it('recorta al tope, informa el total del sitemap y no marca el resultado como truncado', async () => {
    const result = await crawlSite('https://ex.com', { concurrency: 2, maxUrls: 4 });
    expect(result.pages).toHaveLength(4);
    expect(result.total).toBe(4);
    expect(result.sitemapTotal).toBe(6);
    expect(result.truncated).toBe(false);
  });

  it('sin tope sitemapTotal coincide con total', async () => {
    const result = await crawlSite('https://ex.com', { concurrency: 2 });
    expect(result.sitemapTotal).toBe(6);
    expect(result.total).toBe(6);
  });
});

describe('crawlSite pageTimeoutMs', () => {
  it('pasa la espera por página a Crawl4AI (30 s por defecto)', async () => {
    const { extractPageSeo } = await import('./crawler/extract');
    const mock = vi.mocked(extractPageSeo);
    mock.mockClear();
    await crawlSite('https://ex.com', { concurrency: 2 });
    expect(mock.mock.calls[0][1]).toBe(30_000);
    mock.mockClear();
    await crawlSite('https://ex.com', { concurrency: 2, pageTimeoutMs: 12_000 });
    expect(mock.mock.calls[0][1]).toBe(12_000);
  });
});
