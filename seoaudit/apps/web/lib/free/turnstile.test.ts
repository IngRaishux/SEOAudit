import { describe, expect, it, vi } from 'vitest';
import { verifyTurnstile } from './turnstile';

const respond = (body: unknown, status = 200) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

describe('verifyTurnstile', () => {
  it('acepta success: true y envía secreto, token e IP', async () => {
    const fetchImpl = respond({ success: true });
    expect(await verifyTurnstile('tok', '203.0.113.7', 'sec', fetchImpl)).toBe(true);
    const [, init] = vi.mocked(fetchImpl).mock.calls[0] as [string, RequestInit];
    const sent = new URLSearchParams(init.body as URLSearchParams);
    expect(Object.fromEntries(sent)).toEqual({ secret: 'sec', response: 'tok', remoteip: '203.0.113.7' });
  });

  it('rechaza success: false, errores HTTP y de red', async () => {
    expect(await verifyTurnstile('tok', null, 'sec', respond({ success: false, 'error-codes': ['invalid-input-response'] }))).toBe(false);
    expect(await verifyTurnstile('tok', null, 'sec', respond({}, 500))).toBe(false);
    const failing = vi.fn(async () => {
      throw new Error('ECONNRESET');
    }) as unknown as typeof fetch;
    expect(await verifyTurnstile('tok', null, 'sec', failing)).toBe(false);
  });

  it('rechaza sin token o sin secreto sin llamar a Cloudflare', async () => {
    const fetchImpl = respond({ success: true });
    expect(await verifyTurnstile('', null, 'sec', fetchImpl)).toBe(false);
    expect(await verifyTurnstile('tok', null, undefined, fetchImpl)).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('no envía la IP "unknown"', async () => {
    const fetchImpl = respond({ success: true });
    await verifyTurnstile('tok', 'unknown', 'sec', fetchImpl);
    const [, init] = vi.mocked(fetchImpl).mock.calls[0] as [string, RequestInit];
    expect(new URLSearchParams(init.body as URLSearchParams).has('remoteip')).toBe(false);
  });
});
