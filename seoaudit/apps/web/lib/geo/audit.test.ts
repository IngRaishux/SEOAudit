import { describe, expect, it } from 'vitest';
import { omit } from './object';
import { auditPage, findLanguageSpecificIds } from './audit';
import { locatePages, type GeoPage } from './pages';
import type { ProfileInput } from './profile';
import { brisasOrganization, brisasResort } from './__fixtures__/brisas';
import { brisasProfile } from './__fixtures__/profile';

const origin = 'https://www.lasbrisashotels.com.mx';
const languages = ['en', 'es'];
const block = (parsed: unknown) => ({ raw: JSON.stringify(parsed), parsed, parseError: null });

// Resort del fixture con el @id ya unificado y los datos del perfil
const resort = { ...brisasResort, '@id': `${origin}/acapulco/#hotel`, priceRange: '$$$' };

function page(path: string, jsonLd: GeoPage['jsonLd']): GeoPage {
  return { url: `${origin}${path}`, statusCode: 200, jsonLd, bodyText: '' };
}

function audit(p: GeoPage, profile: ProfileInput | null = brisasProfile) {
  const entities = profile ? profile.entities : [];
  return auditPage(locatePages([p], entities, languages)[0], profile);
}

describe('auditPage — cascada', () => {
  it('missing sin bloques', () => {
    expect(audit(page('/acapulco/', [])).status).toBe('missing');
  });

  it('invalid si el único bloque no parsea o no tiene contexto', () => {
    expect(audit(page('/acapulco/', [{ raw: '{', parsed: null, parseError: 'x' }])).status).toBe('invalid');
    expect(audit(page('/acapulco/', [block({ '@type': 'Hotel', name: 'X' })])).status).toBe('invalid');
  });

  it('wrong-type si la página del hotel solo declara la organización', () => {
    const result = audit(page('/acapulco/', [block(brisasOrganization)]));
    expect(result.status).toBe('wrong-type');
    expect(result.notes[0]).toContain('Se espera Resort');
  });

  it('incomplete lista las recomendadas faltantes', () => {
    const partial = omit(resort, 'geo', 'amenityFeature');
    const result = audit(page('/acapulco/', [block(partial)]));
    expect(result.status).toBe('incomplete');
    expect(result.missingRequired).toEqual([]);
    expect(result.missingRecommended).toEqual(['geo', 'amenityFeature']);
  });

  it('Organization sin logo: requerida faltante', () => {
    const org = omit(brisasOrganization, 'logo');
    const result = audit(page('/', [block(org)]));
    expect(result.status).toBe('incomplete');
    expect(result.missingRequired).toEqual(['logo']);
  });

  it('EXTRA no afecta el estado', () => {
    const result = audit(page('/acapulco/', [block(resort)]));
    expect(result.status).toBe('ok');
    expect(result.suggestions).toContain('checkinTime');
    expect(result.completeness).toEqual({ required: [5, 5], recommended: [7, 7] });
  });

  it('ok también con la versión en inglés', () => {
    expect(audit(page('/en/acapulco/rooms/', [block(resort)])).status).toBe('ok');
  });

  it('sin perfil omite tipo esperado y consistencia', () => {
    const result = audit(page('/acapulco/', [block({ ...resort, telephone: '+52 1' })]), null);
    expect(result.status).toBe('ok');
    expect(result.profileChecksSkipped).toBe(true);
  });
});

describe('auditPage — consistencia', () => {
  it('teléfono distinto es inconsistente con ambos valores', () => {
    const result = audit(page('/acapulco/', [block({ ...resort, telephone: '+52 744 469 6901' })]));
    expect(result.status).toBe('inconsistent');
    expect(result.inconsistencies).toEqual([{ field: 'telephone', page: '+52 744 469 6901', profile: '+52 744 469 6900' }]);
  });

  it('mismo teléfono con distinto formato no es inconsistencia', () => {
    expect(audit(page('/acapulco/', [block({ ...resort, telephone: '+527444696900' })])).status).toBe('ok');
  });
});

describe('findLanguageSpecificIds', () => {
  it('recomienda el @id sin idioma del perfil', () => {
    const es = page('/es/acapulco/', [block(brisasResort)]);
    const en = page('/en/acapulco/', [block({ ...brisasResort, '@id': `${origin}/en/acapulco/#hotel` })]);
    const findings = findLanguageSpecificIds([es, en], languages, brisasProfile);
    expect(findings).toEqual([
      {
        name: 'Las Brisas Acapulco',
        ids: [`${origin}/en/acapulco/#hotel`, `${origin}/es/acapulco/#hotel`],
        recommendedId: `${origin}/acapulco/#hotel`,
        entityKey: 'acapulco',
      },
    ]);
  });

  it('no reporta @id sin idioma aunque no tengan slash final', () => {
    const p = page('/acapulco/', [block({ ...resort, '@id': `${origin}/acapulco#hotel` })]);
    expect(findLanguageSpecificIds([p], languages, null)).toEqual([]);
  });
});
