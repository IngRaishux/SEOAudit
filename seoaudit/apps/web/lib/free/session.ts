import { createHmac, timingSafeEqual } from 'node:crypto';

export const FREE_SESSION_COOKIE = 'free_session';
export const FREE_SESSION_TTL_MS = 60 * 60 * 1000;

export interface FreeSession {
  jobId: string;
  visitor: string;
  /** Caducidad en ms desde epoch. */
  exp: number;
}

const sign = (payload: string, secret: string) => createHmac('sha256', secret).update(payload).digest('base64url');

/** Cookie firmada que liga un análisis gratuito a su visitante: `payload.firma`, en base64url. */
export function signFreeSession(session: FreeSession, secret: string): string {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

/** Sesión válida si la firma cuadra, no ha caducado y es del mismo visitante; null en otro caso. */
export function verifyFreeSession(
  token: string | undefined,
  visitor: string,
  secret: string,
  now: number = Date.now(),
): FreeSession | null {
  if (!token) return null;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra !== undefined) return null;

  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString()) as FreeSession;
    if (typeof session.jobId !== 'string' || typeof session.exp !== 'number') return null;
    if (session.exp <= now || session.visitor !== visitor) return null;
    return session;
  } catch {
    return null;
  }
}
