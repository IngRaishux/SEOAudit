// Núcleo de la generación de sugerencias, SIN 'use server': no se expone como Server Action.
// Solo lo llaman código de servidor que ya comprobó el acceso (la acción generateSEOSuggestions)
// o que aplica su propio control (la ruta gratuita /api/free/suggestions, con cupo y sesión).
import { GoogleGenAI } from '@google/genai';
import { toDynamoSuggestion, slugFromUrl } from './dynamoSuggestion';
import { withModelFallback } from './ai/models';
import type { PageData, SEOSuggestion } from './generateSEOSuggestions';

// Por modelo. Con dos modelos el peor caso (~180 s) cabe en los 300 s de Vercel; un modelo
// saturado puede tardar más de un minuto incluso con un prompt corto
const SUGGESTION_TIMEOUT_MS = 90_000;

export async function requestSuggestion(pageData: PageData): Promise<SEOSuggestion> {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY environment variable is not set');
  }

  const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

  const slug = slugFromUrl(pageData.url);

  const prompt = `Eres un experto en SEO. Analiza esta página y genera sugerencias optimizadas para los meta tags en formato DynamoDB.

Cuenta: ${pageData.accountName || 'default'}
URL: ${pageData.url}
Slug: ${slug}
Título actual: ${pageData.title || '(sin título)'}
Descripción actual: ${pageData.description || '(sin descripción)'}
Total de palabras: ${pageData.wordCount}

Genera ÚNICAMENTE un JSON válido en formato DynamoDB (sin markdown, sin explicaciones, sin texto adicional):
{
  "slug": {
    "S": "${slug}"
  },
  "account": {
    "S": ""
  },
  "canonicalUrl": {
    "S": "${pageData.url}"
  },
  "description": {
    "S": "Descripción optimizada (150-165 caracteres)"
  },
  "keywords": {
    "SS": [
      "palabra clave 1",
      "palabra clave 2",
      "palabra clave 3"
    ]
  },
  "alternateLanguages": {
    "M": {
      "en-US": {
        "S": "English version of the url add the '/en/' slug after canonical url"
      },
      "es-MX": {
        "S": "Versión en español de la url manten la url canonica"
      },
      "x-default": {
        "S": "Versión canonica de la url manten la url canonica"
      }
    }
  },
  "title": {
    "S": "Título optimizado (50-65 caracteres)"
  }
}

Requisitos:
- El título debe ser descriptivo y contener palabras clave (50-65 caracteres)
- La descripción debe invitar a hacer clic (150-165 caracteres)
- Generar 3-5 palabras clave relevantes
- Incluir versiones en inglés (en-US) y español mexicano (es-MX)
- El x-default debe ser la versión en español
- Asegurar que sean únicos y no genéricos
- Respetar los límites de caracteres
- Incluye trailing slash en todas las url y en el slug
- Los valores de "S" deben ser strings, los de "SS" deben ser arrays de strings`;

  // Si el modelo principal está saturado, sin cuota o lento, se usa el de respaldo
  const result = await withModelFallback(
    (model) =>
      genAI.models.generateContent({
        model,
        contents: prompt,
        config: { abortSignal: AbortSignal.timeout(SUGGESTION_TIMEOUT_MS) },
      }),
    { fallbackOnTimeout: true }
  );
  const responseText = result.text;

  if (!responseText) {
    throw new Error('No response text from model');
  }

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    const suggestion = JSON.parse(jsonMatch[0]) as SEOSuggestion;

    // Validar estructura
    if (!suggestion.slug?.S || !suggestion.title?.S || !suggestion.description?.S) {
      throw new Error('Invalid SEO suggestion structure: missing required fields');
    }

    return toDynamoSuggestion(suggestion);
  } catch (error) {
    console.error('Error parsing SEO suggestion:', error);
    throw new Error('Failed to parse SEO suggestion');
  }
}
