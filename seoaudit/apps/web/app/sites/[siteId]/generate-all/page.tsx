'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { BackButton, Button } from '@seo-optimizer/ui';
import { useI18n, useCurrentLanguage } from '@/lib/i18n/useI18n';
import { toastError, toastSuccess } from '@/lib/toast';
import { RiDownloadLine, RiSaveLine } from '@remixicon/react';
import type { SEOSuggestion } from '@/lib/generateSEOSuggestions';
import { toDynamoSuggestion } from '@/lib/dynamoSuggestion';

type JobStatus = 'queued' | 'running' | 'completed' | 'failed';

interface JobResultItem {
  pageId: string;
  suggestionId: string;
  url: string;
  content: SEOSuggestion;
}

interface ResultRow {
  pageId: string;
  suggestionId: string;
  url: string;
  form: SEOSuggestion;
  isDirty: boolean;
}

type EditableKey = 'slug' | 'title' | 'description' | 'canonicalUrl';

// Mismo criterio que el prompt de generación: es-MX y x-default usan la canonical,
// en-US agrega el segmento /en/ justo después del dominio.
function englishUrlFromCanonical(canonical: string): string | null {
  try {
    const parsed = new URL(canonical);
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length > 0 && /^[a-z]{2}(-[a-zA-Z]{2})?$/.test(segments[0])) {
      segments.shift();
    }
    const path = ['en', ...segments].join('/');
    return `${parsed.origin}/${path}/${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

function syncAlternateLanguages(
  alternateLanguages: SEOSuggestion['alternateLanguages'],
  canonical: string
): SEOSuggestion['alternateLanguages'] {
  const englishUrl = englishUrlFromCanonical(canonical);
  return {
    M: {
      ...alternateLanguages.M,
      'es-MX': { S: canonical },
      'x-default': { S: canonical },
      ...(englishUrl ? { 'en-US': { S: englishUrl } } : {}),
    },
  };
}

function GenerateAllContent() {
  const params = useParams() as { siteId: string };
  const searchParams = useSearchParams();
  const lang = useCurrentLanguage();
  const { t } = useI18n(lang);

  const siteId = params.siteId;
  const jobId = searchParams.get('jobId');

  const [status, setStatus] = useState<JobStatus>('queued');
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!jobId || !siteId) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/sites/${siteId}/generate-all/${jobId}`);
        const data = await res.json();

        if (!res.ok) {
          setStatus('failed');
          setError(data.error || t('generateAll.error'));
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }

        setStatus(data.status);
        setTotal(data.total);

        if (data.status === 'completed') {
          const items: JobResultItem[] = data.result || [];
          setRows(
            items.map((item) => ({
              pageId: item.pageId,
              suggestionId: item.suggestionId,
              url: item.url,
              form: item.content,
              isDirty: false,
            }))
          );
          if (intervalRef.current) clearInterval(intervalRef.current);
        } else if (data.status === 'failed') {
          setError(data.error);
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch (err) {
        console.error('Error polling generation job:', err);
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [jobId, siteId, t]);

  function updateField(index: number, key: EditableKey, value: string) {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const form = { ...row.form, [key]: { S: value } };
        if (key === 'canonicalUrl') {
          form.alternateLanguages = syncAlternateLanguages(row.form.alternateLanguages, value);
        }
        return { ...row, form, isDirty: true };
      })
    );
  }

  const dirtyCount = rows.filter((row) => row.isDirty).length;

  async function handleSaveAll() {
    const dirtyRows = rows.filter((row) => row.isDirty);
    if (dirtyRows.length === 0) return;

    setIsSaving(true);

    const results = await Promise.allSettled(
      dirtyRows.map(async (row) => {
        const res = await fetch(`/api/suggestions/${row.suggestionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: row.form }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || t('generateAll.saveError'));
        }

        return { suggestionId: row.suggestionId, form: row.form };
      })
    );

    const saved = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failedCount = results.length - saved.length;

    // Solo se limpia el flag si la fila no se volvió a editar mientras se guardaba
    setRows((prev) =>
      prev.map((row) =>
        saved.some((s) => s.suggestionId === row.suggestionId && s.form === row.form)
          ? { ...row, isDirty: false }
          : row
      )
    );
    setIsSaving(false);

    if (failedCount === 0) {
      toastSuccess(t('generateAll.saveSuccess'));
    } else {
      toastError(
        t('generateAll.savePartialError')
          .replace('{{failed}}', String(failedCount))
          .replace('{{total}}', String(results.length))
      );
    }
  }

  function handleExportAll() {
    const exported = rows.map((row) => toDynamoSuggestion(row.form));

    const blob = new Blob([JSON.stringify(exported, null, 2)], {
      type: 'application/json',
    });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `seo-bulk-${siteId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(downloadUrl);
  }

  if (!jobId) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
        <div className="max-w-5xl mx-auto flex flex-col gap-4">
          <BackButton />
          <div className="alert alert-warning">
            <span>{t('generateAll.missingJob')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-5xl mx-auto p-4 lg:p-8 flex flex-col gap-6">
        <BackButton />

        <div>
          <h1 className="text-xl lg:text-2xl font-bold">
            {t('generateAll.resultsTitle')}
          </h1>
          {total > 0 && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              {rows.length} / {total}
            </p>
          )}
        </div>

        {(status === 'queued' || status === 'running') && (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <span className="loading loading-spinner loading-xl text-primary"></span>
            <p className="text-base-content/70">{t('generateAll.generating')}</p>
          </div>
        )}

        {status === 'failed' && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {status === 'completed' && (
          <>
            <div className="flex flex-col gap-4">
              {rows.map((row, index) => (
                <div
                  key={row.suggestionId}
                  className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-white dark:bg-zinc-900 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-mono text-zinc-500 break-all">
                      {row.url}
                    </p>
                    {row.isDirty && (
                      <span className="badge badge-warning badge-sm shrink-0">
                        {t('generateAll.unsaved')}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <EditableField
                      label={t('generateAll.fields.title')}
                      value={row.form.title.S}
                      onChange={(v) => updateField(index, 'title', v)}
                    />
                    <EditableField
                      label={t('generateAll.fields.slug')}
                      value={row.form.slug.S}
                      onChange={(v) => updateField(index, 'slug', v)}
                    />
                    <EditableField
                      label={t('generateAll.fields.description')}
                      value={row.form.description.S}
                      onChange={(v) => updateField(index, 'description', v)}
                      multiline
                    />
                    <EditableField
                      label={t('generateAll.fields.canonicalUrl')}
                      value={row.form.canonicalUrl.S}
                      onChange={(v) => updateField(index, 'canonicalUrl', v)}
                    />
                  </div>

                  {row.form.keywords.SS.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {row.form.keywords.SS.map((kw, i) => (
                        <span key={i} className="badge badge-ghost text-xs">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <ReadOnlyLang
                      label="en-US"
                      value={row.form.alternateLanguages.M['en-US']?.S}
                    />
                    <ReadOnlyLang
                      label="es-MX"
                      value={row.form.alternateLanguages.M['es-MX']?.S}
                    />
                    <ReadOnlyLang
                      label="x-default"
                      value={row.form.alternateLanguages.M['x-default']?.S}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                isLoading={isSaving}
                loadingText={t('common.loading')}
                icon={<RiSaveLine className="size-4" />}
                onClick={handleSaveAll}
                disabled={dirtyCount === 0 || isSaving}
              >
                {t('generateAll.saveAll')}
                {dirtyCount > 0 && ` (${dirtyCount})`}
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<RiDownloadLine className="size-4" />}
                onClick={handleExportAll}
                disabled={rows.length === 0}
              >
                {t('generateAll.exportAll')}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EditableField({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-base-content">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="textarea textarea-bordered w-full text-sm min-h-[64px]"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input input-bordered w-full text-sm"
        />
      )}
    </div>
  );
}

function ReadOnlyLang({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-semibold">{label}</span>
      <span className="break-all">{value || '—'}</span>
    </div>
  );
}

export default function GenerateAllPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-base-100 p-8 flex items-center justify-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      }
    >
      <GenerateAllContent />
    </Suspense>
  );
}
