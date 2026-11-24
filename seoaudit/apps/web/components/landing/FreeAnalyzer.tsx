'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { RiArrowRightLine, RiCheckLine, RiFileCopyLine, RiMagicLine, RiRefreshLine } from '@remixicon/react';
import { FormField } from '@/components/auth/FormField';
import { SERPPreview } from '@/components/SERPPreview';
import { parseSiteInput } from '@/lib/free/input';
import { pageIssues } from '@/lib/free/issues';
import type { FreeErrorCode, FreeJobStatus, FreePageSummary, FreeQuota, FreeSuggestion } from '@/lib/free/types';
import type { Language } from '@/lib/i18n/ui';
import type { HomeTexts } from './types';
import { useTurnstile } from './useTurnstile';

type Texts = HomeTexts['freeTools'];
type Phase = 'idle' | 'verifying' | 'starting' | 'crawling' | 'done';
type SuggestionState = { status: 'loading' } | { status: 'done'; data: FreeSuggestion } | { status: 'error'; code: FreeErrorCode };

const POLL_MS = 1000;

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(values[key] ?? ''));

function displayPath(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.pathname + parsed.search;
  } catch {
    return url;
  }
}

async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function FreeAnalyzer({ texts, lang, siteKey }: { texts: Texts; lang: Language; siteKey: string }) {
  const [input, setInput] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<FreeErrorCode | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [quota, setQuota] = useState<FreeQuota | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState({ processed: 0, total: 0 });
  const [siteUrl, setSiteUrl] = useState('');
  const [pages, setPages] = useState<FreePageSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Record<string, SuggestionState>>({});
  const pendingUrl = useRef<string | null>(null);
  // Se asigna más abajo: Turnstile la llama cuando entrega el token de un envío pendiente
  const startRef = useRef<(url: string, token: string) => void>(() => undefined);
  const { containerRef, token, load, reset } = useTurnstile(siteKey, lang, {
    onToken: (value) => {
      const url = pendingUrl.current;
      if (!url) return;
      pendingUrl.current = null;
      startRef.current(url, value);
    },
    onError: () => {
      if (!pendingUrl.current) return;
      pendingUrl.current = null;
      setFormError('TURNSTILE_FAILED');
      setPhase('idle');
    },
  });

  const formatDate = useCallback(
    (iso: string) =>
      new Date(iso).toLocaleString(lang === 'es' ? 'es-MX' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }),
    [lang],
  );
  const errorText = (code: FreeErrorCode) => fill(texts.errors[code], { date: quota ? formatDate(quota.resetsAt) : '' });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/free/quota')
      .then((res) => readJson<{ quota?: FreeQuota; code?: FreeErrorCode }>(res))
      .then((data) => {
        if (cancelled || !data) return;
        if (data.quota) setQuota(data.quota);
        if (data.code === 'DISABLED') setFormError('DISABLED');
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const crawlLeft = quota ? quota.crawl.limit - quota.crawl.used : null;
  const suggestionsLeft = quota ? quota.suggestions.limit - quota.suggestions.used : null;

  const startCrawl = useCallback(
    async (url: string, token: string) => {
      setPhase('starting');
      reset();
      try {
        const res = await fetch('/api/free/crawl', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ url, turnstileToken: token }),
        });
        const data = await readJson<{ jobId?: string; code?: FreeErrorCode; quota?: FreeQuota }>(res);
        if (data?.quota) setQuota(data.quota);
        if (!res.ok || !data?.jobId) {
          const code = data?.code ?? 'SERVER_ERROR';
          if (code === 'INVALID_URL') setFieldError(texts.errors.INVALID_URL);
          else setFormError(code);
          setPhase('idle');
          return;
        }
        setSiteUrl(url);
        setPages([]);
        setSelected(null);
        setSuggestions({});
        setProgress({ processed: 0, total: 0 });
        setJobId(data.jobId);
        setPhase('crawling');
      } catch {
        setFormError('SERVER_ERROR');
        setPhase('idle');
      }
    },
    [texts.errors.INVALID_URL, reset],
  );

  useEffect(() => {
    startRef.current = (url, value) => void startCrawl(url, value);
  }, [startCrawl]);

  // Sondeo del rastreo
  useEffect(() => {
    if (phase !== 'crawling' || !jobId) return;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/free/crawl/${jobId}`, { cache: 'no-store' });
        const data = await readJson<FreeJobStatus & { code?: FreeErrorCode }>(res);
        if (cancelled) return;
        if (!res.ok || !data) {
          setFormError(data?.code ?? 'SERVER_ERROR');
          setPhase('idle');
          return;
        }
        setQuota(data.quota);
        setProgress({ processed: data.processed, total: data.total });
        if (data.status === 'completed') {
          setPages(data.pages ?? []);
          setSelected(data.pages?.[0]?.url ?? null);
          setPhase('done');
          return;
        }
        if (data.status === 'failed') {
          setFormError(data.error ?? 'CRAWL_FAILED');
          setPhase('idle');
          return;
        }
      } catch {
        // Un fallo puntual de red no corta el sondeo
      }
      if (!cancelled) timer = setTimeout(poll, POLL_MS);
    };
    void poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [phase, jobId]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const parsed = parseSiteInput(input);
    if (!parsed.ok) {
      setFieldError(texts.errors[parsed.error]);
      document.getElementById('free-site-url')?.focus();
      return;
    }
    setFieldError(null);
    if (crawlLeft === 0) {
      setFormError('QUOTA_EXCEEDED');
      return;
    }
    if (token) {
      void startCrawl(parsed.url, token);
    } else {
      // Sin token todavía: se envía en cuanto Turnstile lo entregue (onToken)
      pendingUrl.current = parsed.url;
      setPhase('verifying');
      load();
    }
  };

  const suggest = async (url: string) => {
    if (!jobId) return;
    setSuggestions((prev) => ({ ...prev, [url]: { status: 'loading' } }));
    try {
      const res = await fetch('/api/free/suggestions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jobId, url }),
      });
      const data = await readJson<{ suggestion?: FreeSuggestion; code?: FreeErrorCode; quota?: FreeQuota }>(res);
      if (data?.quota) setQuota(data.quota);
      setSuggestions((prev) => ({
        ...prev,
        [url]:
          res.ok && data?.suggestion
            ? { status: 'done', data: data.suggestion }
            : { status: 'error', code: data?.code ?? 'SERVER_ERROR' },
      }));
    } catch {
      setSuggestions((prev) => ({ ...prev, [url]: { status: 'error', code: 'SERVER_ERROR' } }));
    }
  };

  const busy = phase === 'verifying' || phase === 'starting' || phase === 'crawling';
  const issuesByUrl = useMemo(() => new Map(pages.map((page) => [page.url, pageIssues(page)])), [pages]);
  const pagesWithIssues = [...issuesByUrl.values()].filter((issues) => issues.length > 0).length;
  const selectedPage = pages.find((page) => page.url === selected) ?? null;

  return (
    <div className="space-y-6 min-w-0">
      <QuotaBar texts={texts} quota={quota} formatDate={formatDate} />

      <form noValidate onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3 sm:items-start">
        <div className="flex-1 min-w-0">
          <FormField
            id="free-site-url"
            type="url"
            inputMode="url"
            autoComplete="url"
            label={texts.analyzer.urlLabel}
            placeholder={texts.analyzer.urlPlaceholder}
            value={input}
            disabled={busy}
            onFocus={load}
            onChange={(event) => {
              setInput(event.target.value);
              if (fieldError) setFieldError(null);
            }}
            error={fieldError ?? undefined}
          />
        </div>
        <button type="submit" className="btn btn-primary sm:mt-9" disabled={busy || formError === 'DISABLED'}>
          {busy ? <span className="loading loading-spinner loading-sm" aria-hidden="true" /> : null}
          {phase === 'verifying' || phase === 'starting' ? texts.analyzer.submitting : texts.analyzer.submit}
        </button>
      </form>

      {/* Contenedor del reto anti-bots: solo se ve si Cloudflare pide interacción */}
      <div ref={containerRef} />

      <div aria-live="polite" className="space-y-4">
        {phase === 'verifying' && <p className="text-sm text-base-content/70">{texts.analyzer.verifying}</p>}

        {phase === 'crawling' && (
          <div className="space-y-2">
            <p className="text-sm text-base-content/70">
              {progress.total > 0 ? fill(texts.analyzer.crawling, progress) : texts.analyzer.crawlingStart}
            </p>
            <progress
              className="progress progress-primary w-full"
              value={progress.total > 0 ? progress.processed : undefined}
              max={progress.total || undefined}
            />
          </div>
        )}

        {formError && (
          <div role="alert" className={`alert ${formError === 'QUOTA_EXCEEDED' ? 'alert-warning' : 'alert-error'}`}>
            <span>{errorText(formError)}</span>
            {formError === 'QUOTA_EXCEEDED' && (
              <Link href="/register" className="btn btn-sm">
                {texts.cta.button}
              </Link>
            )}
          </div>
        )}
      </div>

      {phase === 'done' && (
        <div className="space-y-6 min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-xl font-bold text-base-content [overflow-wrap:anywhere]">
                {fill(texts.results.title, { site: new URL(siteUrl).hostname })}
              </h4>
              <p className="text-sm text-base-content/70">
                {fill(texts.results.summary, { count: pages.length, issues: pagesWithIssues })}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setPhase('idle');
                setPages([]);
                document.getElementById('free-site-url')?.focus();
              }}
            >
              <RiRefreshLine className="size-4" aria-hidden="true" />
              {texts.analyzer.newAnalysis}
            </button>
          </div>

          {pages.length === 0 ? (
            <div className="alert bg-base-200 border-base-300">{texts.results.empty}</div>
          ) : (
            <ResultsTable
              texts={texts}
              pages={pages}
              issuesByUrl={issuesByUrl}
              selected={selected}
              onSelect={setSelected}
              suggestions={suggestions}
              suggestionsLeft={suggestionsLeft}
              onSuggest={suggest}
            />
          )}

          {selectedPage && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <div className="min-w-0">
                <h5 className="font-semibold text-base-content mb-2 [overflow-wrap:anywhere]">
                  {fill(texts.results.previewFor, { page: displayPath(selectedPage.url) })}
                </h5>
                <SERPPreview
                  title={selectedPage.title ?? ''}
                  description={selectedPage.description ?? ''}
                  url={selectedPage.url}
                />
              </div>
              <SuggestionPanel
                texts={texts}
                page={selectedPage}
                state={suggestions[selectedPage.url]}
                suggestionsLeft={suggestionsLeft}
                onSuggest={() => suggest(selectedPage.url)}
                errorText={errorText}
              />
            </div>
          )}

          <p className="text-sm text-base-content/60">{texts.results.notSaved}</p>
          <div className="alert bg-primary/10 border-primary/30 grid-cols-1 sm:grid-cols-[1fr_auto] text-left">
            <div>
              <p className="font-semibold text-base-content">{texts.cta.title}</p>
              <p className="text-sm text-base-content/70">{texts.cta.desc}</p>
            </div>
            <Link href="/register" className="btn btn-primary landing-cta-primary">
              {texts.cta.button}
              <RiArrowRightLine className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function QuotaBar({ texts, quota, formatDate }: { texts: Texts; quota: FreeQuota | null; formatDate: (iso: string) => string }) {
  const items = [
    { label: texts.quota.crawl, value: quota?.crawl },
    { label: texts.quota.suggestions, value: quota?.suggestions },
  ];
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm">
      {items.map(({ label, value }) => {
        const left = value ? value.limit - value.used : null;
        return (
          <div key={label} className="flex items-center gap-2">
            <span className="font-medium text-base-content">{label}:</span>
            {value && left !== null ? (
              <span className={`badge h-auto min-h-5 py-0.5 whitespace-normal text-left ${left === 0 ? 'badge-warning' : 'badge-ghost'}`}>
                {fill(texts.quota.left, { left, limit: value.limit })}
              </span>
            ) : (
              <span className="skeleton h-5 w-32" aria-hidden="true" />
            )}
          </div>
        );
      })}
      {quota && <span className="text-base-content/60">{fill(texts.quota.resets, { date: formatDate(quota.resetsAt) })}</span>}
    </div>
  );
}

interface ResultsTableProps {
  texts: Texts;
  pages: FreePageSummary[];
  issuesByUrl: Map<string, ReturnType<typeof pageIssues>>;
  selected: string | null;
  onSelect: (url: string) => void;
  suggestions: Record<string, SuggestionState>;
  suggestionsLeft: number | null;
  onSuggest: (url: string) => void;
}

function ResultsTable({ texts, pages, issuesByUrl, selected, onSelect, suggestions, suggestionsLeft, onSuggest }: ResultsTableProps) {
  const length = (value: string | null) =>
    value?.trim() ? fill(texts.results.chars, { count: value.trim().length }) : texts.results.none;

  return (
    // El desplazamiento horizontal queda dentro de la tabla, nunca en la página
    <div className="overflow-x-auto rounded-box border border-base-300">
      <table className="table table-sm">
        <thead>
          <tr>
            <th>{texts.results.page}</th>
            <th>{texts.results.status}</th>
            <th>{texts.results.titleCol}</th>
            <th>{texts.results.descriptionCol}</th>
            <th>{texts.results.h1}</th>
            <th>{texts.results.issues}</th>
            <th>
              <span className="sr-only">{texts.results.preview}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {pages.map((page) => {
            const issues = issuesByUrl.get(page.url) ?? [];
            const state = suggestions[page.url];
            const isSelected = page.url === selected;
            return (
              <tr key={page.url} className={isSelected ? 'bg-base-200' : undefined}>
                <td className="max-w-48">
                  <a href={page.url} target="_blank" rel="noopener noreferrer" className="link link-hover font-mono text-xs [overflow-wrap:anywhere]">
                    {displayPath(page.url)}
                  </a>
                </td>
                <td>
                  <span className={`badge badge-sm ${page.statusCode === 200 ? 'badge-success' : 'badge-error'}`}>{page.statusCode}</span>
                </td>
                <td className="whitespace-nowrap">{length(page.title)}</td>
                <td className="whitespace-nowrap">{length(page.description)}</td>
                <td>{page.h1.length}</td>
                <td className="min-w-48">
                  {issues.length === 0 ? (
                    <span className="badge badge-sm badge-success badge-outline">{texts.results.noIssues}</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {issues.map((issue) => (
                        <span key={issue} className="badge badge-sm badge-warning h-auto min-h-5 py-0.5 whitespace-normal text-left">
                          {texts.issueLabels[issue]}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td>
                  <div className="flex gap-1 justify-end">
                    <button type="button" className="btn btn-ghost btn-xs" aria-pressed={isSelected} onClick={() => onSelect(page.url)}>
                      {texts.results.select}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-primary btn-xs whitespace-nowrap"
                      disabled={state?.status === 'loading' || state?.status === 'done' || suggestionsLeft === 0}
                      title={suggestionsLeft === 0 ? texts.suggestions.exhausted : undefined}
                      onClick={() => {
                        onSelect(page.url);
                        onSuggest(page.url);
                      }}
                    >
                      {state?.status === 'loading' ? (
                        <span className="loading loading-spinner loading-xs" aria-hidden="true" />
                      ) : state?.status === 'done' ? (
                        <RiCheckLine className="size-3.5" aria-hidden="true" />
                      ) : (
                        <RiMagicLine className="size-3.5" aria-hidden="true" />
                      )}
                      {state?.status === 'loading' ? texts.suggestions.generating : texts.suggestions.generate}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface SuggestionPanelProps {
  texts: Texts;
  page: FreePageSummary;
  state: SuggestionState | undefined;
  suggestionsLeft: number | null;
  onSuggest: () => void;
  errorText: (code: FreeErrorCode) => string;
}

function SuggestionPanel({ texts, page, state, suggestionsLeft, onSuggest, errorText }: SuggestionPanelProps) {
  return (
    <div className="min-w-0 rounded-box border border-base-300 p-4 space-y-4" aria-live="polite">
      <h5 className="font-semibold text-base-content flex items-center gap-2">
        <RiMagicLine className="size-5 text-primary" aria-hidden="true" />
        {texts.suggestions.title}
      </h5>

      {state?.status === 'done' ? (
        <dl className="space-y-4">
          <CompareRow label={texts.results.titleCol} texts={texts} current={page.title} suggested={state.data.title} />
          <CompareRow label={texts.results.descriptionCol} texts={texts} current={page.description} suggested={state.data.description} />
          {state.data.keywords.length > 0 && (
            <div>
              <dt className="text-sm font-medium text-base-content mb-1">{texts.suggestions.keywords}</dt>
              <dd className="flex flex-wrap gap-1">
                {state.data.keywords.map((keyword) => (
                  <span key={keyword} className="badge badge-outline h-auto min-h-5 py-0.5 whitespace-normal">
                    {keyword}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </dl>
      ) : (
        <div className="space-y-3">
          {state?.status === 'error' && (
            <div role="alert" className="alert alert-error text-sm">
              {errorText(state.code)}
            </div>
          )}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={state?.status === 'loading' || suggestionsLeft === 0}
            onClick={onSuggest}
          >
            {state?.status === 'loading' ? (
              <span className="loading loading-spinner loading-sm" aria-hidden="true" />
            ) : (
              <RiMagicLine className="size-4" aria-hidden="true" />
            )}
            {state?.status === 'loading'
              ? texts.suggestions.generating
              : suggestionsLeft === 0
                ? texts.suggestions.exhausted
                : texts.suggestions.generate}
          </button>
        </div>
      )}
    </div>
  );
}

function CompareRow({ label, texts, current, suggested }: { label: string; texts: Texts; current: string | null; suggested: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-1">
      <dt className="text-sm font-medium text-base-content">{label}</dt>
      <dd className="text-sm text-base-content/60 [overflow-wrap:anywhere]">
        <span className="font-medium">{texts.suggestions.current}:</span> {current?.trim() || texts.results.none}
      </dd>
      <dd className="flex items-start gap-2 rounded-box bg-success/10 border border-success/30 p-2">
        <span className="text-sm text-base-content flex-1 min-w-0 [overflow-wrap:anywhere]">
          <span className="font-medium">{texts.suggestions.suggested}:</span> {suggested}
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-xs"
          onClick={() => {
            void navigator.clipboard?.writeText(suggested).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            });
          }}
        >
          {copied ? <RiCheckLine className="size-3.5" aria-hidden="true" /> : <RiFileCopyLine className="size-3.5" aria-hidden="true" />}
          {copied ? texts.suggestions.copied : texts.suggestions.copy}
        </button>
      </dd>
    </div>
  );
}
