import { describe, expect, it } from 'vitest';
import { signFreeSession, verifyFreeSession } from './session';

const SECRET = 'secreto';
const NOW = 1_700_000_000_000;
const session = { jobId: 'job-1', visitor: 'v1', exp: NOW + 60_000 };

describe('sesión de análisis gratuito', () => {
  it('verifica una sesión firmada del mismo visitante', () => {
    expect(verifyFreeSession(signFreeSession(session, SECRET), 'v1', SECRET, NOW)).toEqual(session);
  });

  it('rechaza una firma alterada o de otro secreto', () => {
    const token = signFreeSession(session, SECRET);
    const [payload, signature] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ ...session, jobId: 'job-2' })).toString('base64url');
    expect(verifyFreeSession(`${forged}.${signature}`, 'v1', SECRET, NOW)).toBeNull();
    expect(verifyFreeSession(`${payload}.${signature.slice(0, -2)}xx`, 'v1', SECRET, NOW)).toBeNull();
    expect(verifyFreeSession(signFreeSession(session, 'otro'), 'v1', SECRET, NOW)).toBeNull();
  });

  it('rechaza una sesión caducada, de otro visitante o mal formada', () => {
    const token = signFreeSession(session, SECRET);
    expect(verifyFreeSession(token, 'v1', SECRET, session.exp)).toBeNull();
    expect(verifyFreeSession(token, 'v2', SECRET, NOW)).toBeNull();
    expect(verifyFreeSession(undefined, 'v1', SECRET, NOW)).toBeNull();
    expect(verifyFreeSession('basura', 'v1', SECRET, NOW)).toBeNull();
    expect(verifyFreeSession(`${token}.extra`, 'v1', SECRET, NOW)).toBeNull();
  });
});
