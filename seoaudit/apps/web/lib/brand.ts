/** Nombre de la marca: "SEO" + "bab", cangrejo en maya, por el rastreo. */
export const BRAND_NAME = 'SEObab';

const DEFAULT_SITE_URL = 'https://seobab.com';

/**
 * URL base absoluta del sitio para canónicas, hreflang y Open Graph. `NEXT_PUBLIC_SITE_URL` se
 * lee de forma literal para que Next la incruste en build; vacía o ausente usa producción.
 */
export function siteUrl(value: string | undefined = process.env.NEXT_PUBLIC_SITE_URL): URL {
  return new URL(value?.trim() || DEFAULT_SITE_URL);
}
