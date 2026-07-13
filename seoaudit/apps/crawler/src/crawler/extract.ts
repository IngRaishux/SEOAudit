import { parseSeoFromHtml, emptyPageSeo, type PageSeo } from './parse';

export type { PageSeo };

export async function extractPageSeo(url: string, timeoutMs = 10_000): Promise<PageSeo> {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SEOOptimizer/1.0' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const html = await res.text();
    return parseSeoFromHtml(url, html, res.status, Date.now() - start);
  } catch (err) {
    return emptyPageSeo(url, Date.now() - start, err instanceof Error ? err.message : String(err));
  }
}
