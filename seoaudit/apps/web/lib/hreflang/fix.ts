import { normalizeUrl, type HreflangAlternate, type HreflangIssue } from './review';

export interface FixPage {
  url: string;
  alternates?: HreflangAlternate[];
  htmlLang?: string | null;
}

export type FixKind = 'add' | 'replace' | 'keep-one';

export interface FixExample {
  kind: FixKind;
  /** URL de la página donde se aplica la corrección. */
  target: string;
  /** Líneas <link> listas para copiar. */
  snippet: string;
  /** Código de ejemplo cuando no se pudo deducir el idioma de la página. */
  usesPlaceholder: boolean;
}

const PLACEHOLDER_CODE = 'es-MX';

export const linkTag = (hreflang: string, href: string) => `<link rel="alternate" hreflang="${hreflang}" href="${href}" />`;

/**
 * Código con el que se conoce a una página: el que usa para sí misma, el que le dan las demás
 * versiones o su atributo lang. null si no se puede deducir.
 */
export function pageLanguageCode(page: FixPage, pagesByUrl: Map<string, FixPage>): string | null {
  const self = normalizeUrl(page.url);
  const own = page.alternates?.find((a) => normalizeUrl(a.href) === self && a.hreflang.toLowerCase() !== 'x-default');
  if (own) return own.hreflang;
  for (const other of pagesByUrl.values()) {
    const ref = other.alternates?.find((a) => normalizeUrl(a.href) === self && a.hreflang.toLowerCase() !== 'x-default');
    if (ref) return ref.hreflang;
  }
  return page.htmlLang || null;
}

/** Ejemplo de corrección para un problema de hreflang; null si el problema no requiere cambios. */
export function buildFixExample(issue: HreflangIssue, page: FixPage, pagesByUrl: Map<string, FixPage>): FixExample | null {
  const alternates = page.alternates ?? [];
  const pageCode = () => {
    const code = pageLanguageCode(page, pagesByUrl);
    return { code: code ?? PLACEHOLDER_CODE, usesPlaceholder: code === null };
  };

  switch (issue.type) {
    case 'missing-self': {
      const { code, usesPlaceholder } = pageCode();
      return { kind: 'add', target: page.url, snippet: linkTag(code, page.url), usesPlaceholder };
    }
    case 'missing-return': {
      // La corrección va en la otra versión: debe declarar esta página
      const { code, usesPlaceholder } = pageCode();
      return { kind: 'add', target: issue.href, snippet: linkTag(code, page.url), usesPlaceholder };
    }
    case 'x-default-elsewhere': {
      // x-default debe ser una versión de esta misma página. Se respeta el idioma por defecto que
      // eligió el sitio: el de la página a la que apuntaba (p. ej. la portada en español)
      const defaultPage = pagesByUrl.get(normalizeUrl(issue.href));
      const defaultCode = defaultPage ? pageLanguageCode(defaultPage, pagesByUrl)?.toLowerCase() : undefined;
      const main =
        alternates.find((a) => defaultCode && a.hreflang.toLowerCase() === defaultCode) ??
        alternates.find((a) => a.hreflang.toLowerCase() !== 'x-default');
      if (!main) return null;
      return { kind: 'replace', target: page.url, snippet: linkTag('x-default', main.href), usesPlaceholder: false };
    }
    case 'missing-x-default': {
      // Se propone la primera versión declarada, que suele ser el idioma principal del sitio
      const main = alternates.find((a) => a.hreflang.toLowerCase() !== 'x-default');
      if (!main) return null;
      return { kind: 'add', target: page.url, snippet: linkTag('x-default', main.href), usesPlaceholder: false };
    }
    case 'invalid-code': {
      const wrong = alternates.find((a) => a.hreflang === issue.hreflang);
      if (!wrong) return null;
      return {
        kind: 'replace',
        target: page.url,
        snippet: linkTag(issue.suggestion ?? PLACEHOLDER_CODE, wrong.href),
        usesPlaceholder: !issue.suggestion,
      };
    }
    case 'conflicting-code':
      return { kind: 'keep-one', target: page.url, snippet: linkTag(issue.hreflang, issue.hrefs[0]), usesPlaceholder: false };
    case 'unverifiable':
      return null;
  }
}
