'use client';

import { useEffect, useState } from 'react';
import type { LlmsTxtReport, LlmsTxtStatus } from '@/lib/geo/llmsTxt';
import { toastError } from '@/lib/toast';
import { Alert, CodeBlock, requestJson, type Translate } from './shared';

interface LlmsResponse {
  report: LlmsTxtReport;
  current: string | null;
  hasProfile: boolean;
  languages: string[];
  defaultLanguage: string | null;
}

const STATUS_BADGE: Record<LlmsTxtStatus, string> = {
  missing: 'badge-error',
  invalid: 'badge-error',
  ok: 'badge-success',
  unknown: 'badge-ghost',
};

export function LlmsTxtSection({ siteId, t, reloadKey }: { siteId: string; t: Translate; reloadKey: number }) {
  const [data, setData] = useState<LlmsResponse | null>(null);
  const [loadedKey, setLoadedKey] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [lang, setLang] = useState('');
  const [generated, setGenerated] = useState<string | null>(null);

  useEffect(() => {
    requestJson<LlmsResponse>(`/api/sites/${siteId}/llms-txt`)
      .then((res) => {
        setData(res);
        setLang(res.defaultLanguage ?? '');
      })
      .catch((error) => toastError(error.message, t('geo.loadError')))
      .finally(() => setLoadedKey(reloadKey));
  }, [siteId, t, reloadKey]);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await requestJson<{ content: string }>(`/api/sites/${siteId}/llms-txt`, {
        method: 'POST',
        body: JSON.stringify(lang ? { lang } : {}),
      });
      setGenerated(res.content);
    } catch (error) {
      toastError(error instanceof Error ? error.message : String(error));
    } finally {
      setGenerating(false);
    }
  };

  if (loadedKey !== reloadKey) return <span className="loading loading-spinner loading-lg text-primary" />;
  if (!data) return null;
  const { report } = data;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className={`badge ${STATUS_BADGE[report.status]}`}>{t(`geo.llms.statuses.${report.status}`)}</span>
        {report.url && (
          <a className="link link-hover text-sm" href={report.url} target="_blank" rel="noreferrer">
            {report.url}
          </a>
        )}
      </div>

      {report.problems.length > 0 && (
        <Alert kind="error">
          <p className="font-semibold">{t('geo.llms.problems')}</p>
          <ul className="list-disc ml-4">
            {report.problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </Alert>
      )}
      {report.warnings.length > 0 && (
        <Alert kind="warning">
          <p className="font-semibold">{t('geo.llms.warnings')}</p>
          <ul className="list-disc ml-4">
            {report.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </Alert>
      )}
      {report.brokenLinks.length > 0 && (
        <Alert kind="warning">
          <p className="font-semibold">{t('geo.llms.brokenLinks')}</p>
          <ul className="list-disc ml-4 break-all">
            {report.brokenLinks.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </Alert>
      )}

      {data.current && (
        <div className="collapse collapse-arrow bg-base-100 border border-base-300">
          <input type="checkbox" />
          <div className="collapse-title text-sm font-medium">{t('geo.llms.current')}</div>
          <div className="collapse-content">
            <CodeBlock code={data.current} filename="llms.txt" t={t} />
          </div>
        </div>
      )}

      {data.hasProfile ? (
        <div className="flex flex-wrap items-end gap-2">
          {data.languages.length > 1 && (
            <label className="form-control">
              <span className="label-text mb-1">{t('geo.llms.language')}</span>
              <select className="select select-bordered select-sm" value={lang} onChange={(e) => setLang(e.target.value)}>
                {data.languages.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button type="button" className="btn btn-primary btn-sm" onClick={generate} disabled={generating}>
            {generating && <span className="loading loading-spinner loading-sm" />}
            {generating ? t('geo.llms.generating') : t('geo.llms.generate')}
          </button>
        </div>
      ) : (
        <Alert kind="info">{t('geo.needsProfile')}</Alert>
      )}

      {generated && (
        <div className="space-y-2">
          <h3 className="font-semibold">{t('geo.llms.preview')}</h3>
          <p className="text-sm text-base-content/70">{t('geo.llms.publish')}</p>
          <CodeBlock code={generated} filename="llms.txt" t={t} />
        </div>
      )}
    </div>
  );
}
