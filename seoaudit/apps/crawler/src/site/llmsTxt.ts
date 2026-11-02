export interface LlmsTxtCapture {
  url: string;
  status: number | null;
  contentType: string | null;
  content: string | null;
  error: string | null;
  fetchedAt: string;
}

// Un llms.txt real es pequeño; el tope evita guardar páginas enteras servidas por un rewrite
export const LLMS_TXT_MAX_CHARS = 200_000;

export async function fetchLlmsTxt(
  siteUrl: string,
  timeoutMs = 10_000,
  fetchImpl: typeof fetch = fetch
): Promise<LlmsTxtCapture> {
  const url = `${new URL(siteUrl).origin}/llms.txt`;
  const fetchedAt = new Date().toISOString();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetchImpl(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'SEOOptimizer/1.0' },
    });
    const contentType = res.headers.get('content-type');
    const content = res.ok ? (await res.text()).slice(0, LLMS_TXT_MAX_CHARS) : null;
    return { url, status: res.status, contentType, content, error: null, fetchedAt };
  } catch (err) {
    return {
      url,
      status: null,
      contentType: null,
      content: null,
      error: err instanceof Error ? err.message : String(err),
      fetchedAt,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
