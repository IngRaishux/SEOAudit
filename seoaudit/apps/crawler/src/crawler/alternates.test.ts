import { describe, expect, it } from 'vitest';
import { mergeAlternates } from './alternates';
import type { HreflangAlternate } from './parse';

const html = (hreflang: string, href: string): HreflangAlternate => ({ hreflang, href, source: 'html' });
const sitemap = (hreflang: string, href: string): HreflangAlternate => ({ hreflang, href, source: 'sitemap' });

describe('mergeAlternates', () => {
  it('marca como both la misma pareja en ambas fuentes, sin distinguir mayúsculas en el código', () => {
    expect(mergeAlternates([html('en-US', 'https://a/en/')], [sitemap('en-us', 'https://a/en/')])).toEqual([
      { hreflang: 'en-US', href: 'https://a/en/', source: 'both' },
    ]);
  });

  it('conserva los que solo están en una fuente', () => {
    expect(mergeAlternates([html('es', 'https://a/')], [sitemap('en', 'https://a/en/')])).toEqual([
      { hreflang: 'es', href: 'https://a/', source: 'html' },
      { hreflang: 'en', href: 'https://a/en/', source: 'sitemap' },
    ]);
  });

  it('mismo código con URL distinta son dos alternos (la revisión lo marca como conflicto)', () => {
    expect(mergeAlternates([html('en', 'https://a/en/')], [sitemap('en', 'https://a/en-us/')])).toHaveLength(2);
  });

  it('sin alternos devuelve lista vacía', () => {
    expect(mergeAlternates([], [])).toEqual([]);
  });
});
