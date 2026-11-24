// Restringe las descargas directas del crawler (robots.txt, sitemaps, llms.txt) al host del sitio.
// Lo usa el modo gratuito: el host ya se validó como público y no se debe salir de él.

/** Host comparable: minúsculas, sin "www." ni punto final. */
export function hostKey(hostname: string): string {
  return hostname.toLowerCase().replace(/\.$/, '').replace(/^www\./, '');
}

/** true si `url` es http(s), en puerto estándar y del mismo host que `base` (con o sin www). */
export function isSameHost(url: string, base: string): boolean {
  try {
    const target = new URL(url);
    if (target.protocol !== 'http:' && target.protocol !== 'https:') return false;
    if (target.port !== '') return false;
    return hostKey(target.hostname) === hostKey(new URL(base).hostname);
  } catch {
    return false;
  }
}

/**
 * fetch que sigue las redirecciones a mano y rechaza cualquier salto fuera del host de `base`:
 * evita que un sitio público redirija las descargas hacia una dirección interna.
 */
export function sameHostFetch(base: string, fetchImpl: typeof fetch = fetch, maxRedirects = 5): typeof fetch {
  return async (input, init = {}) => {
    let url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    for (let hop = 0; hop <= maxRedirects; hop++) {
      if (!isSameHost(url, base)) throw new Error(`Blocked request outside ${new URL(base).hostname}: ${url}`);
      const res = await fetchImpl(url, { ...init, redirect: 'manual' });
      const location = res.status >= 300 && res.status < 400 ? res.headers.get('location') : null;
      if (!location) return res;
      url = new URL(location, url).href;
    }
    throw new Error(`Too many redirects: ${url}`);
  };
}
