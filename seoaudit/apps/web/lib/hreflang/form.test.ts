import { describe, expect, it } from 'vitest';
import { alternatesToForm, applyDetectedAlternates } from './form';
import type { HreflangAlternate } from './review';

const alt = (hreflang: string, href: string): HreflangAlternate => ({ hreflang, href, source: 'html' });

describe('alternatesToForm', () => {
  it('usa el código exacto', () => {
    expect(alternatesToForm([alt('en-US', 'https://a/en/'), alt('x-default', 'https://a/')])).toEqual({
      'en-US': 'https://a/en/',
      'x-default': 'https://a/',
    });
  });

  it('cae al primer alterno del mismo idioma', () => {
    expect(alternatesToForm([alt('es', 'https://a/'), alt('en-GB', 'https://a/uk/')])).toEqual({
      'es-MX': 'https://a/',
      'en-US': 'https://a/uk/',
    });
  });

  it('prefiere el exacto aunque haya otro del mismo idioma antes', () => {
    expect(alternatesToForm([alt('es-ES', 'https://a/es/'), alt('es-mx', 'https://a/mx/')])['es-MX']).toBe('https://a/mx/');
  });

  it('x-default solo por coincidencia exacta', () => {
    expect(alternatesToForm([alt('x', 'https://a/')])).toEqual({});
  });

  it('sin alternos no precarga nada', () => {
    expect(alternatesToForm([])).toEqual({});
    expect(alternatesToForm(undefined)).toEqual({});
  });
});

describe('applyDetectedAlternates', () => {
  const suggestion = {
    title: { S: 'Título IA' },
    alternateLanguages: {
      M: { 'en-US': { S: 'https://ia/inventada/' }, 'es-MX': { S: 'https://ia/es/' }, 'x-default': { S: '' } },
    },
  };

  it('los detectados prevalecen y se conservan los demás campos y claves', () => {
    const result = applyDetectedAlternates(suggestion, [alt('en-US', 'https://a/en/')]);
    expect(result.alternateLanguages.M).toEqual({
      'en-US': { S: 'https://a/en/' },
      'es-MX': { S: 'https://ia/es/' },
      'x-default': { S: '' },
    });
    expect(result.title).toEqual({ S: 'Título IA' });
  });

  it('sin alternos devuelve la sugerencia tal cual', () => {
    expect(applyDetectedAlternates(suggestion, undefined)).toBe(suggestion);
  });

  it('no muta la sugerencia original', () => {
    applyDetectedAlternates(suggestion, [alt('x-default', 'https://a/')]);
    expect(suggestion.alternateLanguages.M['x-default'].S).toBe('');
  });
});
