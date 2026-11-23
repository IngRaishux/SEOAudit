import { describe, expect, it } from 'vitest';
import { generateToken, hashToken } from './token';
import { effectiveStatus, expiresAtFrom, normalizeEmail } from './state';

describe('token', () => {
  it('genera 256 bits en base64url (43 caracteres) y distintos cada vez', () => {
    const a = generateToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(generateToken()).not.toBe(a);
  });

  it('el hash es estable y no es el token', () => {
    const t = generateToken();
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken(t)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken(t)).not.toContain(t);
  });
});

describe('estado', () => {
  it('normaliza el email', () => {
    expect(normalizeEmail('  Ana@Ejemplo.COM ')).toBe('ana@ejemplo.com');
  });

  it('vence a los 7 días', () => {
    const now = new Date('2026-11-12T10:00:00Z');
    expect(expiresAtFrom(now).toISOString()).toBe('2026-11-19T10:00:00.000Z');
  });

  it('una pendiente vencida se reporta como expired', () => {
    const now = new Date('2026-11-20T00:00:00Z');
    expect(effectiveStatus({ status: 'pending', expiresAt: '2026-11-19T10:00:00Z' }, now)).toBe('expired');
    expect(effectiveStatus({ status: 'pending', expiresAt: '2026-11-21T10:00:00Z' }, now)).toBe('pending');
  });

  it('los estados finales no cambian por la fecha', () => {
    const now = new Date('2030-01-01T00:00:00Z');
    expect(effectiveStatus({ status: 'revoked', expiresAt: '2026-01-01T00:00:00Z' }, now)).toBe('revoked');
    expect(effectiveStatus({ status: 'accepted', expiresAt: '2026-01-01T00:00:00Z' }, now)).toBe('accepted');
  });
});
