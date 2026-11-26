import { describe, expect, it } from 'vitest';
import { t as translate } from '@/lib/i18n/ui';
import type { HreflangReview } from '@/lib/hreflang/review';
import { pageDescription, statusTone, toPageRow } from './rows';

const t = (path: string) => translate('es', path);

const base = { url: 'https://ex.com/a', headings: ['H1', 'H2'] };

describe('pageDescription', () => {
  it('usa la meta description aunque haya og:description', () => {
    expect(
      pageDescription({ description: 'Hotel en Cancún', metaTags: [{ name: 'og:description', content: 'Reserva ya' }] })
    ).toBe('Hotel en Cancún');
  });

  it('sin meta description usa og:description', () => {
    expect(pageDescription({ metaTags: [{ name: 'og:description', content: 'Reserva ya' }] })).toBe('Reserva ya');
    expect(pageDescription({ description: '   ', metaTags: [{ name: 'og:description', content: 'Reserva ya' }] })).toBe(
      'Reserva ya'
    );
  });

  it('sin ninguna devuelve null', () => {
    expect(pageDescription({ metaTags: [{ name: 'og:title', content: 'Título' }] })).toBeNull();
    expect(pageDescription({})).toBeNull();
  });
});

describe('statusTone', () => {
  it('sigue el color del distintivo de la tabla', () => {
    expect(statusTone(200)).toBe('success');
    expect(statusTone(404)).toBe('error');
    expect(statusTone(500)).toBe('error');
    expect(statusTone(301)).toBe('info');
    expect(statusTone(null)).toBe('info');
  });
});

describe('toPageRow', () => {
  it('página rastreada antes de hreflang: pide volver a rastrear', () => {
    const row = toPageRow(base, undefined, t);
    expect(row.languages).toEqual([]);
    expect(row.languagesText).toBe(t('siteDetails.hreflang.recrawl'));
  });

  it('sin alternos: guion', () => {
    expect(toPageRow({ ...base, alternates: [] }, undefined, t).languagesText).toBe('—');
  });

  it('alternos ordenados con x-default al final y conteo de problemas sin contar las notas', () => {
    const review: HreflangReview = {
      issues: [{ type: 'missing-self' }, { type: 'missing-x-default' }, { type: 'unverifiable', href: 'https://x.com' }],
      problemCount: 2,
    };
    const row = toPageRow(
      {
        ...base,
        alternates: [
          { hreflang: 'x-default', href: 'https://ex.com/', source: 'html' },
          { hreflang: 'es-MX', href: 'https://ex.com/es', source: 'html' },
          { hreflang: 'en-US', href: 'https://ex.com/en', source: 'sitemap' },
        ],
      },
      review,
      t
    );
    expect(row.languages).toEqual(['en-US', 'es-MX', 'x-default']);
    expect(row.languagesText).toBe('en-US, es-MX, x-default (2 problema(s))');
  });

  it('sin problemas no agrega conteo', () => {
    const row = toPageRow(
      { ...base, alternates: [{ hreflang: 'es', href: 'https://ex.com/a', source: 'html' }] },
      { issues: [], problemCount: 0 },
      t
    );
    expect(row.languagesText).toBe('es');
  });

  it('página sin encabezados, título ni estado', () => {
    const row = toPageRow({ url: 'https://ex.com/b' }, undefined, t);
    expect(row).toMatchObject({ title: null, description: null, headingsCount: 0, headings: [], statusCode: null, statusTone: 'info' });
  });

  it('conserva conteo y lista de encabezados', () => {
    const row = toPageRow(base, undefined, t);
    expect(row.headingsCount).toBe(2);
    expect(row.headings).toEqual(['H1', 'H2']);
  });
});
