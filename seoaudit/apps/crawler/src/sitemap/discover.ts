const SITEMAP_PATHS = ['/sitemap-0.xml', '/sitemap-index.xml'];

export async function discoverSitemap(siteUrl: string): Promise<string | null> {
  const base = new URL(siteUrl).origin;

  for (const path of SITEMAP_PATHS) {
    const candidate = `${base}${path}`;
    if (await urlExists(candidate)) return candidate;
  }

  const fromRobots = await readRobotsSitemap(base);
  if (fromRobots) return fromRobots;

  return null;
}

async function urlExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return res.ok;
  } catch {
    return false;
  }
}

async function readRobotsSitemap(base: string): Promise<string | null> {
  try {
    const res = await fetch(`${base}/robots.txt`);
    if (!res.ok) return null;
    const text = await res.text();
    const match = text.match(/^\s*Sitemap:\s*(.+)$/im);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}
