import { describe, expect, it } from 'vitest';
import { ModelUnavailableError, withProviderRetry } from './ai';

const providerError = (code: number) => new Error(`{"error":{"code":${code},"message":"x"}}`);

describe('withProviderRetry', () => {
  it('reintenta la saturación y devuelve el resultado', async () => {
    let calls = 0;
    const result = await withProviderRetry(async () => {
      calls++;
      if (calls < 3) throw providerError(503);
      return 'ok';
    }, [0, 0]);
    expect(result).toBe('ok');
    expect(calls).toBe(3);
  });

  it('agotados los reintentos lanza ModelUnavailableError(overloaded)', async () => {
    await expect(withProviderRetry(async () => Promise.reject(providerError(503)), [0])).rejects.toMatchObject({
      name: 'ModelUnavailableError',
      reason: 'overloaded',
    });
  });

  it('la cuota agotada no se reintenta', async () => {
    let calls = 0;
    const promise = withProviderRetry(async () => {
      calls++;
      throw providerError(429);
    }, [0, 0]);
    await expect(promise).rejects.toBeInstanceOf(ModelUnavailableError);
    expect(calls).toBe(1);
  });

  it('otros errores pasan sin cambios', async () => {
    await expect(withProviderRetry(async () => Promise.reject(new Error('boom')), [0])).rejects.toThrow('boom');
  });
});
