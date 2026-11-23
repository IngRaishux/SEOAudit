import { describe, expect, it } from 'vitest';
import { groupByFirstSegment, suggestStructure } from './detect';
import { chainPages } from './__fixtures__/pages';

const groups = groupByFirstSegment(chainPages(), ['en']);
const input = { origin: 'https://www.lasbrisashotels.com.mx', homeTitle: 'Las Brisas Hotels', homeText: '', groups };

describe('groupByFirstSegment', () => {
  it('agrupa sin idioma y omite páginas con error', () => {
    const byPrefix = Object.fromEntries(groups.map((g) => [g.prefix, g.count]));
    // /acapulco/spa/ es 404; /en/acapulco/* cuenta en /acapulco/
    expect(byPrefix).toEqual({ '/acapulco/': 4, '/ixtapa/': 2, '/blog/': 2, '/contacto/': 1, '/huatulco/': 1 });
    expect(groups.some((g) => g.prefix === '/en/')).toBe(false);
  });
});

describe('suggestStructure', () => {
  it('sugiere las tres propiedades sin /blog/', async () => {
    const model = async () => ({
      businessKind: 'hotel-chain',
      properties: [
        { prefix: '/ixtapa/', name: 'Las Brisas Ixtapa', type: 'Resort' },
        { prefix: '/acapulco/', name: 'Las Brisas Acapulco', type: 'Resort' },
        { prefix: '/huatulco/', name: 'Las Brisas Huatulco', type: 'Hotel' },
      ],
    });
    const result = await suggestStructure(model, input);
    expect(result.businessKind).toBe('hotel-chain');
    expect(result.properties.map((p) => p.prefix)).toEqual(['/ixtapa/', '/acapulco/', '/huatulco/']);
  });

  it('descarta prefijos inexistentes, duplicados y tipos fuera del catálogo', async () => {
    const model = async () => ({
      businessKind: 'hotel-chain',
      properties: [
        { prefix: '/cancun/', name: 'Inventado', type: 'Resort' },
        { prefix: '/ixtapa/', name: 'Ixtapa', type: 'Castillo' },
        { prefix: '/ixtapa/', name: 'Ixtapa otra vez', type: 'Resort' },
      ],
    });
    const result = await suggestStructure(model, input);
    expect(result.properties).toEqual([{ prefix: '/ixtapa/', name: 'Ixtapa', type: 'Hotel' }]);
  });

  it('un hotel independiente no trae propiedades y un tipo inválido cae en organization', async () => {
    expect(
      await suggestStructure(async () => ({ defaultLanguage: 'EN', businessKind: 'hotel', properties: [{ prefix: '/ixtapa/' }] }), input)
    ).toEqual({ businessKind: 'hotel', defaultLanguage: 'en', properties: [] });
    const fallback = await suggestStructure(async () => ({ businessKind: 'castillo', defaultLanguage: 'español' }), input);
    expect(fallback.businessKind).toBe('organization');
    expect(fallback.defaultLanguage).toBe('es');
  });
});
