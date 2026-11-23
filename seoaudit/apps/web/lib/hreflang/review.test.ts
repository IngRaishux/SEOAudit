import { describe, expect, it } from 'vitest';
import { isValidHreflang, normalizeUrl, reviewHreflang, type HreflangAlternate, type HreflangPage } from './review';

const SITE = 'https://hotel.example.com';
const alt = (hreflang: string, path: string): HreflangAlternate => ({ hreflang, href: SITE + path, source: 'html' });
const page = (path: string, alternates?: HreflangAlternate[]): HreflangPage => ({ url: SITE + path, alternates });
const issuesOf = (pages: HreflangPage[], path: string) => reviewHreflang(pages).get(SITE + path)?.issues ?? [];

// Par correcto: se declaran mutuamente, con autorreferencia y x-default
const correctPair = [
  page('/', [alt('es-MX', '/'), alt('en-US', '/en/'), alt('x-default', '/')]),
  page('/en/', [alt('es-MX', '/'), alt('en-US', '/en/'), alt('x-default', '/')]),
];

describe('isValidHreflang', () => {
  it.each(['en', 'en-GB', 'es-MX', 'es-mx', 'zh-Hant-TW', 'x-default', 'X-Default'])('acepta %s', (code) => {
    expect(isValidHreflang(code)).toEqual({ valid: true });
  });

  it.each(['english', 'en_US', 'es-419', 'xx', 'e', ''])('rechaza %s', (code) => {
    expect(isValidHreflang(code).valid).toBe(false);
  });

  it('sugiere el código correcto en los alias', () => {
    expect(isValidHreflang('en-UK')).toEqual({ valid: false, suggestion: 'en-GB' });
    expect(isValidHreflang('iw')).toEqual({ valid: false, suggestion: 'he' });
  });
});

describe('normalizeUrl', () => {
  it('ignora mayúsculas del dominio y el fragmento, y conserva la barra final', () => {
    expect(normalizeUrl('https://HOTEL.example.com/en/#top')).toBe('https://hotel.example.com/en/');
    expect(normalizeUrl('https://hotel.example.com/en')).not.toBe(normalizeUrl('https://hotel.example.com/en/'));
  });
});

describe('reviewHreflang', () => {
  it('una configuración correcta no tiene problemas', () => {
    const review = reviewHreflang(correctPair);
    expect(review.get(SITE + '/')).toEqual({ issues: [], problemCount: 0 });
    expect(review.get(SITE + '/en/')).toEqual({ issues: [], problemCount: 0 });
  });

  it('las páginas sin alternos (o rastreadas antes) no se revisan', () => {
    const review = reviewHreflang([page('/contacto/', []), page('/viejo/')]);
    expect(review.size).toBe(0);
  });

  it('marca códigos inválidos y alias con sugerencia', () => {
    const pages = [page('/', [alt('es-MX', '/'), alt('x-default', '/'), alt('en-UK', '/uk/'), alt('english', '/en/')])];
    const invalid = issuesOf(pages, '/').filter((i) => i.type === 'invalid-code');
    expect(invalid).toEqual([
      { type: 'invalid-code', hreflang: 'en-UK', suggestion: 'en-GB' },
      { type: 'invalid-code', hreflang: 'english' },
    ]);
  });

  it('marca la falta de autorreferencia', () => {
    const pages = [page('/', [alt('en', '/en/'), alt('x-default', '/en/')])];
    expect(issuesOf(pages, '/')).toContainEqual({ type: 'missing-self' });
  });

  it('marca la falta de x-default', () => {
    const pages = [page('/', [alt('es', '/')])];
    expect(issuesOf(pages, '/')).toEqual([{ type: 'missing-x-default' }]);
  });

  it('marca el mismo código hacia URLs distintas', () => {
    const pages = [page('/', [alt('es', '/'), alt('x-default', '/'), alt('en', '/en/'), alt('EN', '/en-us/')])];
    expect(issuesOf(pages, '/')).toContainEqual({
      type: 'conflicting-code',
      hreflang: 'en',
      hrefs: [SITE + '/en/', SITE + '/en-us/'],
    });
  });

  it('marca el enlace sin retorno hacia una página rastreada', () => {
    const pages = [
      page('/', [alt('es', '/'), alt('en', '/en/'), alt('x-default', '/')]),
      page('/en/', [alt('en', '/en/'), alt('x-default', '/en/')]),
    ];
    expect(issuesOf(pages, '/')).toEqual([{ type: 'missing-return', href: SITE + '/en/' }]);
    expect(reviewHreflang(pages).get(SITE + '/')?.problemCount).toBe(1);
  });

  it('un alterno fuera del rastreo es informativo y no cuenta como problema', () => {
    const pages = [page('/', [alt('es', '/'), alt('en', '/en/'), alt('x-default', '/')])];
    const review = reviewHreflang(pages).get(SITE + '/');
    expect(review).toEqual({ issues: [{ type: 'unverifiable', href: SITE + '/en/' }], problemCount: 0 });
  });

  it('un alterno hacia una página rastreada antes de la función no se puede verificar', () => {
    const pages = [page('/', [alt('es', '/'), alt('en', '/en/'), alt('x-default', '/')]), page('/en/')];
    expect(issuesOf(pages, '/')).toEqual([{ type: 'unverifiable', href: SITE + '/en/' }]);
  });

  it('compara URLs sin distinguir mayúsculas del dominio ni fragmentos', () => {
    const pages = [
      page('/', [alt('es', '/'), { hreflang: 'en', href: 'https://HOTEL.example.com/en/#x', source: 'sitemap' }, alt('x-default', '/')]),
      page('/en/', [alt('es', '/'), alt('en', '/en/'), alt('x-default', '/')]),
    ];
    expect(issuesOf(pages, '/')).toEqual([]);
  });
});

describe('reviewHreflang — x-default hacia otra página', () => {
  it('si solo x-default lleva a la otra página, se marca x-default-elsewhere y no missing-return', () => {
    // Caso real: cada página apunta x-default a la portada, que no la declara
    const pages = [
      page('/', [alt('es', '/'), alt('en', '/en/'), alt('x-default', '/')]),
      page('/en/', [alt('es', '/'), alt('en', '/en/'), alt('x-default', '/')]),
      page('/contacto/', [alt('es', '/contacto/'), alt('en', '/en/contact/'), alt('x-default', '/')]),
      page('/en/contact/', [alt('es', '/contacto/'), alt('en', '/en/contact/'), alt('x-default', '/contacto/')]),
    ];
    expect(issuesOf(pages, '/contacto/')).toEqual([{ type: 'x-default-elsewhere', href: SITE + '/' }]);
  });

  it('si además un código de idioma apunta a esa página, sigue siendo missing-return', () => {
    const pages = [
      page('/', [alt('es', '/'), alt('en', '/en/'), alt('x-default', '/en/')]),
      page('/en/', [alt('en', '/en/'), alt('x-default', '/en/')]),
    ];
    expect(issuesOf(pages, '/')).toEqual([{ type: 'missing-return', href: SITE + '/en/' }]);
  });
});
