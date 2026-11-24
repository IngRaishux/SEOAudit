const SITEMAP_PATHS = ['/sitemap-0.xml', '/sitemap-index.xml','/sitemap.xml', '/en/sitemap.xml', '/es/sitemap.xml'];

export interface DiscoverOptions {
  fetchImpl?: typeof fetch;
  /** Si se indica, un sitemap declarado en robots.txt que no lo cumpla se ignora. */
  accept?: (url: string) => boolean;
}

export async function discoverSitemap(siteUrl: string, options: DiscoverOptions = {}): Promise<string | null> {
  const { fetchImpl = fetch, accept } = options;
  const base = new URL(siteUrl).origin;

  for (const path of SITEMAP_PATHS) {
    const candidate = `${base}${path}`;
    if (await urlExists(candidate, fetchImpl)) return candidate;
  }

  const fromRobots = await readRobotsSitemap(base, fetchImpl);
  if (fromRobots && (!accept || accept(fromRobots))) return fromRobots;

  return null;
}

async function urlExists(url: string, fetchImpl: typeof fetch): Promise<boolean> {
  try {
    const res = await fetchImpl(url, { method: 'HEAD', redirect: 'follow' });
    return res.ok;
  } catch {
    return false;
  }
}

async function readRobotsSitemap(base: string, fetchImpl: typeof fetch): Promise<string | null> {
  try {
    const res = await fetchImpl(`${base}/robots.txt`);
    if (!res.ok) return null;
    const text = await res.text();
    const match = text.match(/^\s*Sitemap:\s*(.+)$/im);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}
