'use client';

import { useState } from 'react';
import { RiCheckLine, RiExternalLinkLine, RiFileCopyLine, RiErrorWarningLine, RiInformationLine } from '@remixicon/react';
import type { HreflangAlternate, HreflangIssue, HreflangReview } from '@/lib/hreflang/review';
import { buildFixExample, type FixExample, type FixPage } from '@/lib/hreflang/fix';

type Translate = (path: string) => string;

const fill = (text: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((acc, [key, value]) => acc.replaceAll(`{{${key}}}`, String(value)), text);

/** URL corta para los mensajes: la ruta si es del mismo sitio que la página, la URL completa si no. */
export function displayUrl(href: string, pageUrl: string): string {
  try {
    const target = new URL(href);
    return target.origin === new URL(pageUrl).origin ? `${target.pathname}${target.search}` : href;
  } catch {
    return href;
  }
}

export interface FormattedIssue {
  title: string;
  help: string;
}

export function formatHreflangIssue(issue: HreflangIssue, t: Translate, pageUrl: string): FormattedIssue {
  const message = (key: string, values: Record<string, string> = {}): FormattedIssue => ({
    title: fill(t(`siteDetails.hreflang.issues.${key}.title`), values),
    help: fill(t(`siteDetails.hreflang.issues.${key}.help`), values),
  });
  switch (issue.type) {
    case 'invalid-code':
      return issue.suggestion
        ? message('invalidCodeSuggestion', { code: issue.hreflang, suggestion: issue.suggestion })
        : message('invalidCode', { code: issue.hreflang });
    case 'missing-self':
      return message('missingSelf');
    case 'missing-x-default':
      return message('missingXDefault');
    case 'conflicting-code':
      return message('conflictingCode', {
        code: issue.hreflang,
        hrefs: issue.hrefs.map((h) => displayUrl(h, pageUrl)).join(', '),
      });
    case 'missing-return':
      return message('missingReturn', { href: displayUrl(issue.href, pageUrl) });
    case 'x-default-elsewhere':
      return message('xDefaultElsewhere', { href: displayUrl(issue.href, pageUrl) });
    case 'unverifiable':
      return message('unverifiable', { href: displayUrl(issue.href, pageUrl) });
  }
}

// Orden alfabético con x-default al final
function sortAlternates(alternates: HreflangAlternate[]): HreflangAlternate[] {
  return [...alternates].sort((a, b) => {
    const ax = a.hreflang.toLowerCase() === 'x-default';
    const bx = b.hreflang.toLowerCase() === 'x-default';
    if (ax !== bx) return ax ? 1 : -1;
    return a.hreflang.localeCompare(b.hreflang);
  });
}

interface HreflangCellProps {
  pageUrl: string;
  /** Todas las páginas del sitio por URL normalizada, para deducir el idioma de cada versión. */
  pagesByUrl: Map<string, FixPage>;
  alternates: HreflangAlternate[] | undefined;
  htmlLang?: string;
  review: HreflangReview | undefined;
  t: Translate;
}

/** Celda "Idiomas" de la tabla de páginas: códigos, indicador de problemas y detalle desplegable. */
export function HreflangCell({ pageUrl, pagesByUrl, alternates, htmlLang, review, t }: HreflangCellProps) {
  // Sin el campo: la página se rastreó antes de que existiera la captura de hreflang
  if (alternates === undefined) {
    return <span className="text-xs text-base-content/50">{t('siteDetails.hreflang.recrawl')}</span>;
  }
  if (alternates.length === 0) return <span className="text-base-content/50">—</span>;

  const sorted = sortAlternates(alternates);
  const problems = review?.issues.filter((i) => i.type !== 'unverifiable') ?? [];
  const notes = review?.issues.filter((i) => i.type === 'unverifiable') ?? [];

  return (
    <div className="min-w-48 max-w-sm space-y-1">
      <AlternateBadges alternates={sorted} pageUrl={pageUrl} problemCount={problems.length} t={t} />

      <details className="text-xs">
        <summary className="cursor-pointer link link-hover text-base-content/70">
          {t('siteDetails.hreflang.details')}
        </summary>
        <div className="mt-2 space-y-2 rounded-box bg-base-200 p-2">
          <p className="font-semibold">{t('siteDetails.hreflang.alternatesTitle')}</p>
          <ul className="space-y-1">
            {sorted.map((a) => (
              <li key={`${a.hreflang}-${a.href}`} className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-mono font-medium">{a.hreflang}</span>
                <a href={a.href} title={a.href} target="_blank" rel="noopener noreferrer" className="link link-hover break-all">
                  {displayUrl(a.href, pageUrl)}
                </a>
                <span className="text-base-content/60">({t(`siteDetails.hreflang.source.${a.source}`)})</span>
              </li>
            ))}
          </ul>
          {htmlLang && (
            <p className="text-base-content/60">{fill(t('siteDetails.hreflang.pageLang'), { lang: htmlLang })}</p>
          )}
          {problems.length === 0 && notes.length === 0 ? (
            <p className="text-success">{t('siteDetails.hreflang.noIssues')}</p>
          ) : (
            <ul className="space-y-2">
              {problems.map((issue, i) => (
                <IssueItem
                  key={`p-${i}`}
                  issue={formatHreflangIssue(issue, t, pageUrl)}
                  kind="problem"
                  fix={buildFixExample(issue, { url: pageUrl, alternates, htmlLang }, pagesByUrl)}
                  fromSitemap={alternates.some((a) => a.source !== 'html')}
                  pageUrl={pageUrl}
                  t={t}
                />
              ))}
              {notes.map((issue, i) => (
                <IssueItem key={`n-${i}`} issue={formatHreflangIssue(issue, t, pageUrl)} kind="note" pageUrl={pageUrl} t={t} />
              ))}
            </ul>
          )}
        </div>
      </details>
    </div>
  );
}

interface IssueItemProps {
  issue: FormattedIssue;
  kind: 'problem' | 'note';
  fix?: FixExample | null;
  fromSitemap?: boolean;
  pageUrl: string;
  t: Translate;
}

/**
 * Insignias de idioma: al pasar el cursor el navegador muestra la URL (title) y al pulsar se
 * despliega debajo la URL enlazada. Se muestra en línea y no flotante porque la tabla tiene
 * scroll horizontal y recortaría un tooltip o desplegable.
 */
function AlternateBadges({
  alternates,
  pageUrl,
  problemCount,
  t,
}: {
  alternates: HreflangAlternate[];
  pageUrl: string;
  problemCount: number;
  t: Translate;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const keyOf = (a: HreflangAlternate) => `${a.hreflang} ${a.href}`;
  const active = alternates.find((a) => keyOf(a) === selected);

  return (
    <>
      <div className="flex flex-wrap items-center gap-1">
        {alternates.map((a) => {
          const isActive = keyOf(a) === selected;
          return (
            <button
              key={keyOf(a)}
              type="button"
              title={a.href}
              aria-expanded={isActive}
              aria-label={fill(t('siteDetails.hreflang.showUrl'), { code: a.hreflang })}
              onClick={() => setSelected(isActive ? null : keyOf(a))}
              // Tamaño normal (20 px) para que sea fácil de pulsar; el hover usa el color primario
              // porque base-200 coincide con el fondo de la fila resaltada y no se notaba
              className={`badge font-mono text-xs px-2.5 cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary ${
                isActive
                  ? 'badge-neutral'
                  : 'badge-outline hover:border-primary hover:bg-primary hover:text-primary-content'
              }`}
            >
              {a.hreflang}
            </button>
          );
        })}
        {problemCount > 0 && (
          <span className="badge badge-warning badge-sm gap-1">
            <RiErrorWarningLine className="size-3" aria-hidden="true" />
            {fill(t('siteDetails.hreflang.problemsCount'), { count: problemCount })}
          </span>
        )}
      </div>
      {active && (
        <p className="flex flex-wrap items-baseline gap-x-1.5 text-xs" aria-live="polite">
          <span className="font-mono font-medium">{active.hreflang}</span>
          <span aria-hidden="true">→</span>
          <a
            href={active.href}
            target="_blank"
            rel="noopener noreferrer"
            title={active.href}
            className="link link-hover inline-flex items-center gap-0.5 [overflow-wrap:anywhere]"
          >
            {displayUrl(active.href, pageUrl)}
            <RiExternalLinkLine className="size-3 shrink-0" aria-hidden="true" />
          </a>
          <span className="text-base-content/60">({t(`siteDetails.hreflang.source.${active.source}`)})</span>
        </p>
      )}
    </>
  );
}

function IssueItem({ issue, kind, fix, fromSitemap, pageUrl, t }: IssueItemProps) {
  const Icon = kind === 'problem' ? RiErrorWarningLine : RiInformationLine;
  return (
    <li className="flex gap-1.5">
      <Icon className={`size-4 shrink-0 mt-px ${kind === 'problem' ? 'text-warning' : 'text-info'}`} aria-hidden="true" />
      <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
        <p className={kind === 'problem' ? 'font-medium text-base-content' : 'text-base-content/70'}>{issue.title}</p>
        <p className="text-base-content/60">{issue.help}</p>
        {fix && <FixSnippet fix={fix} fromSitemap={fromSitemap} pageUrl={pageUrl} t={t} />}
      </div>
    </li>
  );
}

const FIX_LABEL_KEY: Record<FixExample['kind'], string> = { add: 'add', replace: 'replace', 'keep-one': 'keepOne' };

function FixSnippet({ fix, fromSitemap, pageUrl, t }: { fix: FixExample; fromSitemap?: boolean; pageUrl: string; t: Translate }) {
  const [copied, setCopied] = useState(false);
  const code = fix.snippet.match(/hreflang="([^"]+)"/)?.[1] ?? '';

  async function copy() {
    try {
      await navigator.clipboard.writeText(fix.snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Sin permiso de portapapeles: el texto sigue seleccionable a mano
    }
  }

  return (
    <div className="mt-1.5 space-y-1">
      <p className="font-medium text-base-content/80">
        {fill(t(`siteDetails.hreflang.fix.${FIX_LABEL_KEY[fix.kind]}`), { target: displayUrl(fix.target, pageUrl), code })}:
      </p>
      <div className="flex items-start gap-1 rounded bg-base-300 p-1.5">
        <code className="min-w-0 flex-1 font-mono text-[11px] leading-snug whitespace-pre-wrap [overflow-wrap:anywhere]">
          {fix.snippet}
        </code>
        <button
          type="button"
          onClick={copy}
          className="btn btn-ghost btn-xs btn-square shrink-0"
          aria-label={t(copied ? 'siteDetails.hreflang.fix.copied' : 'siteDetails.hreflang.fix.copy')}
          title={t(copied ? 'siteDetails.hreflang.fix.copied' : 'siteDetails.hreflang.fix.copy')}
        >
          {copied ? (
            <RiCheckLine className="size-3.5 text-success" aria-hidden="true" />
          ) : (
            <RiFileCopyLine className="size-3.5" aria-hidden="true" />
          )}
        </button>
      </div>
      {fix.usesPlaceholder && <p className="text-base-content/60">{t('siteDetails.hreflang.fix.placeholderNote')}</p>}
      {fromSitemap && <p className="text-base-content/60">{t('siteDetails.hreflang.fix.sitemapNote')}</p>}
    </div>
  );
}

interface HreflangSummaryProps {
  pages: { alternates?: HreflangAlternate[] }[];
  reviews: Map<string, HreflangReview>;
  t: Translate;
}

/** Resumen encima de la tabla; no se muestra si ninguna página tiene datos de hreflang. */
export function HreflangSummary({ pages, reviews, t }: HreflangSummaryProps) {
  const captured = pages.filter((p) => p.alternates !== undefined);
  if (captured.length === 0) return null;

  const withAlternates = captured.filter((p) => (p.alternates?.length ?? 0) > 0).length;
  if (withAlternates === 0) {
    return (
      <div className="alert text-sm py-2 bg-base-200 border-base-300 mb-4">
        <RiInformationLine className="size-5 text-info" aria-hidden="true" />
        <span>{t('siteDetails.hreflang.summaryNone')}</span>
      </div>
    );
  }

  const withProblems = [...reviews.values()].filter((r) => r.problemCount > 0).length;
  return (
    <div className="alert text-sm py-2 bg-base-200 border-base-300 mb-4 flex flex-wrap gap-2">
      <RiInformationLine className="size-5 text-info" aria-hidden="true" />
      <span>{fill(t('siteDetails.hreflang.summaryWithAlternates'), { count: withAlternates, total: pages.length })}</span>
      {withProblems > 0 ? (
        <span className="badge badge-warning gap-1 h-auto min-h-5 py-0.5 whitespace-normal text-left">
          <RiErrorWarningLine className="size-4 shrink-0" aria-hidden="true" />
          {fill(t('siteDetails.hreflang.summaryProblems'), { count: withProblems })}
        </span>
      ) : (
        <span className="badge badge-success h-auto min-h-5 py-0.5 whitespace-normal text-left">
          {t('siteDetails.hreflang.summaryNoProblems')}
        </span>
      )}
    </div>
  );
}
