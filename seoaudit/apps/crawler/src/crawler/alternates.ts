import type { HreflangAlternate } from './parse';

/**
 * Une los alternos del HTML y del sitemap de una página. La misma pareja código+URL
 * (código sin distinguir mayúsculas) queda una sola vez con fuente "both".
 */
export function mergeAlternates(html: HreflangAlternate[], sitemap: HreflangAlternate[]): HreflangAlternate[] {
  const merged = new Map<string, HreflangAlternate>();
  const key = (a: HreflangAlternate) => `${a.hreflang.toLowerCase()} ${a.href}`;
  for (const alternate of html) merged.set(key(alternate), { ...alternate, source: 'html' });
  for (const alternate of sitemap) {
    const existing = merged.get(key(alternate));
    merged.set(key(alternate), existing ? { ...existing, source: 'both' } : { ...alternate, source: 'sitemap' });
  }
  return [...merged.values()];
}
