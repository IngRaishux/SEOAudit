import { describe, expect, it } from 'vitest';
import { extractLiteralFields } from './extract';
import { acapulcoPageWithoutJsonLd } from './__fixtures__/pages';

const page = acapulcoPageWithoutJsonLd();
const text = `${page.bodyText}\n${page.footerText}`;
const input = { entityName: 'Las Brisas Acapulco', type: 'Resort', lang: 'es', text };

describe('extractLiteralFields', () => {
  it('conserva valores literales y descarta los inventados', async () => {
    const model = async () => ({
      address: {
        streetAddress: 'Escénica 5255, Las Brisas',
        addressLocality: 'Acapulco de Juárez',
        addressRegion: 'Guerrero',
        postalCode: '39899', // inventado: el texto dice 39867
        addressCountry: 'MX',
      },
      amenities: ['Spa', 'Gimnasio', 'Campo de golf'], // golf no aparece
      alternateName: ['Las Brisas Acapulco', 'Hotel Las Brisas'], // el segundo no aparece
    });

    const { facts, texts } = await extractLiteralFields(model, input);
    expect(facts.address).toEqual({
      value: {
        streetAddress: 'Escénica 5255, Las Brisas',
        addressLocality: 'Acapulco de Juárez',
        addressRegion: 'Guerrero',
        addressCountry: 'MX',
      },
      source: 'extracted',
    });
    expect(texts.amenities).toEqual({ es: { value: ['Spa', 'Gimnasio'], source: 'extracted' } });
    expect(texts.alternateName).toBeUndefined();
  });

  it('tolera diferencias de acentos y mayúsculas', async () => {
    const model = async () => ({ amenities: ['LA CONCHA beach club'] });
    const { texts } = await extractLiteralFields(model, input);
    expect(texts.amenities?.es.value).toEqual(['LA CONCHA beach club']);
  });

  it('un país suelto no produce dirección', async () => {
    const model = async () => ({ address: { addressCountry: 'MX', streetAddress: 'Calle Falsa 123' } });
    const { facts } = await extractLiteralFields(model, input);
    expect(facts.address).toBeUndefined();
  });

  it('no llama al modelo sin texto', async () => {
    let called = false;
    const model = async () => {
      called = true;
      return {};
    };
    expect(await extractLiteralFields(model, { ...input, text: '  ' })).toEqual({ facts: {}, texts: {} });
    expect(called).toBe(false);
  });
});
