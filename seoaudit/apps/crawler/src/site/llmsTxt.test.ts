import { describe, expect, it } from 'vitest';
import { fetchLlmsTxt } from './llmsTxt';

function fakeFetch(status: number, body: string, contentType = 'text/plain'): typeof fetch {
  return (async () => new Response(body, { status, headers: { 'content-type': contentType } })) as typeof fetch;
}

describe('fetchLlmsTxt', () => {
  it('pide /llms.txt en el origen y guarda el contenido si existe', async () => {
    let requested = '';
    const fetchImpl = (async (input: RequestInfo | URL) => {
      requested = String(input);
      return new Response('# Hotel\n', { status: 200, headers: { 'content-type': 'text/plain' } });
    }) as typeof fetch;

    const capture = await fetchLlmsTxt('https://dominio.com/es/acapulco/', 1000, fetchImpl);
    expect(requested).toBe('https://dominio.com/llms.txt');
    expect(capture).toMatchObject({ status: 200, contentType: 'text/plain', content: '# Hotel\n', error: null });
  });

  it('registra 404 sin contenido', async () => {
    const capture = await fetchLlmsTxt('https://dominio.com', 1000, fakeFetch(404, 'Not found', 'text/html'));
    expect(capture).toMatchObject({ status: 404, content: null, error: null });
  });

  it('registra el error de red o timeout sin lanzar', async () => {
    const hanging = ((_: RequestInfo | URL, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      })) as typeof fetch;

    const capture = await fetchLlmsTxt('https://dominio.com', 10, hanging);
    expect(capture).toMatchObject({ status: null, content: null, error: 'aborted' });
  });
});
