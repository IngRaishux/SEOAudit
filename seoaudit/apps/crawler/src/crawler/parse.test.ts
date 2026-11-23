import { describe, expect, it } from 'vitest';
import { parseSeoFromHtml, BODY_TEXT_MAX_CHARS } from './parse';
import { pageHtml, pageUrl } from './__fixtures__/page';

// cleaned_html de Crawl4AI no trae <head>; se simula quitándolo
const cleanedHtml = pageHtml.replace(/<head>[\s\S]*<\/head>/, '');

describe('parseSeoFromHtml — JSON-LD', () => {
  it('captura bloques de <head> y <body> desde el HTML completo', () => {
    const seo = parseSeoFromHtml(pageUrl, cleanedHtml, 200, 0, undefined, pageHtml);
    expect(seo.jsonLd).toHaveLength(2);
    expect(seo.jsonLd.map((b) => (b.parsed as { '@type': string })['@type'])).toEqual(['Organization', 'Resort']);
    expect(seo.jsonLd.every((b) => b.raw.startsWith('{') && b.parseError === null)).toBe(true);
  });

  it('marca el bloque inválido sin fallar', () => {
    const html = '<html><head><script type="application/ld+json">{"@type": "Hotel",</script></head><body></body></html>';
    const seo = parseSeoFromHtml(pageUrl, html, 200, 0);
    expect(seo.jsonLd).toHaveLength(1);
    expect(seo.jsonLd[0].parsed).toBeNull();
    expect(seo.jsonLd[0].parseError).toBeTruthy();
    expect(seo.jsonLd[0].raw).toBe('{"@type": "Hotel",');
  });

  it('registra lista vacía sin JSON-LD', () => {
    const seo = parseSeoFromHtml(pageUrl, '<html><body><p>hola</p></body></html>', 200, 0);
    expect(seo.jsonLd).toEqual([]);
  });
});

describe('parseSeoFromHtml — links e imágenes', () => {
  const seo = parseSeoFromHtml(pageUrl, cleanedHtml, 200, 0, undefined, pageHtml);

  it('persiste tel:, mailto: y redes marcando externos', () => {
    const byUrl = Object.fromEntries(seo.links.map((l) => [l.url, l]));
    expect(byUrl['tel:+527444696900']).toMatchObject({ isExternal: false, text: '+52 744 469 6900' });
    expect(byUrl['mailto:info@ejemplo.com']).toMatchObject({ isExternal: false });
    expect(byUrl['https://www.instagram.com/hotel/']).toMatchObject({ isExternal: true });
    expect(byUrl['https://www.lasbrisashotels.com.mx/es/acapulco/habitaciones/']).toMatchObject({ isExternal: false });
    expect(seo.links.some((l) => l.url.includes('#reservar'))).toBe(false);
  });

  it('resuelve imágenes relativas y omite data URIs', () => {
    expect(seo.images).toEqual([{ url: 'https://www.lasbrisashotels.com.mx/img/logo.svg', alt: 'Logo' }]);
  });
});

describe('parseSeoFromHtml — texto', () => {
  it('guarda cuerpo y footer sin scripts', () => {
    const seo = parseSeoFromHtml(pageUrl, cleanedHtml, 200, 0, undefined, pageHtml);
    expect(seo.bodyText).toContain('Casitas con alberca privada y spa.');
    expect(seo.bodyText).not.toContain('window.tracking');
    expect(seo.footerText).toContain('Escénica 5255');
    expect(seo.footerText).not.toContain('Casitas');
    expect(seo.textTruncated).toBe(false);
  });

  it('trunca el cuerpo que excede el límite', () => {
    const long = `<html><body><p>${'palabra '.repeat(BODY_TEXT_MAX_CHARS)}</p></body></html>`;
    const seo = parseSeoFromHtml(pageUrl, long, 200, 0);
    expect(seo.bodyText).toHaveLength(BODY_TEXT_MAX_CHARS);
    expect(seo.textTruncated).toBe(true);
  });

  it('produce las mismas señales con el documento renderizado (ruta Playwright)', () => {
    const rendered = parseSeoFromHtml(pageUrl, pageHtml, 200, 0);
    const crawl4ai = parseSeoFromHtml(pageUrl, cleanedHtml, 200, 0, undefined, pageHtml);
    expect(rendered.jsonLd).toEqual(crawl4ai.jsonLd);
    expect(rendered.links).toEqual(crawl4ai.links);
    expect(rendered.images).toEqual(crawl4ai.images);
    expect(rendered.footerText).toEqual(crawl4ai.footerText);
  });
});

describe('parseSeoFromHtml — idiomas alternos (hreflang)', () => {
  const url = 'https://hotel.example.com/habitaciones/';
  const doc = (head: string, lang = 'es-MX') =>
    `<html lang="${lang}"><head>${head}</head><body><p>hola</p></body></html>`;

  it('captura dos idiomas con URL absoluta y fuente html', () => {
    const html = doc(
      '<link rel="alternate" hreflang="es-MX" href="https://hotel.example.com/habitaciones/">' +
        '<link rel="alternate" hreflang="en-US" href="/en/rooms/">'
    );
    const seo = parseSeoFromHtml(url, html.replace(/<head>[\s\S]*<\/head>/, ''), 200, 0, undefined, html);
    expect(seo.alternates).toEqual([
      { hreflang: 'es-MX', href: 'https://hotel.example.com/habitaciones/', source: 'html' },
      { hreflang: 'en-US', href: 'https://hotel.example.com/en/rooms/', source: 'html' },
    ]);
    expect(seo.htmlLang).toBe('es-MX');
  });

  it('acepta rel con varios valores e ignora links sin alternate', () => {
    const html = doc(
      '<link rel="alternate nofollow" hreflang="x-default" href="/">' +
        '<link rel="canonical" hreflang="en" href="/en/">'
    );
    expect(parseSeoFromHtml(url, html, 200, 0).alternates).toEqual([
      { hreflang: 'x-default', href: 'https://hotel.example.com/', source: 'html' },
    ]);
  });

  it('elimina duplicados sin distinguir mayúsculas en el código', () => {
    const html = doc('<link rel="alternate" hreflang="en" href="/en/"><link rel="alternate" hreflang="EN" href="/en/">');
    expect(parseSeoFromHtml(url, html, 200, 0).alternates).toHaveLength(1);
  });

  it('sin anotaciones deja la lista vacía y sin lang deja null', () => {
    const seo = parseSeoFromHtml(url, '<html><head></head><body></body></html>', 200, 0);
    expect(seo.alternates).toEqual([]);
    expect(seo.htmlLang).toBeNull();
  });

  it('el fixture del hotel conserva su lang', () => {
    expect(parseSeoFromHtml(pageUrl, cleanedHtml, 200, 0, undefined, pageHtml).htmlLang).toBe('es');
  });
});
