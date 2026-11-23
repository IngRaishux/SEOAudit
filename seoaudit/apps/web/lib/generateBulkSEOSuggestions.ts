import { FinishReason, GoogleGenAI } from '@google/genai';
import type { PageData, SEOSuggestion } from './generateSEOSuggestions';
import { toDynamoSuggestion, slugFromUrl } from './dynamoSuggestion';

// Una respuesta grande (cientos de páginas) puede tardar varios minutos en generarse
export const GENERATION_TIMEOUT_MS = Number(process.env.GENERATION_TIMEOUT_MS) || 10 * 60 * 1000;

// Sin 'use server': solo debe invocarse desde la ruta autenticada de generate-all,
// no exponerse como Server Action pública

export interface BulkPageData extends PageData {
  pageId: string;
}

export interface BulkSEOSuggestionResult {
  pageId: string;
  url: string;
  suggestion: SEOSuggestion;
}

/**
 * Genera sugerencias SEO para todas las páginas en una sola llamada al modelo,
 * aprovechando la ventana de contexto en vez de hacer N llamadas.
 */
export async function generateBulkSEOSuggestions(
  pages: BulkPageData[],
  accountName?: string
): Promise<BulkSEOSuggestionResult[]> {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY environment variable is not set');
  }

  if (pages.length === 0) {
    return [];
  }

  const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

  const pagesForPrompt = pages.map((page) => ({
    url: page.url,
    slug: slugFromUrl(page.url),
    title: page.title || '(sin título)',
    description: page.description || '(sin descripción)',
    wordCount: page.wordCount,
  }));

  const prompt = `Eres un experto en SEO. Analiza las siguientes ${pages.length} páginas de un mismo sitio y genera sugerencias optimizadas para los meta tags de CADA UNA, en formato DynamoDB.

Cuenta: ${accountName || 'default'}

Páginas:
${JSON.stringify(pagesForPrompt, null, 2)}

Genera ÚNICAMENTE un array JSON válido (sin markdown, sin explicaciones, sin texto adicional) con exactamente ${pages.length} elementos, EN EL MISMO ORDEN que la lista de páginas de entrada. Cada elemento debe tener esta forma exacta:
{
  "slug": { "S": "..." },
  "account": { "S": "" },
  "canonicalUrl": { "S": "..." },
  "description": { "S": "Descripción optimizada (150-165 caracteres)" },
  "keywords": { "SS": ["palabra clave 1", "palabra clave 2", "palabra clave 3"] },
  "alternateLanguages": {
    "M": {
      "en-US": { "S": "English version of the url add the '/en/' slug after canonical url" },
      "es-MX": { "S": "Versión en español de la url manten la url canonica" },
      "x-default": { "S": "Versión canonica de la url manten la url canonica" }
    }
  },
  "title": { "S": "Título optimizado (50-65 caracteres)" }
}

Requisitos (aplican a cada elemento):
- El título debe ser descriptivo y contener palabras clave (50-65 caracteres)
- La descripción debe invitar a hacer clic (150-165 caracteres)
- Generar 3-5 palabras clave relevantes
- Incluir versiones en inglés (en-US) y español mexicano (es-MX)
- El x-default debe ser la versión en español
- Asegurar que sean únicos y no genéricos entre páginas
- Respetar los límites de caracteres
- Incluye trailing slash en todas las url y en el slug
- Los valores de "S" deben ser strings, los de "SS" deben ser arrays de strings
- Devuelve el array completo, uno por cada página de entrada, sin omitir ninguna`;

  let result;
  try {
    result = await genAI.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        abortSignal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new Error(
        `El modelo no respondió en ${Math.round(GENERATION_TIMEOUT_MS / 1000)} segundos. Intenta de nuevo más tarde.`
      );
    }
    throw error;
  }

  if (result.candidates?.[0]?.finishReason === FinishReason.MAX_TOKENS) {
    throw new Error(
      `El sitio tiene demasiadas páginas (${pages.length}) para generarlas en una sola llamada: la respuesta del modelo superó su límite de salida y quedó incompleta.`
    );
  }

  const responseText = result.text;

  if (!responseText) {
    throw new Error('No response text from model');
  }

  let parsed: SEOSuggestion[];
  try {
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
  } catch (error) {
    console.error('Error parsing bulk SEO suggestions:', error);
    throw new Error('Failed to parse bulk SEO suggestions');
  }

  if (!Array.isArray(parsed) || parsed.length !== pages.length) {
    throw new Error(
      `Expected ${pages.length} suggestions, got ${Array.isArray(parsed) ? parsed.length : 'invalid response'}`
    );
  }

  // El prompt exige el mismo orden que la entrada; se empareja por posición porque el
  // modelo puede normalizar la url (trailing slash, http/https) al repetirla
  return pages.map((page, index) => {
    const item = parsed[index];
    if (!item || !item.slug?.S || !item.title?.S || !item.description?.S) {
      throw new Error(`Missing or invalid suggestion for page: ${page.url}`);
    }
    return {
      pageId: page.pageId,
      url: page.url,
      suggestion: toDynamoSuggestion(item),
    };
  });
}
