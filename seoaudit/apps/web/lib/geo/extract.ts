import { appearsIn, type JsonModel } from './ai';
import type { Facts, Texts } from './profile';

export interface ExtractionInput {
  entityName: string;
  type: string;
  lang: string;
  text: string;
}

const MAX_SOURCE_CHARS = 15_000;

const ADDRESS_KEYS = ['streetAddress', 'addressLocality', 'addressRegion', 'postalCode', 'addressCountry'] as const;

/**
 * La IA solo propone; se conserva únicamente lo que aparece literal en el texto de la página.
 * addressCountry es la excepción: se acepta como código ISO de dos letras si el resto de la dirección es literal.
 */
export async function extractLiteralFields(
  model: JsonModel,
  input: ExtractionInput
): Promise<{ facts: Facts; texts: Texts }> {
  const text = input.text.slice(0, MAX_SOURCE_CHARS);
  if (!text.trim()) return { facts: {}, texts: {} };

  const prompt = `Extrae datos de un negocio (${input.type}) llamado "${input.entityName}" a partir del TEXTO.
Reglas estrictas:
- Copia los valores EXACTAMENTE como aparecen en el TEXTO. No completes, no traduzcas, no infieras.
- Si un dato no aparece en el TEXTO, omítelo.
- "amenities": instalaciones o servicios del negocio mencionados en el TEXTO (p. ej. "Spa", "Gimnasio").
- "alternateName": otros nombres con los que el TEXTO se refiere al negocio.

Responde solo JSON con esta forma:
{"address": {"streetAddress": "", "addressLocality": "", "addressRegion": "", "postalCode": "", "addressCountry": ""},
 "amenities": [""], "alternateName": [""]}

TEXTO:
"""
${text}
"""`;

  const response = (await model(prompt)) as {
    address?: Record<string, unknown>;
    amenities?: unknown;
    alternateName?: unknown;
  } | null;

  const facts: Facts = {};
  const texts: Texts = {};

  const literalAddress: Record<string, string> = {};
  for (const key of ADDRESS_KEYS) {
    const value = response?.address?.[key];
    if (typeof value !== 'string' || !value.trim()) continue;
    const isCountryCode = key === 'addressCountry' && /^[A-Z]{2}$/.test(value.trim());
    if (appearsIn(value, text) || isCountryCode) literalAddress[key] = value.trim();
  }
  // Un país suelto no es una dirección
  if (Object.keys(literalAddress).some((k) => k !== 'addressCountry')) {
    facts.address = { value: literalAddress, source: 'extracted' };
  }

  const literalList = (value: unknown) =>
    (Array.isArray(value) ? value : [])
      .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
      .map((v) => v.trim())
      .filter((v, i, all) => all.indexOf(v) === i && appearsIn(v, text));

  const amenities = literalList(response?.amenities);
  if (amenities.length) texts.amenities = { [input.lang]: { value: amenities, source: 'extracted' } };

  const alternateName = literalList(response?.alternateName).filter((n) => n !== input.entityName);
  if (alternateName.length) texts.alternateName = { [input.lang]: { value: alternateName, source: 'extracted' } };

  return { facts, texts };
}
