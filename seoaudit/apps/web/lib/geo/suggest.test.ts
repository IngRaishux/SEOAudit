import { describe, expect, it } from 'vitest';
import { suggestProfile } from './suggest';
import { validateProfile } from './profile';
import { acapulcoPageWithoutJsonLd, chainPages } from './__fixtures__/pages';

const origin = 'https://www.lasbrisashotels.com.mx';

// Responde según el tipo de prompt, como lo haría el modelo real
const model = async (prompt: string) => {
  if (prompt.startsWith('Clasifica')) {
    return {
      defaultLanguage: 'es',
      businessKind: 'hotel-chain',
      properties: [
        { prefix: '/acapulco/', name: 'Las Brisas Acapulco', type: 'Resort' },
        { prefix: '/ixtapa/', name: 'Las Brisas Ixtapa', type: 'Resort' },
      ],
    };
  }
  if (prompt.startsWith('Extrae')) return { amenities: ['Spa', 'Helipuerto'] };
  if (prompt.includes('colección de hoteles')) {
    return { description: 'Las Brisas Hotels reúne Las Brisas Acapulco y Las Brisas Ixtapa.' };
  }
  return { description: 'Descripción generada.' };
};

describe('suggestProfile', () => {
  it('arma un borrador de cadena válido con fuentes trazables', async () => {
    const pages = chainPages().map((p) => (p.url === `${origin}/acapulco/` ? { ...acapulcoPageWithoutJsonLd(), _id: p._id } : p));
    const { profile } = await suggestProfile(model, origin, pages);

    expect(validateProfile(profile)).toMatchObject({ ok: true });
    expect(profile.businessKind).toBe('hotel-chain');
    expect(profile.languages).toEqual(['en', 'es']);
    expect(profile.entities.map((e) => [e.key, e.type, e.scope, e.parentKey, e.id])).toEqual([
      ['org', 'Organization', '/', null, `${origin}/#organization`],
      ['acapulco', 'Resort', '/acapulco/', 'org', `${origin}/acapulco/#hotel`],
      ['ixtapa', 'Resort', '/ixtapa/', 'org', `${origin}/ixtapa/#hotel`],
    ]);

    const acapulco = profile.entities[1];
    expect(acapulco.facts.telephone).toEqual({ value: '+52 744 469 6900', source: 'extracted' });
    // "Helipuerto" no aparece en el texto: se descarta
    expect(acapulco.texts.amenities?.es.value).toEqual(['Spa']);
    expect(acapulco.texts.description?.es).toEqual({ value: 'Descripción generada.', source: 'generated' });
    expect(profile.entities[0].texts.description?.es.value).toContain('Las Brisas Ixtapa');
  });
});
