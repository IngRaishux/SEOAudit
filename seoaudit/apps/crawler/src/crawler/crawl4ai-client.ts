export interface Crawl4AIRequest {
  urls: string[];
}

export interface Crawl4AIResult {
  url: string;
  html: string;
  cleaned_html: string;
  status_code: number;
  success: boolean;
  metadata: {
    title: string | null;
    description: string | null;
    keywords: string | null;
    author: string | null;
    [key: string]: string | null | undefined;
  };
  links: {
    internal: any[];
    external: any[];
  };
  error_message?: string;
}

export interface Crawl4AIResponse {
  success: boolean;
  results: Crawl4AIResult[];
}

export async function crawlWithCrawl4AI(
  url: string,
  baseUrl: string,
  timeoutMs: number = 20000,
  apiToken?: string
): Promise<Crawl4AIResult> {
  const payload: Crawl4AIRequest = {
    urls: [url],
  };

  const crawl4aiUrl = `${baseUrl}/crawl`;
  console.log(`[Crawl4AI] Crawling ${url} via ${crawl4aiUrl}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'SEOOptimizer/1.0',
    };

    if (apiToken) {
      headers['Authorization'] = `Bearer ${apiToken}`;
    }

    const response = await fetch(crawl4aiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = `Crawl4AI error: ${response.status} ${response.statusText}`;
      console.error(`[Crawl4AI] ${error}`);
      throw new Error(error);
    }

    const data = (await response.json()) as Crawl4AIResponse;

    if (!data.success || !data.results || data.results.length === 0) {
      throw new Error('Crawl4AI returned empty results');
    }

    const result = data.results[0];
    console.log(`[Crawl4AI] Successfully crawled ${url}`);
    return result;
  } catch (error) {
    console.error(`[Crawl4AI] Failed to crawl ${url}:`, error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
