import { GoogleGenAI } from '@google/genai';

/** Modelo que recibe un prompt y devuelve JSON ya parseado. Se inyecta para poder probar sin red. */
export type JsonModel = (prompt: string) => Promise<unknown>;

const GEO_MODEL = 'gemini-3.5-flash';
const GEO_TIMEOUT_MS = 60_000;

/** El proveedor no pudo atender (saturación o cuota); la ruta responde 503 con un mensaje claro. */
export class ModelUnavailableError extends Error {
  constructor(public readonly reason: 'overloaded' | 'quota') {
    super(
      reason === 'quota'
        ? 'Se agotó la cuota del modelo de IA. Intenta de nuevo más tarde.'
        : 'El modelo de IA está saturado en este momento. Intenta de nuevo en unos minutos.'
    );
    this.name = 'ModelUnavailableError';
  }
}

const RETRY_DELAYS_MS = [2_000, 5_000];

function providerStatus(error: unknown): number | null {
  const status = (error as { status?: unknown })?.status;
  if (typeof status === 'number') return status;
  const match = error instanceof Error ? error.message.match(/"code":\s*(\d{3})/) : null;
  return match ? Number(match[1]) : null;
}

/** Reintenta solo la saturación (503); la cuota agotada (429) no se resuelve reintentando. */
export async function withProviderRetry<T>(call: () => Promise<T>, delays = RETRY_DELAYS_MS): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await call();
    } catch (error) {
      const status = providerStatus(error);
      if (status === 429) throw new ModelUnavailableError('quota');
      if (status !== 503) throw error;
      if (attempt >= delays.length) throw new ModelUnavailableError('overloaded');
      await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
    }
  }
}

export function geminiJsonModel(): JsonModel {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY environment variable is not set');
  }
  const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

  return async (prompt) => {
    const result = await withProviderRetry(() =>
      genAI.models.generateContent({
        model: GEO_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          abortSignal: AbortSignal.timeout(GEO_TIMEOUT_MS),
        },
      })
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
