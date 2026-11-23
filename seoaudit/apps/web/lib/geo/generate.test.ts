import { describe, expect, it } from 'vitest';
import { generateChainDescription, generateEntityDescription } from './generate';

const properties = ['Las Brisas Ixtapa', 'Las Brisas Acapulco', 'Las Brisas Huatulco'];

describe('generateChainDescription', () => {
  it('envía las propiedades confirmadas y marca la fuente generated', async () => {
    let prompt = '';
    const model = async (p: string) => {
      prompt = p;
      return { description: 'Las Brisas Hotels reúne Las Brisas Ixtapa, Las Brisas Acapulco y Las Brisas Huatulco.' };
    };
    const result = await generateChainDescription(model, { organizationName: 'Las Brisas Hotels', lang: 'es', properties });
    expect(properties.every((p) => prompt.includes(p))).toBe(true);
    expect(result.source).toBe('generated');
    expect(result.value).toContain('Las Brisas Huatulco');
  });

  it('si el modelo omite un hotel usa la enumeración determinista', async () => {
    const model = async () => ({ description: 'Hoteles en Ixtapa y Acapulco.' });
    const result = await generateChainDescription(model, { organizationName: 'Las Brisas Hotels', lang: 'es', properties });
    expect(result).toEqual({
      value: 'Las Brisas Hotels: colección de hoteles que incluye Las Brisas Ixtapa, Las Brisas Acapulco y Las Brisas Huatulco.',
      source: 'generated',
    });
  });
});

describe('generateEntityDescription', () => {
  it('genera en el idioma pedido con fuente generated', async () => {
    let prompt = '';
    const model = async (p: string) => {
      prompt = p;
      return { description: 'Iconic hotel overlooking Acapulco Bay.' };
    };
    const result = await generateEntityDescription(model, {
      name: 'Las Brisas Acapulco',
      type: 'Resort',
      lang: 'en',
      sourceText: 'Casitas con alberca privada.',
    });
    expect(prompt).toContain('inglés');
    expect(result).toEqual({ value: 'Iconic hotel overlooking Acapulco Bay.', source: 'generated' });
  });

  it('sin contenido no genera', async () => {
    expect(await generateEntityDescription(async () => ({}), { name: 'X', type: 'Hotel', lang: 'es', sourceText: '' })).toBeNull();
  });
});
