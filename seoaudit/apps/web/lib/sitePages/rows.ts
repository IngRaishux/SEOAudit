import { sortAlternates, type HreflangAlternate, type HreflangReview } from '@/lib/hreflang/review';

type Translate = (path: string) => string;

/** Página tal como llega a la vista de páginas del sitio. */
export interface SitePageInput {
  url: string;
  title?: string;
  description?: string;
  statusCode?: number;
  headings?: string[];
  metaTags?: Array<{ name: string; content: string }>;
  /** undefined: rastreada antes de capturar hreflang */
  alternates?: HreflangAlternate[];
}

export type StatusTone = 'success' | 'error' | 'info';

/** Fila con los valores que comparten la tabla, el PDF y el XLSX. */
export interface PageRow {
  url: string;
  title: string | null;
  description: string | null;
  /** Códigos de los alternos en el orden de la tabla (x-default al final). */
  languages: string[];
  /** Idiomas como texto plano, para los archivos exportados. */
  languagesText: string;
  headingsCount: number;
  headings: string[];
  statusCode: number | null;
  statusTone: StatusTone;
}

const fill = (text: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((acc, [key, value]) => acc.replaceAll(`{{${key}}}`, String(value)), text);

const clean = (value: string | undefined | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

/** Meta description; si falta, og:description; si tampoco hay, null. */
export function pageDescription(page: Pick<SitePageInput, 'description' | 'metaTags'>): string | null {
  return (
    clean(page.description) ??
    clean(page.metaTags?.find((tag) => tag.name === 'og:description')?.content) ??
    null
  );
}

/** Mismo criterio de color que el distintivo de estado de la tabla. */
export function statusTone(statusCode: number | null | undefined): StatusTone {
  if (statusCode === 200) return 'success';
  if (statusCode && statusCode >= 400) return 'error';
  return 'info';
}

export function toPageRow(page: SitePageInput, review: HreflangReview | undefined, t: Translate): PageRow {
  const alternates = page.alternates;
  const languages = alternates ? sortAlternates(alternates).map((a) => a.hreflang) : [];
  const problems = review?.issues.filter((issue) => issue.type !== 'unverifiable').length ?? 0;

  let languagesText: string;
  if (alternates === undefined) {
    languagesText = t('siteDetails.hreflang.recrawl');
  } else if (alternates.length === 0) {
    languagesText = '—';
  } else {
    languagesText = languages.join(', ');
    if (problems > 0) {
      languagesText += ` (${fill(t('siteDetails.hreflang.problemsCount'), { count: problems })})`;
    }
  }

  const headings = page.headings ?? [];
  const statusCode = page.statusCode ?? null;
  return {
    url: page.url,
    title: clean(page.title),
    description: pageDescription(page),
    languages,
    languagesText,
    headingsCount: headings.length,
    headings,
    statusCode,
    statusTone: statusTone(statusCode),
  };
}
