'use client';

import { useEffect, useState } from 'react';
import type { AuditStatus, PageAudit } from '@/lib/geo/audit';
import type { BlockItem, ResolutionsByItem } from '@/lib/geo/blocks';
import type { Resolution } from '@/lib/geo/merge';
import { toastError, toastSuccess } from '@/lib/toast';
import { Alert, CodeBlock, requestJson, type Translate } from './shared';

interface Report {
  hasProfile: boolean;
  needsRecrawl: boolean;
  summary: Record<AuditStatus, number>;
  pages: Array<Omit<PageAudit, 'node'>>;
  languageIdFindings: Array<{ name: string; ids: string[]; recommendedId: string }>;
  plan: { items: BlockItem[] } | null;
}

const STATUS_BADGE: Record<AuditStatus, string> = {
  missing: 'badge-error',
  invalid: 'badge-error',
  'wrong-type': 'badge-warning',
  incomplete: 'badge-warning',
  inconsistent: 'badge-warning',
  ok: 'badge-success',
};

const STATUS_ORDER: AuditStatus[] = ['missing', 'invalid', 'wrong-type', 'incomplete', 'inconsistent', 'ok'];

const DIFF_BADGE = { added: 'badge-success', kept: 'badge-ghost', conflict: 'badge-warning', preserved: 'badge-info' } as const;

const preview = (value: unknown) => {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.length > 120 ? `${text.slice(0, 120)}…` : text;
};

