import pLimit from 'p-limit';
import { discoverSitemap } from './sitemap/discover';
import { parseSitemapEntries } from './sitemap/parse';
import { mergeAlternates } from './crawler/alternates';
import { extractPageSeo } from './crawler/extract';
import type { PageSeo } from './crawler/parse';
import { fetchLlmsTxt, type LlmsTxtCapture } from './site/llmsTxt';
import { isSameHost, sameHostFetch } from './net/sameHost';

export interface CrawlOptions {
  concurrency?: number;
  maxUrls?: number;
  renderJs?: boolean;
  crawl4aiUrl?: string;
  /** Tiempo máximo de espera por página en Crawl4AI (ms). */
  pageTimeoutMs?: number;
  onProgress?: (processed: number, total: number) => void;
  /**
   * Solo el host de la URL inicial (con o sin www) en puertos estándar: filtra las páginas del
   * sitemap antes de maxUrls y no deja que robots.txt, los sitemaps ni llms.txt salgan del host,
   * ni siquiera por redirección. Desactivado por defecto.
   */
  sameHostOnly?: boolean;
  /** fetch para las descargas directas (robots.txt, sitemaps, llms.txt); por defecto el global. */
  fetchImpl?: typeof fetch;
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

/** El sitio no tiene un sitemap localizable: no se rastrea nada. */
export class NoSitemapError extends Error {
  constructor(siteUrl: string) {
    super(`No sitemap found for ${siteUrl}`);
    this.name = 'NoSitemapError';
  }
}

export async function crawlSite(
  siteUrl: string,
  options: CrawlOptions = {}
): Promise<CrawlResult> {
  const {
    concurrency = 5,
    maxUrls,
    renderJs = false,
    crawl4aiUrl,
    pageTimeoutMs = 30_000,
    onProgress,
    deadline,
    sameHostOnly = false,
  } = options;
  const baseFetch = options.fetchImpl ?? fetch;
  const fetchImpl = sameHostOnly ? sameHostFetch(siteUrl, baseFetch) : baseFetch;
  const accept = sameHostOnly ? (url: string) => isSameHost(url, siteUrl) : undefined;

  // Se pide en paralelo al crawl; fetchLlmsTxt nunca lanza
  const llmsTxtPromise = fetchLlmsTxt(siteUrl, 10_000, fetchImpl);

  const sitemapUrl = await discoverSitemap(siteUrl, { fetchImpl, accept });
  if (!sitemapUrl) throw new NoSitemapError(siteUrl);

  let entries = await parseSitemapEntries(sitemapUrl, { fetchImpl, accept });
  if (accept) entries = entries.filter((entry) => accept(entry.loc));
  if (maxUrls) entries = entries.slice(0, maxUrls);
  const urls = entries.map((entry) => entry.loc);
  // Solo se conservan los alternos del sitemap de las URLs que se rastrean
  const sitemapAlternates = new Map(entries.map((entry) => [entry.loc, entry.alternates]));

  const total = urls.length;
  const effectiveConcurrency = renderJs ? Math.min(concurrency, 3) : concurrency;
  const limit = pLimit(effectiveConcurrency);
  let processed = 0;

  // Playwright solo se carga si se pide renderizar: importarlo al inicio rompe el despliegue en
  // Vercel (el paquete no incluye sus binarios) aunque el crawl use Crawl4AI
  const render = renderJs ? await import('./crawler/render') : null;
  const browser = render ? await render.launchBrowser() : null;

  try {
    const pages = await Promise.all(
      urls.map((url) =>
        limit(async () => {
          // Pasado el deadline las URLs que aún esperan turno se descartan
          if (deadline !== undefined && Date.now() >= deadline) return null;
          const result = render && browser
            ? await render.extractPageSeoRendered(browser, url)
            : await extractPageSeo(url, pageTimeoutMs, crawl4aiUrl);
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
