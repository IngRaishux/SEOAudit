const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Verifica un token de Cloudflare Turnstile. Ante cualquier fallo (token vacío, sin secreto,
 * respuesta negativa o error de red) devuelve false: sin verificación no hay análisis.
 */
export async function verifyTurnstile(
  token: string | undefined | null,
  remoteIp: string | null,
  secret: string | undefined = process.env.TURNSTILE_SECRET_KEY,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  if (!token || !secret) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp && remoteIp !== 'unknown') body.set('remoteip', remoteIp);
  try {
    const res = await fetchImpl(SITEVERIFY_URL, { method: 'POST', body, signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