export function StructuredDataSection({ siteId, t, reloadKey }: { siteId: string; t: Translate; reloadKey: number }) {
  const [report, setReport] = useState<Report | null>(null);
  const [loadedKey, setLoadedKey] = useState<number | null>(null);
  const [applying, setApplying] = useState(false);
  const [filter, setFilter] = useState<AuditStatus | 'all'>('all');
  const [resolutions, setResolutions] = useState<ResolutionsByItem>({});

  useEffect(() => {
    requestJson<Report>(`/api/sites/${siteId}/structured-data`)
      .then(setReport)
      .catch((error) => toastError(error.message, t('geo.loadError')))
      .finally(() => setLoadedKey(reloadKey));
  }, [siteId, t, reloadKey]);

  const setResolution = (itemKey: string, path: string, resolution: Resolution) =>
    setResolutions((r) => ({ ...r, [itemKey]: { ...r[itemKey], [path]: resolution } }));

  const apply = async () => {
    setApplying(true);
    try {
      const data = await requestJson<Report>(`/api/sites/${siteId}/structured-data/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolutions }),
      });
      setReport(data);
      toastSuccess(t('geo.structuredData.applied'));
    } catch (error) {
      toastError(error instanceof Error ? error.message : String(error));
    } finally {
      setApplying(false);
    }
  };

  if (loadedKey !== reloadKey) return <span className="loading loading-spinner loading-lg text-primary" />;
  if (!report) return null;

  const pages = filter === 'all' ? report.pages : report.pages.filter((p) => p.status === filter);
  const items = report.plan?.items ?? [];
  const hasConflicts = items.some((i) => i.conflicts.length > 0);

  return (
    <div className="space-y-6">
      {report.needsRecrawl && <Alert kind="warning">{t('geo.recrawl')}</Alert>}
      {!report.hasProfile && <Alert kind="info">{t('geo.structuredData.noProfile')}</Alert>}

      <div className="stats stats-vertical md:stats-horizontal shadow w-full">
        {STATUS_ORDER.map((status) => (
          <button
            key={status}
            type="button"
            className={`stat text-left ${filter === status ? 'bg-base-200' : ''}`}
            onClick={() => setFilter(filter === status ? 'all' : status)}
          >
            <div className="stat-title text-xs">{t(`geo.structuredData.statuses.${status}`)}</div>
            <div className="stat-value text-2xl">{report.summary[status]}</div>
          </button>
        ))}
      </div>

      {report.languageIdFindings.length > 0 && (
        <Alert kind="warning">
          <p className="font-semibold">{t('geo.structuredData.languageIds')}</p>
          <ul className="list-disc ml-4">
            {report.languageIdFindings.map((f) => (
              <li key={f.recommendedId}>
                {f.name}: <code className="text-xs">{f.ids.join(', ')}</code> → {t('geo.structuredData.recommended')}{' '}
                <code className="text-xs">{f.recommendedId}</code>
              </li>
            ))}
          </ul>
        </Alert>
      )}

      <div className="overflow-x-auto max-h-96">
        <table className="table table-pin-rows w-full text-xs lg:text-sm">
          <thead className="bg-base-200">
            <tr>
              <th>URL</th>
              <th>{t('common.status')}</th>
              <th>{t('geo.structuredData.missing')}</th>
              <th>{t('geo.structuredData.suggestions')}</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.url}>
                <td className="break-all max-w-xs">
                  <a className="link link-hover" href={page.url} target="_blank" rel="noreferrer">
                    {new URL(page.url).pathname}
                  </a>
                  {page.notes.map((note) => (
                    <div key={note} className="text-base-content/60">
                      {note}
                    </div>
                  ))}
                </td>
                <td>
                  <span className={`badge badge-sm ${STATUS_BADGE[page.status]}`}>{t(`geo.structuredData.statuses.${page.status}`)}</span>
                </td>
                <td>
                  {[...page.missingRequired.map((p) => `${p}*`), ...page.missingRecommended].join(', ')}
                  {page.inconsistencies.map((i) => (
                    <div key={i.field} className="text-warning">
                      {i.field}: {preview(i.page)} ≠ {preview(i.profile)}
                    </div>
                  ))}
                </td>
                <td className="text-base-content/60">{page.suggestions.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">{t('geo.structuredData.blocks')}</h3>
            {hasConflicts && (
              <button type="button" className="btn btn-primary btn-sm" onClick={apply} disabled={applying}>
                {applying && <span className="loading loading-spinner loading-sm" />}
                {t('geo.structuredData.apply')}
              </button>
            )}
          </div>
          {items.map((item) => (
            <div key={item.key} className="collapse collapse-arrow bg-base-100 border border-base-300">
              <input type="checkbox" />
              <div className="collapse-title text-sm font-medium flex flex-wrap items-center gap-2">
                <span className="badge badge-outline badge-sm">{item.lang}</span>
                <span>{item.entityKey}</span>
                <span className="text-base-content/60 font-normal">{t(`geo.structuredData.destinations.${item.destination}`)}</span>
                {item.conflicts.length > 0 && (
                  <span className="badge badge-warning badge-sm">
                    {item.conflicts.length} {t('geo.structuredData.conflict')}
                  </span>
                )}
              </div>
              <div className="collapse-content space-y-3 text-sm">
                <p className="text-base-content/70">
                  {item.basePageUrl ? `${t('geo.structuredData.completed')} ${item.basePageUrl}` : t('geo.structuredData.newBlock')}
                  {item.pageUrl && ` · ${item.pageUrl}`}
                </p>
                <div className="flex flex-wrap gap-1">
                  {item.diff.map((d) => (
                    <span key={d.path} className={`badge badge-sm ${DIFF_BADGE[d.kind]}`}>
                      {d.path}: {t(`geo.structuredData.${d.kind}`)}
                    </span>
                  ))}
                </div>
                {item.conflicts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">{t('geo.structuredData.conflicts')}</h4>
                    {item.conflicts.map((c) => {
                      const current = resolutions[item.key]?.[c.path] ?? c.resolution;
                      return (
                        <div key={c.path} className="border border-base-300 rounded-box p-2 space-y-1">
                          <code className="font-semibold">{c.path}</code>
                          <div className="grid md:grid-cols-2 gap-2">
                            {(['keep', 'profile'] as const).map((choice) => (
                              <label key={choice} className="flex items-start gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  className="radio radio-sm radio-primary mt-1"
                                  name={`${item.key}-${c.path}`}
                                  checked={current === choice}
                                  onChange={() => setResolution(item.key, c.path, choice)}
                                />
                                <span>
                                  <span className="font-medium">
                                    {choice === 'keep' ? t('geo.structuredData.keep') : t('geo.structuredData.useProfile')}
                                  </span>
                                  <span className="block text-xs text-base-content/70 break-all">
                                    {preview(choice === 'keep' ? c.existing : c.profile)}
                                  </span>
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <CodeBlock code={item.script} filename={`${item.entityKey}-${item.lang}.html`} type="text/html" t={t} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
