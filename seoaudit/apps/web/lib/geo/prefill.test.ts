import { describe, expect, it } from 'vitest';
import { locatePages } from './pages';
import { coordinatesFromMapsUrl, isSocialProfile, prefillEntity } from './prefill';
import { acapulcoPageWithJsonLd, acapulcoPageWithoutJsonLd } from './__fixtures__/pages';

const origin = 'https://www.lasbrisashotels.com.mx';
const resort = { key: 'acapulco', scope: '/acapulco/', id: `${origin}/acapulco/#hotel`, type: 'Resort' };

const locate = (page: ReturnType<typeof acapulcoPageWithoutJsonLd>) => locatePages([page], [resort], ['en']);

describe('prefillEntity', () => {
  it('teléfono, email, redes, coordenadas e imagen salen de las señales', () => {
    const { facts } = prefillEntity(locate(acapulcoPageWithoutJsonLd()), resort, 'es');
    expect(facts.telephone).toEqual({ value: '+52 744 469 6900', source: 'extracted' });
    expect(facts.email).toEqual({ value: 'reservaciones@brisas.com.mx', source: 'extracted' });
    expect(facts.sameAs?.value).toEqual([
      'https://www.instagram.com/lasbrisasacapulco/',
      'https://www.facebook.com/LasBrisasAcapulco',
    ]);
    expect(facts.geo).toEqual({ value: { latitude: 16.826196, longitude: -99.862053 }, source: 'extracted' });
    expect(facts.image?.value).toBe('https://res.cloudinary.com/itermotus/acapulco-og.jpg');
    expect(facts.name?.value).toBe('Las Brisas Acapulco');
    expect(facts.logo).toBeUndefined();
  });

  it('sin evidencia el campo queda vacío', () => {
    const page = { ...acapulcoPageWithoutJsonLd(), links: [] };
    const { facts } = prefillEntity(locate(page), resort, 'es');
    expect(facts.geo).toBeUndefined();
    expect(facts.telephone).toBeUndefined();
  });

  it('el JSON-LD existente gana sobre el footer', () => {
    const page = acapulcoPageWithJsonLd();
    page.links = [{ url: 'tel:+527440000000', text: '+52 744 000 0000', isExternal: false }];
    const { facts, texts } = prefillEntity(locate(page), resort, 'es');
    expect(facts.telephone).toEqual({ value: '+52 744 469 6900', source: 'existing-jsonld' });
    expect(facts.address?.value.postalCode).toBe('39867');
    expect(texts.amenities?.es.value).toContain('Spa');
    expect(texts.alternateName?.es).toEqual({ value: ['Hotel Las Brisas Acapulco'], source: 'existing-jsonld' });
  });
});

describe('helpers', () => {
  it('reconoce perfiles sociales y descarta links de compartir', () => {
    expect(isSocialProfile('https://mx.linkedin.com/company/grupobrisas')).toBe(true);
    expect(isSocialProfile('https://www.facebook.com/sharer/sharer.php?u=x')).toBe(false);
    expect(isSocialProfile('https://www.facebook.com/')).toBe(false);
  });

  it('lee coordenadas de varios formatos de Google Maps', () => {
    expect(coordinatesFromMapsUrl('https://maps.google.com/?q=16.8,-99.86')).toEqual({ latitude: 16.8, longitude: -99.86 });
    expect(coordinatesFromMapsUrl('https://www.google.com/maps/place/X/data=!3d16.82!4d-99.86')).toEqual({
      latitude: 16.82,
      longitude: -99.86,
    });
    expect(coordinatesFromMapsUrl('https://example.com/@16.8,-99.8')).toBeNull();
  });
});
