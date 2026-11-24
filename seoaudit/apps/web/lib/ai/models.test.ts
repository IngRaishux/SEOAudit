import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_MODELS, ModelUnavailableError, modelChain, withModelFallback } from './models';

const providerError = (code: number) => new Error(`{"error":{"code":${code},"message":"x"}}`);

afterEach(() => vi.restoreAllMocks());
vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('modelChain', () => {
  it('usa gemini-3.6-flash como principal por defecto', () => {
    expect(modelChain({})).toEqual([...DEFAULT_MODELS]);
    expect(modelChain({})[0]).toBe('gemini-3.6-flash');
  });
  it('respeta GEMINI_MODELS, sin vacíos ni duplicados', () => {
    expect(modelChain({ GEMINI_MODELS: ' a , b,,a ' })).toEqual(['a', 'b']);
  });
});

describe('withModelFallback', () => {
  it('usa el principal si responde', async () => {
    const call = vi.fn(async (model: string) => model);
    await expect(withModelFallback(call, { models: ['a', 'b'], delays: [] })).resolves.toBe('a');
    expect(call).toHaveBeenCalledTimes(1);
  });

  it('pasa al respaldo cuando el principal da 503', async () => {
    const call = vi.fn(async (model: string) => {
      if (model === 'a') throw providerError(503);
      return model;
    });
    await expect(withModelFallback(call, { models: ['a', 'b'], delays: [] })).resolves.toBe('b');
  });

  it('también cambia de modelo con 429, 404, 500 y 504', async () => {
    for (const code of [429, 404, 500, 504]) {
      const result = await withModelFallback(
        async (model) => {
          if (model === 'a') throw Object.assign(new Error('x'), { status: code });
          return model;
        },
        { models: ['a', 'b'], delays: [] }
      );
      expect(result).toBe('b');
    }
  });

  it('da otra vuelta a la cadena tras la espera', async () => {
    let calls = 0;
    const result = await withModelFallback(
      async (model) => {
        calls++;
        if (calls <= 2) throw providerError(503);
        return model;
      },
      { models: ['a', 'b'], delays: [0] }
    );
    expect(result).toBe('a');
    expect(calls).toBe(3);
  });

  it('si todos siguen saturados lanza ModelUnavailableError(overloaded)', async () => {
    await expect(
      withModelFallback(async () => Promise.reject(providerError(503)), { models: ['a', 'b'], delays: [0] })
    ).rejects.toMatchObject({ name: 'ModelUnavailableError', reason: 'overloaded' });
  });

  it('sin cuota en todos los modelos no espera otra vuelta', async () => {
    const call = vi.fn(async () => Promise.reject(providerError(429)));
    const promise = withModelFallback(call, { models: ['a', 'b'], delays: [0, 0] });
    await expect(promise).rejects.toBeInstanceOf(ModelUnavailableError);
    await expect(promise).rejects.toMatchObject({ reason: 'quota' });
    expect(call).toHaveBeenCalledTimes(2);
  });

  it('otros errores pasan sin probar más modelos', async () => {
    const call = vi.fn(async () => Promise.reject(new Error('boom')));
    await expect(withModelFallback(call, { models: ['a', 'b'], delays: [0] })).rejects.toThrow('boom');
    expect(call).toHaveBeenCalledTimes(1);
  });

  it('un timeout no cambia de modelo salvo con fallbackOnTimeout', async () => {
    const timeout = () => Promise.reject(Object.assign(new Error('t'), { name: 'TimeoutError' }));
    const call = vi.fn(async (model: string) => (model === 'a' ? timeout() : model));
    await expect(withModelFallback(call, { models: ['a', 'b'], delays: [0] })).rejects.toThrow('t');
    await expect(
      withModelFallback(call, { models: ['a', 'b'], delays: [0], fallbackOnTimeout: true })
    ).resolves.toBe('b');
  });

  it('tras un timeout en todos los modelos no da otra vuelta', async () => {
    const call = vi.fn(async () => Promise.reject(Object.assign(new Error('t'), { name: 'TimeoutError' })));
    await expect(
      withModelFallback(call, { models: ['a', 'b'], delays: [0, 0], fallbackOnTimeout: true })
    ).rejects.toMatchObject({ reason: 'overloaded' });
    expect(call).toHaveBeenCalledTimes(2);
  });
});
