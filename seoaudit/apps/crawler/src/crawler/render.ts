import { chromium, type Browser } from 'playwright';
import { parseSeoFromHtml, emptyPageSeo, type PageSeo } from './parse';

export async function launchBrowser(): Promise<Browser> {
  return chromium.launch({ headless: true });
}

export async function extractPageSeoRendered(
  browser: Browser,
  url: string,
  timeoutMs = 20_000
): Promise<PageSeo> {
  const start = Date.now();
  const context = await browser.newContext({ userAgent: 'SEOOptimizer/1.0' });
  const page = await context.newPage();

  try {
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: timeoutMs,
    });
    const html = await page.content();
    const status = response?.status() ?? 0;
    return parseSeoFromHtml(url, html, status, Date.now() - start);
  } catch (err) {
    return emptyPageSeo(url, Date.now() - start, err instanceof Error ? err.message : String(err));
  } finally {
    await context.close();
  }
}
