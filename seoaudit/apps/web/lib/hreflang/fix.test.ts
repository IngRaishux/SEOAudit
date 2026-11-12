import { describe, expect, it } from 'vitest';
import { buildFixExample, linkTag, pageLanguageCode, type FixPage } from './fix';
import type { HreflangAlternate } from './review';

const SITE = 'https://hotel.example.com';
const alt = (hreflang: string, path: string): HreflangAlternate => ({ hreflang, href: SITE + path, source: 'html' });
const byUrl = (pages: FixPage[]) => new Map(pages.map((p) => [p.url, p]));

describe('pageLanguageCode', () => {
  it('usa el código con el que la página se declara a sí misma', () => {
    const page = { url: SITE + '/', alternates: [alt('es-MX', '/'), alt('en-US', '/en/')] };
    expect(pageLanguageCode(page, byUrl([page]))).toBe('es-MX');
  });

  it('si no, el código que le dan las otras versiones', () => {
    const home = { url: SITE + '/', alternates: [alt('en-US', '/en/')] };
    const en = { url: SITE + '/en/', alternates: [alt('es-MX', '/'), alt('en-US', '/en/')] };
    expect(pageLanguageCode(home, byUrl([home, en]))).toBe('es-MX');
  });

  it('si no, el lang de la página; y null si no hay nada', () => {
    expect(pageLanguageCode({ url: SITE + '/', alternates: [], htmlLang: 'es' }, new Map())).toBe('es');
    expect(pageLanguageCode({ url: SITE + '/', alternates: [] }, new Map())).toBeNull();
  });
});

describe('buildFixExample', () => {
  it('sin retorno: la línea va en la otra versión y apunta a esta página', () => {
    const home = { url: SITE + '/', alternates: [alt('es-MX', '/'), alt('en-US', '/en/'), alt('x-default', '/')] };
    const fix = buildFixExample({ type: 'missing-return', href: SITE + '/en/' }, home, byUrl([home]));
    expect(fix).toEqual({ kind: 'add', target: SITE + '/en/', snippet: linkTag('es-MX', SITE + '/'), usesPlaceholder: false });
  });

  it('sin autorreferencia: añade su propio idioma con lang como respaldo', () => {
    const page = { url: SITE + '/', alternates: [alt('en', '/en/')], htmlLang: 'es' };
    expect(buildFixExample({ type: 'missing-self' }, page, byUrl([page]))?.snippet).toBe(linkTag('es', SITE + '/'));
  });

  it('usa un código de ejemplo cuando no se puede deducir el idioma', () => {
    const page = { url: SITE + '/', alternates: [alt('en', '/en/')] };
    expect(buildFixExample({ type: 'missing-self' }, page, byUrl([page]))?.usesPlaceholder).toBe(true);
  });

  it('sin x-default: propone la primera versión declarada', () => {
    const page = { url: SITE + '/en/', alternates: [alt('es-MX', '/'), alt('en-US', '/en/')] };
    expect(buildFixExample({ type: 'missing-x-default' }, page, byUrl([page]))?.snippet).toBe(linkTag('x-default', SITE + '/'));
  });

  it('código inválido con alias: sustituye por el sugerido conservando la URL', () => {
    const page = { url: SITE + '/', alternates: [alt('es', '/'), alt('en-UK', '/uk/')] };
    const fix = buildFixExample({ type: 'invalid-code', hreflang: 'en-UK', suggestion: 'en-GB' }, page, byUrl([page]));
    expect(fix).toEqual({ kind: 'replace', target: SITE + '/', snippet: linkTag('en-GB', SITE + '/uk/'), usesPlaceholder: false });
  });

  it('mismo código hacia varias URLs: deja una sola', () => {
    const page = { url: SITE + '/', alternates: [] };
    const fix = buildFixExample({ type: 'conflicting-code', hreflang: 'es-mx', hrefs: [SITE + '/', SITE + '/es/'] }, page, byUrl([page]));
    expect(fix?.kind).toBe('keep-one');
    expect(fix?.snippet).toBe(linkTag('es-mx', SITE + '/'));
  });

  it('lo no verificable no necesita corrección', () => {
    const page = { url: SITE + '/', alternates: [] };
    expect(buildFixExample({ type: 'unverifiable', href: SITE + '/x/' }, page, byUrl([page]))).toBeNull();
  });
});

describe('buildFixExample — x-default hacia otra página', () => {
  it('propone sustituir x-default por la versión principal de esta misma página', () => {
    const page = { url: SITE + '/contacto/', alternates: [alt('es', '/contacto/'), alt('en', '/en/contact/'), alt('x-default', '/')] };
    expect(buildFixExample({ type: 'x-default-elsewhere', href: SITE + '/' }, page, byUrl([page]))).toEqual({
      kind: 'replace',
      target: SITE + '/contacto/',
      snippet: linkTag('x-default', SITE + '/contacto/'),
      usesPlaceholder: false,
    });
  });

  it('respeta el idioma de la página a la que apuntaba x-default aunque se declare después', () => {
    const home = { url: SITE + '/', alternates: [alt('en', '/en/'), alt('es', '/'), alt('x-default', '/')] };
    const contact = { url: SITE + '/contacto/', alternates: [alt('en', '/en/contact/'), alt('es', '/contacto/'), alt('x-default', '/')] };
    const fix = buildFixExample({ type: 'x-default-elsewhere', href: SITE + '/' }, contact, byUrl([home, contact]));
    expect(fix?.snippet).toBe(linkTag('x-default', SITE + '/contacto/'));
  });
});
