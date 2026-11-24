import { createHash } from 'node:crypto';

/**
 * IP del visitante: la primera de x-forwarded-for (la que añade el proxy de la plataforma),
 * luego x-real-ip. 'unknown' si no hay ninguna: todos esos visitantes comparten cupo.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwarded) return forwarded;
  const real = headers.get('x-real-ip')?.trim();
  return real || 'unknown';
}

/** Identificador del visitante para el cupo: hash con sal de la IP, nunca la IP en claro. */
export function visitorKey(headers: Headers, secret: string | undefined = process.env.AUTH_SECRET): string {
  if (!secret) throw new Error('AUTH_SECRET is required for free tools');
  return createHash('sha256').update(`${secret}:${clientIp(headers)}`).digest('hex');
}
