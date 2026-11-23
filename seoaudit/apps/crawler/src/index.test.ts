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
