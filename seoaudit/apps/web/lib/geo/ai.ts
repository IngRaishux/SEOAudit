import { GoogleGenAI } from '@google/genai';
import { ModelUnavailableError, withModelFallback } from '@/lib/ai/models';

/** Modelo que recibe un prompt y devuelve JSON ya parseado. Se inyecta para poder probar sin red. */
export type JsonModel = (prompt: string) => Promise<unknown>;

// Por modelo; con el respaldo el peor caso (~180 s) cabe en el maxDuration de 300 s de las rutas
const GEO_TIMEOUT_MS = 90_000;

// Se reexporta para las rutas GEO, que ya lo importaban desde aquí
export { ModelUnavailableError };

export function geminiJsonModel(): JsonModel {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY environment variable is not set');
  }
  const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

  return async (prompt) => {
    const result = await withModelFallback((model) =>
      genAI.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          abortSignal: AbortSignal.timeout(GEO_TIMEOUT_MS),
        },
      }),
      { fallbackOnTimeout: true }
    );
    const text = result.text;
    if (!text) throw new Error('No response text from model');
    try {
      return JSON.parse(text);
    } catch {
      const match = text.match(/[[{][\s\S]*[\]}]/);
      if (!match) throw new Error('Failed to parse model response');
      return JSON.parse(match[0]);
    }
  };
}

/** Comparación tolerante a mayúsculas, acentos, puntuación y espacios. */
export function normalizeForMatch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function appearsIn(value: string, source: string): boolean {
  const needle = normalizeForMatch(value);
  return needle.length > 0 && normalizeForMatch(source).includes(needle);
}
