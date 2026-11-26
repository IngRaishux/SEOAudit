import type { Metadata } from 'next';
import { BRAND_NAME } from '@/lib/brand';
import { landingPath } from '@/lib/i18n/language';
import { getServerTranslations } from '@/lib/i18n/server';
import type { Language } from '@/lib/i18n/ui';

const OG_LOCALE: Record<Language, string> = { es: 'es_MX', en: 'en_US' };

/**
 * Metadatos de la landing en su idioma. Las rutas son relativas: el layout fija `metadataBase`
 * y Next las convierte en absolutas. Las dos landings declaran las mismas alternativas.
 */
export function landingMetadata(lang: Language): Metadata {
  const { title, description } = getServerTranslations(lang).home.meta;
  const url = landingPath(lang);
  return {
    // absolute: el título ya incluye la marca y no debe pasar por la plantilla "%s · SEObab"
    title: { absolute: title },
    description,
    // Next reemplaza el openGraph del layout en vez de fusionarlo: siteName y type se repiten aquí
    openGraph: { siteName: BRAND_NAME, type: 'website', title, description, locale: OG_LOCALE[lang], url },
    alternates: {
      canonical: url,
      languages: { es: landingPath('es'), en: landingPath('en'), 'x-default': landingPath('es') },
    },
  };
}
