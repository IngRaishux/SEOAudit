'use server';

import { GoogleGenAI } from '@google/genai';

export interface PageData {
  url: string;
  title: string | null;
  description: string | null;
  wordCount: number;
  accountName?: string;
}

export interface DynamoDBString {
  S: string;
}

export interface DynamoDBStringSet {
  SS: string[];
}

export interface DynamoDBMap {
  M: {
    [key: string]: DynamoDBString;
  };
}

export interface SEOSuggestion {
  slug: DynamoDBString;
  account: DynamoDBString;
  canonicalUrl: DynamoDBString;
  description: DynamoDBString;
  keywords: DynamoDBStringSet;
  alternateLanguages: {
    M: {
      "en-US": DynamoDBString;
      "es-MX": DynamoDBString;
      "x-default": DynamoDBString;
      [key: string]: DynamoDBString;
    };
  };
  title: DynamoDBString;
}

export async function generateSEOSuggestions(
  pageData: PageData
): Promise<SEOSuggestion> {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY environment variable is not set');
  }

  const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

  // Extraer slug incluyendo patrones de idioma como /en/, /es-MX/, etc
  const urlParts = pageData.url.split('/').filter(Boolean);
  let slug = '/home/';

  if (urlParts.length > 0) {
    // Buscar si hay un segmento que sea un idioma (en, es, es-MX, etc)
    const languagePattern = /^[a-z]{2}(-[a-zA-Z]{2})?$/;
    const languageIndex = urlParts.findIndex(part => languagePattern.test(part));

    if (languageIndex !== -1 && languageIndex < urlParts.length - 1) {
      // Si hay un patrón de idioma y hay más segmentos después, incluir idioma + resto
      slug = '/' + urlParts.slice(languageIndex).join('/') + '/';
    } else {
      // Si no hay patrón de idioma, solo tomar el último segmento
      slug = '/' + urlParts[urlParts.length - 1] + '/';
    }
  }

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

  const result = await genAI.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: prompt,
  });
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

    return suggestion;
  } catch (error) {
    console.error('Error parsing SEO suggestion:', error);
    throw new Error('Failed to parse SEO suggestion');
  }
}
