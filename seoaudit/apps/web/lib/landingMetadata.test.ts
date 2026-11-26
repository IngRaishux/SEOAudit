import { describe, expect, it } from 'vitest';
import { landingMetadata } from './landingMetadata';

const ALTERNATES = { es: '/', en: '/en', 'x-default': '/' };

describe('landingMetadata', () => {
  it('landing en español: canónica propia, alternativas y textos en español', () => {
    const meta = landingMetadata('es');
    expect(meta.alternates?.canonical).toBe('/');
    expect(meta.alternates?.languages).toEqual(ALTERNATES);
    expect(meta.title).toEqual({ absolute: 'SEObab · Auditoría SEO y GEO con IA' });
    expect(meta.description).toMatch(/^Rastrea tu sitio/);
    expect(meta.openGraph).toMatchObject({ siteName: 'SEObab', locale: 'es_MX', url: '/' });
  });

  it('landing en inglés: canónica propia, las mismas alternativas y textos en inglés', () => {
    const meta = landingMetadata('en');
    expect(meta.alternates?.canonical).toBe('/en');
    expect(meta.alternates?.languages).toEqual(ALTERNATES);
    expect(meta.title).toEqual({ absolute: 'SEObab · AI-powered SEO and GEO audits' });
    expect(meta.description).toMatch(/^Crawl your site/);
    expect(meta.openGraph).toMatchObject({ siteName: 'SEObab', locale: 'en_US', url: '/en' });
  });
});
