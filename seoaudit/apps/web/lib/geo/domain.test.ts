import { describe, expect, it } from 'vitest';
import { assignEntity, detectSiteLanguages, entityId, normalizePath } from './url';
import { RULES, isCompatibleType, familyOf, rulesFor } from './rules';
import { findEntityNode, flattenNodes, isValidSchemaBlock, nodesFromBlocks } from './jsonld';
import { brisasOrganization, brisasResort } from './__fixtures__/brisas';

const origin = 'https://www.lasbrisashotels.com.mx';
const urls = [
  `${origin}/`,
  `${origin}/contacto/`,
  `${origin}/acapulco/`,
  `${origin}/acapulco/habitaciones/`,
  `${origin}/en/`,
  `${origin}/en/acapulco/`,
  `${origin}/en/acapulco/rooms/`,
  `${origin}/df/`,
  `${origin}/df/habitaciones/`,
];
const entities = [
  { key: 'org', scope: '/' },
  { key: 'acapulco', scope: '/acapulco/' },
  { key: 'df', scope: '/df/' },
  { key: 'grupo', scope: null },
];

describe('url', () => {
  const languages = detectSiteLanguages(urls);

  it('detecta solo idiomas reales del sitio', () => {
    expect(languages).toEqual(['en']);
  });

  it('normaliza /en/acapulco/rooms/ y asigna el hotel', () => {
    const n = normalizePath(`${origin}/en/acapulco/rooms/`, languages);
    expect(n).toEqual({ path: '/acapulco/rooms/', lang: 'en' });
    expect(assignEntity(n.path, entities)?.key).toBe('acapulco');
  });

  it('ruta sin idioma conserva lang null', () => {
    const n = normalizePath(`${origin}/acapulco/`, languages);
    expect(n).toEqual({ path: '/acapulco/', lang: null });
    expect(assignEntity(n.path, entities)?.key).toBe('acapulco');
  });

  it('/contacto/ va a la organización y /en/ a la raíz', () => {
    expect(assignEntity(normalizePath(`${origin}/contacto/`, languages).path, entities)?.key).toBe('org');
    expect(normalizePath(`${origin}/en/`, languages)).toEqual({ path: '/', lang: 'en' });
  });

  it('un slug de dos letras que no es idioma se trata como scope', () => {
    const n = normalizePath(`${origin}/df/habitaciones/`, languages);
    expect(n.lang).toBeNull();
    expect(assignEntity(n.path, entities)?.key).toBe('df');
  });

  it('las entidades externas (sin scope) nunca se asignan', () => {
    expect(assignEntity('/', [{ key: 'grupo', scope: null }])).toBeNull();
  });

  it('@id sin idioma con fragmento por tipo', () => {
    expect(entityId(origin, '/acapulco', 'Resort')).toBe(`${origin}/acapulco/#hotel`);
    expect(entityId(`${origin}/en/`, '/', 'Organization')).toBe(`${origin}/#organization`);
    expect(entityId(origin, '/tienda/', 'LocalBusiness')).toBe(`${origin}/tienda/#business`);
  });
});

describe('rules', () => {
  it('Resort es compatible con LodgingBusiness y no al revés', () => {
    expect(isCompatibleType('Resort', 'LodgingBusiness')).toBe(true);
    expect(isCompatibleType('LodgingBusiness', 'Resort')).toBe(false);
    expect(familyOf('Hotel')).toBe('LodgingBusiness');
  });

  it('las reglas de hospedaje coinciden con el spec', () => {
    expect(rulesFor('Resort')).toEqual({
      req: ['@id', 'name', 'url', 'address', 'telephone'],
      rec: ['alternateName', 'description', 'image', 'geo', 'amenityFeature', 'sameAs', 'parentOrganization'],
      extra: ['checkinTime', 'checkoutTime', 'priceRange', 'starRating', 'numberOfRooms', 'petsAllowed'],
    });
    expect(RULES.Organization.req).toContain('logo');
  });
});

describe('jsonld', () => {
  it('localiza la entidad dentro de @graph', () => {
    const block = { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebPage' }, { '@type': 'Hotel', name: 'X' }] };
    const nodes = flattenNodes([block]);
    expect(nodes.map((n) => n['@type'])).toEqual(['WebPage', 'Hotel']);
    expect(findEntityNode(nodes, { type: 'LodgingBusiness' })?.name).toBe('X');
    expect(isValidSchemaBlock(block)).toBe(true);
  });

  it('enlaza varios bloques por @id sin tomar nodos anidados', () => {
    const nodes = nodesFromBlocks([
      { raw: '', parsed: brisasOrganization, parseError: null },
      { raw: '', parsed: brisasResort, parseError: null },
    ]);
    expect(nodes).toHaveLength(2);
    expect(findEntityNode(nodes, { id: brisasOrganization['@id'], type: 'Organization' })?.name).toBe('Las Brisas Hotels');
    expect(findEntityNode(nodes, { type: 'Resort' })?.name).toBe('Las Brisas Acapulco');
  });

  it('un bloque sin contexto de schema.org no es válido', () => {
    expect(isValidSchemaBlock({ '@type': 'Hotel' })).toBe(false);
  });
});

describe('findEntityNode — prioridad por tipo', () => {
  it('busca la organización sin tomar el hotel que es subtipo', () => {
    const nodes = flattenNodes([{ '@type': 'Resort', name: 'Hotel' }, { '@type': 'Organization', name: 'Grupo' }]);
    expect(findEntityNode(nodes, { id: 'https://x.com/#organization', type: 'Organization' })?.name).toBe('Grupo');
  });
});

describe('findEntityNode — organización esperada', () => {
  it('no toma un hotel como la organización', () => {
    expect(findEntityNode(flattenNodes([{ '@type': 'Resort', name: 'Hotel' }]), { type: 'Organization' })).toBeNull();
  });

  it('un LocalBusiness esperado sí acepta un Hotel más específico', () => {
    expect(findEntityNode(flattenNodes([{ '@type': 'Hotel', name: 'H' }]), { type: 'LocalBusiness' })?.name).toBe('H');
  });
});
