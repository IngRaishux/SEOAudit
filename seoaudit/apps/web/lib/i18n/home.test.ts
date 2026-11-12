import { describe, expect, it } from 'vitest';
import { translations } from './ui';

/** Rutas de todas las hojas del objeto, p. ej. "faq.items.0.q". */
function leafPaths(value: unknown, prefix = ''): string[] {
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) =>
      leafPaths(child, prefix ? `${prefix}.${key}` : key)
    );
  }
  return [prefix];
}

function leafValues(value: unknown): unknown[] {
  if (value !== null && typeof value === 'object') {
    return Object.values(value).flatMap(leafValues);
  }
  return [value];
}

describe('textos de la landing (home)', () => {
  it('español e inglés tienen exactamente las mismas claves', () => {
    expect(leafPaths(translations.en.home).sort()).toEqual(leafPaths(translations.es.home).sort());
  });

  it.each(['es', 'en'] as const)('ningún texto en %s está vacío', (lang) => {
    for (const value of leafValues(translations[lang].home)) {
      expect(typeof value).toBe('string');
      expect((value as string).trim()).not.toBe('');
    }
  });

  it.each(['es', 'en'] as const)('en %s hay 7 herramientas, 4 pasos y al menos 5 preguntas', (lang) => {
    const home = translations[lang].home;
    expect(Object.keys(home.tools.items)).toHaveLength(7);
    expect(home.howItWorks.steps).toHaveLength(4);
    expect(home.faq.items.length).toBeGreaterThanOrEqual(5);
  });
});
