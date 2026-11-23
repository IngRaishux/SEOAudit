import pLimit from 'p-limit';
import { discoverSitemap } from './sitemap/discover';
import { parseSitemapEntries } from './sitemap/parse';
import { mergeAlternates } from './crawler/alternates';
import { extractPageSeo } from './crawler/extract';
import { extractPageSeoRendered, launchBrowser } from './crawler/render';
import type { PageSeo } from './crawler/parse';
import { fetchLlmsTxt, type LlmsTxtCapture } from './site/llmsTxt';

export interface CrawlOptions {
  concurrency?: number;
  maxUrls?: number;
  renderJs?: boolean;
  crawl4aiUrl?: string;
  onProgress?: (processed: number, total: number) => void;
  /**
   * Momento (epoch ms) a partir del cual no se empiezan URLs nuevas: las que ya están en curso
   * terminan y el resultado sale parcial (`truncated: true`). Sirve para entrar en el límite
   * de duración de una función serverless.
   */
  deadline?: number;
}

export interface CrawlResult {
  siteUrl: string;
  sitemapUrl: string;
  /** URLs del sitemap (o el tope de maxUrls); puede ser mayor que pages.length si truncated. */
  total: number;
  pages: PageSeo[];
  llmsTxt: LlmsTxtCapture;
  /** true si se alcanzó el deadline antes de rastrear todas las URLs. */
  truncated: boolean;
}

export async function crawlSite(
  siteUrl: string,
  options: CrawlOptions = {}
): Promise<CrawlResult> {
  const { concurrency = 5, maxUrls, renderJs = false, crawl4aiUrl, onProgress, deadline } = options;

  // Se pide en paralelo al crawl; fetchLlmsTxt nunca lanza
  const llmsTxtPromise = fetchLlmsTxt(siteUrl);

  const sitemapUrl = await discoverSitemap(siteUrl);
  if (!sitemapUrl) throw new Error(`No sitemap found for ${siteUrl}`);

  let entries = await parseSitemapEntries(sitemapUrl);
  if (maxUrls) entries = entries.slice(0, maxUrls);
  const urls = entries.map((entry) => entry.loc);
  // Solo se conservan los alternos del sitemap de las URLs que se rastrean
  const sitemapAlternates = new Map(entries.map((entry) => [entry.loc, entry.alternates]));

  const total = urls.length;
  const effectiveConcurrency = renderJs ? Math.min(concurrency, 3) : concurrency;
  const limit = pLimit(effectiveConcurrency);
  let processed = 0;

  const browser = renderJs ? await launchBrowser() : null;

  try {
    const pages = await Promise.all(
      urls.map((url) =>
        limit(async () => {
          // Pasado el deadline las URLs que aún esperan turno se descartan
          if (deadline !== undefined && Date.now() >= deadline) return null;
          const result = browser
            ? await extractPageSeoRendered(browser, url)
            : await extractPageSeo(url, 10_000, crawl4aiUrl);
          processed++;
          onProgress?.(processed, total);
          return { ...result, alternates: mergeAlternates(result.alternates, sitemapAlternates.get(url) ?? []) };
        })
      )
    );

    const crawled = pages.filter((page): page is NonNullable<typeof page> => page !== null);
    return {
      siteUrl,
      sitemapUrl,
      total,
      pages: crawled,
      llmsTxt: await llmsTxtPromise,
      truncated: crawled.length < total,
    };
  } finally {
    await browser?.close();
  }
}

export type { PageSeo, LlmsTxtCapture };
export type { JsonLdBlock, PageLink, PageImage, HreflangAlternate, HreflangSource } from './crawler/parse';
