import { describe, expect, it } from 'vitest';
import { translations } from './ui';

/** Todas las cadenas del diccionario con su ruta, p. ej. ["home.faq.items.0.q", "..."]. */
function strings(value: unknown, prefix = ''): Array<[string, string]> {
  if (typeof value === 'string') return [[prefix, value]];
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => strings(child, prefix ? `${prefix}.${key}` : key));
  }
  return [];
}

describe.each(['es', 'en'] as const)('marca en el diccionario %s', (lang) => {
  it('ninguna cadena usa el nombre anterior', () => {
    const old = strings(translations[lang]).filter(([, text]) => /seo ?audit/i.test(text));
    expect(old.map(([path]) => path)).toEqual([]);
  });

  it('el producto se nombra SEObab', () => {
    expect(strings(translations[lang]).some(([, text]) => text.includes('SEObab'))).toBe(true);
  });
});
