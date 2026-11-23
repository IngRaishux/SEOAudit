import { parseSeoFromHtml, emptyPageSeo, type PageSeo } from './parse';
import { crawlWithCrawl4AI, type Crawl4AIResult } from './crawl4ai-client';

export type { PageSeo };

export async function extractPageSeo(
  url: string,
  timeoutMs = 10_000,
  crawl4aiUrl?: string
): Promise<PageSeo> {
  const start = Date.now();
  const baseUrl = crawl4aiUrl || process.env.CRAWL4AI_URL || 'http://localhost:11235';
  const apiToken = process.env.CRAWL4AI_API_TOKEN;

  try {
    const result = await crawlWithCrawl4AI(url, baseUrl, timeoutMs, apiToken);

    // Use full HTML for canonical extraction, cleaned_html for content extraction
    const htmlForCanonical = result.html || result.cleaned_html;
    const htmlForContent = result.cleaned_html || result.html;

    return parseSeoFromHtml(url, htmlForContent, result.status_code, Date.now() - start, result.metadata, htmlForCanonical);
  } catch (err) {
    return emptyPageSeo(url, Date.now() - start, err instanceof Error ? err.message : String(err));
  }
}
