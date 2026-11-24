import { createHash, randomBytes } from 'node:crypto';

/** Token aleatorio de 256 bits, apto para URL. */
export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Hash con el que se guarda y se busca el token. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
