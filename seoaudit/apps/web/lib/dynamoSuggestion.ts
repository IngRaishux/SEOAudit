import type { SEOSuggestion } from './generateSEOSuggestions';

// Deja únicamente los atributos válidos del item DynamoDB (descarta "url" u otros extras del modelo)
export function toDynamoSuggestion(item: SEOSuggestion): SEOSuggestion {
  return {
    slug: item.slug,
    account: item.account,
    canonicalUrl: item.canonicalUrl,
    description: item.description,
    keywords: item.keywords,
    alternateLanguages: item.alternateLanguages,
    title: item.title,
  };
}

// Extrae slug incluyendo patrones de idioma como /en/, /es-MX/, etc
export function slugFromUrl(url: string): string {
  const urlParts = url.split('/').filter(Boolean);
  let slug = '/home/';

  if (urlParts.length > 0) {
    const languagePattern = /^[a-z]{2}(-[a-zA-Z]{2})?$/;
    const languageIndex = urlParts.findIndex(part => languagePattern.test(part));

    if (languageIndex !== -1 && languageIndex < urlParts.length - 1) {
      slug = '/' + urlParts.slice(languageIndex).join('/') + '/';
    } else {
      slug = '/' + urlParts[urlParts.length - 1] + '/';
    }
  }

  return slug;
}
