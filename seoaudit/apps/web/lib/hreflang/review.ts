// Revisión de hreflang a nivel de sitio: función pura sobre las páginas guardadas.

export type HreflangSource = 'html' | 'sitemap' | 'both';

export interface HreflangAlternate {
  hreflang: string;
  href: string;
  source: HreflangSource;
}

export interface HreflangPage {
  url: string;
  alternates?: HreflangAlternate[];
}

export type HreflangIssue =
  | { type: 'invalid-code'; hreflang: string; suggestion?: string }
  | { type: 'missing-self' }
  | { type: 'missing-x-default' }
  | { type: 'conflicting-code'; hreflang: string; hrefs: string[] }
  | { type: 'missing-return'; href: string }
  /** Solo x-default apunta a esa otra página y no hay retorno: se corrige en esta página. */
  | { type: 'x-default-elsewhere'; href: string }
  /** Informativo: el alterno apunta a una URL que no se rastreó. No cuenta como problema. */
  | { type: 'unverifiable'; href: string };

export interface HreflangReview {
  issues: HreflangIssue[];
  /** Problemas reales (excluye los informativos). */
  problemCount: number;
}

const X_DEFAULT = 'x-default';
// idioma (2-3 letras), escritura opcional (4) y región opcional de 2 letras: Google no admite regiones numéricas
const HREFLANG_SHAPE = /^[a-z]{2,3}(-[a-z]{4})?(-[a-z]{2})?$/i;

let languageNames: Intl.DisplayNames | null = null;
function knownLanguage(language: string): boolean {
  languageNames ??= new Intl.DisplayNames(['en'], { type: 'language', fallback: 'none' });
  try {
    return languageNames.of(language) !== undefined;
  } catch {
    return false;
  }
}

/** Valida un código hreflang; en los alias (en-UK, iw) devuelve el código correcto como sugerencia. */
export function isValidHreflang(code: string): { valid: boolean; suggestion?: string } {
  if (code.toLowerCase() === X_DEFAULT) return { valid: true };
  if (!HREFLANG_SHAPE.test(code)) return { valid: false };

  let canonical: string;
  try {
    canonical = Intl.getCanonicalLocales(code)[0];
  } catch {
    return { valid: false };
  }
  // Si la canonicalización cambia el código, es un alias (en-UK -> en-GB, iw -> he)
  if (canonical.toLowerCase() !== code.toLowerCase()) return { valid: false, suggestion: canonical };
  if (!knownLanguage(code.split('-')[0])) return { valid: false };
  return { valid: true };
}

/** Clave de comparación: dominio en minúsculas y sin fragmento; la ruta (y su barra final) se conserva. */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    return parsed.href;
  } catch {
    return url;
  }
}

export function reviewHreflang(pages: HreflangPage[]): Map<string, HreflangReview> {
  const byUrl = new Map(pages.map((page) => [normalizeUrl(page.url), page]));
  const result = new Map<string, HreflangReview>();

  for (const page of pages) {
    const alternates = page.alternates ?? [];
    if (alternates.length === 0) continue;

    const self = normalizeUrl(page.url);
    const issues: HreflangIssue[] = [];

    for (const { hreflang } of alternates) {
      const { valid, suggestion } = isValidHreflang(hreflang);
      if (!valid) issues.push({ type: 'invalid-code', hreflang, ...(suggestion ? { suggestion } : {}) });
    }

    if (!alternates.some((a) => normalizeUrl(a.href) === self)) issues.push({ type: 'missing-self' });
    if (!alternates.some((a) => a.hreflang.toLowerCase() === X_DEFAULT)) issues.push({ type: 'missing-x-default' });

    const hrefsByCode = new Map<string, Set<string>>();
    for (const { hreflang, href } of alternates) {
      const code = hreflang.toLowerCase();
      if (!hrefsByCode.has(code)) hrefsByCode.set(code, new Set());
      hrefsByCode.get(code)!.add(normalizeUrl(href));
    }
    for (const [code, hrefs] of hrefsByCode) {
      if (hrefs.size > 1) {
        const original = alternates.find((a) => a.hreflang.toLowerCase() === code)!.hreflang;
        issues.push({ type: 'conflicting-code', hreflang: original, hrefs: [...hrefs] });
      }
    }

    const checked = new Set<string>([self]);
    for (const { href } of alternates) {
      const target = normalizeUrl(href);
      if (checked.has(target)) continue;
      checked.add(target);
      const targetPage = byUrl.get(target);
      if (!targetPage) {
        issues.push({ type: 'unverifiable', href });
        continue;
      }
      // Una página rastreada antes de capturar hreflang no se puede verificar
      if (targetPage.alternates === undefined) {
        issues.push({ type: 'unverifiable', href });
        continue;
      }
      if (!targetPage.alternates.some((a) => normalizeUrl(a.href) === self)) {
        // Si solo x-default lleva a esa página (p. ej. todas apuntan x-default a la portada),
        // lo que falla es el x-default de esta página, no la otra
        const onlyXDefault = alternates
          .filter((a) => normalizeUrl(a.href) === target)
          .every((a) => a.hreflang.toLowerCase() === X_DEFAULT);
        issues.push(onlyXDefault ? { type: 'x-default-elsewhere', href } : { type: 'missing-return', href });
      }
    }

    result.set(self, { issues, problemCount: issues.filter((i) => i.type !== 'unverifiable').length });
  }

  return result;
}
