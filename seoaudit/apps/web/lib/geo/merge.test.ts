import { describe, expect, it } from 'vitest';
import { omit } from './object';
import { applyIdRewrites, buildEntityNode, mergeNode } from './merge';
import { brisasResort } from './__fixtures__/brisas';
import { brisasProfile } from './__fixtures__/profile';

const origin = 'https://www.lasbrisashotels.com.mx';
const resortEntity = brisasProfile.entities[2];
const profileNode = buildEntityNode(resortEntity, brisasProfile, 'es', `${origin}/acapulco/`);

describe('buildEntityNode', () => {
  it('usa solo valores del perfil y omite los vacíos', () => {
    expect(profileNode['@id']).toBe(`${origin}/acapulco/#hotel`);
    expect(profileNode.parentOrganization).toEqual({ '@id': `${origin}/#organization` });
    expect(profileNode.amenityFeature).toEqual([
      { '@type': 'LocationFeatureSpecification', name: 'Spa', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Gimnasio', value: true },
    ]);
    expect(profileNode).not.toHaveProperty('email');
    expect(profileNode).not.toHaveProperty('logo');
  });

  it('usa la url del perfil en el idioma por defecto y la de la página en los demás', () => {
    const edited = {
      ...resortEntity,
      facts: { ...resortEntity.facts, url: { value: 'https://acapulco.example.com/', source: 'user' as const } },
    };
    const lang = brisasProfile.defaultLanguage;
    const other = brisasProfile.languages.find((l) => l !== lang) ?? 'en';
    expect(buildEntityNode(edited, brisasProfile, lang, `${origin}/acapulco/`).url).toBe('https://acapulco.example.com/');
    expect(buildEntityNode(edited, brisasProfile, other, `${origin}/en/acapulco/`).url).toBe(`${origin}/en/acapulco/`);
  });

  it('describe en línea a un padre externo', () => {
    const org = buildEntityNode(brisasProfile.entities[1], brisasProfile, 'es', `${origin}/`);
    expect(org.parentOrganization).toEqual({
      '@type': 'Organization',
      '@id': 'https://www.brisas.com.mx/#organization',
      name: 'Grupo Brisas',
      url: 'https://www.brisas.com.mx/',
    });
    expect(org).not.toHaveProperty('amenityFeature');
  });
});

describe('mergeNode', () => {
  const offers = [{ '@type': 'Offer', name: 'Tarifa flexible', price: '9500', priceCurrency: 'MXN' }];

  it('conserva makesOffer intacto y agrega geo desde el perfil', () => {
    const existing = omit({ ...brisasResort, '@id': `${origin}/acapulco/#hotel`, priceRange: '$$$', makesOffer: offers }, 'geo');
    const { node, diff } = mergeNode(existing, profileNode);
    expect(node.makesOffer).toEqual(offers);
    expect(node.geo).toEqual({ '@type': 'GeoCoordinates', latitude: 16.826196, longitude: -99.862053 });
    expect(diff).toContainEqual({ path: 'geo', kind: 'added' });
    expect(diff).toContainEqual({ path: 'makesOffer', kind: 'preserved' });
  });

  it('un campo sin valor en el perfil no se agrega', () => {
    const { node } = mergeNode({ '@type': 'Resort', name: 'Las Brisas Acapulco' }, profileNode);
    expect(node).not.toHaveProperty('email');
  });

  it('valores distintos son conflictos; por defecto se mantiene el existente', () => {
    const existing = { ...brisasResort, priceRange: '$$' };
    const { node, conflicts } = mergeNode(existing, profileNode);
    expect(conflicts.map((c) => c.path)).toEqual(['@id', 'description', 'url', 'image', 'priceRange']);
    expect(node.priceRange).toBe('$$');
    expect(node['@id']).toBe(brisasResort['@id']);
  });

  it('aplica las resoluciones del usuario', () => {
    const existing = { ...brisasResort, priceRange: '$$' };
    const { node, diff } = mergeNode(existing, profileNode, { priceRange: 'profile', '@id': 'profile' });
    expect(node.priceRange).toBe('$$$');
    expect(node['@id']).toBe(`${origin}/acapulco/#hotel`);
    expect(diff).toContainEqual({ path: 'priceRange', kind: 'conflict', resolution: 'profile' });
  });

  it('un cambio de @type es conflicto y la dirección se completa por campo', () => {
    const existing = { '@type': 'LocalBusiness', address: { '@type': 'PostalAddress', streetAddress: 'Escénica 5255, Las Brisas' } };
    const { node, conflicts, diff } = mergeNode(existing, profileNode);
    expect(conflicts.map((c) => c.path)).toEqual(['@type']);
    expect(node['@type']).toBe('LocalBusiness');
    expect((node.address as Record<string, string>).postalCode).toBe('39867');
    expect(diff).toContainEqual({ path: 'address.streetAddress', kind: 'kept' });
    expect(diff).toContainEqual({ path: 'address.postalCode', kind: 'added' });
  });

  it('en listas, usar el perfil agrega sin quitar lo existente', () => {
    const existing = { '@type': 'Resort', sameAs: ['https://www.facebook.com/LasBrisasAcapulco'] };
    const { node } = mergeNode(existing, profileNode, { sameAs: 'profile' });
    expect(node.sameAs).toEqual(['https://www.facebook.com/LasBrisasAcapulco', 'https://www.instagram.com/lasbrisasacapulco/']);
  });

  it('el teléfono con otro formato no es conflicto', () => {
    const { conflicts } = mergeNode({ '@type': 'Resort', telephone: '+527444696900' }, profileNode);
    expect(conflicts).toEqual([]);
  });
});

describe('applyIdRewrites', () => {
  it('reescribe @id y referencias anidadas', () => {
    const block = { '@id': `${origin}/es/acapulco/#hotel`, parentOrganization: { '@id': `${origin}/es/#organization` } };
    expect(
      applyIdRewrites(block, {
        [`${origin}/es/acapulco/#hotel`]: `${origin}/acapulco/#hotel`,
        [`${origin}/es/#organization`]: `${origin}/#organization`,
      })
    ).toEqual({ '@id': `${origin}/acapulco/#hotel`, parentOrganization: { '@id': `${origin}/#organization` } });
  });
});
