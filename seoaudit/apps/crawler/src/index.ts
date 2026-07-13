import pLimit from 'p-limit';
import { discoverSitemap } from './sitemap/discover';
import { parseSitemap } from './sitemap/parse';
import { extractPageSeo } from './crawler/extract';
import { extractPageSeoRendered, launchBrowser } from './crawler/render';
import type { PageSeo } from './crawler/parse';

export interface CrawlOptions {
  concurrency?: number;
  maxUrls?: number;
  renderJs?: boolean;
  onProgress?: (processed: number, total: number) => void;
}

export interface CrawlResult {
  siteUrl: string;
  sitemapUrl: string;
  total: number;
  pages: PageSeo[];
}

export async function crawlSite(
  siteUrl: string,
  options: CrawlOptions = {}
): Promise<CrawlResult> {
  const { concurrency = 5, maxUrls, renderJs = false, onProgress } = options;

  const sitemapUrl = await discoverSitemap(siteUrl);
  if (!sitemapUrl) throw new Error(`No sitemap found for ${siteUrl}`);

  let urls = await parseSitemap(sitemapUrl);
  if (maxUrls) urls = urls.slice(0, maxUrls);

  const total = urls.length;
  const effectiveConcurrency = renderJs ? Math.min(concurrency, 3) : concurrency;
  const limit = pLimit(effectiveConcurrency);
  let processed = 0;

  const browser = renderJs ? await launchBrowser() : null;

  try {
    const pages = await Promise.all(
      urls.map((url) =>
        limit(async () => {
          const result = browser
            ? await extractPageSeoRendered(browser, url)
            : await extractPageSeo(url);
          processed++;
          onProgress?.(processed, total);
          return result;
        })
      )
    );

    return { siteUrl, sitemapUrl, total, pages };
  } finally {
    await browser?.close();
  }
}

export type { PageSeo };
