export type SiteInputResult = { ok: true; url: string } | { ok: false; error: 'required' | 'format' };

/**
 * Validación en el cliente de la URL del formulario, antes de gastar la verificación anti-bots.
 * Un dominio sin protocolo ("tusitio.com") se completa con https://; el servidor vuelve a validarlo todo.
 */
export function parseSiteInput(value: string): SiteInputResult {
  const trimmed = value.trim();
  if (!trimmed) return { ok: false, error: 'required' };
  const withProtocol = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    if ((url.protocol !== 'http:' && url.protocol !== 'https:') || !url.hostname.includes('.')) {
      return { ok: false, error: 'format' };
    }
    return { ok: true, url: url.href };
  } catch {
    return { ok: false, error: 'format' };
  }
}
