import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { validateProfile, textIn } from './profile';
import { brisasProfile } from './__fixtures__/profile';
import BusinessProfile from '@/lib/models/BusinessProfile';

const clone = () => structuredClone(brisasProfile);

describe('validateProfile', () => {
  it('acepta el perfil de una cadena con entidad externa', () => {
    expect(validateProfile(clone())).toMatchObject({ ok: true });
  });

  it('rechaza un tipo fuera del catálogo indicando los permitidos', () => {
    const input = clone();
    (input.entities[1] as { type: string }).type = 'Restaurant';
    const result = validateProfile(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/tipo no soportado; permitidos: Organization/);
  });

  it('rechaza un padre inexistente', () => {
    const input = clone();
    input.entities[2].parentKey = 'nadie';
    const result = validateProfile(input);
    expect(result).toEqual({ ok: false, errors: ['entidad acapulco: parentKey nadie no existe'] });
  });

  it('rechaza scopes repetidos y externas con scope', () => {
    const input = clone();
    input.entities[2].scope = '/';
    input.entities[0].scope = '/grupo/';
    const result = validateProfile(input);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain('entidad grupo: una entidad externa no tiene scope');
      expect(result.errors).toContain('entidad acapulco: scope / repetido');
    }
  });

  it('textos por idioma con respaldo al idioma por defecto', () => {
    const resort = brisasProfile.entities[2];
    expect(textIn(resort, 'description', 'en', 'es')).toBe('Iconic hotel overlooking the bay.');
    expect(textIn(resort, 'alternateName', 'en', 'es')).toEqual(['Hotel Las Brisas Acapulco']);
  });
});

// Requiere Mongo local: MONGODB_TEST_URI=mongodb://localhost:27017/seo-geo-test npm test
const testUri = process.env.MONGODB_TEST_URI;

describe.skipIf(!testUri)('BusinessProfile (Mongo)', () => {
  beforeAll(async () => {
    await mongoose.connect(testUri!);
    await BusinessProfile.syncIndexes();
  });
  afterAll(async () => {
    await mongoose.connection.db?.dropDatabase();
    await mongoose.disconnect();
  });

  it('no permite dos perfiles para la misma organización y origen', async () => {
    const data = { ...clone(), organizationId: 'org-1', origin: 'https://www.lasbrisashotels.com.mx' };
    await BusinessProfile.create(data);
    await expect(BusinessProfile.create(data)).rejects.toThrow(/duplicate key/);
    await expect(BusinessProfile.create({ ...data, organizationId: 'org-2' })).resolves.toBeTruthy();
  });
});

describe('markUserEdits', () => {
  it('un valor editado pasa a fuente user y los demás conservan la suya', async () => {
    const { markUserEdits } = await import('./profile');
    const previous = clone();
    previous.entities[2].facts.telephone = { value: '+52 744 469 6900', source: 'extracted' };
    previous.entities[2].facts.email = { value: 'a@b.com', source: 'extracted' };
    const next = structuredClone(previous);
    next.entities[2].facts.telephone = { value: '+52 744 469 6901', source: 'extracted' };
    next.entities[2].texts.description!.en = { value: 'Edited', source: 'generated' };

    const result = markUserEdits(previous, next);
    expect(result.entities[2].facts.telephone).toEqual({ value: '+52 744 469 6901', source: 'user' });
    expect(result.entities[2].facts.email?.source).toBe('extracted');
    expect(result.entities[2].texts.description?.en).toEqual({ value: 'Edited', source: 'user' });
  });

  it('en el primer guardado se respetan las fuentes de la sugerencia', async () => {
    const { markUserEdits } = await import('./profile');
    const next = clone();
    next.entities[2].facts.telephone = { value: '+52 744 469 6900', source: 'extracted' };
    expect(markUserEdits(null, next).entities[2].facts.telephone?.source).toBe('extracted');
  });
});
