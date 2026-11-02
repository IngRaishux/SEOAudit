'use client';

import type { ReactNode } from 'react';
import { toastError, toastSuccess } from '@/lib/toast';

export type Translate = (path: string, defaultValue?: string) => string;

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly details?: unknown) {
    super(message);
  }
}

export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const details = (data as { details?: unknown }).details;
    const message = (data as { error?: string }).error ?? `HTTP ${res.status}`;
    throw new ApiError(Array.isArray(details) ? `${message}: ${details.join('; ')}` : message, res.status, details);
  }
  return data as T;
}

export async function copyText(text: string, t: Translate) {
  try {
    await navigator.clipboard.writeText(text);
    toastSuccess(t('geo.copied'));
  } catch (error) {
    toastError(error instanceof Error ? error.message : String(error));
  }
}

export function downloadText(text: string, filename: string, type = 'text/plain') {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const ALERT_ICON = 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';

export function Alert({ kind, children }: { kind: 'info' | 'warning' | 'error' | 'success'; children: ReactNode }) {
  const cls = { info: 'alert-info', warning: 'alert-warning', error: 'alert-error', success: 'alert-success' }[kind];
  return (
    <div role="alert" className={`alert ${cls}`}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={ALERT_ICON} />
      </svg>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function CodeBlock({ code, filename, type, t }: { code: string; filename: string; type?: string; t: Translate }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2 justify-end">
        <button type="button" className="btn btn-ghost btn-xs" onClick={() => copyText(code, t)}>
          {t('geo.copy')}
        </button>
        <button type="button" className="btn btn-ghost btn-xs" onClick={() => downloadText(code, filename, type)}>
          {t('geo.download')}
        </button>
      </div>
      <pre className="bg-base-200 rounded-box p-4 text-xs overflow-x-auto max-h-96 whitespace-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}
