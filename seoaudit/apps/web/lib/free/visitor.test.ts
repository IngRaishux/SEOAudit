import { describe, expect, it } from 'vitest';
import { clientIp, visitorKey } from './visitor';

const h = (init: Record<string, string>) => new Headers(init);

describe('clientIp', () => {
  it('usa la primera IP de x-forwarded-for', () => {
    expect(clientIp(h({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1, 10.0.0.2' }))).toBe('203.0.113.7');
  });

  it('si no, x-real-ip; y "unknown" sin cabeceras', () => {
    expect(clientIp(h({ 'x-real-ip': ' 198.51.100.4 ' }))).toBe('198.51.100.4');
    expect(clientIp(h({ 'x-forwarded-for': ' ' }))).toBe('unknown');
    expect(clientIp(h({}))).toBe('unknown');
  });
});

describe('visitorKey', () => {
  it('no contiene la IP y es estable para la misma IP', () => {
    const a = visitorKey(h({ 'x-forwarded-for': '203.0.113.7' }), 'secreto');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toContain('203.0.113.7');
    expect(visitorKey(h({ 'x-real-ip': '203.0.113.7' }), 'secreto')).toBe(a);
  });

  it('cambia con la IP y con el secreto', () => {
    const a = visitorKey(h({ 'x-forwarded-for': '203.0.113.7' }), 'secreto');
    expect(visitorKey(h({ 'x-forwarded-for': '203.0.113.8' }), 'secreto')).not.toBe(a);
    expect(visitorKey(h({ 'x-forwarded-for': '203.0.113.7' }), 'otro')).not.toBe(a);
  });

  it('exige un secreto', () => {
    expect(() => visitorKey(h({}), '')).toThrow();
  });
});
