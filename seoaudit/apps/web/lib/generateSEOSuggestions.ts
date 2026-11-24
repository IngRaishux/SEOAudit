'use server';

import { requireSiteAccess } from '@/lib/auth/orgAccess';
import { ModelUnavailableError } from './ai/models';
import { requestSuggestion } from './seoSuggestionCore';

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

export type GenerateSEOSuggestionsResult =
  | { ok: true; suggestion: SEOSuggestion }
  | { ok: false; error: string; retryable: boolean };

/**
 * Server Action: cualquier cliente puede invocarla, así que exige sesión y permiso de edición
 * de contenido en la organización del sitio antes de llamar al modelo.
 *
 * Devuelve el error en vez de lanzarlo: en producción Next.js oculta el mensaje de los errores
 * lanzados desde una Server Action y el usuario no sabría si vale la pena reintentar.
 */
export async function generateSEOSuggestions(
  pageData: PageData,
  siteId: string
): Promise<GenerateSEOSuggestionsResult> {
  const access = await requireSiteAccess(siteId, 'content.edit');
  if (!access.ok) {
    return { ok: false, error: 'No tienes permiso para generar sugerencias en este sitio', retryable: false };
  }

  try {
    return { ok: true, suggestion: await requestSuggestion(pageData) };
  } catch (error) {
    if (error instanceof ModelUnavailableError) {
      return { ok: false, error: error.message, retryable: true };
    }
    console.error('Error generating SEO suggestion:', error);
    return {
      ok: false,
      error: 'No se pudo generar la sugerencia. Intenta de nuevo.',
      retryable: true,
    };
  }
}
