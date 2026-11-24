'use server';

import { requireSiteAccess } from '@/lib/auth/orgAccess';
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

/**
 * Server Action: cualquier cliente puede invocarla, así que exige sesión y permiso de edición
 * de contenido en la organización del sitio antes de llamar al modelo.
 */
export async function generateSEOSuggestions(
  pageData: PageData,
  siteId: string
): Promise<SEOSuggestion> {
  const access = await requireSiteAccess(siteId, 'content.edit');
  if (!access.ok) {
    throw new Error('No tienes permiso para generar sugerencias en este sitio');
  }

  return requestSuggestion(pageData);
}
