import { appearsIn, type JsonModel } from './ai';
import type { Sourced } from './profile';

const LANGUAGE_NAMES: Record<string, string> = { es: 'español', en: 'inglés', fr: 'francés', pt: 'portugués' };

const languageName = (lang: string) => LANGUAGE_NAMES[lang.slice(0, 2)] ?? lang;

function readDescription(response: unknown): string | null {
  const value = (response as { description?: unknown } | null)?.description;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/** Descripción de una entidad a partir de su contenido; siempre queda como `generated` hasta que el usuario la confirma. */
export async function generateEntityDescription(
  model: JsonModel,
  input: { name: string; type: string; lang: string; sourceText: string }
): Promise<Sourced<string> | null> {
  if (!input.sourceText.trim()) return null;
  const prompt = `Escribe en ${languageName(input.lang)} una descripción de 1 a 2 oraciones (máximo 300 caracteres) para "${input.name}" (${input.type}).
Usa solo hechos presentes en el CONTENIDO; no inventes premios, cifras ni servicios.
Responde solo JSON: {"description": ""}

CONTENIDO:
"""
${input.sourceText.slice(0, 8000)}
"""`;
  const description = readDescription(await model(prompt));
  return description ? { value: description, source: 'generated' } : null;
}

/**
 * Descripción de la organización de una cadena a partir de sus propiedades confirmadas.
 * Si el modelo omite alguna propiedad se usa una enumeración determinista.
 */
export async function generateChainDescription(
  model: JsonModel,
  input: { organizationName: string; lang: string; properties: string[] }
): Promise<Sourced<string>> {
  const prompt = `Escribe en ${languageName(input.lang)} una descripción de 1 a 2 oraciones (máximo 400 caracteres) para "${input.organizationName}", una colección de hoteles.
Debe mencionar por su nombre todas estas propiedades: ${input.properties.join('; ')}.
No agregues propiedades ni datos que no estén en la lista.
Responde solo JSON: {"description": ""}`;

  const description = readDescription(await model(prompt));
  if (description && input.properties.every((p) => appearsIn(p, description))) {
    return { value: description, source: 'generated' };
  }
  return { value: enumerate(input.organizationName, input.properties, input.lang), source: 'generated' };
}

function enumerate(name: string, properties: string[], lang: string): string {
  const english = lang.startsWith('en');
  const and = english ? 'and' : 'y';
  const list =
    properties.length > 1 ? `${properties.slice(0, -1).join(', ')} ${and} ${properties.at(-1)}` : (properties[0] ?? '');
  return english ? `${name}: a collection of hotels including ${list}.` : `${name}: colección de hoteles que incluye ${list}.`;
}
