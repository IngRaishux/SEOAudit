import { describe, expect, it } from 'vitest';
import { translations } from './ui';

function leaves(value: unknown, prefix = ''): [string, unknown][] {
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => leaves(child, prefix ? `${prefix}.${key}` : key));
  }
  return [[prefix, value]];
}

describe('textos de hreflang en la vista del sitio', () => {
  it('español e inglés tienen exactamente las mismas claves', () => {
    const keys = (lang: 'es' | 'en') => leaves(translations[lang].siteDetails.hreflang).map(([k]) => k).sort();
    expect(keys('en')).toEqual(keys('es'));
  });

  it.each(['es', 'en'] as const)('ningún texto en %s está vacío', (lang) => {
    for (const [, value] of leaves(translations[lang].siteDetails.hreflang)) {
      expect(typeof value).toBe('string');
      expect((value as string).trim()).not.toBe('');
    }
  });
});
