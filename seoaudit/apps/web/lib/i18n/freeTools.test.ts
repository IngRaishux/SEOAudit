import { describe, expect, it } from 'vitest';
import { translations } from './ui';
import type { FreeErrorCode } from '@/lib/free/types';
import type { PageIssue } from '@/lib/free/issues';

function leaves(value: unknown, prefix = ''): [string, unknown][] {
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => leaves(child, prefix ? `${prefix}.${key}` : key));
  }
  return [[prefix, value]];
}

const texts = (lang: 'es' | 'en') => translations[lang].home.freeTools;

describe('textos de las herramientas gratuitas', () => {
  it('español e inglés tienen exactamente las mismas claves', () => {
    const keys = (lang: 'es' | 'en') => leaves(texts(lang)).map(([k]) => k).sort();
    expect(keys('en')).toEqual(keys('es'));
  });

  it.each(['es', 'en'] as const)('ningún texto en %s está vacío', (lang) => {
    for (const [, value] of leaves(texts(lang))) {
      expect(typeof value).toBe('string');
      expect((value as string).trim()).not.toBe('');
    }
  });

  it('hay mensaje para cada código de error y cada problema', () => {
    const codes: FreeErrorCode[] = ['DISABLED', 'INVALID_URL', 'TURNSTILE_FAILED', 'QUOTA_EXCEEDED', 'NO_SITEMAP', 'CRAWL_FAILED', 'FORBIDDEN', 'NOT_FOUND', 'NOT_IN_JOB', 'AI_FAILED', 'SERVER_ERROR'];
    const issues: PageIssue[] = ['status', 'missing-title', 'title-length', 'missing-description', 'description-length', 'missing-h1', 'multiple-h1'];
    for (const lang of ['es', 'en'] as const) {
      for (const code of codes) expect(texts(lang).errors[code]).toBeTruthy();
      for (const issue of issues) expect(texts(lang).issueLabels[issue]).toBeTruthy();
    }
  });
});
